# Industrial Datasheet + FieldScan

Field diagnosis and spare-part verification for a boat engine room, with
realistic Three.js digital twins (normal, X-ray and exploded views) and a
real-time assistant you can talk to.

Two cases run on the same session core:

1. **TZ THT-02 Modbus RTU diagnosis.** The master polls address 1, but the
   sensor DIP is set to `0000 0010` (address 2). The sensor stays silent and
   the master times out. The fix sets the DIP to `0000 0001`, and the reading
   comes back as 23.4 °C / 57.8 %RH. Every frame is CRC-checked and every
   explanation cites the manual sections.
2. **4–20 mA spare verification.** The FMX11 replaces a WIKA LS-10 on loop
   LT-301 (24 V / 12 V, config v1 / v2, empty-tank and open-wire scenarios).
   The loop-load check runs separately from full replacement equivalence.

The THT-02 bus and the installation are **simulated**. Every result says
whether it is `observed`, `simulated` or `documented`, and the app never
presents a simulated reading as a field measurement.

## Run

The only requirement is Python 3.10+. The backend uses the standard library
only.

```bash
python3 mvp.py --port 8765 --open          # local server + UI
python3 mvp.py --self-test                 # Python golden vectors and flows
python3 mvp.py --tool get_asset_status --args '{}'
python3 mvp.py --mcp                       # MCP server over stdio
python3 mvp.py --html FIELD_SCAN_DEMO.html # portable offline demo
python3 -m unittest discover -s tests -t .
```

`FIELD_SCAN_DEMO.html` is a single self-contained file. Open it directly from
disk: it works in airplane mode with the same JS session core.

To rebuild the frontend after editing `web/src`:

```bash
npm install && npm run build   # esbuild → web/dist/app.js
```

## Demo script

1. **Live view (1):** the FieldScan HUD recognizes the probe. Click **Capture frame**,
   then **Confirm asset**.
2. **THT-02 diagnosis (2):** ask *"Why does it fail?"*. The assistant explains
   the timeout and cites §5, §6.4 and §6.10. Use **View manual** to read the
   cited sections and check their validity.
3. **Simulate DIP fix:** the probe opens in 3D and the DIP is set to address 1.
   Ask *"Does it work now?"*. You can also click the DIP mirror switches
   directly.
4. **Inject faults:** bad CRC, foreign address or sensor 7FFF H. Watch the
   RTU frames tab.
5. **X-ray / Disassemble:** inspect the inside of the probe, gateway and loop.
6. **4–20 mA spare (3):** switch to 12 V and watch the load check fail. Ask
   *"Is the spare a valid replacement?"*.
7. Ask *"Is everything OK?"* or *"run self-test"* for live diagnostics and
   the JS/Python parity check.

## Tool contracts

All six tools are exposed through the HTTP API (`POST /api/tools/<name>`), the
CLI (`--tool`) and MCP (`--mcp`). Every call returns an `event_id`. Session
pins record `asset_id`, `product_id`, `catalog_version`, `rules_version` and
the status of each source.

| Tool | Purpose |
|---|---|
| `capture_frame` | Frame from the simulated scene. `uvc` reports that it is not integrated. |
| `confirm_asset` | Pins the identity and lists the pending fields. |
| `get_document` | Document, edition, date, URL, section and validity. |
| `get_asset_status` | Simulated RTU reading. `rtu_bench` returns `no_evidence`. |
| `simulate_fault` | Before / action / after evidence. |
| `check_replacement` | Per-criterion verdict with margin and sources. |

A missing manual, a variant mismatch or an unknown catalog or rules version
returns `insufficient_evidence` instead of a guess.

## Architecture

```
core/modbus.py         CRC-16/MODBUS, DIP mapping, THT-02 behaviour model, frame decoder
core/fieldscan.py      Session, versioned catalog/documents, six tools, self-tests
core/compatibility.py  4–20 mA loop-load engine
edge/server.py         Loopback HTTP server, tools API, portable HTML builder
edge/mcp_stdio.py      MCP stdio server (JSON-RPC 2.0, stdlib)
adapters/ai.py         LLM adapter: on-device Liquid AI (auto-detected) or remote OpenAI-compatible
scripts/               start_local_ai.sh (llama.cpp + LFM3-1.7B)
web/src/               Three.js twins, JS session mirror, assistant, UI
tests/                 unittest suite
```

The browser keeps a JS mirror of the Modbus core so the portable file works
offline. The self-test checks it against the Python golden vectors.

### On-device LLM (works offline)

Commands, diagnoses and numbers always come from the deterministic local engine,
with citations. For open conversation, the assistant uses a small **Liquid AI**
model running on the same machine, so the crew can still talk to the platform
when the boat has no Internet:

```bash
brew install llama.cpp
./scripts/start_local_ai.sh      # downloads LFM3-1.7B Q4_K_M (~1.1 GB) once, serves on :8080
python3 mvp.py --port 8765 --open
```

The server detects the model automatically at `AI_LOCAL_URL` (default
`http://127.0.0.1:8080/v1`). The header pill then shows
`Assistant · lfm3-1.7b · on-device`. The adapter disables the model's
reasoning pass for fast, literal answers and grounds every reply in a fixed
fact sheet plus the live session context.

### Boat ONLINE / OFFLINE switch: who answers

The big switch above the assistant tabs shows whether the boat has Internet and
who is answering. Every reply is tagged `rule engine`, `<model> · on-device` or
`<model> · cloud`.

- **OFFLINE** (default): free-form chat never leaves the machine. The on-device
  Liquid AI model answers.
- **ONLINE**: free-form chat goes to the cloud model configured on the server
  (`AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY`). If none is configured, the switch
  says so and the on-device model keeps answering.

Commands and diagnoses always run on the local rule engine. No key ever reaches
the browser. The portable `FIELD_SCAN_DEMO.html` uses the rule engine only.

### Hands-free Live voice and vision (LFM3-Omni, on-device)

```bash
./scripts/start_local_ai.sh omni  # LFM3-Omni-2B Q4_K_M + projector (~1.9 GB) once, serves on :8081
```

- **Go Live** works like a real-time voice call, with no send button. You speak,
  voice activity detection ends your turn, and LFM3-Omni transcribes it
  on-device (`/api/asr`). The answer streams and is spoken sentence by sentence
  with the macOS offline voices. Talk over it to interrupt (barge-in).
- **Mic button**: push-to-talk with the same on-device transcription.
- **"What do you see?"** sends the current 3D frame to LFM3-Omni
  (`/api/vision`, on demand only, never a continuous video feed). The
  description is labelled as an AI description, not evidence.

Without the Omni server, Live voice explains how to start it, and the mic falls
back to the browser speech service.

## FieldScan reuse vs. new work

- **Reused from FieldScan
  ([armando-token/beta_2](https://github.com/armando-token/beta_2)):** the
  concept of a live camera with asset recognition, one session per asset, and
  the voice and camera input paths. The UVC and voice adapters are planned
  here, not wired.
- **New in this project:** the THT-02 Modbus RTU model and diagnosis, versioned
  evidence with session pins, the six tool contracts (HTTP, CLI and MCP), the
  Three.js twins with X-ray and disassembly, the 4–20 mA verifier, and the
  portable offline demo.

## Sponsor integrations (planned)

None of these integrations exist in this build yet. Each will be recorded with
verifiable evidence once it is done.

| Sponsor | Planned work |
|---|---|
| Boat.dev | Run the worker and tests on a persistent VM; package a catalog revision with a manifest and checksums. |
| Context.dev | Real source search and a monitor on a verified OEM page (URL, date, SHA-256). |
| NY Token Exchange | Confidential extraction of documented fields, validated against a schema and the source. |
| Teamily AI | Agent review of a catalog diff, linked to the job. |
