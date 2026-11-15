import * as THREE from 'three';
import { loadBundle, getBundle, callTool, sessionState, syncSession, getReport, health, aiStatus, selfTest, mode } from './data.js';
import { Tht02Model, poll, annotate, addressToDip, dipToAddress, DIP_WEIGHTS } from './fieldscan/modbus.js';
import { Telemetry, drawChart } from './telemetry.js';
import { Twin } from './twin/twin.js';
import { ThtTwin } from './twin/tht.js';
import { Assistant } from './assistant.js';

const $ = id => document.getElementById(id);
const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
const h = (tag, props = {}, ...children) => {
  const el = Object.assign(document.createElement(tag), props);
  el.append(...children.filter(c => c !== null && c !== undefined && c !== false));
  return el;
};
const STATES = {
  nominal: 'Nominal level',
  empty_tank: 'Empty tank',
  open_circuit: 'Open wire · loop diagnostic',
  outside_load_envelope: 'Load outside limit',
};
const PROVENANCE = {
  oem: ['OEM', 'oem'], synthetic: ['Synthetic', 'synthetic'], pending: ['Pending', 'pending'],
  live: ['Live', 'oem'], fieldscan: ['FieldScan', 'fieldscan'],
};
const STATUS_TEXT = {
  valid: 'Valid reply', timeout: 'No reply · timeout', invalid: 'Frame rejected',
  sensor_abnormal: 'Sensor abnormal (7FFF H)', exception: 'Modbus exception', idle: 'Not polled yet',
};
const SUBTITLES = {
  live: 'FieldScan live view · engine room · bulkhead FR 42 · asset BOAT-ER-TH-02',
  diag: 'THT-02 diagnosis · RS-485 segment B · Modbus RTU 9600 8N1',
  compat: '4–20 mA spare · freshwater tank T-03 · loop LT-301 · FMX11 replacing WIKA LS-10',
};
const CAMS = {
  tht: [['overview', 'Overview'], ['camera', 'Camera'], ['plate', 'Plate'], ['probe', 'Probe'], ['dip', 'DIP'], ['gateway', 'Master']],
  loop: [['overview', 'Overview'], ['probe', 'Probe'], ['cabinet', 'Cabinet']],
};
const INTERNAL = { tht: ['tht-sht', 'tht-dip', 'tht-rs485'], loop: ['probe', 'probe-cap', 'probe-cell', 'probe-pcb'] };
const bitsText = bits => bits.slice(0, 4).join('') + ' ' + bits.slice(4).join('');

class App {
  constructor() {
    this.ws = 'live';
    this.config = { voltage: 24, revision: 'v1', scenario: 'nominal' };
    this.report = null;
    this.replacement = null;
    this.ai = { configured: false, model: null };
    this.requestId = 0;
    this.transactions = [];
    this.bus = null;
    this.frame = null;
    this.lastStatus = 'idle';
    this.holdUntil = 0;
    this.selfTest = selfTest;
    this.health = health;
    this.mode = mode;
  }

  async start() {
    $('pill-link').textContent = mode === 'portable' ? 'Portable · offline-ready' : 'Local server';
    $('pill-link').className = 'pill ok';
    this.updateNetwork();
    const tickClock = () => {
      const t = new Date().toLocaleTimeString('en-US', { hour12: false });
      $('clock').textContent = t + ' local';
      $('hud-time').textContent = new Date().toISOString().slice(0, 10) + ' ' + t;
    };
    tickClock();
    setInterval(tickClock, 1000);

    let bundle;
    try {
      bundle = await loadBundle();
    } catch (error) {
      this.toast(error.message);
      $('pill-link').textContent = 'Server unreachable';
      $('pill-link').className = 'pill fail';
      return;
    }
    this.bundle = bundle;
    $('pill-engine').textContent = `Catalog ${bundle.catalog_version.split('/')[1]} · ${bundle.rules_versions.diagnosis}`;
    $('pill-engine').title = `Catalog ${bundle.catalog_version} · rules ${bundle.rules_versions.diagnosis}, ${bundle.rules_versions.loop}`;
    $('pill-engine').className = 'pill ok';

    const common = { onSelect: id => this.inspect(id), onHover: (name, x, y) => this.tooltip(name, x, y) };
    this.tht = new ThtTwin($('viewport-tht'), {
      ...common, plateLines: bundle.assets['BOAT-ER-TH-02'].plate_lines, onDip: i => this.toggleDip(i),
    });
    this.loop = new Twin($('viewport-loop'), common);
    this.loop.setActive(false);
    this.telemetry = new Telemetry(sample => this.onSample(sample));
    this.assistant = new Assistant(this);
    this.bindUi();
    this.buildDip();

    await this.refreshSession();
    this.applyBus(this.bus || { master_address: bundle.incident.master_address, dip_bits: addressToDip(bundle.incident.device_address) });
    this.renderDocuments();
    if (this.identity) this.renderIdentity();

    await this.refreshAi();
    await this.setConfig({}, 'init');
    this.telemetry.start();
    this.setWorkspace('live', { quiet: true });
    this.assistant.greet();
    setInterval(() => this.livePoll(), 2500);
    requestAnimationFrame(() => this.hudLoop());
    if (mode === 'server') {
      setInterval(() => this.checkLink(), 5000);
      setInterval(() => this.refreshAi(), 20000);
    }
  }

  async refreshAi() {
    this.ai = await aiStatus();
    const pill = $('pill-ai');
    pill.title = [
      `Cloud: ${this.ai.cloud?.configured ? this.ai.cloud.model : 'not configured'}`,
      `On-device chat: ${this.ai.on_device?.configured ? this.ai.on_device.model : 'not running'}`,
      `On-device voice + vision: ${this.ai.omni?.configured ? this.ai.omni.model : 'not running'}`,
    ].join('\n');
    pill.className = 'pill ok';
    this.assistant.updateLinkUi();
  }

  get stage() { return this.ws === 'compat' ? this.loop : this.tht; }
  get twin() { return this.stage; }
  get identity() { return sessionState().identity; }
  sessionPins() { return sessionState().pins; }

  // ------------------------------------------------------------ workspaces

  setWorkspace(ws, { quiet = false } = {}) {
    if (!SUBTITLES[ws]) return;
    const changed = ws !== this.ws;
    const prevStage = this.stage;
    this.ws = ws;
    $('app').dataset.ws = ws;
    for (const b of document.querySelectorAll('.workspaces button')) b.setAttribute('aria-selected', String(b.dataset.ws === ws));
    for (const id of ['live', 'diag', 'compat']) $('ws-' + id).hidden = id !== ws;
    const current = document.querySelector('.tabs button[aria-selected="true"]')?.dataset.tab;
    for (const el of document.querySelectorAll('.tabs [data-only]')) el.hidden = !el.dataset.only.split(' ').includes(ws);
    const tabBtn = document.querySelector(`.tabs button[data-tab="${current}"]`);
    if (tabBtn?.hidden) this.openTab('assistant');
    $('subtitle').textContent = SUBTITLES[ws];
    const loop = ws === 'compat';
    $('viewport-loop').hidden = !loop;
    $('viewport-tht').hidden = loop;
    this.loop.setActive(loop);
    this.tht.setActive(!loop);
    if (prevStage !== this.stage || !this.assemblyBuilt) {
      this.buildCams();
      this.buildAssembly();
      this.inspect(null);
      this.syncDock();
      this.assemblyBuilt = true;
    }
    if (ws === 'live' && changed) this.tht.preset(this.frame ? 'camera' : 'overview');
    if (ws === 'diag' && changed) this.tht.preset('overview');
    if (ws === 'compat') this.refreshReplacement();
    this.assistant.setChips(ws);
    if (changed && !quiet) this.assistant.onWorkspace(ws);
  }

  // ------------------------------------------------------------ session state

  async refreshSession() {
    const s = await syncSession();
    if (s.bus) this.bus = s.bus;
    this.renderPins(s.pins);
    this.renderEvents(s.events);
    return s;
  }

  applyBus(bus) {
    this.bus = { ...bus, device_address: dipToAddress(bus.dip_bits) };
    this.tht.setDip(this.bus.dip_bits);
    this.renderDip();
    $('d-master').textContent = `Address ${this.bus.master_address} · FC03 · R0 × 2`;
    const a = this.bus.device_address;
    $('d-addr').textContent = `${bitsText(this.bus.dip_bits)} → address ${a}` + (a === this.bus.master_address ? ' ✓' : ` ≠ ${this.bus.master_address}`);
    $('d-addr').className = a === this.bus.master_address ? 'pos' : 'neg';
  }

  renderPins(pins) {
    if (!pins) return;
    const rows = [
      ['Asset', pins.asset_id || 'not confirmed'],
      ['Product', pins.product_id || '—'],
      ['Catalog', pins.catalog_version],
      ['Rules', `${pins.rules_version.diagnosis} · ${pins.rules_version.loop}`],
      ['Last event', pins.last_event_id || '—'],
      ['Sources', Object.entries(pins.source_status).map(([k, v]) => `${k}: ${v.replace('_', ' ')}`).join(' · ')],
    ];
    $('pins').replaceChildren(...rows.flatMap(([k, v]) => [h('dt', { textContent: k }), h('dd', { textContent: v })]));
  }

  renderEvents(events = []) {
    $('events').replaceChildren(...[...events].reverse().slice(0, 50).map(e => h('li', {},
      h('code', { textContent: e.event_id }),
      h('span', { textContent: `${e.tool} · ${e.summary}` }),
      h('span', { className: 'src', textContent: e.source }))));
  }

  renderDocuments() {
    $('documents').replaceChildren(...Object.values(this.bundle.documents).map(d => {
      const li = h('li', {}, h('code', { textContent: d.id }));
      const a = h('a', { href: '#', textContent: d.title });
      a.addEventListener('click', e => { e.preventDefault(); this.assistant.action('showManual', null, d.id); });
      li.append(a, ` · ${d.edition || ''} · validity: ${d.validity.replace('_', ' ')}`);
      return li;
    }));
    $('versions').textContent = `Catalog ${this.bundle.catalog_version} · rules ${this.bundle.rules_versions.diagnosis} · ${this.bundle.rules_versions.loop} · mode ${mode}`;
  }

  renderIdentity() {
    const id = this.identity;
    if (!id) return;
    $('btn-confirm').disabled = id.confirmed;
    $('btn-confirm').textContent = id.confirmed ? 'Asset confirmed ✓' : 'Confirm asset';
    $('btn-go-diag').disabled = !id.confirmed;
    if (!this.frame) {
      $('recog-card').className = 'card found';
      $('recog-card').replaceChildren(
        h('div', { className: 'match' }, h('strong', { textContent: id.model }), h('span', { className: 'tag oem', textContent: id.status.replace('_', ' ') })),
        h('div', { className: 'muted small', textContent: `Asset ${id.asset_id} · pending: ${id.pending_fields.join(', ')}` }));
    }
  }

  // Record a tool transaction and animate it.
  recordTx(tx, eventId, label) {
    if (!tx) return;
    this.transactions.unshift({ ...tx, event_id: eventId, label });
    this.transactions.length = Math.min(this.transactions.length, 30);
    this.renderFrames();
    this.showStatus(tx, eventId);
    this.holdUntil = Date.now() + 4000;
    this.tht.playTransaction(tx);
  }

  showStatus(tx, eventId = null) {
    const st = tx.decode.status;
    this.lastStatus = st;
    $('d-status').textContent = STATUS_TEXT[st] + (eventId ? ` · ${eventId}` : ' · live simulation');
    $('d-status').className = st === 'valid' ? 'pos' : 'neg';
    $('d-reading').textContent = st === 'valid'
      ? `${tx.decode.values.temperature_c.toFixed(1)} °C · ${tx.decode.values.humidity_rh.toFixed(1)} %RH (simulated)`
      : 'No valid reading';
    const v = $('diag-verdict');
    v.className = 'verdict ' + (st === 'valid' ? 'ok' : 'fail');
    v.textContent = st === 'valid' ? 'Sensor answering · CRC OK' : STATUS_TEXT[st];
  }

  renderFrames() {
    const bytes = (frameHex, kind, bad) => frameHex
      ? h('span', { className: 'bytes' }, ...annotate(frameHex, kind).map(b => h('span', { className: `b ${b.role}${bad && b.role === bad ? ' bad' : ''}`, textContent: b.hex })))
      : h('span', { className: 'muted small', textContent: '— no reply within 1000 ms —' });
    $('frames').replaceChildren(...this.transactions.map(tx => {
      const st = tx.decode.status;
      const failed = tx.decode.checks.find(c => !c.ok);
      const bad = failed && { crc: 'crc', address: 'addr', function: 'fn', byte_count: 'count', sensor: 'data' }[failed.check];
      return h('li', { className: st === 'valid' ? 'ok' : 'fail' },
        h('div', { className: 'hdr' }, h('span', { textContent: `${tx.event_id || 'live'} · ${tx.label || 'poll'}${tx.injection !== 'none' ? ' · inject ' + tx.injection : ''}` }), h('strong', { textContent: STATUS_TEXT[st] })),
        h('div', { className: 'dir' }, h('span', { textContent: 'REQ' }), bytes(tx.request_hex, 'request')),
        h('div', { className: 'dir' }, h('span', { textContent: 'RSP' }), bytes(tx.response_hex, 'response', bad)),
        h('div', { className: 'checks' }, ...tx.decode.checks.map(c => h('span', { className: c.ok ? 'ok' : 'no', textContent: `${c.ok ? '✓' : '✗'} ${c.check}`, title: c.detail }))));
    }));
  }

  // Display-only read of the simulated bus right now (no event, never evidence).
  liveSnapshot() {
    if (!this.bus) return null;
    return poll(this.bus.master_address, new Tht02Model(this.bus.dip_bits, this.bundle.incident.temperature_c, this.bundle.incident.humidity_rh));
  }

  // Display-only poll so the gateway LCD and bus packets feel alive; never recorded as evidence.
  livePoll() {
    if (this.ws === 'compat' || !this.bus || this.tht.anim || Date.now() < this.holdUntil || document.hidden) return;
    const tx = poll(this.bus.master_address, new Tht02Model(this.bus.dip_bits, this.bundle.incident.temperature_c, this.bundle.incident.humidity_rh));
    this.tht.playTransaction(tx, { quiet: true });
    this.showStatus(tx);
  }

  // ------------------------------------------------------------ FieldScan flow (shared with the assistant)

  async capture() {
    this.setWorkspace('live', { quiet: true });
    const hud = $('hud');
    hud.classList.remove('flash');
    void hud.offsetWidth;
    hud.classList.add('flash');
    const res = await callTool('capture_frame', { source: 'simulated' });
    this.frame = res;
    this.tht.preset('camera');
    $('recog-box').hidden = false;
    $('recog-tag').textContent = 'TZ THT-02 · plate match (simulated)';
    $('recog-card').className = 'card found';
    $('recog-card').replaceChildren(
      h('div', { className: 'match' }, h('strong', { textContent: 'TZ THT-02' }), h('span', { className: 'tag synthetic', textContent: 'needs confirmation' })),
      h('div', { className: 'plate', textContent: res.plate_text.join('\n') }),
      h('div', { className: 'muted small', textContent: `${res.frame_id} · source ${res.source} · hint ${res.asset_hint} · ${res.event_id}` }));
    $('btn-confirm').disabled = false;
    $('btn-confirm').textContent = 'Confirm asset';
    await this.refreshSession();
    return [
      `Frame captured (${res.event_id}, simulated source). The nameplate reads **${res.plate_text[0]}** · ${res.plate_text[2]} · ${res.plate_text[3]}.`,
      `It matches catalog product tzone-tht-02 and asset ${res.asset_hint} on bulkhead FR 42. This is only a candidate: the plate is synthetic and a technician must confirm it before any diagnosis.`,
    ].join('\n');
  }

  async confirm() {
    if (!this.frame && !this.identity) await this.capture();
    const res = await callTool('confirm_asset', { model: 'TZ THT-02', id_source: 'plate_simulated', confirmed: true, asset_id: 'BOAT-ER-TH-02' });
    await this.refreshSession();
    if (res.status === 'insufficient_evidence') return '[warn] ' + res.missing;
    this.renderIdentity();
    $('recog-tag').textContent = 'TZ THT-02 · confirmed';
    return [
      `[ok] Asset confirmed by the technician (${res.event_id}): **${res.model}** at ${res.asset_id}.`,
      `Session pinned to ${res.pins.catalog_version} and rules ${res.pins.rules_version.diagnosis}.`,
      `[warn] Not verified from the plate: ${res.pending_fields.join(', ')}.`,
      'Next: open the diagnosis and ask “Why does it fail?”.',
    ].join('\n');
  }

  async ensureIdentity(notes) {
    if (this.identity?.confirmed) return;
    notes.push(await this.confirm());
  }

  showPlate() {
    this.setWorkspace('live', { quiet: true });
    if (this.stage.view === 'xray') this.setView('normal');
    this.setExplode(0);
    this.tht.preset('plate');
    const lines = this.bundle.assets['BOAT-ER-TH-02'].plate_lines;
    return `Zoomed on the nameplate: “${lines.join(' / ')}”. The plate is synthetic for this demo, so it identifies the model but not the order variant or factory address.`;
  }

  async whyFail() {
    const notes = [];
    await this.ensureIdentity(notes);
    this.setWorkspace('diag', { quiet: true });
    const res = await callTool('get_asset_status', { transport: 'simulated_rtu' });
    await this.refreshSession();
    this.recordTx(res.transaction, res.event_id, 'diagnosis poll');
    this.tht.preset('overview');
    const tx = res.transaction;
    const st = tx.decode.status;
    const bits = this.bus.dip_bits;
    if (st === 'valid') {
      notes.push(`[ok] It does not fail right now (${res.event_id}): the master polls address ${tx.master_address}, the sensor answers with a valid CRC: **${tx.decode.values.temperature_c.toFixed(1)} °C, ${tx.decode.values.humidity_rh.toFixed(1)} %RH** (simulated).`);
      return notes.join('\n');
    }
    if (st === 'timeout' && tx.device_address !== tx.master_address) {
      notes.push(
        `**Diagnosis (${res.event_id}, rules ${this.bundle.rules_versions.diagnosis}):** the master sends \`${tx.request_hex}\` to address **${tx.master_address}** and gets no reply within 1000 ms.`,
        `The sensor DIP reads ${bitsText(bits)} → address **${tx.device_address}** (manual § 5: switches 1–8 weigh 128…1).`,
        `A Modbus slave only answers frames for its own address (§ 6.4), so the request for ${tx.master_address} is silently ignored. That is a timeout, not a CRC or wiring fault.`,
        `Fix: set the DIP to address ${tx.master_address} (only switch 8 ON), or change the master to poll ${tx.device_address}. Source: TZ-THT02-UM-V1.0 § 5, § 6.4, § 6.10 — validity *to confirm*.`,
      );
    } else {
      const failed = tx.decode.checks.find(c => !c.ok);
      notes.push(`[fail] Poll result (${res.event_id}): ${STATUS_TEXT[st]}${failed ? ` — ${failed.check}: ${failed.detail}` : ''}.`);
    }
    return notes.join('\n');
  }

  async showManual(section = '5', docId = 'TZ-THT02-UM-V1.0') {
    const doc = this.bundle.documents[docId];
    const productId = doc?.product_id || (docId === 'TZ-THT02-UM-V1.0' ? 'tzone-tht-02' : null);
    const res = productId === 'tzone-tht-02'
      ? await callTool('get_document', { product_id: productId, doc_type: 'user_manual' })
      : { status: 'ok', source: 'documented', document: doc, sections: doc.sections, event_id: null };
    await this.refreshSession();
    if (res.status !== 'ok') return '[warn] ' + res.missing;
    const d = res.document;
    $('manual-title').textContent = d.title;
    $('manual-meta').textContent = [d.id, d.edition, d.date, d.origin].filter(Boolean).join(' · ');
    $('manual-validity').textContent = `Validity: ${d.validity.replace('_', ' ')}. ${d.validity_note || ''}`;
    $('manual-sections').replaceChildren(...Object.entries(res.sections).map(([k, s]) => h('article', { className: k === section ? 'hl' : '', id: 'sec-' + k },
      h('h4', { textContent: `§ ${k} · ${s.title}${s.page ? ` · p. ${s.page}` : ''}` }), h('p', { textContent: s.excerpt || s.text || '' }))));
    $('manual-event').textContent = res.event_id ? `Retrieved as ${res.event_id}` : 'Preloaded document';
    $('manual-link').href = d.url;
    const dlg = $('manual');
    if (!dlg.open) dlg.showModal();
    $('sec-' + section)?.scrollIntoView({ block: 'nearest' });
    const s = res.sections[section];
    return s
      ? `Opened ${d.id} (${d.edition}, ${d.date}) at § ${section} “${s.title}”: ${s.excerpt}\nValidity: ${d.validity.replace('_', ' ')} — ${d.validity_note}`
      : `Opened ${d.id}. Validity: ${d.validity.replace('_', ' ')}.`;
  }

  async dipFix() {
    const notes = [];
    await this.ensureIdentity(notes);
    this.setWorkspace('diag', { quiet: true });
    const res = await callTool('simulate_fault', { scenario: 'dip_fix' });
    await this.refreshSession();
    this.holdUntil = Date.now() + 9000;
    // Follow the opening procedure: gland, barrel at the seam, then the DIP switch.
    this.setView('normal');
    this.setExplode(1);
    this.tht.preset('dip');
    await new Promise(r => setTimeout(r, 1700));
    this.applyBus({ master_address: res.after.master_address, dip_bits: addressToDip(res.after.device_address) });
    await new Promise(r => setTimeout(r, 1600));
    this.setExplode(0);
    this.tht.preset('overview');
    await new Promise(r => setTimeout(r, 1200));
    this.recordTx(res.after, res.event_id, 'after DIP fix');
    const v = res.after.decode.values;
    notes.push(
      `**Simulated fix (${res.event_id}):** opened the probe (rear gland, then the barrel at the middle seam) and set the DIP to ${bitsText(addressToDip(res.after.device_address))} → address ${res.after.device_address}.`,
      `Before: ${STATUS_TEXT[res.before.decode.status]}. After: ${STATUS_TEXT[res.after.decode.status]}${v ? ` — **${v.temperature_c.toFixed(1)} °C, ${v.humidity_rh.toFixed(1)} %RH**` : ''}.`,
      'This is a simulation. On the real unit, power it down before changing the DIP, and confirm the address with a bench reader.',
    );
    return notes.join('\n');
  }

  async worksNow() {
    const notes = [];
    await this.ensureIdentity(notes);
    this.setWorkspace('diag', { quiet: true });
    const res = await callTool('get_asset_status', { transport: 'simulated_rtu' });
    await this.refreshSession();
    this.recordTx(res.transaction, res.event_id, 'verification poll');
    const tx = res.transaction;
    if (tx.decode.status === 'valid') {
      notes.push(`[ok] Yes (${res.event_id}): address ${tx.master_address} answers \`${tx.response_hex}\`, CRC OK → **${tx.decode.values.temperature_c.toFixed(1)} °C, ${tx.decode.values.humidity_rh.toFixed(1)} %RH**. Source: simulated RTU, not a field measurement.`);
    } else {
      notes.push(`[fail] Not yet (${res.event_id}): ${STATUS_TEXT[tx.decode.status]}. Ask “Why does it fail?” or “simulate the DIP fix”.`);
    }
    return notes.join('\n');
  }

  async resetCase() {
    const notes = [];
    await this.ensureIdentity(notes);
    const res = await callTool('simulate_fault', { scenario: 'reset' });
    await this.refreshSession();
    this.applyBus({ master_address: res.after.master_address, dip_bits: addressToDip(res.after.device_address) });
    this.recordTx(res.after, res.event_id, 'case reset');
    notes.push(`Case reset (${res.event_id}): ${res.action}`);
    return notes.join('\n');
  }

  async inject(kind) {
    const notes = [];
    await this.ensureIdentity(notes);
    if (this.ws === 'compat') this.setWorkspace('diag', { quiet: true });
    const res = await callTool('simulate_fault', { scenario: kind });
    await this.refreshSession();
    this.recordTx(res.after, res.event_id, 'injection');
    const tx = res.after;
    const failed = tx.decode.checks.find(c => !c.ok);
    const why = {
      bad_crc: 'The reply CRC does not match its bytes, so the master must discard it (§ 6.10). A real slave would not even answer a corrupted request.',
      foreign_address: 'The reply comes from a different slave address than the one polled, so it is rejected.',
      sensor_fault: 'The registers carry 7FFF H, which the manual defines as “sensor abnormal” (§ 6.7). The frame is valid; the reading is not.',
    }[kind];
    if (tx.device_address !== tx.master_address) {
      notes.push(`Injected ${kind} (${res.event_id}), but the sensor is still on address ${tx.device_address}, so there was no reply to corrupt (timeout). Fix the DIP first to see the effect.`);
    } else {
      notes.push(`Injected **${kind}** on one reply (${res.event_id}): ${STATUS_TEXT[tx.decode.status]}${failed ? ` — ${failed.check}: ${failed.detail}` : ''}.`, why);
    }
    return notes.join('\n');
  }

  async bench() {
    const notes = [];
    await this.ensureIdentity(notes);
    const res = await callTool('get_asset_status', { transport: 'rtu_bench' });
    await this.refreshSession();
    notes.push(`[warn] Bench RS-485 reader (${res.event_id}): source **${res.source}**. ${res.detail} Nothing is inferred without a reading.`);
    return notes.join('\n');
  }

  async toggleDip(i) {
    if (!this.identity?.confirmed) {
      this.toast('Confirm the asset first (Live view → Capture → Confirm).');
      return;
    }
    const bits = [...this.bus.dip_bits];
    bits[i] = bits[i] ? 0 : 1;
    try {
      const res = await callTool('simulate_fault', { scenario: 'set_dip', dip_bits: bits });
      await this.refreshSession();
      this.applyBus({ master_address: res.after.master_address, dip_bits: bits });
      this.recordTx(res.after, res.event_id, `DIP ${i + 1} ${bits[i] ? 'ON' : 'OFF'}`);
      this.toast(`DIP ${i + 1} ${bits[i] ? 'ON' : 'OFF'} → address ${res.after.device_address} · ${STATUS_TEXT[res.after.decode.status]}`);
    } catch (error) {
      this.toast(error.message);
    }
  }

  buildDip() {
    $('dip').replaceChildren(...DIP_WEIGHTS.map((w, i) => {
      const b = h('button', { type: 'button', title: `Switch ${i + 1} · weight ${w}` }, h('span', { className: 'slot' }), h('span', { textContent: String(i + 1) }));
      b.addEventListener('click', () => this.toggleDip(i));
      return b;
    }));
  }

  renderDip() {
    [...$('dip').children].forEach((b, i) => {
      b.classList.toggle('on', !!this.bus.dip_bits[i]);
      b.setAttribute('aria-pressed', String(!!this.bus.dip_bits[i]));
    });
    $('dip-sum').textContent = '= ' + this.bus.dip_bits.map((b, i) => (b ? DIP_WEIGHTS[i] : 0)).filter(Boolean).join(' + ') + ` = ${this.bus.device_address}`;
  }

  exportReport() {
    const s = sessionState();
    const data = {
      generated_at: new Date().toISOString(),
      source: 'simulated',
      note: 'Demo session. Readings come from a simulated Modbus RTU slave, not from field equipment.',
      mode,
      pins: s.pins,
      identity: s.identity,
      bus: this.bus,
      events: s.events,
      transactions: this.transactions,
      documents: Object.values(this.bundle.documents).map(({ sections, ...meta }) => meta),
      replacement: this.replacement && { status: this.replacement.status, criteria: this.replacement.criteria, config: this.config },
    };
    this.download(data, 'fieldscan-session-report.json');
    return `Exported fieldscan-session-report.json with ${s.events.length} events, ${this.transactions.length} RTU transactions and the session pins. Every value is tagged as simulated or documented.`;
  }

  download(data, name) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    h('a', { href: url, download: name }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ------------------------------------------------------------ 4–20 mA spare (compat workspace)

  async setConfig(partial, source = 'ui') {
    Object.assign(this.config, partial);
    for (const [name, value] of Object.entries(this.config)) {
      const input = document.querySelector(`input[name="${name}"][value="${value}"]`);
      if (input) input.checked = true;
    }
    const id = ++this.requestId;
    $('export').disabled = true;
    try {
      const report = await getReport(this.config);
      if (id !== this.requestId) return;
      const previous = this.report;
      this.report = report;
      this.render(report);
      this.loop.applyReport(report);
      this.telemetry.setReport(report);
      $('export').disabled = false;
      if (this.ws === 'compat' && source !== 'init') await this.refreshReplacement();
      if (source !== 'init') this.assistant.onReport(report, previous, source);
    } catch (error) {
      if (id !== this.requestId) return;
      $('verdict').className = 'verdict fail';
      $('verdict').textContent = 'Local result unavailable';
      $('replacement').textContent = error.message + ' Reload or regenerate the file.';
    }
  }

  // check_replacement records an evidence event, so it only runs when the spare workspace is in use.
  async refreshReplacement() {
    const key = JSON.stringify(this.config);
    if (this.replacementKey === key) return this.replacement;
    try {
      const res = await callTool('check_replacement', { candidate: 'eh-fmx11', ...this.config });
      this.replacement = res;
      this.replacementKey = key;
      await this.refreshSession();
      $('criteria').replaceChildren(...(res.criteria || []).map(c => h('li', { title: c.detail },
        h('span', { textContent: c.criterion.replace(/_/g, ' ') + (c.margin_ohm !== undefined ? ` (${c.margin_ohm >= 0 ? '+' : ''}${fmt.format(c.margin_ohm)} Ω)` : '') }),
        h('span', { className: 'st ' + c.status, textContent: c.status }))));
      return res;
    } catch (error) {
      this.toast(error.message);
      return null;
    }
  }

  render(r) {
    const c = r.load_check;
    const s = r.simulation;
    const pass = c.status === 'pass';
    $('verdict').className = 'verdict ' + (pass ? 'ok' : 'fail');
    $('verdict').textContent = pass ? 'Passes the load check' : 'Incompatible: load exceeded';
    $('m-limit').textContent = fmt.format(c.available_ohm) + ' Ω';
    $('m-load').textContent = fmt.format(c.evaluated_ohm) + ' Ω';
    $('m-margin').textContent = (c.margin_ohm >= 0 ? '+' : '') + fmt.format(c.margin_ohm) + ' Ω';
    $('m-margin').className = c.margin_ohm >= 0 ? 'pos' : 'neg';
    $('m-state').textContent = STATES[s.state];
    $('m-signal').textContent = s.loop_signal_ma === null ? 'Indeterminate' : fmt.format(s.loop_signal_ma) + ' mA';
    $('m-count').textContent = s.plc_ideal_count === null ? 'No valid reading' : new Intl.NumberFormat('en-US').format(s.plc_ideal_count);
    const ratio = c.evaluated_ohm / c.available_ohm;
    $('gauge-fill').style.width = Math.min(100, ratio * 100) + '%';
    $('gauge-fill').style.background = ratio <= 1 ? 'var(--ok)' : 'var(--fail)';
    $('replacement').className = 'replacement' + (pass ? '' : ' fail');
    $('replacement').textContent = pass
      ? 'Replacement equivalence: insufficient evidence.'
      : 'Replacement equivalence: incompatible with the evaluated profile.';
    $('pending').replaceChildren(...r.pending.map(p => h('li', { textContent: p })));
    $('sources').replaceChildren(...r.sources.map(src => h('li', {},
      h('code', { textContent: src.id }),
      h('a', { href: src.url, textContent: src.title, target: '_blank', rel: 'noopener noreferrer' }),
      ' · ' + src.section)));
    if (this.inspected && this.ws === 'compat') this.inspect(this.inspected, { reveal: false });
  }

  onSample(s) {
    this.loop.updateLive(s);
    $('t-ma').textContent = s.ma === null ? 'suppressed' : s.ma.toFixed(3) + ' mA';
    $('t-v').textContent = s.supply.toFixed(2) + ' V';
    $('t-term').textContent = s.terminalAtDesign.toFixed(2) + ' V ' + (s.terminalAtDesign >= 8 ? '(≥ 8 V)' : '(< 8 V)');
    $('t-term').className = s.terminalAtDesign >= 8 ? 'pos' : 'neg';
    $('t-count').textContent = s.count === null ? '—' : String(s.count);
    $('t-level').textContent = (s.level * 100).toFixed(1) + ' %';
    $('t-diag').textContent = s.diag;
    $('t-diag').className = s.diag === 'OK' ? 'pos' : 'neg';
    if (!$('tab-telemetry').hidden) drawChart($('chart'), this.telemetry.history);
  }

  exportJson() {
    if (!this.report) return;
    this.download({ ...this.report, replacement_check: this.replacement }, 'boat-mvp-result.json');
  }

  async checkLink() {
    const res = await health();
    $('pill-link').textContent = res.ok ? 'Local server' : 'Server unreachable';
    $('pill-link').className = 'pill ' + (res.ok ? 'ok' : 'fail');
  }

  updateNetwork() {
    $('pill-net').textContent = navigator.onLine ? 'Online' : 'Offline · local mode';
    $('pill-net').className = 'pill ' + (navigator.onLine ? 'ok' : 'warn');
  }

  // ------------------------------------------------------------ twin controls (also used by the assistant)

  setView(view) {
    this.stage.setView(view);
    this.syncDock();
  }

  setExplode(v) {
    this.stage.setExplode(v);
    $('explode').value = v;
    this.syncDock();
  }

  preset(name) {
    const kind = this.stage === this.tht ? 'tht' : 'loop';
    if (((kind === 'loop' && name === 'probe') || (kind === 'tht' && name === 'dip')) && this.stage.view === 'normal' && this.stage.explodeTarget < 0.5) {
      this.setView('xray');
      this.toast('Switched to X-ray to see inside');
    }
    this.stage.preset(name);
  }

  focus(id) {
    const kind = this.stage === this.tht ? 'tht' : 'loop';
    if (INTERNAL[kind].includes(id) && this.stage.view === 'normal' && this.stage.explodeTarget < 0.5) {
      this.setView('xray');
      this.toast('Switched to X-ray to see inside');
    }
    this.stage.focus(id);
  }

  partName(id) {
    return this.stage.parts[id]?.name || id;
  }

  viewState() {
    return { workspace: this.ws, view: this.stage.view, explode: this.stage.explodeTarget, selected: this.inspected || null };
  }

  syncDock() {
    const v = this.stage.view;
    const e = this.stage.explodeTarget;
    for (const b of document.querySelectorAll('#view-modes button')) {
      const pressed = b.dataset.view === 'normal' ? v === 'normal' && e === 0
        : b.dataset.view === 'xray' ? v === 'xray' : e > 0;
      b.setAttribute('aria-pressed', String(pressed));
    }
    $('explode').value = e;
  }

  buildCams() {
    const kind = this.stage === this.tht ? 'tht' : 'loop';
    $('cams').replaceChildren(...CAMS[kind].map(([id, label]) => {
      const b = h('button', { type: 'button', textContent: label });
      b.dataset.cam = id;
      b.addEventListener('click', () => this.preset(id));
      return b;
    }));
  }

  // ------------------------------------------------------------ parts inspector

  buildAssembly() {
    const stage = this.stage;
    $('assembly').replaceChildren(...Object.entries(stage.parts).map(([id, def]) => {
      const li = h('li');
      li.dataset.id = id;
      if (def.parent) li.style.paddingLeft = (stage.parts[def.parent]?.parent ? 36 : 22) + 'px';
      const cb = h('input', { type: 'checkbox', checked: true, title: 'Visible' });
      cb.addEventListener('click', e => e.stopPropagation());
      cb.addEventListener('change', () => (stage.setPartVisible ? stage.setPartVisible(id, cb.checked) : (def.object.visible = cb.checked)));
      const dot = h('span', { className: 'dot' });
      dot.style.background = def.color;
      li.append(cb, dot, h('span', { textContent: def.name }));
      li.addEventListener('click', () => { this.inspect(id); this.focus(id); });
      return li;
    }));
  }

  liveValue(label) {
    if (this.stage === this.tht) {
      if (label === 'Current address') return `${this.bus.device_address} (DIP ${bitsText(this.bus.dip_bits)})`;
      return '—';
    }
    const r = this.report;
    const last = this.telemetry.last;
    return {
      'Loop current': last?.ma === null ? 'Suppressed' : (last?.ma ?? r.simulation.loop_signal_ma)?.toFixed?.(2) + ' mA',
      'Additional series load': `+${r.inputs.synthetic_additional_series_ohm} Ω`,
      Output: `${r.inputs.supply_v} V DC`,
    }[label] ?? '—';
  }

  inspect(id, { reveal = true } = {}) {
    const stage = this.stage;
    this.inspected = id;
    stage.select(id);
    for (const li of document.querySelectorAll('#assembly li')) li.classList.toggle('selected', li.dataset.id === id);
    const box = $('inspector');
    if (!id || !stage.parts[id]) {
      this.inspected = null;
      box.replaceChildren(h('p', { className: 'muted', textContent: 'Click any part in the 3D twin to inspect it.' }));
      return;
    }
    if (reveal) this.openTab('inspector');
    const def = stage.parts[id];
    const table = h('table', { className: 'spec' }, ...def.specs.map(([label, value, prov, sourceId]) => {
      const [tagText, tagClass] = PROVENANCE[prov] || PROVENANCE.pending;
      return h('tr', {}, h('td', { textContent: label }),
        h('td', {}, (value === 'live' ? this.liveValue(label) : value) + ' ', h('span', { className: 'tag ' + tagClass, textContent: tagText, title: sourceId || '' })));
    }));
    const actions = h('div', { className: 'actions' });
    const btn = (label, fn) => {
      const b = h('button', { type: 'button', textContent: label });
      b.addEventListener('click', fn);
      actions.append(b);
    };
    btn('Focus', () => this.focus(id));
    btn('Isolate', () => stage.isolate(id));
    btn('Show all', () => {
      stage.showAll();
      for (const cb of document.querySelectorAll('#assembly input')) cb.checked = true;
    });
    btn(stage.explodeTarget > 0 ? 'Reassemble' : 'Disassemble', () => { this.setExplode(stage.explodeTarget > 0 ? 0 : 1); this.inspect(id); });
    box.replaceChildren(h('h4', { textContent: def.name }), h('p', { className: 'role', textContent: def.role }),
      def.specs.length ? table : h('p', { className: 'muted small', textContent: 'No datasheet fields for this part.' }), actions);
  }

  // ------------------------------------------------------------ chrome

  // Keeps the recognition box glued to the sensor on screen.
  hudLoop() {
    requestAnimationFrame(() => this.hudLoop());
    const boxEl = $('recog-box');
    if (this.ws !== 'live' || boxEl.hidden) return;
    const stage = this.tht;
    const obj = stage.parts.tht?.object;
    if (!obj) return;
    this.hudBox ||= new THREE.Box3();
    this.hudBox.setFromObject(obj, true);
    const rect = stage.renderer.domElement.getBoundingClientRect();
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const v = new THREE.Vector3();
    const { min, max } = this.hudBox;
    for (let i = 0; i < 8; i++) {
      v.set(i & 1 ? max.x : min.x, i & 2 ? max.y : min.y, i & 4 ? max.z : min.z).project(stage.camera);
      const x = rect.left + (v.x + 1) / 2 * rect.width;
      const y = rect.top + (1 - v.y) / 2 * rect.height;
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
    const hud = $('hud').getBoundingClientRect();
    const pad = 10;
    Object.assign(boxEl.style, {
      left: x0 - hud.left - pad + 'px', top: y0 - hud.top - pad + 'px',
      width: x1 - x0 + 2 * pad + 'px', height: y1 - y0 + 2 * pad + 'px',
    });
  }

  openTab(name) {
    if (document.querySelector(`.tabs button[data-tab="${name}"]`)?.hidden) name = 'assistant';
    for (const b of document.querySelectorAll('.tabs button')) b.setAttribute('aria-selected', String(b.dataset.tab === name));
    for (const t of document.querySelectorAll('.tab')) t.hidden = t.id !== 'tab-' + name;
    if (name === 'telemetry') drawChart($('chart'), this.telemetry.history);
  }

  tooltip(name, x, y) {
    const tip = $('tooltip');
    if (!name) { tip.hidden = true; return; }
    tip.hidden = false;
    tip.textContent = name;
    tip.style.left = x + 14 + 'px';
    tip.style.top = y + 12 + 'px';
  }

  toast(text) {
    const t = $('toast');
    t.textContent = text;
    t.hidden = false;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
  }

  bindUi() {
    const act = (id, name, ...args) => $(id).addEventListener('click', () => this.assistant.action(name, ...args));
    for (const b of document.querySelectorAll('.workspaces button')) b.addEventListener('click', () => this.setWorkspace(b.dataset.ws));
    act('btn-capture', 'capture');
    act('btn-confirm', 'confirm');
    act('btn-plate', 'showPlate');
    act('btn-why', 'whyFail');
    act('btn-manual', 'showManual', '5');
    act('btn-fix', 'dipFix');
    act('btn-works', 'worksNow');
    act('btn-reset', 'resetCase');
    act('btn-report', 'exportReport');
    act('btn-bench', 'bench');
    $('btn-go-diag').addEventListener('click', () => this.setWorkspace('diag'));
    $('btn-torch').addEventListener('click', e => {
      const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
      e.currentTarget.setAttribute('aria-pressed', String(on));
      this.tht.setTorch(on);
    });
    for (const b of document.querySelectorAll('[data-inject]')) b.addEventListener('click', () => this.assistant.action('inject', b.dataset.inject));
    $('manual-close').addEventListener('click', () => $('manual').close());
    $('manual').addEventListener('click', e => { if (e.target === $('manual')) $('manual').close(); });

    $('controls').addEventListener('submit', e => e.preventDefault());
    $('controls').addEventListener('change', e => {
      const { name, value } = e.target;
      this.setConfig({ [name]: name === 'voltage' ? Number(value) : value }, 'ui');
    });
    $('export').addEventListener('click', () => this.exportJson());
    for (const b of document.querySelectorAll('.tabs button')) b.addEventListener('click', () => this.openTab(b.dataset.tab));
    $('view-modes').addEventListener('click', e => {
      const view = e.target.dataset?.view;
      if (view === 'normal') { this.setView('normal'); this.setExplode(0); }
      if (view === 'xray') this.setView(this.stage.view === 'xray' ? 'normal' : 'xray');
      if (view === 'exploded') {
        const open = this.stage.explodeTarget === 0;
        this.setExplode(open ? 1 : 0);
        if (open && this.stage === this.tht) this.tht.preset('probe');
      }
    });
    $('explode').addEventListener('input', e => this.setExplode(Number(e.target.value)));
    const toggle = (id, fn) => {
      const b = $(id);
      b.addEventListener('click', () => {
        const on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', String(on));
        fn(on);
      });
    };
    toggle('labels-toggle', on => { this.tht.setLabels(on); this.loop.setLabels(on); });
    toggle('rotate-toggle', on => { this.tht.setAutoRotate(on); this.loop.setAutoRotate(on); });
    window.addEventListener('keydown', e => {
      if (e.target.closest('input, textarea, dialog')) return;
      if (['1', '2', '3'].includes(e.key)) this.setWorkspace({ 1: 'live', 2: 'diag', 3: 'compat' }[e.key]);
    });
    window.addEventListener('online', () => { this.updateNetwork(); this.assistant.onNetwork(true); });
    window.addEventListener('offline', () => { this.updateNetwork(); this.assistant.onNetwork(false); });
  }
}

const app = new App();
app.start();
window.__app = app;
