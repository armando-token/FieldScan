import * as THREE from 'three';
import { Stage } from './stage.js';
import { buildThtScene } from './tht_build.js';
import { DIP_WEIGHTS } from '../fieldscan/modbus.js';

const PRESETS = {
  overview: { pos: [0.5, 1.56, 1.22], target: [0.33, 1.46, 0.02] },
  camera: { pos: [0.08, 1.4, 0.55], target: [0.02, 1.36, 0.02] },
  probe: { pos: [0.12, 1.4, 0.3], target: [-0.03, 1.36, 0.03] },
  plate: { pos: [0.06, 1.33, 0.2], target: [0.045, 1.325, 0.006] },
  dip: { pos: [0.05, 1.35, 0.14], target: [-0.03, 1.335, 0.04] },
  gateway: { pos: [0.66, 1.44, 0.32], target: [0.64, 1.43, 0.06] },
};

const PACKET = { request: 0x46e8ff, reply: 0xffb02e, error: 0xff3b30 };
const SLIDE = 0.0011; // slider travel (m) from centre to ON/OFF

// TZ THT-02 on the engine-room bulkhead, wired to a synthetic Modbus master.
export class ThtTwin extends Stage {
  constructor(container, { plateLines, onDip = () => {}, ...opts } = {}) {
    super(container, buildThtScene(plateLines), {
      ...opts, presets: PRESETS, initial: 'overview', background: '#11181c', fog: [3, 9],
      minFocus: 0.09, focusScale: 2.2, near: 0.005, minDistance: 0.05, maxDistance: 3, exposure: 1.1,
    });
    this.onDip = onDip;
    const scene = this.scene;
    scene.add(new THREE.HemisphereLight(0xe6efff, 0x3a342a, 0.55));
    const key = new THREE.DirectionalLight(0xfff1df, 2.2);
    key.position.set(1.2, 2.6, 1.8);
    key.target.position.set(0.2, 1.4, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -1, right: 1, top: 1, bottom: -1, near: 0.5, far: 5 });
    key.shadow.bias = -0.0003;
    key.shadow.normalBias = 0.01;
    scene.add(key, key.target);
    const tubeLight = new THREE.PointLight(0xfff0d8, 1.6, 3, 2);
    tubeLight.position.set(0.2, 2.45, 0.6);
    scene.add(tubeLight);
    const torch = new THREE.SpotLight(0xffffff, 0, 1.6, 0.35, 0.6, 1.5);
    torch.position.set(0.1, 1.45, 0.6);
    torch.target.position.copy(this.model.probeWorld);
    scene.add(torch, torch.target);
    this.torch = torch;

    for (const knob of this.model.sliders) knob.userData.hint = 'DIP';
    this.dipBits = [0, 0, 0, 0, 0, 0, 1, 0];
    this.sliderX = this.model.sliders.map(() => SLIDE);

    // Packet particles travelling along the RS-485 path.
    const geo = new THREE.SphereGeometry(0.0032, 12, 10);
    this.packets = [];
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: PACKET.request, transparent: true, toneMapped: false, depthTest: false }));
      m.renderOrder = 5;
      m.visible = false;
      scene.add(m);
      this.packets.push(m);
    }
    this.flash = new THREE.PointLight(PACKET.error, 0, 0.35, 2);
    this.flash.position.copy(this.model.probeWorld).add(new THREE.Vector3(0, 0.04, 0.03));
    scene.add(this.flash);
    this.anim = null;
    this.lcdLines = null;
    this.drawLcd({ status: 'idle' });
    this.model.dynamic.leds.pwr.on(1);
  }

  // ------------------------------------------------------------ state from the session

  setDip(bits) {
    this.dipBits = [...bits];
    this.model.sliders.forEach((knob, i) => {
      knob.userData.hint = `DIP ${i + 1} (${DIP_WEIGHTS[i]}) · ${bits[i] ? 'ON' : 'OFF'} — click to toggle`;
    });
    const address = bits.reduce((s, b, i) => s + (b ? DIP_WEIGHTS[i] : 0), 0);
    this.setLabel('tht', 'THT-02 · DIP', `address ${address}`, '');
  }

  onPickObject(object) {
    if (object.userData.dip === undefined) return false;
    this.onDip(object.userData.dip);
    return true;
  }

  setTorch(on) { this.torch.intensity = on ? 6 : 0; }

  drawLcd({ status, tx = null, master = 1 }) {
    const lines = [
      { text: 'SEG B · 9600 8N1', y: 46, size: 30, weight: 700 },
      { text: `POLL ADDR ${master} · FC03 R0×2`, y: 96, size: 30, weight: 600 },
    ];
    if (status === 'valid') {
      lines.push({ text: `${tx.decode.values.temperature_c.toFixed(1)} °C   ${tx.decode.values.humidity_rh.toFixed(1)} %RH`, y: 168, size: 46, weight: 800 });
      lines.push({ text: 'OK · CRC MATCH', y: 228, size: 30, weight: 700 });
    } else if (status === 'idle') {
      lines.push({ text: 'WAITING…', y: 175, size: 44, weight: 800 });
    } else {
      const text = { timeout: 'NO REPLY · TIMEOUT', invalid: 'FRAME REJECTED', sensor_abnormal: 'SENSOR 7FFF H', exception: 'EXCEPTION' }[status] || status.toUpperCase();
      lines.push({ text, y: 168, size: 42, weight: 800, color: '#ff8f7a' });
      const failed = tx?.decode.checks.find(c => !c.ok);
      lines.push({ text: failed ? `${failed.check.toUpperCase()}: ${failed.detail}`.slice(0, 30) : '', y: 228, size: 26, weight: 600, color: '#ff8f7a' });
    }
    this.model.dynamic.lcd.draw(lines);
    this.lcdStatus = status;
  }

  setLiveLabels(tx) {
    const st = tx.decode.status;
    this.setLabel('gateway', 'Master · addr 1', st === 'valid' ? `${tx.decode.values.temperature_c.toFixed(1)} °C · ${tx.decode.values.humidity_rh.toFixed(1)} %RH` : st.replace('_', ' '), st === 'valid' ? 'ok' : 'fail');
    this.setLabel('jb', 'JB-ER-07', 'Segment B · A+/B−');
  }

  // Animate one Modbus transaction: request out, then reply back, timeout flash or rejection.
  playTransaction(tx, { quiet = false } = {}) {
    this.anim = { tx, start: performance.now(), quiet };
    this.model.dynamic.leds.tx.on(1);
    this.setLiveLabels(tx);
  }

  tick(dt, t) {
    // DIP sliders glide to their positions
    this.model.sliders.forEach((knob, i) => {
      const target = this.dipBits[i] ? -SLIDE : SLIDE;
      this.sliderX[i] += (target - this.sliderX[i]) * Math.min(1, dt * 10);
      knob.position.x = this.sliderX[i];
    });

    const L = this.model.dynamic.leds;
    if (!this.anim) {
      for (const p of this.packets) p.visible = false;
      this.flash.intensity *= 0.9;
      L.err.on(this.lcdStatus && !['valid', 'idle'].includes(this.lcdStatus) ? 0.4 + 0.6 * (Math.sin(t * 6) > 0) : 0);
      return;
    }
    const { tx } = this.anim;
    const age = (performance.now() - this.anim.start) / 1000;
    const status = tx.decode.status;
    const out = 0.7;
    const back = 0.7;
    const path = this.model.busPath;
    const draw = (u, color) => {
      this.packets.forEach((p, i) => {
        const k = u - i * 0.018;
        p.visible = k >= 0 && k <= 1 && this.explode < 0.05;
        if (!p.visible) return;
        p.position.copy(path.getPointAt(Math.min(1, k)));
        p.material.color.setHex(color);
        p.material.opacity = 1 - i * 0.085;
      });
    };
    if (age < out) {
      draw(age / out * 1.15, PACKET.request);
    } else if (status === 'timeout') {
      draw(-1, 0);
      L.tx.on(0);
      this.flash.intensity = !this.anim.quiet && age < out + 0.5 ? 0.6 * (Math.sin(age * 40) > 0) : 0;
      if (age > out + 1) this.finish(tx);
    } else if (age < out + back) {
      L.tx.on(0);
      L.rx.on(1);
      const color = status === 'valid' ? PACKET.reply : PACKET.error;
      draw(1.15 - (age - out) / back * 1.15, color);
    } else {
      this.finish(tx);
    }
  }

  finish(tx) {
    this.anim = null;
    const L = this.model.dynamic.leds;
    L.tx.on(0);
    L.rx.on(0);
    this.drawLcd({ status: tx.decode.status, tx, master: tx.master_address });
  }
}
