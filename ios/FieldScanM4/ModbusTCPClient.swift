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
            "temp_c": tempVal as Any,
            "humidity_rh": humVal as Any,
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
}
