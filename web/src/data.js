// Data and tool client. Server mode calls the Python tools over loopback; the portable
// HTML embeds the versioned bundle and runs the JS mirror of the session instead.

import { LocalSession, ToolError } from './fieldscan/session.js';
import { parityCheck } from './fieldscan/modbus.js';

const embeddedNode = document.getElementById('embedded-bundle');
const embedded = embeddedNode ? JSON.parse(embeddedNode.textContent) : null;

export const mode = embedded ? 'portable' : 'server';

let bundle = embedded;
let local = embedded ? new LocalSession(embedded) : null;
let serverState = { pins: null, events: [], identity: null, bus: null };

export async function loadBundle() {
  if (bundle) return bundle;
  const response = await fetch('/api/bundle');
  if (!response.ok) throw new Error('Could not load the data bundle from the local server.');
  bundle = await response.json();
  return bundle;
}

export const getBundle = () => bundle;

async function refreshServerState() {
  try {
    const response = await fetch('/api/session', { cache: 'no-store' });
    if (response.ok) serverState = await response.json();
  } catch { /* keep last known state */ }
}

export async function syncSession() {
  if (!local) await refreshServerState();
  return sessionState();
}

export async function callTool(name, args = {}) {
  if (local) {
    if (typeof local[name] !== 'function') throw new ToolError(`Unknown tool ${name}.`);
    return local[name](args);
  }
  const response = await fetch('/api/tools/' + name, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  const data = await response.json();
  await refreshServerState();
  if (!response.ok) throw new ToolError(data.error || `Tool ${name} failed.`);
  return data;
}

export function sessionState() {
  if (local) return { pins: local.pins(), events: local.events, identity: local.identity, bus: local.busState() };
  return serverState;
}

export async function getReport({ voltage, revision, scenario }) {
  if (bundle?.reports && mode === 'portable') {
    const report = bundle.reports[`${voltage}:${revision}:${scenario}`];
    if (!report) throw new Error('Combination not available in this file.');
    return report;
  }
  const params = new URLSearchParams({ voltage, revision, scenario });
  const response = await fetch('/api/check?' + params);
  if (!response.ok) throw new Error((await response.json()).error || 'Local query failed.');
  return response.json();
}

export async function health() {
  if (embedded) return { ok: true, portable: true };
  try {
    const response = await fetch('/health', { cache: 'no-store' });
    return { ok: response.ok };
  } catch {
    return { ok: false };
  }
}

export async function aiStatus() {
  if (embedded) return { configured: false, model: null };
  try {
    const response = await fetch('/api/ai');
    return response.ok ? response.json() : { configured: false };
  } catch {
    return { configured: false };
  }
}

// Golden loop cases mirrored from core/compatibility.py.
const LOOP_GOLDEN = [
  ['24:v1:nominal', 'pass', 'nominal', 12, 13824, 407.273],
  ['12:v1:nominal', 'fail', 'outside_load_envelope', null, null, -138.182],
  ['24:v1:empty', 'pass', 'empty_tank', 4, 0, 407.273],
  ['24:v1:open', 'pass', 'open_circuit', 0, null, 407.273],
  ['24:v2:nominal', 'fail', 'outside_load_envelope', null, null, -37.727],
  ['12:v1:open', 'fail', 'open_circuit', 0, null, -138.182],
];

// Always checks the browser Modbus implementation against the Python golden vectors;
// in server mode it also runs the full Python suite.
export async function selfTest() {
  const parity = bundle ? parityCheck(bundle.golden) : { ok: false, cases: 0, failures: ['bundle not loaded'] };
  if (!embedded) {
    try {
      const response = await fetch('/api/selftest');
      const py = await response.json();
      return { ok: !!py.ok && parity.ok, total: (py.total || 0) + parity.cases, python: py, parity,
        error: py.error || (parity.ok ? undefined : 'JS/Python Modbus mismatch: ' + parity.failures.join(', ')) };
    } catch (error) {
      return { ok: false, total: 0, parity, error: String(error) };
    }
  }
  const failures = LOOP_GOLDEN.filter(([key, status, state, signal, count, margin]) => {
    const r = bundle.reports[key];
    return !r || r.load_check.status !== status || r.simulation.state !== state
      || r.simulation.loop_signal_ma !== signal || r.simulation.plc_ideal_count !== count
      || r.load_check.margin_ohm !== margin;
  }).map(f => f[0]);
  const all = [...failures, ...parity.failures];
  return { ok: all.length === 0, total: LOOP_GOLDEN.length + parity.cases, parity,
    error: all.length ? 'Mismatch: ' + all.join(', ') : undefined };
}
