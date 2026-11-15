// Onboard assistant. A deterministic, grounded local engine handles platform commands and
// engineering questions (works offline). Free-form questions are streamed from the optional
// server-side LLM adapter when configured.

const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
const fmtInt = new Intl.NumberFormat('en-US');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const escapeHtml = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const signed = n => (n >= 0 ? '+' : '') + fmt.format(n);

const THT_PARTS = [
  [/gland|cable entry/, 'tht-gland'],
  [/dip|address switch|switch/, 'tht-dip'],
  [/sht|sensing element|element|strainer|head/, 'tht-sht'],
  [/rs-?485|transceiver|pcb|board/, 'tht-rs485'],
  [/bracket|flange|body|barrel/, 'tht-body'],
  [/plate|nameplate|label/, 'plate'],
  [/junction|\bjb\b|lid/, 'jb'],
  [/gateway|master|lcd|display/, 'gateway'],
  [/cable|wiring/, 'cabling'],
  [/probe|sensor|tht/, 'tht'],
];

const CHIPS = {
  live: ['Identify this sensor', 'Confirm the asset', 'Show the plate', 'Why does it fail?', 'Is everything OK?'],
  diag: ['Why does it fail?', 'Show the manual', 'Simulate the DIP fix', 'Does it work now?', 'Inject a bad CRC', 'Disassemble the probe'],
  compat: ['Is everything OK?', 'Switch to 12 V', 'Simulate an open wire', 'Explain the margin', 'Is the spare a valid replacement?', 'X-ray view'],
};

const pick = list => list[Math.floor(Math.random() * list.length)];
const bitsOf = bits => bits.slice(0, 4).join('') + ' ' + bits.slice(4).join('');

// Short, sourced explanations of the concepts behind the demo (§ = TZ-THT02-UM-V1.0).
const CONCEPTS = [
  [/modbus/, 'Modbus RTU is a master/slave protocol: the master (here the ventilation controller) sends a request to one slave address, and only the slave with that address answers. Each frame is address · function · data · CRC-16. The THT-02 answers function 03 (read holding registers) at 9600 baud, 8N1 by default (§ 6.1, § 6.4).'],
  [/rs-?485|two[- ]wire|a\+|b-/, 'RS-485 is the differential two-wire bus that carries the Modbus frames. On the THT-02 the leads are Red V+, Black GND, Yellow A+ and Green B− (§ 4.6). Swapping A/B or a missing ground usually gives garbled frames (CRC errors), not a clean timeout.'],
  [/\bcrc\b|checksum/, 'The CRC-16/MODBUS is a 2-byte checksum at the end of every frame. If it does not match, the receiver silently discards the frame (§ 6.10), so a bad CRC looks like noise, while a wrong address looks like total silence (timeout).'],
  [/\bdip\b|address switch|dip switch/, 'The THT-02 slave address is set by an 8-way DIP switch. Switches 1–8 weigh 128, 64, 32, 16, 8, 4, 2, 1 (§ 5). Right now the sensor reads {dip} → address {addr}; the master polls {master}.'],
  [/timeout|no reply|silent|no response/, 'A timeout means no frame came back within 1000 ms. With Modbus that usually means nobody owns the polled address: wrong DIP address, wrong baud rate, or the sensor is unpowered. A corrupted reply would show as a CRC error instead.'],
  [/7fff|abnormal/, '7FFF H in register 0 or 1 is the manual\'s “sensor abnormal” marker (§ 6.4/§ 6.7): the frame is valid, but the reading must not be trusted.'],
  [/register/, 'THT-02 registers (§ 6.4): 0 = temperature ×0.1 °C (signed), 1 = relative humidity ×0.1 %, 4 = address code from the DIP, 5 = baud rate, 6/7 = hardware/software version. 7FFF H means sensor abnormal.'],
  [/tht-?02|\bsensor\b.*(is|model)|what (is|are) (the )?(sensor|probe)/, 'The TZ THT-02 is a stainless temperature/humidity probe with an SHT30-class element, an RS-485 Modbus RTU interface and an internal DIP-8 address switch. It is asset BOAT-ER-TH-02 on the engine-room bulkhead. Its manual (TZ-THT02-UM-V1.0) is marked “to confirm”: the edition is not verified against the manufacturer.'],
  [/4.?20|current loop|\bloop\b/, 'A 4–20 mA loop carries the level as a current: 4 mA = 0 %, 20 mA = 100 %. The transmitter needs a minimum voltage at its terminals, so the supply minus the drop across every load in the loop must stay above it. Workspace 3 checks that for the FMX11 replacing the WIKA LS-10.'],
  [/digital twin|\btwin\b|3d/, 'The digital twin is a Three.js model of the installation driven by the same session state as the tools: the DIP, bus packets, LCD and loop current you see come from the simulation core. Try “x-ray view” or “disassemble the probe”.'],
  [/fieldscan/, 'FieldScan is the live inspection layer: the camera recognizes the asset, the technician confirms it, and every later answer is pinned to that identity, catalog version and rules version, with an event id for each tool call.'],
  [/evidence|event id|\bpins?\b|provenance/, 'Every tool call writes an event (EV-xxxx) and the session pins asset, product, catalog version and rules version. Each fact is labelled observed, simulated or documented, so a simulated reading is never presented as a field measurement.'],
  [/baud|8n1|serial setting/, 'The THT-02 supports 4800, 9600 and 19200 baud; the default is 9600, 8 data bits, no parity, 1 stop bit (8N1) (§ 6.1, register 5 in § 6.4).'],
];
const CONCEPT_ASK = /\bwhat('?s| is| are| does)\b|\bexplain\b|\btell me about\b|\bhow does\b|\bmeaning\b|\bqu[eé] es\b|\bdefine\b/;

const PARTS = [
  [/probe|fmx|waterpilot|sensor|transmitter|candidate/, 'probe'],
  [/sm ?1231|analog input|input module|\bai0?\b|\bplc\b/, 'sm1231'],
  [/\bcpu\b|controller|s7-?1200/, 'cpu'],
  [/power supply|\bpsu\b|\bg1\b/, 'psu'],
  [/junction|\bjb\b/, 'jb'],
  [/terminal/, 'terminals'],
  [/breaker/, 'breaker'],
  [/cabinet|enclosure|panel/, 'cabinet'],
  [/wika|ls-?10|reference|old (sensor|probe)/, 'wika'],
  [/tank/, 'tank'],
  [/cable|wiring/, 'cabling'],
];

export function summary(report) {
  const c = report.load_check;
  const v = report.inputs.supply_v;
  return c.status === 'pass'
    ? `Loop load check PASSES at ${v} V: available ${fmt.format(c.available_ohm)} Ω vs evaluated ${fmt.format(c.evaluated_ohm)} Ω, margin ${signed(c.margin_ohm)} Ω.`
    : `Loop load check FAILS at ${v} V: available ${fmt.format(c.available_ohm)} Ω but the loop presents ${fmt.format(c.evaluated_ohm)} Ω, margin ${signed(c.margin_ohm)} Ω.`;
}

export function stateLine(report) {
  const s = report.simulation;
  switch (s.state) {
    case 'nominal': return `Simulated signal ${fmt.format(s.loop_signal_ma)} mA → ideal PLC count ${fmtInt.format(s.plc_ideal_count)} (level ${s.level_fraction * 100} %).`;
    case 'empty_tank': return 'Empty tank: 4.0 mA live zero → ideal count 0. That is a valid reading, not a fault.';
    case 'open_circuit': return 'Open wire: idealized loop current 0 mA and the SM 1231 reports a wire-break diagnostic, which is distinct from an empty tank.';
    default: return 'The simulated reading is suppressed because the loop is outside the validated load envelope.';
  }
}

export function replacementLine(report) {
  return report.replacement_status === 'insufficient_evidence'
    ? 'Replacement equivalence: insufficient evidence. Still pending: ' + report.pending.join(' ')
    : 'Replacement equivalence: incompatible with the evaluated profile.';
}

export class Assistant {
  constructor(app) {
    this.app = app;
    this.history = [];
    this.speakOn = false;
    this.busy = false;
    this.list = document.getElementById('messages');
    this.input = document.getElementById('chat-input');
    this.queue = Promise.resolve();
    this.bindUi();
  }

  setChips(ws) {
    const chips = document.getElementById('chips');
    chips.replaceChildren(...CHIPS[ws].map(t => Object.assign(document.createElement('button'), { type: 'button', textContent: t })));
  }

  // Run an App flow step (button or chat) and narrate its grounded result.
  action(name, ...args) {
    this.queue = this.queue.then(async () => {
      try {
        const text = await this.app[name](...args);
        if (text) await this.post(text, { kind: /^\[fail\]/.test(text) ? 'alert' : '' });
      } catch (error) {
        await this.post('[warn] ' + error.message, { kind: 'alert' });
      }
    });
    return this.queue;
  }

  onWorkspace(ws) {
    const text = {
      live: 'Live view: FieldScan camera on the engine-room bulkhead. Capture a frame to identify the sensor, then confirm it.',
      diag: 'THT-02 diagnosis: the master polls address ' + (this.app.bus?.master_address ?? 1) + '. Ask “Why does it fail?”, open the manual, or flip the DIP switches (3D or the mirror on the left).',
      compat: 'Spare-part check: candidate E+H FMX11 replacing a WIKA LS-10 on loop LT-301. ' + summary(this.app.report),
    }[ws];
    this.post(text, { speak: false });
  }

  // ------------------------------------------------------------ UI

  bindUi() {
    document.getElementById('chat').addEventListener('submit', e => {
      e.preventDefault();
      const text = this.input.value.trim();
      if (!text) return;
      this.input.value = '';
      this.ask(text);
    });
    document.getElementById('chips').addEventListener('click', e => {
      if (e.target.tagName === 'BUTTON') this.ask(e.target.textContent);
    });
    const speak = document.getElementById('speak');
    speak.addEventListener('click', () => {
      this.speakOn = !this.speakOn;
      speak.setAttribute('aria-pressed', String(this.speakOn));
      if (!this.speakOn) window.speechSynthesis?.cancel();
    });
    if (!('speechSynthesis' in window)) speak.disabled = true;
    this.bindMic();
  }

  bindMic() {
    const mic = document.getElementById('mic');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      mic.disabled = true;
      mic.title = 'Speech recognition is not supported in this browser (try Chrome or Edge).';
      return;
    }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    let listening = false;
    rec.onresult = e => {
      const result = e.results[e.results.length - 1];
      this.input.value = result[0].transcript;
      if (result.isFinal) {
        const text = this.input.value.trim();
        this.input.value = '';
        if (text) this.ask(text);
      }
    };
    rec.onend = () => { listening = false; mic.classList.remove('listening'); };
    rec.onerror = e => {
      if (e.error === 'network') this.post('Voice input needs the browser speech service (online). Type your question instead; everything else keeps working offline.', { kind: 'alert' });
    };
    mic.addEventListener('click', () => {
      if (listening) { rec.stop(); return; }
      window.speechSynthesis?.cancel();
      try {
        rec.start();
        listening = true;
        mic.classList.add('listening');
      } catch { /* already started */ }
    });
  }

  bubble(role, kind = '') {
    const el = document.createElement('div');
    el.className = `msg ${role} ${kind}`.trim();
    const meta = document.createElement('span');
    meta.className = 'meta';
    meta.textContent = (role === 'user' ? 'You' : 'Platform') + ' · ' + new Date().toLocaleTimeString('en-US', { hour12: false });
    const body = document.createElement('span');
    el.append(meta, body);
    this.list.append(el);
    this.list.scrollTop = this.list.scrollHeight;
    return body;
  }

  render(text) {
    return escapeHtml(text)
      .replace(/^\[ok\]/gm, '<span class="ok">✓</span>')
      .replace(/^\[fail\]/gm, '<span class="fail">✗</span>')
      .replace(/^\[warn\]/gm, '<span class="warn">!</span>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  // Typewriter effect so replies feel live.
  async post(text, { kind = '', speak = true } = {}) {
    const body = this.bubble('bot', kind);
    body.parentElement.classList.add('typing');
    for (let i = 0; i <= text.length; i += 4) {
      body.innerHTML = this.render(text.slice(0, i));
      this.list.scrollTop = this.list.scrollHeight;
      await sleep(8);
    }
    body.innerHTML = this.render(text);
    body.parentElement.classList.remove('typing');
    this.list.scrollTop = this.list.scrollHeight;
    if (speak) this.say(text);
    this.history.push({ role: 'assistant', content: text });
    return body;
  }

  say(text) {
    if (!this.speakOn || !('speechSynthesis' in window)) return;
    const clean = text.replace(/\[(ok|fail|warn)\]/g, '').replace(/\*\*/g, '').replace(/Ω/g, ' ohms').replace(/→/g, ', ').replace(/−/g, 'minus ');
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'en-US';
    u.rate = 1.05;
    window.speechSynthesis.speak(u);
  }

  // ------------------------------------------------------------ conversation

  async greet() {
    const app = this.app;
    const id = app.identity;
    await this.post(
      'Platform online. FieldScan camera CAM-01 is looking at the engine-room bulkhead (simulated source). '
      + 'Ticket: the ventilation controller shows no temperature from sensor BOAT-ER-TH-02 since the last maintenance.\n'
      + (id?.confirmed ? `[ok] Asset already confirmed in this session: ${id.model} at ${id.asset_id}.\n` : 'Start with “Identify this sensor”, then confirm the asset.\n')
      + 'Then ask “Why does it fail?”, “show the manual”, “simulate the DIP fix” or “does it work now?”. The 4–20 mA spare check lives in workspace 3. You can also use the microphone.',
      { speak: false },
    );
  }

  async ask(text) {
    if (this.busy) return;
    this.busy = true;
    this.bubble('user').textContent = text;
    this.history.push({ role: 'user', content: text });
    try {
      await this.handle(text);
    } catch (error) {
      await this.post('Something went wrong locally: ' + error.message, { kind: 'alert' });
    } finally {
      this.busy = false;
    }
  }

  async fieldscan(q) {
    const app = this.app;
    const steps = [];
    let moved = false;
    if (/workspace ?1|live view|camera view|go live/.test(q)) { app.setWorkspace('live'); moved = true; }
    else if (/workspace ?2|diagnosis (view|workspace)|open (the )?diagnosis/.test(q)) { app.setWorkspace('diag'); moved = true; }
    if (/identif|recogni|capture|take a (photo|picture|frame)|what (sensor|device) is (this|that)|\bscan\b/.test(q)) steps.push(['capture']);
    if (/confirm/.test(q)) steps.push(['confirm']);
    if (/plate|label/.test(q) && /show|zoom|read|look/.test(q)) steps.push(['showPlate']);
    const sec = q.match(/(?:§|section)\s*(\d+(?:\.\d+)?)/)?.[1];
    if (/manual|§|section/.test(q)) steps.push(['showManual', sec || '5']);
    if (/(dip|address).{0,20}(fix|set|correct|change)|(fix|correct|repair).{0,20}(dip|address|it\b)|simulate (the )?(dip )?fix/.test(q)) steps.push(['dipFix']);
    else if (/\bwhy\b.{0,30}(fail|timeout|no (reply|reading|response|temperature)|not work)|what('?s| is) wrong|no temperature|diagnose (it|the sensor)/.test(q)) steps.push(['whyFail']);
    if (/(work|ok|fixed|answer|respond)\w* now|is it (fixed|working)|verify|poll (it|again|the sensor)/.test(q)) steps.push(['worksNow']);
    if (/reset (the )?case|restore (the )?incident|start the case over/.test(q)) steps.push(['resetCase']);
    if (/bad crc|corrupt|crc error/.test(q)) steps.push(['inject', 'bad_crc']);
    if (/foreign|other slave|wrong address reply/.test(q)) steps.push(['inject', 'foreign_address']);
    if (/7fff|sensor (fault|abnormal|broken)/.test(q)) steps.push(['inject', 'sensor_fault']);
    if (/bench|real reader|usb.?rs-?485/.test(q)) steps.push(['bench']);
    if (/session report|export (the )?(session|report|evidence)/.test(q)) steps.push(['exportReport']);
    for (const [name, ...args] of steps) await this.action(name, ...args);
    if (moved && !steps.length) return true;
    return steps.length > 0;
  }

  // ------------------------------------------------------------ conversation layer

  liveNow() {
    const app = this.app;
    if (app.ws === 'compat') return this.live();
    const tx = app.liveSnapshot();
    if (!tx) return this.rtuLive();
    const v = tx.decode.values;
    const head = v
      ? `Right now (simulated bus, display-only): ${v.temperature_c.toFixed(1)} °C and ${v.humidity_rh.toFixed(1)} %RH from address ${app.bus.device_address}, CRC OK.`
      : `Right now (simulated bus, display-only): the master polls address ${app.bus.master_address} and gets ${tx.decode.status === 'timeout' ? 'no reply (timeout)' : tx.decode.status} — so there is no valid temperature to show.`;
    return head + '\n' + this.rtuLive().split('\n')[1] + '\nLive polls are not evidence; say “does it work now?” to record a pinned reading.';
  }

  nextStep() {
    const app = this.app;
    const id = app.identity;
    const b = app.bus;
    if (app.ws === 'compat') {
      return app.report.load_check.status === 'pass'
        ? 'The loop load passes. Ask “is the spare a valid replacement?” to see what is still pending, or try “switch to 12 V” to see it fail.'
        : 'The loop load fails here. Say “switch to 24 V” or “use config v1”, or ask “explain the margin”.';
    }
    if (!app.frame && !id) return 'Next: say “Identify this sensor” so the camera captures the asset.';
    if (!id?.confirmed) return 'Next: say “Confirm the asset” to pin THT-02 / BOAT-ER-TH-02 to this session.';
    if (b && b.master_address !== b.device_address) return `Next: ask “Why does it fail?” — the DIP is at address ${b.device_address} but the master polls ${b.master_address}. Then “simulate the DIP fix”.`;
    return 'The sensor answers. Next: “does it work now?” to record proof, “inject a bad CRC” to test the diagnosis, or switch to workspace 3 for the 4–20 mA spare.';
  }

  stateBrief() {
    const app = this.app;
    const id = app.identity;
    const ws = { live: 'Live view', diag: 'THT-02 diagnosis', compat: '4–20 mA spare' }[app.ws];
    const lines = [`You are in **${ws}**.`];
    if (app.ws === 'compat') {
      lines.push(summary(app.report));
    } else {
      lines.push(id ? `Asset: ${id.model} at ${id.asset_id} (${id.confirmed ? 'confirmed' : 'needs confirmation'}).` : 'No asset identified yet in this session.');
      const tx = app.liveSnapshot();
      if (tx) lines.push(tx.decode.values
        ? `Bus: sensor answering at address ${app.bus.device_address} · ${tx.decode.values.temperature_c.toFixed(1)} °C, ${tx.decode.values.humidity_rh.toFixed(1)} %RH (simulated).`
        : `Bus: master polls ${app.bus.master_address}, DIP is ${bitsOf(app.bus.dip_bits)} → address ${app.bus.device_address} → timeout, no temperature reaching the controller.`);
    }
    lines.push(this.nextStep());
    return lines.join('\n');
  }

  concept(q) {
    const hit = CONCEPTS.find(([re]) => re.test(q));
    if (!hit) return null;
    const b = this.app.bus || { dip_bits: [0, 0, 0, 0, 0, 0, 1, 0], device_address: 2, master_address: 1 };
    return hit[1].replace('{dip}', bitsOf(b.dip_bits)).replace('{addr}', b.device_address).replace('{master}', b.master_address);
  }

  smalltalk(q) {
    const s = q.trim().replace(/[!.?¡¿,]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (/^(hi|hello|hey|hiya|yo|hola|buenas( tardes| noches)?|buenos d[ií]as|good (morning|afternoon|evening)|greetings|what'?s up|sup|qu[eé] tal)( there| platform| team| everyone| assistant)?$/.test(s)) {
      return pick(['Hello!', 'Hi there!', 'Hey!']) + ' I\'m the platform assistant, connected to the live session.\n' + this.stateBrief();
    }
    if (/^(thanks|thank you|thx|ty|gracias|cheers|great|perfect|nice|cool|awesome|ok|okay|got it|perfecto|genial|vale)( a lot| so much| very much)?$/.test(s)) {
      return pick(['You\'re welcome.', 'Glad to help.', 'Any time.']) + ' ' + this.nextStep();
    }
    if (/^(bye|goodbye|see you|adi[oó]s|chao)/.test(s)) return 'See you. The session and its evidence stay here; export the report if you need to hand it over.';
    if (/how are you|how'?s it going|c[oó]mo est[aá]s/.test(s)) {
      const tx = this.app.ws !== 'compat' && this.app.liveSnapshot();
      return 'All platform services are up' + (navigator.onLine ? '' : ' (offline mode)') + '. '
        + (tx && !tx.decode.values ? 'The THT-02, on the other hand, is not answering its master — that\'s the open ticket.' : 'The simulated bus is healthy.')
        + '\n' + this.nextStep();
    }
    if (/who are you|what are you|your name|qui[eé]n eres|are you (an? )?(ai|bot|human)/.test(s)) {
      return 'I\'m the onboard assistant of Industrial Datasheet + FieldScan. I drive the same tools as the UI (capture, confirm, documents, bus status, fault simulation, replacement check) and answer only from the session evidence and the manuals in this package.'
        + (this.app.ai.configured ? ` Free-form questions are answered by ${this.app.ai.model}.` : ' I run fully locally — no LLM is connected, so open-ended chat is limited.');
    }
    if (/what('?s| is) (going on|happening)|where are we|what do (you|i) see|summary|status of (the )?(case|session|ticket)|qu[eé] (pasa|ves)|recap/.test(s)) return this.stateBrief();
    if (/what (should|do) i do|next step|what now|now what|what'?s next|siguiente|qu[eé] hago/.test(s)) return this.nextStep();
    if (/what time|current time|qu[eé] hora/.test(s)) return `It is ${new Date().toLocaleTimeString('en-US', { hour12: false })} local time.`;
    if (/ticket|problem|issue|complaint/.test(s) && !/inject|simulate/.test(s)) {
      return 'Open ticket: the ventilation controller shows no temperature from BOAT-ER-TH-02 since the last maintenance.\n' + this.stateBrief();
    }
    return null;
  }

  async handle(text) {
    const q = text.toLowerCase();
    const app = this.app;
    const out = [];
    let handled = false;

    const chat = this.smalltalk(q);
    if (chat && !(app.ai.configured && await this.streamLLM(text))) { await this.post(chat); return; }
    if (chat) return;
    const concept = CONCEPT_ASK.test(q) ? this.concept(q) : null;
    if (concept && !/\b(fail|wrong|fix|now|inject|simulate|show|open)\b/.test(q)) { await this.post(concept); return; }

    // 0. FieldScan flow (identify → confirm → diagnose → fix → verify). Spare-part and
    // 4–20 mA topics move to workspace 3 and fall through to the loop engine below.
    const loopTopic = /spare|4.?20|fmx|wika|\bloop\b|tank|\b(12|24) ?v\b|config(uration)? ?v?[12]\b|open wire|margin|sm ?1231|replacement|equivalen|workspace ?3/.test(q);
    if (!loopTopic && await this.fieldscan(q)) return;
    if (loopTopic && app.ws !== 'compat') app.setWorkspace('compat', { quiet: true });

    // 1. Configuration changes
    const changes = {};
    if (app.ws === 'compat' && /\breset\b|start over|defaults?\b/.test(q)) Object.assign(changes, { voltage: 24, revision: 'v1', scenario: 'nominal' });
    if (/\b12\s*v\b|\b12[- ]?volts?|twelve/.test(q)) changes.voltage = 12;
    else if (/\b24\s*v\b|\b24[- ]?volts?|twenty[- ]?four/.test(q)) changes.voltage = 24;
    if (/\bv2\b|config(uration)?\s*v?2\b|revision\s*2|475/.test(q)) changes.revision = 'v2';
    else if (/\bv1\b|config(uration)?\s*v?1\b|revision\s*1/.test(q)) changes.revision = 'v1';
    if (app.ws !== 'compat') { /* loop scenarios only apply to the spare workspace */ } else if (/open[- ]?(wire|circuit|loop)|wire[- ]?break|broken (wire|cable)|cut (the )?(wire|cable)|disconnect/.test(q)) changes.scenario = 'open';
    else if (/\bempty\b|\bdrain/.test(q)) changes.scenario = 'empty';
    else if (/50 ?%|\bhalf\b|nominal|refill|fill (the |it )?(tank|up)|reconnect|repair|fix the (wire|cable)|restore/.test(q)) changes.scenario = 'nominal';
    if (Object.keys(changes).length) {
      const before = app.report;
      await app.setConfig(changes, 'assistant');
      const r = app.report;
      const what = [
        changes.voltage && `${changes.voltage} V DC supply`,
        changes.revision && `installation ${changes.revision} (+${r.inputs.synthetic_additional_series_ohm} Ω synthetic)`,
        changes.scenario && { nominal: 'level 50 %', empty: 'empty tank', open: 'open wire' }[changes.scenario],
      ].filter(Boolean).join(', ');
      out.push(`Applied: ${what}.`);
      out.push((r.load_check.status === 'pass' ? '[ok] ' : '[fail] ') + summary(r));
      out.push(stateLine(r));
      if (before.replacement_status !== r.replacement_status) out.push(replacementLine(r));
      handled = true;
    }

    // 2. View and part commands
    const part = (app.ws === 'compat' ? PARTS : THT_PARTS).find(([re]) => re.test(q))?.[1];
    if (/x-?ray|see inside|interior|transparent|look inside/.test(q)) {
      app.setView('xray');
      out.push(app.ws === 'compat'
        ? 'X-ray view on: shells are translucent so you can see the water column, the probe internals and the loop wiring. The glowing particles are the loop current.'
        : 'X-ray view on: the stainless barrel turns translucent so you can see the SHT30 element, the DIP-8 address switch and the RS-485 board. Bus packets are cyan (request) and amber (reply).');
      handled = true;
    } else if (/realistic|normal view|solid view|photo/.test(q)) {
      app.setView('normal');
      out.push('Back to the realistic view.');
      handled = true;
    }
    if (/re-?assembl|put (it )?back|collapse|close (it )?up/.test(q)) {
      app.setExplode(0);
      out.push('Reassembled. All parts are back in their installed positions.');
      handled = true;
    } else if (/explod|disassembl|take (it |the \w+ )?apart|tear ?down|dismantl|break (it )?down|pull (it )?out/.test(q)) {
      app.setExplode(1);
      if (part) {
        app.focus(part);
        app.inspect(part, { reveal: false });
      }
      out.push(`Disassembled${part ? ` and focused on the ${app.partName(part)}` : ''}.${app.ws === 'compat' ? '' : ' Same order as the manual: rear gland first, then the barrel unscrews at the middle seam to expose the DIP switch.'} Click any part to inspect its datasheet fields, or use “Isolate” in the Parts tab.`);
      handled = true;
    } else if (part && /show|focus|zoom|look at|where|inspect|go to|open|view/.test(q)) {
      app.focus(part);
      app.inspect(part, { reveal: false });
      out.push(`Focused on the ${app.partName(part)}. Its evidence-backed fields are in the Parts tab.`);
      handled = true;
    }

    if (out.length) await this.post(out.join('\n'));

    // 3. Information requests
    if (/self[- ]?test|run (the )?tests?|golden/.test(q)) {
      await this.selfTest();
      handled = true;
    }
    if (/(everything|all|it|system|platform|loop|things?).{0,25}\b(ok|okay|fine|working|running|good|healthy|alright)\b|\bstatus\b|\bhealth|diagnos|check ?up|sanity/.test(q)) {
      await this.diagnostics();
      handled = true;
    }
    if (/\bwhy\b|explain|margin|formula|how .*(calc|comput|work)|\bload\b/.test(q) && !Object.keys(changes).length) {
      await this.post(this.explain());
      handled = true;
    }
    if (/source|evidence|datasheet|document|\boem\b/.test(q)) {
      await this.post(app.ws === 'compat' ? this.sources() : this.fsSources());
      handled = true;
    }
    if (/equivalen|replace|substitut|\bswap|pending|compatib/.test(q) && !Object.keys(changes).length) {
      const rc = await app.refreshReplacement();
      const crit = rc?.criteria ? '\n' + rc.criteria.map(c => `${c.status === 'pass' ? '[ok]' : c.status === 'fail' ? '[fail]' : '[warn]'} ${c.criterion.replace(/_/g, ' ')}: ${c.detail}`).join('\n') + `\n(${rc.event_id}, rules ${rc.rules_version})` : '';
      await this.post(summary(app.report) + crit + '\n' + replacementLine(app.report));
      handled = true;
    }
    if (/telemetry|live|reading|current|\bma\b|count|signal|level|temperature|humidity|right now|\bnow\b/.test(q) && !handled) {
      await this.post(this.liveNow());
      handled = true;
    }
    if (/export|download|\bjson\b/.test(q) && app.ws !== 'compat') {
      await this.action('exportReport');
      handled = true;
    } else if (/export|download|\bjson\b/.test(q)) {
      app.exportJson();
      await this.post('Exported the current report as boat-mvp-result.json. Paste it into your AI tool if you need a narrative; the JSON stays the source of truth.');
      handled = true;
    }
    if (/\bhelp\b|what can you|commands|capabilit/.test(q)) {
      await this.post(this.help());
      handled = true;
    }
    if (handled) return;

    // 4. Free-form → LLM (server-side key) or grounded fallback
    if (app.ai.configured) {
      const ok = await this.streamLLM(text);
      if (ok) return;
    }
    const loose = this.concept(q);
    if (loose) { await this.post(loose); return; }
    if (!app.ai.configured) await app.refreshAi?.();
    if (app.ai.configured && await this.streamLLM(text)) return;
    await this.post(
      pick(['I\'m not sure I follow that one.', 'I can\'t answer that from the evidence I have.', 'That\'s outside what I can verify here.'])
      + ' I run locally without an LLM, so I answer about this platform: the THT-02 case, the 4–20 mA spare, the manuals and the 3D twin.\n'
      + this.stateBrief()
      + '\nYou can also ask “what is Modbus?”, “what is going on?”, “temperature now?” or “help”.',
    );
  }

  async streamLLM(text) {
    const app = this.app;
    let body;
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: {
            workspace: app.ws, view: app.viewState(), pins: app.sessionPins(), bus: app.bus,
            situation: this.stateBrief(), live_now: app.ws === 'compat' ? undefined : app.liveSnapshot()?.decode,
            last_transaction: app.transactions[0] || null,
            report: app.ws === 'compat' ? app.report : undefined,
            telemetry: app.ws === 'compat' ? app.telemetry.last : undefined,
          },
          history: this.history.slice(-9, -1),
        }),
      });
      if (!response.ok || !response.body) return false;
      body = this.bubble('bot');
      body.parentElement.classList.add('typing');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let full = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf('\n\n')) >= 0) {
          const chunk = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 2);
          if (!chunk.startsWith('data:')) continue;
          const evt = JSON.parse(chunk.slice(5));
          if (evt.error) throw new Error(evt.error);
          if (evt.delta) {
            full += evt.delta;
            body.innerHTML = this.render(full);
            this.list.scrollTop = this.list.scrollHeight;
          }
        }
      }
      body.parentElement.classList.remove('typing');
      if (!full) throw new Error('Empty response.');
      this.history.push({ role: 'assistant', content: full });
      this.say(full);
      return true;
    } catch {
      if (body) body.parentElement.remove();
      return false;
    }
  }

  // ------------------------------------------------------------ grounded answers

  explain() {
    const r = this.app.report;
    const c = r.load_check;
    const v = r.inputs.supply_v;
    const R = r.inputs.synthetic_additional_series_ohm;
    const term = v - 0.022 * c.evaluated_ohm;
    return [
      '**How the margin is computed**',
      `1. The FMX11 needs at least 8 V at its terminals while drawing up to 22 mA (E+H TI01524P, p. 7). The loop may therefore drop (V − 8 V) at 22 mA: (${v} − 8) / 0.022 = ${fmt.format(c.available_ohm)} Ω available.`,
      `2. The loop presents 290 Ω (upper bound of the SM 1231 input impedance, Siemens) + ${R} Ω synthetic cable and accessories = ${fmt.format(c.evaluated_ohm)} Ω.`,
      `3. Margin = ${fmt.format(c.available_ohm)} − ${fmt.format(c.evaluated_ohm)} = ${signed(c.margin_ohm)} Ω → ${c.status === 'pass' ? '[PASS]' : '[FAIL]'}.`,
      `At 22 mA the transmitter would see ${fmt.format(term)} V at its terminals (${term >= 8 ? '≥' : '<'} 8 V minimum).`,
      'Only the installation data (+' + R + ' Ω, supply choice) is synthetic; the 8 V, 22 mA and 290 Ω figures come from the OEM documents.',
    ].join('\n');
  }

  sources() {
    return 'Evidence used (snapshot ' + this.app.report.evidence_version + '):\n'
      + this.app.report.sources.map(s => `• ${s.id}: ${s.title}. ${s.section}`).join('\n')
      + '\nThe links are in the Evidence tab; opening them requires Internet.';
  }

  live() {
    const s = this.app.telemetry.last;
    if (!s) return 'Telemetry is starting…';
    return [
      `Live (simulated) at ${new Date(s.t).toLocaleTimeString('en-US', { hour12: false })}:`,
      `• Loop current: ${s.ma === null ? 'suppressed (outside envelope)' : s.ma.toFixed(2) + ' mA'}`,
      `• Supply: ${s.supply.toFixed(2)} V · terminal voltage at 22 mA: ${s.terminalAtDesign.toFixed(2)} V`,
      `• AI0 raw count: ${s.count === null ? '—' : fmtInt.format(s.count)} · channel diagnostic: ${s.diag}`,
      `• Physical tank level: ${(s.level * 100).toFixed(1)} %`,
    ].join('\n');
  }

  fsSources() {
    const docs = this.app.bundle.documents;
    return 'Documents in this package (catalog ' + this.app.bundle.catalog_version + '):\n'
      + Object.values(docs).map(d => `• ${d.id}: ${d.title} · ${d.edition || ''} · validity ${d.validity.replace('_', ' ')}`).join('\n')
      + '\nSay “show the manual § 6.4” to open a section. Opening the original links requires Internet.';
  }

  rtuLive() {
    const app = this.app;
    const b = app.bus;
    const tx = app.transactions[0];
    return [
      `Bus (simulated): master polls address ${b.master_address} · sensor DIP ${b.dip_bits.join('')} → address ${b.device_address}.`,
      tx ? `Last recorded transaction ${tx.event_id}: ${tx.decode.status}${tx.decode.values ? ` · ${tx.decode.values.temperature_c.toFixed(1)} °C, ${tx.decode.values.humidity_rh.toFixed(1)} %RH` : ''}.` : 'No transaction recorded yet in this session.',
    ].join('\n');
  }

  help() {
    return [
      'I can operate the platform and answer from the evidence:',
      '• FieldScan: “identify this sensor”, “confirm the asset”, “why does it fail?”, “show the manual § 5”, “simulate the DIP fix”, “does it work now?”, “inject a bad CRC”, “bench reader”, “reset the case”',
      '• Health: “Is everything OK?”, “run self-test”, “live readings”',
      '• Spare (workspace 3): “switch to 12 V”, “use config v2”, “simulate an open wire”, “empty the tank”, “reset”',
      '• Twin: “x-ray view”, “disassemble the probe”, “show the SM 1231”, “reassemble”',
      '• Engineering: “explain the margin”, “is the spare a valid replacement?”, “sources”, “export JSON”',
      this.app.ai.configured ? `Free-form questions go to ${this.app.ai.model}${this.app.ai.local ? ', running on this machine (works offline)' : ''}.` : 'Free-form questions need an LLM: start a local Liquid AI model (llama-server on port 8080) or set AI_BASE_URL, AI_MODEL, AI_API_KEY.',
    ].join('\n');
  }

  async selfTest() {
    const res = await this.app.selfTest();
    if (res.ok) {
      await this.post(`[ok] Self-test passed: ${res.total} checks${res.python ? ` (Python: loop ${res.python.loop.cases.length}, Modbus ${res.python.modbus.cases.length}, session ${res.python.session.cases.length})` : ''} and the browser Modbus RTU matches the Python golden vectors (${res.parity.cases}/${res.parity.cases}).`, { kind: 'good' });
    } else {
      await this.post('[fail] Engine self-test FAILED: ' + (res.error || 'unknown error'), { kind: 'alert' });
    }
  }

  async diagnostics() {
    const app = this.app;
    const r = app.report;
    const body = this.bubble('bot');
    body.parentElement.classList.add('typing');
    const lines = ['**Platform diagnostics**'];
    const push = async line => {
      lines.push(line);
      body.innerHTML = this.render(lines.join('\n'));
      this.list.scrollTop = this.list.scrollHeight;
      await sleep(260);
    };
    await push(`[ok] Local engine: rules ${r.rules_version}, evidence ${r.evidence_version}`);
    const h = await app.health();
    await push(h.portable ? '[ok] Platform link: portable file, all 12 scenarios precomputed (no server needed)'
      : h.ok ? '[ok] Platform link: loopback server healthy, live recomputation'
        : '[fail] Platform link: local server not responding');
    const st = await app.selfTest();
    await push(st.ok ? `[ok] Engine self-test: ${st.total} checks, JS/Python Modbus parity ${st.parity.cases}/${st.parity.cases}` : '[fail] Engine self-test failed: ' + (st.error || ''));
    const id = app.identity;
    await push(id?.confirmed ? `[ok] Asset: ${id.model} confirmed at ${id.asset_id}` : '[warn] Asset: not confirmed yet (capture + confirm in Live view)');
    const b = app.bus;
    const rtuOk = app.lastStatus === 'valid';
    await push(rtuOk ? `[ok] THT-02 bus: address ${b.master_address} answering, CRC OK (simulated)`
      : `[fail] THT-02 bus: ${app.lastStatus === 'timeout' ? `no reply — master polls ${b.master_address}, DIP set to ${b.device_address}` : app.lastStatus.replace('_', ' ')}`);
    await push(navigator.onLine ? '[ok] Network: online (OEM links reachable)' : '[warn] Network: offline. Calculations, evidence and export still work locally');
    const pass = r.load_check.status === 'pass';
    await push(`${pass ? '[ok]' : '[fail]'} Loop load at ${r.inputs.supply_v} V / ${r.inputs.synthetic_installation_revision}: margin ${signed(r.load_check.margin_ohm)} Ω`);
    const s = app.telemetry.last;
    const state = r.simulation.state;
    if (state === 'open_circuit') await push('[fail] Live signal: 0 mA, wire-break diagnostic on AI0 (check JB-03 and field cable)');
    else if (state === 'outside_load_envelope') await push('[fail] Live signal: suppressed, loop outside validated load envelope');
    else await push(`[ok] Live signal: ${s?.ma?.toFixed(2) ?? '—'} mA on AI0 (expected ${fmt.format(r.simulation.loop_signal_ma)} mA)${state === 'empty_tank' ? ', empty tank (valid live zero)' : ''}`);
    await push(r.replacement_status === 'insufficient_evidence'
      ? `[warn] Replacement equivalence: ${r.pending.length} evidence items pending`
      : '[fail] Replacement equivalence: incompatible with the evaluated profile');
    await push(app.ai.configured ? `[ok] Assistant: LLM ${app.ai.model} available via local server` : '[ok] Assistant: local grounded engine (no LLM needed)');

    const platformOk = (h.ok || h.portable) && st.ok;
    const loopOk = pass && state !== 'open_circuit';
    const busOk = rtuOk;
    let verdict;
    if (!platformOk) verdict = '**Verdict:** the platform itself has a problem; see the failed checks above.';
    else if (!busOk) verdict = '**Verdict:** platform healthy, but sensor BOAT-ER-TH-02 is NOT answering. Ask “Why does it fail?” for the evidence-backed diagnosis.' + (loopOk ? ' The 4–20 mA loop is fine.' : '');
    else if (loopOk) verdict = '**Verdict:** platform healthy, the THT-02 is answering and the loop is working. The spare passes the load check; equivalence still needs the pending evidence before you sign off the swap.';
    else if (state === 'open_circuit') verdict = '**Verdict:** platform healthy, but the loop is NOT OK. There is a wire break; the reading is 0 mA, not an empty tank.';
    else verdict = '**Verdict:** platform healthy, but the loop is NOT OK. The candidate cannot drive this loop at this configuration (negative margin).';
    await push(verdict);
    body.parentElement.classList.remove('typing');
    body.parentElement.classList.add(platformOk && loopOk && busOk ? 'good' : 'alert');
    this.history.push({ role: 'assistant', content: lines.join('\n') });
    this.say(verdict);
  }

  // Proactive real-time alerts when something changes outside the chat.
  async onReport(report, previous, source) {
    if (source === 'assistant' || !previous) return;
    const wasOk = previous.load_check.status === 'pass' && previous.simulation.state !== 'open_circuit';
    const isOk = report.load_check.status === 'pass' && report.simulation.state !== 'open_circuit';
    if (wasOk && !isOk) {
      await this.post('**Alert.** ' + summary(report) + '\n' + stateLine(report), { kind: 'alert' });
    } else if (!wasOk && isOk) {
      await this.post('**Recovered.** ' + summary(report) + '\n' + stateLine(report), { kind: 'good' });
    } else if (report.simulation.state !== previous.simulation.state) {
      await this.post(stateLine(report), { speak: false });
    }
  }

  onNetwork(online) {
    this.post(online
      ? 'Network restored. OEM document links are reachable again.'
      : 'Network lost. No problem: the engine, evidence and export run locally on board.', { kind: online ? 'good' : 'alert' });
  }
}
