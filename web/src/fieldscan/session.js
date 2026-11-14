// Offline mirror of core/fieldscan.Session. Used only by the portable HTML file;
// in server mode the browser calls the Python tools over loopback instead.

import { Tht02Model, addressToDip, dipToAddress, poll, INJECTIONS } from './modbus.js';

const now = () => new Date().toISOString().replace(/\.\d+Z$/, '+00:00');
const norm = s => String(s).toUpperCase().replace(/-/g, ' ').split(/\s+/).filter(Boolean).join(' ');

export class ToolError extends Error {}

export class LocalSession {
  constructor(bundle) {
    this.b = bundle;
    this.n = 0;
    this.events = [];
    this.identity = null;
    this.resetCase();
  }

  event(tool, summary, source) {
    const id = 'EV-' + String(++this.n).padStart(4, '0');
    this.events.push({ event_id: id, at: now(), tool, summary, source });
    return id;
  }

  pins() {
    const b = this.b;
    return {
      asset_id: this.identity?.asset_id ?? null,
      product_id: this.identity?.product_id ?? null,
      catalog_version: b.catalog_version,
      rules_version: { diagnosis: b.rules_versions.diagnosis, loop: b.rules_versions.loop },
      last_event_id: this.events.at(-1)?.event_id ?? null,
      source_status: Object.fromEntries(Object.entries(b.documents).map(([id, d]) => [id, d.validity])),
    };
  }

  resetCase() {
    const i = this.b.incident;
    this.master = i.master_address;
    this.model = new Tht02Model(addressToDip(i.device_address), i.temperature_c, i.humidity_rh);
  }

  busState() {
    return { source: 'simulated', master_address: this.master, device_address: this.model.address, dip_bits: [...this.model.dipBits] };
  }

  requireIdentity() {
    if (!this.identity) throw new ToolError('No confirmed asset in this session. Run capture_frame and confirm_asset first.');
  }

  findProduct(model) {
    const key = norm(model);
    return Object.values(this.b.products).find(p => [p.model, ...p.aliases].some(n => norm(n) === key)) || null;
  }

  capture_frame({ source = 'simulated' } = {}) {
    if (source === 'uvc') throw new ToolError('UVC capture is not integrated in this build (planned: FieldScan camera adapter).');
    if (source !== 'simulated') throw new ToolError("source must be 'simulated' or 'uvc'.");
    const asset = this.b.assets['BOAT-ER-TH-02'];
    const id = this.event('capture_frame', 'Simulated frame of the engine-room bulkhead', 'simulated');
    return { frame_id: 'FRAME-' + id, source: 'simulated', kind: 'html_scene', captured_at: now(),
      plate_text: asset.plate_lines, asset_hint: asset.asset_id, event_id: id };
  }

  confirm_asset({ model, variant = null, id_source = 'plate_simulated', confirmed = false, asset_id = 'BOAT-ER-TH-02' } = {}) {
    const product = this.findProduct(model);
    const asset = this.b.assets[asset_id];
    if (!asset) throw new ToolError('Unknown asset_id.');
    if (!product) {
      const id = this.event('confirm_asset', `Model '${model}' not in catalog`, 'documented');
      return { status: 'insufficient_evidence', missing: `Model '${model}' is not in catalog ${this.b.catalog_version}.`, event_id: id };
    }
    if (product.product_id !== asset.expected_product) {
      const id = this.event('confirm_asset', 'Model does not match the installed asset record', 'documented');
      return { status: 'insufficient_evidence', missing: `${product.model} does not match the record for ${asset_id}. Confirm the asset.`, event_id: id };
    }
    const pending = product.variant_fields.filter(f => !(variant && f === 'Order variant'));
    this.identity = { asset_id, product_id: product.product_id, model: product.model, variant, id_source,
      confirmed: !!confirmed, status: confirmed ? 'confirmed' : 'needs_confirmation', pending_fields: pending };
    const id = this.event('confirm_asset', `${product.model} · ${this.identity.status}`, id_source === 'uvc' ? 'observed' : 'simulated');
    return { ...this.identity, event_id: id, pins: this.pins() };
  }

  get_document({ product_id = null, doc_type = 'user_manual', catalog_version = null, section = null } = {}) {
    if (catalog_version && catalog_version !== this.b.catalog_version) {
      const id = this.event('get_document', 'Catalog version mismatch', 'documented');
      return { status: 'insufficient_evidence', missing: `Catalog ${catalog_version} requested; this package holds ${this.b.catalog_version}.`, event_id: id };
    }
    if (product_id === null) { this.requireIdentity(); product_id = this.identity.product_id; }
    const product = this.b.products[product_id];
    if (!product) throw new ToolError('Unknown product_id.');
    const doc = product.document_ids.map(d => this.b.documents[d]).find(d => d.type === doc_type);
    if (!doc) {
      const id = this.event('get_document', `No ${doc_type} for ${product_id}`, 'documented');
      return { status: 'insufficient_evidence', missing: `No ${doc_type} in the package for ${product.model}.`, event_id: id };
    }
    if (section !== null && !(section in doc.sections)) throw new ToolError(`Section ${section} is not in ${doc.id}.`);
    const id = this.event('get_document', `${doc.id} § ${section || 'all'}`, 'documented');
    const meta = Object.fromEntries(['id', 'title', 'edition', 'date', 'origin', 'url', 'validity', 'validity_note'].map(k => [k, doc[k]]));
    return { status: 'ok', source: 'documented', document: meta, sections: section ? { [section]: doc.sections[section] } : doc.sections, event_id: id };
  }

  get_asset_status({ transport = 'simulated_rtu', injection = 'none' } = {}) {
    this.requireIdentity();
    if (transport === 'rtu_bench') {
      const id = this.event('get_asset_status', 'Bench reader not connected', 'observed');
      return { source: 'no_evidence', reading: null, detail: 'No bench RS-485 reader in this build.', event_id: id };
    }
    if (transport !== 'simulated_rtu') throw new ToolError("transport must be 'simulated_rtu' or 'rtu_bench'.");
    if (!INJECTIONS.includes(injection)) throw new ToolError('Unknown injection.');
    const tx = poll(this.master, this.model, injection);
    const id = this.event('get_asset_status', `Poll addr ${this.master}: ${tx.decode.status}`, 'simulated');
    return { source: 'simulated', reading: tx.decode.values, transaction: tx, event_id: id };
  }

  simulate_fault({ scenario = 'address_mismatch', dip_bits = null } = {}) {
    this.requireIdentity();
    const before = poll(this.master, this.model);
    let action;
    if (scenario === 'reset' || scenario === 'address_mismatch') {
      this.resetCase();
      action = `Incident restored: master polls ${this.master}, DIP set to ${this.model.address}.`;
    } else if (scenario === 'dip_fix') {
      this.model.dipBits = addressToDip(this.master);
      action = `DIP set to ${this.master} (switch 8 ON, others OFF) inside the simulation.`;
    } else if (scenario === 'set_dip') {
      let address;
      try { address = dipToAddress(dip_bits || []); } catch (e) { throw new ToolError(e.message); }
      this.model.dipBits = [...dip_bits];
      action = `DIP set to address ${address} inside the simulation.`;
    } else if (['bad_crc', 'foreign_address', 'sensor_fault'].includes(scenario)) {
      const after = poll(this.master, this.model, scenario);
      const id = this.event('simulate_fault', `Injected ${scenario}: ${after.decode.status}`, 'simulated');
      return { source: 'simulated', scenario, before, action: `One reply with ${scenario}.`, after, event_id: id };
    } else {
      throw new ToolError('scenario must be address_mismatch, dip_fix, set_dip, bad_crc, foreign_address, sensor_fault or reset.');
    }
    const after = poll(this.master, this.model);
    const id = this.event('simulate_fault', action, 'simulated');
    return { source: 'simulated', scenario, before, action, after, event_id: id };
  }

  check_replacement({ candidate = 'eh-fmx11', voltage = 24, revision = 'v1', scenario = 'nominal', rules_version = this.b.rules_versions.loop } = {}) {
    if (rules_version !== this.b.rules_versions.loop) {
      const id = this.event('check_replacement', 'Rules version mismatch', 'documented');
      return { status: 'insufficient_evidence', missing: `Rules ${rules_version} requested; the engine runs ${this.b.rules_versions.loop}.`, event_id: id };
    }
    if (candidate !== 'eh-fmx11') {
      const id = this.event('check_replacement', `No profile for ${candidate}`, 'documented');
      return { status: 'insufficient_evidence', missing: `No evaluated profile for candidate ${candidate}.`, event_id: id };
    }
    const report = this.b.reports[`${voltage}:${revision}:${scenario}`];
    if (!report) throw new ToolError('Combination not available in this file.');
    const load = report.load_check;
    const criteria = [
      { criterion: 'signal_type', status: 'pass', detail: 'Reference and candidate are 4–20 mA.', source_ids: ['WIKA-LS10', 'EH-TI01524P'] },
      { criterion: 'loop_load', status: load.status, margin_ohm: load.margin_ohm,
        detail: `${load.evaluated_ohm} Ω evaluated vs ${load.available_ohm} Ω available at ${voltage} V.`, source_ids: load.source_ids },
      { criterion: 'range_and_scaling', status: 'pending', detail: 'Order codes, range and scaling not confirmed.', source_ids: [] },
      { criterion: 'materials_mounting_approvals', status: 'pending', detail: 'Materials, mounting, cable and approvals not confirmed.', source_ids: [] },
    ];
    const id = this.event('check_replacement', `FMX11 at ${voltage} V/${revision}: ${report.replacement_status}`, 'documented');
    return { status: report.replacement_status, candidate, criteria, rules_version: this.b.rules_versions.loop, report, event_id: id };
  }
}

export const TOOL_NAMES = ['capture_frame', 'confirm_asset', 'get_document', 'get_asset_status', 'simulate_fault', 'check_replacement'];
