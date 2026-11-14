"""Modbus RTU primitives and a TZ THT-02 behaviour model (simulation only).

Protocol facts follow the TZ THT-02 User's Manual V1.0 (2021-03-18):
section 5 (DIP weights 128..1), 6.4 (registers, 7FFF H = abnormal),
6.7 (function 03 example frames), 6.9 (exception responses) and
6.10 (CRC-16, preset FFFF, polynomial A001, low byte first).

Nothing here talks to hardware. A bench reader can implement the same
`transact(request) -> response | None` contract later.
"""

DIP_WEIGHTS = (128, 64, 32, 16, 8, 4, 2, 1)
SENSOR_ABNORMAL = 0x7FFF
REGISTER_COUNT = 8
FUNCTION_READ = 0x03
BAUD_RATES = (4800, 9600, 19200)
RESPONSE_TIMEOUT_MS = 1000


def crc16(data):
    crc = 0xFFFF
    for byte in data:
        crc ^= byte
        for _ in range(8):
            crc = (crc >> 1) ^ 0xA001 if crc & 1 else crc >> 1
    return crc


def with_crc(pdu):
    crc = crc16(pdu)
    return bytes(pdu) + bytes((crc & 0xFF, crc >> 8))


def crc_ok(frame):
    return len(frame) >= 4 and crc16(frame[:-2]) == (frame[-2] | frame[-1] << 8)


def hexstr(frame):
    return " ".join(f"{b:02X}" for b in frame) if frame is not None else None


def dip_to_address(bits):
    if len(bits) != 8 or any(b not in (0, 1) for b in bits):
        raise ValueError("DIP state must be 8 values of 0 or 1 (switch 1 first).")
    return sum(w for b, w in zip(bits, DIP_WEIGHTS) if b)


def address_to_dip(address):
    if not 0 <= address <= 255:
        raise ValueError("Address must be 0..255.")
    return [1 if address & w else 0 for w in DIP_WEIGHTS]


def read_request(address, start=0, quantity=2):
    if not 1 <= address <= 247:
        raise ValueError("Master polling address must be 1..247.")
    if not (0 <= start < REGISTER_COUNT and 1 <= quantity <= REGISTER_COUNT - start):
        raise ValueError("Register window must stay inside 0..7.")
    return with_crc(bytes((address, FUNCTION_READ, start >> 8, start & 0xFF, quantity >> 8, quantity & 0xFF)))


def _word(value):
    value &= 0xFFFF
    return bytes((value >> 8, value & 0xFF))


class Tht02Model:
    """Behaviour model of one THT-02 on an RS-485 segment."""

    def __init__(self, dip_bits, temperature_c=23.4, humidity_rh=57.8, baud=9600,
                 hardware_version=0x0600, software_version=0x000A, element_fault=False):
        self.dip_bits = list(dip_bits)
        self.temperature_c = temperature_c
        self.humidity_rh = humidity_rh
        self.baud = baud
        self.hardware_version = hardware_version
        self.software_version = software_version
        self.element_fault = element_fault

    @property
    def address(self):
        return dip_to_address(self.dip_bits)

    def registers(self):
        temp = SENSOR_ABNORMAL if self.element_fault else round(self.temperature_c * 10)
        rh = SENSOR_ABNORMAL if self.element_fault else round(self.humidity_rh * 10)
        return [temp, rh, 0, 0, self.address, self.baud, self.hardware_version, self.software_version]

    def transact(self, request):
        """Return the response frame, or None when the sensor stays silent (timeout)."""
        if not crc_ok(request) or len(request) < 4:
            return None  # 6.10: wrong CRC is ignored
        address, function = request[0], request[1]
        if address == 0 or address != self.address:
            return None
        if function != FUNCTION_READ:
            return with_crc(bytes((address, function | 0x80, 0x01)))
        if len(request) != 8:
            return with_crc(bytes((address, 0x83, 0x03)))
        start = request[2] << 8 | request[3]
        quantity = request[4] << 8 | request[5]
        if quantity < 1 or start + quantity > REGISTER_COUNT:
            return with_crc(bytes((address, 0x83, 0x02)))
        data = b"".join(_word(v) for v in self.registers()[start:start + quantity])
        return with_crc(bytes((address, FUNCTION_READ, len(data))) + data)


def decode_read(response, expected_address, start=0, quantity=2):
    """Verify a function-03 response. Values are reported only when every check passes."""
    checks = []

    def check(name, ok, detail):
        checks.append({"check": name, "ok": bool(ok), "detail": detail})
        return ok

    result = {"status": "invalid", "valid": False, "checks": checks, "values": None, "exception": None}
    if response is None:
        check("response", False, f"No reply within {RESPONSE_TIMEOUT_MS} ms")
        result["status"] = "timeout"
        return result
    if not check("length", len(response) >= 5, f"{len(response)} bytes"):
        return result
    if not check("crc", crc_ok(response), "CRC-16/MODBUS " + ("matches" if crc_ok(response) else "mismatch")):
        return result
    if not check("address", response[0] == expected_address, f"0x{response[0]:02X} (expected 0x{expected_address:02X})"):
        return result
    if response[1] == FUNCTION_READ | 0x80:
        code = response[2]
        check("function", False, f"Exception 0x{code:02X}")
        result["status"] = "exception"
        result["exception"] = code
        return result
    if not check("function", response[1] == FUNCTION_READ, f"0x{response[1]:02X}"):
        return result
    expected_bytes = 2 * quantity
    if not check("byte_count", response[2] == expected_bytes and len(response) == 5 + expected_bytes,
                 f"{response[2]} data bytes (expected {expected_bytes})"):
        return result
    words = [response[3 + 2 * i] << 8 | response[4 + 2 * i] for i in range(quantity)]
    registers = dict(zip(range(start, start + quantity), words))
    abnormal = [r for r in (0, 1) if registers.get(r) == SENSOR_ABNORMAL]
    if not check("sensor_marker", not abnormal, "7FFF H on register " + ", ".join(map(str, abnormal)) if abnormal else "no 7FFF H marker"):
        result["status"] = "sensor_abnormal"
        return result
    values = {}
    if 0 in registers:
        raw = registers[0]
        values["temperature_c"] = round((raw - 0x10000 if raw & 0x8000 else raw) / 10, 1)
    if 1 in registers:
        values["humidity_rh"] = round(registers[1] / 10, 1)
    result.update(status="valid", valid=True, values=values)
    return result


INJECTIONS = ("none", "bad_crc", "foreign_address", "sensor_fault")


def poll(master_address, model, injection="none", start=0, quantity=2):
    """One master transaction against the model, with optional fault injection on the reply."""
    if injection not in INJECTIONS:
        raise ValueError("Injection must be one of " + ", ".join(INJECTIONS) + ".")
    request = read_request(master_address, start, quantity)
    fault = model.element_fault
    if injection == "sensor_fault":
        model.element_fault = True
    try:
        response = model.transact(request)
    finally:
        model.element_fault = fault
    if response is not None and injection == "bad_crc":
        response = response[:-1] + bytes((response[-1] ^ 0x5A,))
    if response is not None and injection == "foreign_address":
        response = with_crc(bytes(((response[0] % 247) + 1,)) + response[1:-2])
    decoded = decode_read(response, master_address, start, quantity)
    return {
        "source": "simulated",
        "master_address": master_address,
        "device_address": model.address,
        "injection": injection,
        "request_hex": hexstr(request),
        "response_hex": hexstr(response),
        "decode": decoded,
    }


# Golden vectors shared with the browser implementation (web/src/fieldscan/modbus.js).
MANUAL_REQUEST = "01 03 00 00 00 08 44 0C"  # manual 6.7, host request
MANUAL_RESPONSE = "01 03 10 00 FA 02 58 00 00 00 00 00 01 25 80 06 00 00 0A D4 64"  # manual 6.7, sensor reply


def golden_vectors():
    incident = Tht02Model(address_to_dip(2))
    fixed = Tht02Model(address_to_dip(1))
    return {
        "manual_request": MANUAL_REQUEST,
        "manual_response": MANUAL_RESPONSE,
        "incident": poll(1, incident),
        "fixed": poll(1, fixed),
        "bad_crc": poll(1, fixed, "bad_crc"),
        "foreign_address": poll(1, fixed, "foreign_address"),
        "sensor_fault": poll(1, fixed, "sensor_fault"),
    }


def self_test():
    manual_model = Tht02Model(address_to_dip(1), temperature_c=25.0, humidity_rh=60.0)
    request = read_request(1, 0, 8)
    assert hexstr(request) == MANUAL_REQUEST, hexstr(request)
    assert hexstr(manual_model.transact(request)) == MANUAL_RESPONSE
    assert dip_to_address([1, 0, 1, 1, 0, 0, 0, 0]) == 176  # manual section 5 example
    v = golden_vectors()
    assert v["incident"]["decode"]["status"] == "timeout"
    assert v["fixed"]["decode"]["values"] == {"temperature_c": 23.4, "humidity_rh": 57.8}
    for name in ("bad_crc", "foreign_address", "sensor_fault"):
        assert not v[name]["decode"]["valid"] and v[name]["decode"]["values"] is None, name
    negative = Tht02Model(address_to_dip(1), temperature_c=-12.5)
    assert poll(1, negative)["decode"]["values"]["temperature_c"] == -12.5
    out_of_range = with_crc(bytes((1, FUNCTION_READ, 0, 6, 0, 5)))  # registers 6..10 do not exist
    exception = decode_read(Tht02Model(address_to_dip(1)).transact(out_of_range), 1, 6, 5)
    assert exception["status"] == "exception" and exception["exception"] == 2
    return {
        "ok": True,
        "cases": ["manual 6.7 request CRC", "manual 6.7 response", "DIP example 176", "address mismatch timeout",
                  "valid decode 23.4 °C / 57.8 %RH", "bad CRC rejected", "foreign address rejected",
                  "7FFF H rejected", "negative temperature", "exception 02"],
    }
