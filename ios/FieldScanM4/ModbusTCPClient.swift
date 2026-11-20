import Foundation
import Darwin

/// Pure-Swift Modbus TCP (MBAP + PDU) Stream Parser & Client for PUSR `USR-DR164` Gateways (`BUS-02..10`, `BUS-12`).
///
/// Key guarantees:
/// - Bounded receive buffer (`maxBufferBytes = 4096`) with incremental stream reassembly supporting
///   split 7-byte MBAP headers and multiple concatenated responses in a single TCP read (`BUS-04`, `BUS-05`).
/// - Strict correlation of `transactionId`, `unitId`, and `connectionGeneration` (`BUS-06`).
/// - Explicit Modbus Exception (`func | 0x80` + code) vs `READ_TIMEOUT` distinction (`BUS-07`).
/// - Refuses legacy raw-RTU bridge port `:5502` by default and detects raw RTU CRC frames arriving on MBAP (`BUS-03`).
/// - Never fabricates RTU CRC bytes on MBAP TCP payloads (`crcCheckedByClient = false`, `mbapValid = true`, `BUS-02`).
/// - Enforces P0 Pilot Read-Only Gate (`functionCode == 0x03` only) with inspectable `txAuditLog` (`BUS-12`).
public struct ParsedMBAPFrame {
    public let transactionId: UInt16
    public let protocolId: UInt16
    public let length: UInt16
    public let unitId: UInt8
    public let functionCode: UInt8
    public let pduPayload: Data
    public let rawBytes: Data
    public let isException: Bool
    public let exceptionCode: UInt8?
    public let exceptionName: String?
}

public enum ModbusTCPFramingError: Error {
    case bufferOverflow(Int)
    case protocolMismatchRawRTU
    case invalidProtocolId(UInt16)
    case invalidLength(UInt16)
    case invalidExceptionPDU
    case invalidRegisterData(String)
    case pilotWriteBlocked(UInt8)

    public var errorCode: String {
        switch self {
        case .bufferOverflow:
            return "BUFFER_OVERFLOW"
        case .protocolMismatchRawRTU:
            return "PROTOCOL_MISMATCH"
        case .invalidProtocolId:
            return "INVALID_MBAP_PROTOCOL"
        case .invalidLength:
            return "INVALID_MBAP_LENGTH"
        case .invalidExceptionPDU:
            return "INVALID_EXCEPTION_PDU"
        case .invalidRegisterData:
            return "INVALID_REGISTER_DATA"
        case .pilotWriteBlocked:
            return "PILOT_WRITE_BLOCKED"
        }
    }

    public var errorDetail: String {
        switch self {
        case .bufferOverflow(let limit):
            return "Incoming TCP stream exceeded bounded buffer (\(limit) bytes)"
        case .protocolMismatchRawRTU:
            return "Received raw Modbus-RTU frame with CRC-16 on a Modbus TCP (MBAP) session"
        case .invalidProtocolId(let pid):
            return String(format: "Invalid MBAP protocolId=0x%04X (expected 0x0000)", pid)
        case .invalidLength(let len):
            return "Invalid MBAP length=\(len) (expected 2..260)"
        case .invalidExceptionPDU:
            return "Malformed Modbus exception PDU"
        case .invalidRegisterData(let msg):
            return msg
        case .pilotWriteBlocked(let fc):
            return String(format: "Modbus write function 0x%02X blocked in pilot read-only mode", fc)
        }
    }
}

public final class ModbusTCPStreamParser {
    public static let exceptionNames: [UInt8: String] = [
        0x01: "Illegal Function",
        0x02: "Illegal Data Address",
        0x03: "Illegal Data Value",
        0x04: "Server Device Failure",
        0x05: "Acknowledge",
        0x06: "Server Device Busy",
        0x0A: "Gateway Path Unavailable",
        0x0B: "Gateway Target Device Failed to Respond",
    ]

    public let maxBufferBytes: Int
    private var buffer = Data()

    public init(maxBufferBytes: Int = 4096) {
        self.maxBufferBytes = max(64, maxBufferBytes)
    }

    public var bufferedBytes: Int {
        return buffer.count
    }

    public func reset() {
        buffer.removeAll(keepingCapacity: false)
    }

    public static func computeCRC16(_ data: Data) -> UInt16 {
        var crc: UInt16 = 0xFFFF
        for byte in data {
            crc ^= UInt16(byte)
            for _ in 0..<8 {
                if (crc & 0x0001) != 0 {
                    crc = (crc >> 1) ^ 0xA001
                } else {
                    crc >>= 1
                }
            }
        }
        return crc
    }

    public static func verifyRTUCRC16(_ frame: Data) -> Bool {
        guard frame.count >= 5 else { return false }
        let body = frame.prefix(frame.count - 2)
        let expected = computeCRC16(Data(body))
        let lo = UInt16(frame[frame.count - 2])
        let hi = UInt16(frame[frame.count - 1]) << 8
        return expected == (lo | hi)
    }

    public static func formatHex(_ data: Data) -> String {
        return data.map { String(format: "%02X", $0) }.joined(separator: " ")
    }

    public static func buildMBAPReadHoldingRequest(
        transactionId: UInt16,
        unitId: UInt8 = 1,
        startReg: UInt16 = 0x0000,
        count: UInt16 = 8,
        pilotReadonly: Bool = true,
        functionCode: UInt8 = 0x03
    ) throws -> Data {
        if pilotReadonly && functionCode != 0x03 {
            throw ModbusTCPFramingError.pilotWriteBlocked(functionCode)
        }
        var out = Data(capacity: 12)
        out.append(UInt8((transactionId >> 8) & 0xFF))
        out.append(UInt8(transactionId & 0xFF))
        out.append(0x00)
        out.append(0x00)
        out.append(0x00)
        out.append(0x06) // UnitID (1) + FC03 PDU (5)
        out.append(unitId)
        out.append(functionCode)
        out.append(UInt8((startReg >> 8) & 0xFF))
        out.append(UInt8(startReg & 0xFF))
        out.append(UInt8((count >> 8) & 0xFF))
        out.append(UInt8(count & 0xFF))
        return out
    }

    public static func decodeTHT02PDURegisters(
        unitId: UInt8,
        pduPayload: Data,
        expectedRegCount: Int = 8
    ) throws -> [String: Any] {
        guard !pduPayload.isEmpty else {
            throw ModbusTCPFramingError.invalidRegisterData("Empty FC03 PDU payload")
        }
        let byteCount = Int(pduPayload[pduPayload.startIndex])
        let regBytes = Data(pduPayload.dropFirst())
        if regBytes.count != byteCount || byteCount < 4 || (byteCount % 2) != 0 {
            throw ModbusTCPFramingError.invalidRegisterData(
                "Incompatible FC03 byteCount=\(byteCount) vs actual=\(regBytes.count)"
            )
        }
        let regCount = byteCount / 2
        if expectedRegCount > 0 && regCount != expectedRegCount {
            throw ModbusTCPFramingError.invalidRegisterData(
                "Expected \(expectedRegCount) registers, received \(regCount)"
            )
        }

        var regs: [UInt16] = []
        regs.reserveCapacity(regCount)
        for idx in 0..<regCount {
            let hi = UInt16(regBytes[idx * 2]) << 8
            let lo = UInt16(regBytes[idx * 2 + 1])
            regs.append(hi | lo)
        }

        let rawTemp = regs[0]
        let rawHum = regs[1]
        let tempAbn = (rawTemp == 0x7FFF)
        let humAbn = (rawHum == 0x7FFF)

        var tempVal: Double? = nil
        let tempQuality: String
        if tempAbn {
            tempQuality = "invalid_sentinel_7fff"
        } else {
            let signedT = Int16(bitPattern: rawTemp)
            let candT = (Double(signedT) / 10.0 * 10.0).rounded() / 10.0
            if candT >= -45.0 && candT <= 130.0 {
                tempVal = candT
                tempQuality = "valid"
            } else {
                tempQuality = "out_of_range"
            }
        }

        var humVal: Double? = nil
        let humQuality: String
        if humAbn {
            humQuality = "invalid_sentinel_7fff"
        } else {
            let candH = (Double(rawHum) / 10.0 * 10.0).rounded() / 10.0
            if candH >= 0.0 && candH <= 100.0 {
                humVal = candH
                humQuality = "valid"
            } else {
                humQuality = "out_of_range"
            }
        }

        let reportedAddr: Int = (regCount > 4 && regs[4] >= 1 && regs[4] <= 247) ? Int(regs[4]) : Int(unitId)
        let rawBaud = regCount > 5 ? Int(regs[5]) : 0x2580
        let baudMap: [Int: Int] = [0x12C0: 4800, 0x2580: 9600, 0x4B00: 19200, 0: 4800, 1: 9600, 2: 19200]
        let baudBps = baudMap[rawBaud] ?? 9600
        let hwVer = regCount > 6 ? Int(regs[6]) : 0x0600
        let swVer = regCount > 7 ? Int(regs[7]) : 0x000A

        let weights = [128, 64, 32, 16, 8, 4, 2, 1]
        let dipBits = weights.map { (reportedAddr & $0) != 0 ? 1 : 0 }

        return [
            "slave_id": Int(unitId),
            "reported_slave_id": reportedAddr,
            "dip_bits": dipBits,
            "temp_c": tempVal ?? NSNull(),
            "humidity_rh": humVal ?? NSNull(),
            "temp_quality": tempQuality,
            "humidity_quality": humQuality,
            "raw_temp_hex": String(format: "0x%04X", rawTemp),
            "raw_humidity_hex": String(format: "0x%04X", rawHum),
            "sensor_abnormal_7fff": (tempAbn || humAbn),
            "temp_abnormal_7fff": tempAbn,
            "humidity_abnormal_7fff": humAbn,
            "baud_bps": baudBps,
            "hw_version": String(format: "0x%04X", hwVer),
            "sw_version": String(format: "V%.1f", Double(swVer) / 10.0),
            "registers_u16": regs.map { Int($0) },
        ]
    }

    public func feed(_ chunk: Data) throws -> [ParsedMBAPFrame] {
        guard !chunk.isEmpty else { return [] }
        if buffer.count + chunk.count > maxBufferBytes {
            reset()
            throw ModbusTCPFramingError.bufferOverflow(maxBufferBytes)
        }
        buffer.append(chunk)

        var out: [ParsedMBAPFrame] = []
        while buffer.count >= 7 {
            let b = [UInt8](buffer.prefix(7))
            let txId = (UInt16(b[0]) << 8) | UInt16(b[1])
            let protoId = (UInt16(b[2]) << 8) | UInt16(b[3])
            let mbapLen = (UInt16(b[4]) << 8) | UInt16(b[5])
            let unitId = b[6]

            if protoId != 0x0000 {
                let sample = Data(buffer.prefix(min(buffer.count, 24)))
                reset()
                if Self.verifyRTUCRC16(sample) {
                    throw ModbusTCPFramingError.protocolMismatchRawRTU
                }
                throw ModbusTCPFramingError.invalidProtocolId(protoId)
            }

            if mbapLen < 2 || mbapLen > 260 {
                reset()
                throw ModbusTCPFramingError.invalidLength(mbapLen)
            }

            let totalLen = 6 + Int(mbapLen)
            if buffer.count < totalLen {
                break
            }

            let rawFrame = Data(buffer.prefix(totalLen))
            buffer.removeFirst(totalLen)

            let rawBytesArr = [UInt8](rawFrame)
            let funcCode = rawBytesArr[7]
            let pduPayload = rawFrame.count > 8 ? Data(rawFrame.dropFirst(8)) : Data()

            if (funcCode & 0x80) != 0 {
                guard pduPayload.count == 1 else {
                    throw ModbusTCPFramingError.invalidExceptionPDU
                }
                let excCode = pduPayload[pduPayload.startIndex]
                out.append(
                    ParsedMBAPFrame(
                        transactionId: txId,
                        protocolId: protoId,
                        length: mbapLen,
                        unitId: unitId,
                        functionCode: funcCode,
                        pduPayload: pduPayload,
                        rawBytes: rawFrame,
                        isException: true,
                        exceptionCode: excCode,
                        exceptionName: Self.exceptionNames[excCode] ?? String(format: "Unknown Exception 0x%02X", excCode)
                    )
                )
                continue
            }

            if funcCode == 0x03 {
                guard !pduPayload.isEmpty else {
                    throw ModbusTCPFramingError.invalidRegisterData("Missing FC03 byteCount")
                }
                let declared = Int(pduPayload[pduPayload.startIndex])
                if pduPayload.count - 1 != declared || declared < 2 || (declared % 2) != 0 {
                    throw ModbusTCPFramingError.invalidRegisterData(
                        "FC03 byteCount=\(declared) incompatible with payload length \(pduPayload.count - 1)"
                    )
                }
            }

            out.append(
                ParsedMBAPFrame(
                    transactionId: txId,
                    protocolId: protoId,
                    length: mbapLen,
                    unitId: unitId,
                    functionCode: funcCode,
                    pduPayload: pduPayload,
                    rawBytes: rawFrame,
                    isException: false,
                    exceptionCode: nil,
                    exceptionName: nil
                )
            )
        }
        return out
    }
}

public final class ModbusTCPClient {
    public static let backoffScheduleS: [Double] = [0.5, 1.0, 2.0, 4.0]
    public static let legacyRTUBridgePort: Int = 5502

    private let lock = NSLock()
    public private(set) var host: String
    public private(set) var port: Int
    public var timeoutS: Double
    public let pilotReadonly: Bool
    public var allowLegacyBridgePort: Bool = false

    private var socketFD: Int32 = -1
    private let parser = ModbusTCPStreamParser()
    private var txSeq: UInt16 = 0
    public private(set) var connectionGeneration: Int = 1
    private var consecutiveFailures: Int = 0
    private var nextRetryUptime: TimeInterval = 0
    public private(set) var txAuditLog: [[String: Any]] = []

    public init(host: String, port: Int = 502, timeoutS: Double = 1.0, pilotReadonly: Bool = true) {
        self.host = host.trimmingCharacters(in: .whitespacesAndNewlines)
        self.port = port
        self.timeoutS = max(0.15, timeoutS)
        self.pilotReadonly = pilotReadonly
    }

    deinit {
        close()
    }

    public func updateEndpoint(host: String, port: Int = 502) {
        lock.lock()
        closeUnlocked()
        self.host = host.trimmingCharacters(in: .whitespacesAndNewlines)
        self.port = port
        self.consecutiveFailures = 0
        self.nextRetryUptime = 0
        lock.unlock()
    }

    public func close() {
        lock.lock()
        closeUnlocked()
        lock.unlock()
    }

    private func closeUnlocked() {
        connectionGeneration += 1
        parser.reset()
        if socketFD >= 0 {
            Darwin.close(socketFD)
            socketFD = -1
        }
    }

    private func recordFailureUnlocked() -> Double {
        closeUnlocked()
        consecutiveFailures += 1
        let idx = min(consecutiveFailures - 1, Self.backoffScheduleS.count - 1)
        let delay = Self.backoffScheduleS[idx]
        nextRetryUptime = ProcessInfo.processInfo.systemUptime + delay
        return delay
    }

    private func connectSocketWithTimeoutUnlocked() throws {
        if socketFD >= 0 {
            return
        }
        var hints = addrinfo()
        hints.ai_family = AF_INET
        hints.ai_socktype = SOCK_STREAM
        hints.ai_protocol = IPPROTO_TCP

        var resPtr: UnsafeMutablePointer<addrinfo>?
        let status = getaddrinfo(host, String(port), &hints, &resPtr)
        guard status == 0, let info = resPtr else {
            throw NSError(domain: NSPOSIXErrorDomain, code: Int(EHOSTUNREACH), userInfo: [NSLocalizedDescriptionKey: "Cannot resolve gateway host \(host)"])
        }
        defer { freeaddrinfo(resPtr) }

        let fd = Darwin.socket(info.pointee.ai_family, info.pointee.ai_socktype, info.pointee.ai_protocol)
        guard fd >= 0 else {
            throw NSError(domain: NSPOSIXErrorDomain, code: Int(errno), userInfo: [NSLocalizedDescriptionKey: "Failed to allocate TCP socket"])
        }

        // Prevent SIGPIPE on broken socket writes
        var one: Int32 = 1
        setsockopt(fd, SOL_SOCKET, SO_NOSIGPIPE, &one, socklen_t(MemoryLayout<Int32>.size))

        let flags = fcntl(fd, F_GETFL, 0)
        _ = fcntl(fd, F_SETFL, flags | O_NONBLOCK)

        let rc = Darwin.connect(fd, info.pointee.ai_addr, info.pointee.ai_addrlen)
        if rc < 0 && errno != EINPROGRESS {
            let err = errno
            Darwin.close(fd)
            throw NSError(domain: NSPOSIXErrorDomain, code: Int(err), userInfo: [NSLocalizedDescriptionKey: "Gateway connect failed (\(err))"])
        }

        if rc < 0 {
            var pfd = pollfd(fd: fd, events: Int16(POLLOUT), revents: 0)
            let timeoutMs = Int32((timeoutS * 1000.0).rounded())
            let prc = Darwin.poll(&pfd, 1, timeoutMs)
            if prc <= 0 {
                Darwin.close(fd)
                throw NSError(domain: NSPOSIXErrorDomain, code: Int(ETIMEDOUT), userInfo: [NSLocalizedDescriptionKey: "Connect timed out after \(timeoutS)s"])
            }
            var soErr: Int32 = 0
            var soLen = socklen_t(MemoryLayout<Int32>.size)
            getsockopt(fd, SOL_SOCKET, SO_ERROR, &soErr, &soLen)
            if soErr != 0 {
                Darwin.close(fd)
                let code = soErr == EACCES || soErr == EPERM ? "LOCAL_NETWORK_DENIED" : "SOURCE_UNAVAILABLE"
                throw NSError(domain: code, code: Int(soErr), userInfo: [NSLocalizedDescriptionKey: "Socket error \(soErr)"])
            }
        }

        socketFD = fd
        connectionGeneration += 1
        parser.reset()
    }

    public func readTHT02Holding(
        unitId: UInt8 = 1,
        startReg: UInt16 = 0x0000,
        count: UInt16 = 8,
        respectBackoff: Bool = false
    ) -> [String: Any] {
        if port == Self.legacyRTUBridgePort && !allowLegacyBridgePort {
            return [
                "ok": false,
                "error_code": "PROTOCOL_MISMATCH",
                "error_detail": "Port 5502 is reserved for raw RTU-over-TCP framing; Modbus TCP (MBAP) refuses :5502 by default.",
                "protocol": "modbus_tcp_mbap",
                "transport_status": "protocol_blocked",
                "tx_hex": "",
                "rx_hex": "",
                "crc_checked_by_client": false,
                "mbap_valid": false,
            ]
        }

        lock.lock()
        defer { lock.unlock() }

        let nowUp = ProcessInfo.processInfo.systemUptime
        if respectBackoff && nowUp < nextRetryUptime {
            let rem = ((nextRetryUptime - nowUp) * 100.0).rounded() / 100.0
            return [
                "ok": false,
                "error_code": "BACKOFF_ACTIVE",
                "error_detail": "Reconnect backoff active (\(rem)s remaining)",
                "protocol": "modbus_tcp_mbap",
                "transport_status": "backoff_waiting",
                "tx_hex": "",
                "rx_hex": "",
                "crc_checked_by_client": false,
                "mbap_valid": false,
                "backoff_s": rem,
            ]
        }

        txSeq = txSeq &+ 1
        if txSeq == 0 { txSeq = 1 }
        let currentTxId = txSeq

        let reqData: Data
        do {
            reqData = try ModbusTCPStreamParser.buildMBAPReadHoldingRequest(
                transactionId: currentTxId,
                unitId: unitId,
                startReg: startReg,
                count: count,
                pilotReadonly: pilotReadonly,
                functionCode: 0x03
            )
        } catch let fe as ModbusTCPFramingError {
            return [
                "ok": false,
                "error_code": fe.errorCode,
                "error_detail": fe.errorDetail,
                "protocol": "modbus_tcp_mbap",
                "crc_checked_by_client": false,
                "mbap_valid": false,
            ]
        } catch {
            return [
                "ok": false,
                "error_code": "INVALID_REQUEST",
                "error_detail": error.localizedDescription,
                "protocol": "modbus_tcp_mbap",
                "crc_checked_by_client": false,
                "mbap_valid": false,
            ]
        }

        let txHex = ModbusTCPStreamParser.formatHex(reqData)
        let t0 = ProcessInfo.processInfo.systemUptime

        do {
            try connectSocketWithTimeoutUnlocked()
        } catch let nsErr as NSError {
            let rttMs = ((ProcessInfo.processInfo.systemUptime - t0) * 1000.0 * 100.0).rounded() / 100.0
            let backoff = recordFailureUnlocked()
            let errCode: String
            if nsErr.domain == "LOCAL_NETWORK_DENIED" || nsErr.code == Int(EACCES) || nsErr.code == Int(EPERM) {
                errCode = "LOCAL_NETWORK_DENIED"
            } else if nsErr.code == Int(ETIMEDOUT) {
                errCode = "READ_TIMEOUT"
            } else {
                errCode = "SOURCE_UNAVAILABLE"
            }
            return [
                "ok": false,
                "error_code": errCode,
                "error_detail": nsErr.localizedDescription,
                "protocol": "modbus_tcp_mbap",
                "transport_status": "unreachable",
                "transaction_id": Int(currentTxId),
                "tx_hex": txHex,
                "rx_hex": "",
                "roundtrip_ms": rttMs,
                "crc_checked_by_client": false,
                "mbap_valid": false,
                "backoff_s": backoff,
            ]
        }

        let activeGen = connectionGeneration

        // Drain stale bytes on non-blocking FD before sending new request (`BUS-06`)
        var drainBuf = [UInt8](repeating: 0, count: 512)
        while Darwin.recv(socketFD, &drainBuf, drainBuf.count, 0) > 0 {}
        parser.reset()

        txAuditLog.append([
            "ts_monotonic": ProcessInfo.processInfo.systemUptime,
            "transaction_id": Int(currentTxId),
            "unit_id": Int(unitId),
            "function_code": 3,
            "tx_hex": txHex,
            "endpoint": "\(host):\(port)",
        ])
        if txAuditLog.count > 256 {
            txAuditLog.removeFirst(txAuditLog.count - 256)
        }

        let sentOk = reqData.withUnsafeBytes { rawPtr -> Bool in
            guard let base = rawPtr.baseAddress else { return false }
            var totalSent = 0
            while totalSent < reqData.count {
                let n = Darwin.send(socketFD, base.advanced(by: totalSent), reqData.count - totalSent, 0)
                if n > 0 {
                    totalSent += n
                } else if errno == EAGAIN || errno == EWOULDBLOCK {
                    var pfd = pollfd(fd: socketFD, events: Int16(POLLOUT), revents: 0)
                    if Darwin.poll(&pfd, 1, 200) <= 0 { return false }
                } else {
                    return false
                }
            }
            return true
        }

        if !sentOk {
            let rttMs = ((ProcessInfo.processInfo.systemUptime - t0) * 1000.0 * 100.0).rounded() / 100.0
            let backoff = recordFailureUnlocked()
            return [
                "ok": false,
                "error_code": "SOURCE_UNAVAILABLE",
                "error_detail": "Failed transmitting MBAP FC03 request to \(host):\(port)",
                "protocol": "modbus_tcp_mbap",
                "transport_status": "send_failed",
                "transaction_id": Int(currentTxId),
                "tx_hex": txHex,
                "rx_hex": "",
                "roundtrip_ms": rttMs,
                "crc_checked_by_client": false,
                "mbap_valid": false,
                "backoff_s": backoff,
            ]
        }

        let deadline = ProcessInfo.processInfo.systemUptime + timeoutS
        var rxChunk = [UInt8](repeating: 0, count: 512)

        while true {
            let remS = deadline - ProcessInfo.processInfo.systemUptime
            if remS <= 0 {
                let rttMs = ((ProcessInfo.processInfo.systemUptime - t0) * 1000.0 * 100.0).rounded() / 100.0
                let backoff = recordFailureUnlocked()
                return [
                    "ok": false,
                    "error_code": "READ_TIMEOUT",
                    "error_detail": String(format: "Timed out after %.2fs awaiting MBAP TxID %d", timeoutS, currentTxId),
                    "protocol": "modbus_tcp_mbap",
                    "transport_status": "timeout",
                    "transaction_id": Int(currentTxId),
                    "tx_hex": txHex,
                    "rx_hex": "",
                    "roundtrip_ms": rttMs,
                    "crc_checked_by_client": false,
                    "mbap_valid": false,
                    "backoff_s": backoff,
                ]
            }

            var pfd = pollfd(fd: socketFD, events: Int16(POLLIN), revents: 0)
            let waitMs = max(15, Int32((remS * 1000.0).rounded()))
            let prc = Darwin.poll(&pfd, 1, waitMs)
            if prc == 0 {
                continue
            }
            if prc < 0 {
                let rttMs = ((ProcessInfo.processInfo.systemUptime - t0) * 1000.0 * 100.0).rounded() / 100.0
                let backoff = recordFailureUnlocked()
                return [
                    "ok": false,
                    "error_code": "SOURCE_UNAVAILABLE",
                    "error_detail": "Socket poll interrupted",
                    "protocol": "modbus_tcp_mbap",
                    "transaction_id": Int(currentTxId),
                    "tx_hex": txHex,
                    "rx_hex": "",
                    "roundtrip_ms": rttMs,
                    "crc_checked_by_client": false,
                    "mbap_valid": false,
                    "backoff_s": backoff,
                ]
            }

            let nRead = Darwin.recv(socketFD, &rxChunk, rxChunk.count, 0)
            if nRead <= 0 {
                if nRead < 0 && (errno == EAGAIN || errno == EWOULDBLOCK) {
                    continue
                }
                let rttMs = ((ProcessInfo.processInfo.systemUptime - t0) * 1000.0 * 100.0).rounded() / 100.0
                let backoff = recordFailureUnlocked()
                return [
                    "ok": false,
                    "error_code": "SOURCE_UNAVAILABLE",
                    "error_detail": "Gateway closed TCP stream before complete MBAP frame arrived",
                    "protocol": "modbus_tcp_mbap",
                    "transport_status": "disconnected",
                    "transaction_id": Int(currentTxId),
                    "tx_hex": txHex,
                    "rx_hex": "",
                    "roundtrip_ms": rttMs,
                    "crc_checked_by_client": false,
                    "mbap_valid": false,
                    "backoff_s": backoff,
                ]
            }

            if activeGen != connectionGeneration {
                return [
                    "ok": false,
                    "error_code": "CONNECTION_CANCELLED",
                    "error_detail": "Connection generation changed while awaiting response",
                    "protocol": "modbus_tcp_mbap",
                    "crc_checked_by_client": false,
                    "mbap_valid": false,
                ]
            }

            do {
                let parsedFrames = try parser.feed(Data(rxChunk.prefix(nRead)))
                for frame in parsedFrames {
                    if frame.transactionId != currentTxId {
                        // Discard late/mismatched transaction ID (`BUS-06`)
                        continue
                    }
                    let rttMs = ((ProcessInfo.processInfo.systemUptime - t0) * 1000.0 * 100.0).rounded() / 100.0
                    if frame.unitId != unitId {
                        return [
                            "ok": false,
                            "error_code": "WRONG_UNIT",
                            "error_detail": "Expected Unit ID \(unitId), received Unit ID \(frame.unitId)",
                            "protocol": "modbus_tcp_mbap",
                            "transport_status": "wrong_unit",
                            "transaction_id": Int(currentTxId),
                            "tx_hex": txHex,
                            "rx_hex": ModbusTCPStreamParser.formatHex(frame.rawBytes),
                            "roundtrip_ms": rttMs,
                            "crc_checked_by_client": false,
                            "mbap_valid": true,
                        ]
                    }

                    consecutiveFailures = 0
                    nextRetryUptime = 0

                    if frame.isException {
                        return [
                            "ok": false,
                            "error_code": "MODBUS_EXCEPTION",
                            "exception_code": Int(frame.exceptionCode ?? 0),
                            "exception_name": frame.exceptionName ?? "Exception",
                            "error_detail": String(
                                format: "Modbus Exception 0x%02X code 0x%02X (%@)",
                                frame.functionCode,
                                frame.exceptionCode ?? 0,
                                frame.exceptionName ?? "Unknown"
                            ),
                            "protocol": "modbus_tcp_mbap",
                            "transport_status": "modbus_exception",
                            "transaction_id": Int(currentTxId),
                            "unit_id": Int(frame.unitId),
                            "tx_hex": txHex,
                            "rx_hex": ModbusTCPStreamParser.formatHex(frame.rawBytes),
                            "roundtrip_ms": rttMs,
                            "crc_checked_by_client": false,
                            "mbap_valid": true,
                        ]
                    }

                    let decoded = try ModbusTCPStreamParser.decodeTHT02PDURegisters(
                        unitId: frame.unitId,
                        pduPayload: frame.pduPayload,
                        expectedRegCount: Int(count)
                    )
                    return [
                        "ok": true,
                        "error_code": NSNull(),
                        "protocol": "modbus_tcp_mbap",
                        "transport_status": "response_received",
                        "transaction_id": Int(currentTxId),
                        "unit_id": Int(frame.unitId),
                        "tx_hex": txHex,
                        "rx_hex": ModbusTCPStreamParser.formatHex(frame.rawBytes),
                        "roundtrip_ms": rttMs,
                        "crc_checked_by_client": false,
                        "crc_valid": NSNull(),
                        "mbap_valid": true,
                        "decoded": decoded,
                    ]
                }
            } catch let fe as ModbusTCPFramingError {
                let rttMs = ((ProcessInfo.processInfo.systemUptime - t0) * 1000.0 * 100.0).rounded() / 100.0
                let backoff = recordFailureUnlocked()
                return [
                    "ok": false,
                    "error_code": fe.errorCode,
                    "error_detail": fe.errorDetail,
                    "protocol": "modbus_tcp_mbap",
                    "transport_status": "framing_error",
                    "transaction_id": Int(currentTxId),
                    "tx_hex": txHex,
                    "rx_hex": "",
                    "roundtrip_ms": rttMs,
                    "crc_checked_by_client": false,
                    "mbap_valid": false,
                    "backoff_s": backoff,
                ]
            } catch {
                let rttMs = ((ProcessInfo.processInfo.systemUptime - t0) * 1000.0 * 100.0).rounded() / 100.0
                let backoff = recordFailureUnlocked()
                return [
                    "ok": false,
                    "error_code": "INVALID_REGISTER_DATA",
                    "error_detail": error.localizedDescription,
                    "protocol": "modbus_tcp_mbap",
                    "transaction_id": Int(currentTxId),
                    "tx_hex": txHex,
                    "rx_hex": "",
                    "roundtrip_ms": rttMs,
                    "crc_checked_by_client": false,
                    "mbap_valid": false,
                    "backoff_s": backoff,
                ]
            }
        }
    }

    // MARK: - AP-First Direct PUSR Gateway Discovery (Explicit Operator Action Only; Zero Startup Egress)

    public static let defaultDirectAPHost = "10.10.100.254"
    public static let alternateDirectAPHost = "192.168.0.7"
    public static let fallbackDirectAPHost = "192.168.4.1"

    public struct DirectAPCandidate {
        public let host: String
        public let label: String
        public let topology: String
    }

    /// Returns `true` strictly for private RFC1918 IPv4 addresses (`10/8`, `172.16/12`, `192.168/16`).
    /// Optionally permits loopback (`127.0.0.1`) only when `allowLoopback == true` (for unit tests).
    public static func isPrivateRFC1918IPv4(_ host: String, allowLoopback: Bool = false) -> Bool {
        let trimmed = host.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return false }
        var addr = in_addr()
        guard inet_pton(AF_INET, trimmed, &addr) == 1 else { return false }
        let ip = UInt32(bigEndian: addr.s_addr)
        let b0 = (ip >> 24) & 0xFF
        let b1 = (ip >> 16) & 0xFF
        if b0 == 10 { return true }
        if b0 == 172 && (16...31).contains(b1) { return true }
        if b0 == 192 && b1 == 168 { return true }
        if allowLoopback && b0 == 127 { return true }
        return false
    }

    /// Reads the device's active Wi-Fi (`en0`) private RFC1918 IPv4 address using POSIX `getifaddrs()`.
    public static func detectActiveWiFiIPv4() -> String? {
        var ifaddrPtr: UnsafeMutablePointer<ifaddrs>?
        guard getifaddrs(&ifaddrPtr) == 0, let firstAddr = ifaddrPtr else {
            return nil
        }
        defer { freeifaddrs(ifaddrPtr) }

        var fallbackIP: String?
        var cursor: UnsafeMutablePointer<ifaddrs>? = firstAddr
        while let ptr = cursor {
            let entry = ptr.pointee
            cursor = entry.ifa_next

            let flags = Int32(entry.ifa_flags)
            guard (flags & IFF_UP) != 0, (flags & IFF_LOOPBACK) == 0 else { continue }
            guard let sa = entry.ifa_addr, sa.pointee.sa_family == UInt8(AF_INET) else { continue }

            let ifaceName = String(cString: entry.ifa_name)
            var addrIn = sa.withMemoryRebound(to: sockaddr_in.self, capacity: 1) { $0.pointee.sin_addr }
            var buf = [CChar](repeating: 0, count: Int(INET_ADDRSTRLEN))
            guard inet_ntop(AF_INET, &addrIn, &buf, socklen_t(INET_ADDRSTRLEN)) != nil else { continue }
            let ipStr = String(cString: buf)
            guard isPrivateRFC1918IPv4(ipStr) else { continue }

            if ifaceName == "en0" {
                return ipStr
            }
            if ifaceName.hasPrefix("en") && fallbackIP == nil {
                fallbackIP = ipStr
            }
        }
        return fallbackIP
    }

    /// Builds a prioritized, deduplicated list of private RFC1918 PUSR Direct AP candidates.
    public static func buildDirectAPCandidateHosts(
        wifiIP: String?,
        savedHost: String? = nil,
        extraHosts: [String] = [],
        allowLoopbackExtra: Bool = false
    ) -> [DirectAPCandidate] {
        var seen = Set<String>()
        var out: [DirectAPCandidate] = []
        let cleanWifi = wifiIP?.trimmingCharacters(in: .whitespacesAndNewlines)

        func add(_ host: String, label: String, topology: String = "ap_direct", allowLoopback: Bool = false) {
            let h = host.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !h.isEmpty, h != cleanWifi else { return }
            guard isPrivateRFC1918IPv4(h, allowLoopback: allowLoopback) else { return }
            guard !seen.contains(h) else { return }
            seen.insert(h)
            out.append(DirectAPCandidate(host: h, label: label, topology: topology))
        }

        // 1. Derive gateway candidates directly from active Wi-Fi subnet (`A.B.C.254` PUSR AP pattern first)
        if let w = cleanWifi, isPrivateRFC1918IPv4(w) {
            let octets = w.split(separator: ".")
            if octets.count == 4 {
                let prefix = "\(octets[0]).\(octets[1]).\(octets[2])"
                let isPusrDefaultSubnet = (prefix == "10.10.100")
                add("\(prefix).254", label: isPusrDefaultSubnet ? "Direct PUSR AP Default (Active Subnet)" : "Active Wi-Fi Subnet AP (.254)")
                add("\(prefix).1", label: "Active Wi-Fi Subnet AP (.1)")
                add("\(prefix).7", label: "Active Wi-Fi Subnet Static (.7)")
            }
        }

        // 2. Well-known PUSR Direct AP factory defaults
        add(defaultDirectAPHost, label: "Direct PUSR AP Default")
        add(alternateDirectAPHost, label: "Direct PUSR Alternate AP")
        add(fallbackDirectAPHost, label: "Direct Wi-Fi AP Fallback")

        // 3. Previously saved private gateway host if not already present
        if let saved = savedHost?.trimmingCharacters(in: .whitespacesAndNewlines), !saved.isEmpty {
            add(saved, label: "Saved Gateway", topology: "ap_direct")
        }

        // 4. Optional explicit private (or test loopback) hosts
        for extra in extraHosts {
            add(extra, label: "Explicit Bench Candidate", topology: "ap_direct", allowLoopback: allowLoopbackExtra)
        }

        return out
    }

    /// Fast non-blocking TCP reachability probe on MBAP port (default `:502`); strictly refuses `:5502` and WAN IPs.
    public static func probeTCPPort(
        host: String,
        port: Int = 502,
        timeoutS: Double = 0.45,
        allowLoopback: Bool = false
    ) -> (reachable: Bool, rttMs: Double, errorCode: String?) {
        if port == legacyRTUBridgePort {
            return (false, 0.0, "PROTOCOL_MISMATCH")
        }
        let cleanHost = host.trimmingCharacters(in: .whitespacesAndNewlines)
        guard isPrivateRFC1918IPv4(cleanHost, allowLoopback: allowLoopback) else {
            return (false, 0.0, "WAN_HOST_BLOCKED")
        }

        let t0 = ProcessInfo.processInfo.systemUptime
        var hints = addrinfo()
        hints.ai_family = AF_INET
        hints.ai_socktype = SOCK_STREAM
        hints.ai_protocol = IPPROTO_TCP

        var resPtr: UnsafeMutablePointer<addrinfo>?
        guard getaddrinfo(cleanHost, String(port), &hints, &resPtr) == 0, let info = resPtr else {
            return (false, 0.0, "UNRESOLVABLE")
        }
        defer { freeaddrinfo(resPtr) }

        let fd = Darwin.socket(info.pointee.ai_family, info.pointee.ai_socktype, info.pointee.ai_protocol)
        guard fd >= 0 else {
            return (false, 0.0, "SOCKET_ALLOC_FAILED")
        }
        defer { Darwin.close(fd) }

        var one: Int32 = 1
        setsockopt(fd, SOL_SOCKET, SO_NOSIGPIPE, &one, socklen_t(MemoryLayout<Int32>.size))
        let flags = fcntl(fd, F_GETFL, 0)
        _ = fcntl(fd, F_SETFL, flags | O_NONBLOCK)

        let rc = Darwin.connect(fd, info.pointee.ai_addr, info.pointee.ai_addrlen)
        if rc == 0 {
            let rtt = ((ProcessInfo.processInfo.systemUptime - t0) * 1000.0 * 10.0).rounded() / 10.0
            return (true, rtt, nil)
        }
        if errno != EINPROGRESS {
            let err = errno
            let code = (err == EACCES || err == EPERM) ? "LOCAL_NETWORK_DENIED" : "UNREACHABLE"
            let rtt = ((ProcessInfo.processInfo.systemUptime - t0) * 1000.0 * 10.0).rounded() / 10.0
            return (false, rtt, code)
        }

        var pfd = pollfd(fd: fd, events: Int16(POLLOUT), revents: 0)
        let boundedTimeout = min(max(timeoutS, 0.15), 2.0)
        let timeoutMs = Int32((boundedTimeout * 1000.0).rounded())
        let prc = Darwin.poll(&pfd, 1, timeoutMs)
        let rtt = ((ProcessInfo.processInfo.systemUptime - t0) * 1000.0 * 10.0).rounded() / 10.0
        if prc <= 0 {
            return (false, rtt, "TIMEOUT")
        }
        var soErr: Int32 = 0
        var soLen = socklen_t(MemoryLayout<Int32>.size)
        getsockopt(fd, SOL_SOCKET, SO_ERROR, &soErr, &soLen)
        if soErr != 0 {
            let code = (soErr == EACCES || soErr == EPERM) ? "LOCAL_NETWORK_DENIED" : "UNREACHABLE"
            return (false, rtt, code)
        }
        return (true, rtt, nil)
    }

    /// Parallel AP-First discovery probe across active Wi-Fi subnet and PUSR factory Direct AP defaults.
    public static func discoverDirectPusrAP(
        port: Int = 502,
        timeoutS: Double = 0.45,
        savedHost: String? = nil,
        extraHosts: [String] = [],
        allowLoopbackExtra: Bool = false
    ) -> [String: Any] {
        let presets: [[String: Any]] = [
            ["host": defaultDirectAPHost, "port": port, "label": "Direct PUSR AP Default", "topology": "ap_direct"],
            ["host": alternateDirectAPHost, "port": port, "label": "Direct PUSR Alternate AP", "topology": "ap_direct"],
        ]

        if port == legacyRTUBridgePort {
            return [
                "ok": false,
                "found": false,
                "error_code": "PROTOCOL_MISMATCH",
                "port": port,
                "wifi_ip": NSNull(),
                "recommended_host": NSNull(),
                "recommended_topology": "ap_direct",
                "candidates": [],
                "presets": presets,
                "message": "Port 5502 is reserved for raw RTU-over-TCP framing; configure PUSR USR-DR164 in Modbus TCP (MBAP) mode on port 502.",
            ]
        }

        let wifiIP = detectActiveWiFiIPv4()
        let candidates = buildDirectAPCandidateHosts(
            wifiIP: wifiIP,
            savedHost: savedHost,
            extraHosts: extraHosts,
            allowLoopbackExtra: allowLoopbackExtra
        )

        var orderedResults = Array<[String: Any]?>(repeating: nil, count: candidates.count)
        let resultsLock = NSLock()
        let group = DispatchGroup()
        let queue = DispatchQueue.global(qos: .userInitiated)

        for (index, cand) in candidates.enumerated() {
            group.enter()
            queue.async {
                let probe = probeTCPPort(
                    host: cand.host,
                    port: port,
                    timeoutS: timeoutS,
                    allowLoopback: allowLoopbackExtra
                )
                let row: [String: Any] = [
                    "host": cand.host,
                    "port": port,
                    "label": cand.label,
                    "topology": cand.topology,
                    "reachable": probe.reachable,
                    "rtt_ms": probe.rttMs,
                    "error_code": probe.errorCode ?? NSNull(),
                ]
                resultsLock.lock()
                orderedResults[index] = row
                resultsLock.unlock()
                group.leave()
            }
        }
        group.wait()

        let finalRows = orderedResults.compactMap { $0 }
        let winner = finalRows.first { ($0["reachable"] as? Bool) == true }
        let recHost = winner?["host"] as? String
        let recTopo = (winner?["topology"] as? String) ?? "ap_direct"
        let anyPermissionDenied = finalRows.contains { ($0["error_code"] as? String) == "LOCAL_NETWORK_DENIED" }

        let message: String
        if let foundHost = recHost {
            let rtt = (winner?["rtt_ms"] as? Double) ?? 0.0
            message = String(format: "Detected PUSR Modbus TCP gateway at %@:%d (%.1f ms).", foundHost, port, rtt)
        } else if anyPermissionDenied {
            message = "iPadOS Local Network permission denied. Enable Local Network for FieldScanM4 in iPad Settings and retry."
        } else if let wip = wifiIP {
            message = "No PUSR gateway answered on port \(port) from Wi-Fi IP \(wip). Join the PUSR AP Wi-Fi SSID in iPad Settings, verify pure AP Mode + Modbus TCP (:\(port)), or tap a preset below."
        } else {
            message = "No active Wi-Fi IPv4 address detected. Join the PUSR USR-DR164 Direct AP Wi-Fi SSID in iPad Settings (no router or internet needed), then retry."
        }

        return [
            "ok": true,
            "found": recHost != nil,
            "wifi_ip": wifiIP ?? NSNull(),
            "port": port,
            "recommended_host": recHost ?? NSNull(),
            "recommended_topology": recTopo,
            "candidates": finalRows,
            "presets": presets,
            "message": message,
        ]
    }

    // MARK: - 1-Tap PUSR USR-DR164 UDP 48899 Discovery & Auto-Provisioning (Explicit Operator Action Only)

    public static let pusrUDPConfigPort: Int = 48899
    public static let pusrFactoryTCPPort: Int = 8899

    /// Sends one UDP datagram on private RFC1918 LAN to PUSR's Network AT port (`48899`) and awaits reply.
    public static func sendPusrUDPCommand(
        host: String,
        command: String,
        port: Int = 48899,
        timeoutS: Double = 0.65,
        sharedSocketFD: Int32? = nil
    ) -> (reply: String?, senderIP: String?, errorCode: String?) {
        let cleanHost = host.trimmingCharacters(in: .whitespacesAndNewlines)
        guard isPrivateRFC1918IPv4(cleanHost) else {
            return (nil, nil, "WAN_HOST_BLOCKED")
        }

        let fd: Int32
        let ownsFD: Bool
        if let existing = sharedSocketFD, existing >= 0 {
            fd = existing
            ownsFD = false
        } else {
            fd = Darwin.socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP)
            guard fd >= 0 else { return (nil, nil, "SOCKET_ALLOC_FAILED") }
            ownsFD = true
            var one: Int32 = 1
            setsockopt(fd, SOL_SOCKET, SO_BROADCAST, &one, socklen_t(MemoryLayout<Int32>.size))
            setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &one, socklen_t(MemoryLayout<Int32>.size))
            let flags = fcntl(fd, F_GETFL, 0)
            _ = fcntl(fd, F_SETFL, flags | O_NONBLOCK)
        }
        defer {
            if ownsFD { Darwin.close(fd) }
        }

        var dst = sockaddr_in()
        dst.sin_len = UInt8(MemoryLayout<sockaddr_in>.size)
        dst.sin_family = sa_family_t(AF_INET)
        dst.sin_port = UInt16(clamping: port).bigEndian
        guard inet_pton(AF_INET, cleanHost, &dst.sin_addr) == 1 else {
            return (nil, nil, "INVALID_IP")
        }

        let data = Data(command.utf8)
        let sent = data.withUnsafeBytes { rawPtr -> Int in
            guard let base = rawPtr.baseAddress else { return -1 }
            return withUnsafePointer(to: &dst) { dstPtr in
                dstPtr.withMemoryRebound(to: sockaddr.self, capacity: 1) { saPtr in
                    Darwin.sendto(fd, base, data.count, 0, saPtr, socklen_t(MemoryLayout<sockaddr_in>.size))
                }
            }
        }
        if sent < 0 {
            let err = errno
            let code = (err == EACCES || err == EPERM) ? "LOCAL_NETWORK_DENIED" : "UDP_SEND_FAILED"
            return (nil, nil, code)
        }

        var pfd = pollfd(fd: fd, events: Int16(POLLIN), revents: 0)
        let boundedMs = Int32((min(max(timeoutS, 0.15), 2.0) * 1000.0).rounded())
        let prc = Darwin.poll(&pfd, 1, boundedMs)
        if prc <= 0 {
            return (nil, nil, "TIMEOUT")
        }

        var rxBuf = [UInt8](repeating: 0, count: 1024)
        var srcAddr = sockaddr_in()
        var srcLen = socklen_t(MemoryLayout<sockaddr_in>.size)
        let n = withUnsafeMutablePointer(to: &srcAddr) { srcPtr in
            srcPtr.withMemoryRebound(to: sockaddr.self, capacity: 1) { saPtr in
                Darwin.recvfrom(fd, &rxBuf, rxBuf.count, 0, saPtr, &srcLen)
            }
        }
        guard n > 0 else {
            return (nil, nil, "EMPTY_REPLY")
        }
        var ipBuf = [CChar](repeating: 0, count: Int(INET_ADDRSTRLEN))
        var sinIn = srcAddr.sin_addr
        let senderIP = inet_ntop(AF_INET, &sinIn, &ipBuf, socklen_t(INET_ADDRSTRLEN)).map { String(cString: $0) }
        let replyStr = String(bytes: rxBuf.prefix(n), encoding: .utf8)?
            .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return (replyStr, senderIP, nil)
    }

    /// 1-Tap PUSR USR-DR164 diagnostics & automatic UDP `48899` provisioning (`9600 8N1`, `TCP Server :502`, `Modbus TCP`, `AT+Z`).
    public static func autoProvisionPusrGateway(
        preferredHost: String? = nil,
        baud: Int = 9600,
        targetPort: Int = 502
    ) -> [String: Any] {
        if targetPort == legacyRTUBridgePort {
            return [
                "ok": false,
                "status": "protocol_mismatch",
                "error_code": "PROTOCOL_MISMATCH",
                "message": "Port 5502 is forbidden; PUSR USR-DR164 must run Modbus TCP (MBAP) on port 502.",
            ]
        }

        let wifiIP = detectActiveWiFiIPv4()
        let candidates = buildDirectAPCandidateHosts(wifiIP: wifiIP, savedHost: preferredHost)
        let candidateHosts = candidates.map { $0.host }

        // 1. Probe UDP 48899 ("www.usr.cn") across active subnet & PUSR defaults to identify unit even on factory port 8899
        var udpTargets: [String] = []
        if let w = wifiIP, isPrivateRFC1918IPv4(w) {
            let octs = w.split(separator: ".")
            if octs.count == 4 {
                let pfx = "\(octs[0]).\(octs[1]).\(octs[2])"
                udpTargets.append("\(pfx).254")
                udpTargets.append("\(pfx).255")
                udpTargets.append("\(pfx).1")
            }
        }
        for h in [preferredHost ?? "", defaultDirectAPHost, alternateDirectAPHost] where isPrivateRFC1918IPv4(h) {
            if !udpTargets.contains(h) { udpTargets.append(h) }
        }

        let udpFD = Darwin.socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP)
        if udpFD >= 0 {
            var one: Int32 = 1
            setsockopt(udpFD, SOL_SOCKET, SO_BROADCAST, &one, socklen_t(MemoryLayout<Int32>.size))
            setsockopt(udpFD, SOL_SOCKET, SO_REUSEADDR, &one, socklen_t(MemoryLayout<Int32>.size))
            let flags = fcntl(udpFD, F_GETFL, 0)
            _ = fcntl(udpFD, F_SETFL, flags | O_NONBLOCK)
        }
        defer { if udpFD >= 0 { Darwin.close(udpFD) } }

        var udpReply: String?
        var udpHost: String?
        var localNetDenied = false
        for target in udpTargets {
            let res = sendPusrUDPCommand(
                host: target,
                command: "www.usr.cn",
                port: pusrUDPConfigPort,
                timeoutS: 0.45,
                sharedSocketFD: udpFD >= 0 ? udpFD : nil
            )
            if res.errorCode == "LOCAL_NETWORK_DENIED" {
                localNetDenied = true
                break
            }
            if let rep = res.reply, !rep.isEmpty {
                udpReply = rep
                let firstField = rep.split(separator: ",").first.map(String.init) ?? ""
                if isPrivateRFC1918IPv4(firstField) {
                    udpHost = firstField
                } else if let sip = res.senderIP, isPrivateRFC1918IPv4(sip) {
                    udpHost = sip
                } else if !target.hasSuffix(".255") {
                    udpHost = target
                }
                break
            }
        }

        // 2. Check TCP :502 (ready), :8899 (factory default), and :80 (web UI) on discovered host or top candidates
        var probeList: [String] = []
        if let uh = udpHost { probeList.append(uh) }
        for h in candidateHosts where !probeList.contains(h) { probeList.append(h) }

        var host502: String?
        var host8899: String?
        var host80: String?
        for h in probeList.prefix(4) {
            let p502 = probeTCPPort(host: h, port: targetPort, timeoutS: 0.35)
            if p502.errorCode == "LOCAL_NETWORK_DENIED" { localNetDenied = true; break }
            if p502.reachable { host502 = h; break }
            let p8899 = probeTCPPort(host: h, port: pusrFactoryTCPPort, timeoutS: 0.30)
            if p8899.reachable && host8899 == nil { host8899 = h }
            let p80 = probeTCPPort(host: h, port: 80, timeoutS: 0.30)
            if p80.reachable && host80 == nil { host80 = h }
        }

        if localNetDenied {
            return [
                "ok": false,
                "status": "local_network_denied",
                "error_code": "LOCAL_NETWORK_DENIED",
                "wifi_ip": wifiIP ?? NSNull(),
                "message": "iPadOS Local Network permission is OFF for FieldScanM4. Open iPad Settings > Privacy & Security > Local Network and enable FieldScanM4.",
            ]
        }

        // Case A: Already listening on Modbus TCP :502!
        if let readyHost = host502 {
            return [
                "ok": true,
                "status": "ready_on_502",
                "host": readyHost,
                "port": targetPort,
                "topology": "ap_direct",
                "wifi_ip": wifiIP ?? NSNull(),
                "udp_identity": udpReply ?? NSNull(),
                "port_502_open": true,
                "port_8899_open": false,
                "at_log": [],
                "message": "PUSR gateway is live on \(readyHost):\(targetPort) (Modbus TCP). Selected gateway and scanning RS-485 bus now.",
            ]
        }

        // Case B: PUSR detected (via UDP 48899, factory :8899, or web :80) -> attempt 1-tap UDP Network AT auto-provisioning!
        if let foundHost = udpHost ?? host8899 ?? host80 {
            var atLog: [[String: String]] = []
            var appliedCount = 0
            var rebootSent = false

            if udpFD >= 0 {
                // Re-enter Network AT mode specifically against `foundHost`
                let hello = sendPusrUDPCommand(host: foundHost, command: "www.usr.cn", port: pusrUDPConfigPort, timeoutS: 0.50, sharedSocketFD: udpFD)
                if let r = hello.reply, !r.isEmpty {
                    atLog.append(["cmd": "www.usr.cn", "reply": r])
                    let ack = sendPusrUDPCommand(host: foundHost, command: "+ok", port: pusrUDPConfigPort, timeoutS: 0.40, sharedSocketFD: udpFD)
                    if let ar = ack.reply, !ar.isEmpty {
                        atLog.append(["cmd": "+ok", "reply": ar])
                    }

                    func runAT(_ cmd: String) -> String {
                        let r = sendPusrUDPCommand(host: foundHost, command: "\(cmd)\r\n", port: pusrUDPConfigPort, timeoutS: 0.55, sharedSocketFD: udpFD)
                        let out = r.reply ?? (r.errorCode ?? "NO_REPLY")
                        atLog.append(["cmd": cmd, "reply": out])
                        return out
                    }

                    _ = runAT("AT+VER")
                    let wResp = runAT("AT+WMODE=AP")
                    if wResp.lowercased().contains("ok") { appliedCount += 1 }

                    var uResp = runAT("AT+UART=\(baud),8,1,NONE,NFC")
                    if !uResp.lowercased().contains("ok") {
                        uResp = runAT("AT+UART=\(baud),8,N,1")
                    }
                    if uResp.lowercased().contains("ok") { appliedCount += 1 }

                    var sResp = runAT("AT+NETP=TCP,Server,\(targetPort),\(foundHost)")
                    if !sResp.lowercased().contains("ok") {
                        sResp = runAT("AT+NETP=TCP,SERVER,\(targetPort),\(foundHost)")
                    }
                    if !sResp.lowercased().contains("ok") {
                        sResp = runAT("AT+SOCKA=TCPS,\(foundHost),\(targetPort)")
                    }
                    if !sResp.lowercased().contains("ok") {
                        sResp = runAT("AT+SOCKA=TCPS,\(targetPort),\(foundHost)")
                    }
                    if sResp.lowercased().contains("ok") { appliedCount += 1 }

                    var mResp = runAT("AT+WKMOD=MODBUS")
                    if !mResp.lowercased().contains("ok") {
                        mResp = runAT("AT+MODBUS=ON")
                    }
                    if !mResp.lowercased().contains("ok") {
                        mResp = runAT("AT+TCPMB=ON")
                    }
                    if mResp.lowercased().contains("ok") { appliedCount += 1 }

                    if appliedCount > 0 {
                        let zResp = runAT("AT+Z")
                        rebootSent = zResp.lowercased().contains("ok") || !zResp.lowercased().contains("err")
                    }
                }
            }

            if appliedCount >= 2 && rebootSent {
                return [
                    "ok": true,
                    "status": "provisioned_rebooting",
                    "host": foundHost,
                    "port": targetPort,
                    "topology": "ap_direct",
                    "wifi_ip": wifiIP ?? NSNull(),
                    "udp_identity": udpReply ?? NSNull(),
                    "port_502_open": false,
                    "port_8899_open": host8899 != nil,
                    "port_80_open": host80 != nil,
                    "at_applied_count": appliedCount,
                    "at_log": atLog,
                    "message": "Auto-configured PUSR at \(foundHost) (AP, \(baud) 8N1, TCP Server :\(targetPort)) and rebooted via AT+Z. Wait 5 seconds, ensure iPad stays on USR-DR164 Wi-Fi, then tap 1-Tap Auto-Setup again.",
                ]
            }

            let factoryHint = (host8899 != nil)
                ? "Port 8899 (factory default) is open, but port \(targetPort) is closed — likely reset by the physical Reload button."
                : "Web UI (http://\(foundHost)) is reachable, but port \(targetPort) is closed."
            return [
                "ok": true,
                "status": "needs_port_502",
                "host": foundHost,
                "port": targetPort,
                "topology": "ap_direct",
                "wifi_ip": wifiIP ?? NSNull(),
                "udp_identity": udpReply ?? NSNull(),
                "port_502_open": false,
                "port_8899_open": host8899 != nil,
                "port_80_open": host80 != nil,
                "at_applied_count": appliedCount,
                "at_log": atLog,
                "message": "Detected PUSR at \(foundHost). \(factoryHint) Open http://\(foundHost) (admin/admin), set Serial = \(baud) 8N1, Socket = TCP Server Port \(targetPort) + Modbus TCP, click Save + Software Restart (do NOT press physical Reload button!).",
            ]
        }

        // Case C: Not reachable on Wi-Fi at all
        let wifiText = wifiIP != nil ? "Current iPad Wi-Fi IP is \(wifiIP!)." : "No active Wi-Fi IPv4 address detected."
        return [
            "ok": false,
            "status": "not_found",
            "host": NSNull(),
            "port": targetPort,
            "topology": "ap_direct",
            "wifi_ip": wifiIP ?? NSNull(),
            "port_502_open": false,
            "port_8899_open": false,
            "at_log": [],
            "message": "PUSR gateway not reachable. \(wifiText) Join USR-DR164-XXXX in iPad Settings > Wi-Fi ('Use Without Internet') and tap 1-Tap Auto-Setup again.",
        ]
    }
}
