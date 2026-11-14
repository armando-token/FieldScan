import * as THREE from 'three';
import { Stage } from './stage.js';
import { buildPlant, TANK } from './build.js';

const PRESETS = {
  overview: { pos: [2.5, 2.35, 4.1], target: [0.05, 1.0, -0.45] },
  probe: { pos: [-0.25, 1.15, 1.25], target: [-0.85, 0.55, -0.1] },
  cabinet: { pos: [1.35, 1.38, 0.15], target: [1.55, 1.22, -1.3] },
};

const FLOW = {
  nominal: { color: '#59ffe0' },
  empty_tank: { color: '#8fd8ff' },
  outside_load_envelope: { color: '#ff5a36' },
  open_circuit: { color: '#ff5a36' },
};

// 4–20 mA level loop LT-301: tank, FMX11 probe, junction box and PLC cabinet.
export class Twin extends Stage {
  constructor(container, opts = {}) {
    super(container, buildPlant(), { ...opts, presets: PRESETS });
    const scene = this.scene;
    const plant = this.model;
    this.plant = plant;

    scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x2f2c26, 0.45));
    const key = new THREE.DirectionalLight(0xfff3e4, 2.1);
    key.position.set(2.6, 4.6, 3.2);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 14 });
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    scene.add(key);
    for (const [x, z] of [[-1.6, -0.9], [1.2, -0.9], [-1.6, 0.5], [1.2, 0.5]]) {
      const lamp = new THREE.PointLight(0xfff0d8, 2.6, 7, 2);
      lamp.position.set(x, 2.7, z);
      scene.add(lamp);
    }

    // Loop-current particles
    this.N = 110;
    const flowMat = new THREE.MeshBasicMaterial({ color: FLOW.nominal.color, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const haloMat = flowMat.clone();
    haloMat.opacity = 0.18;
    this.flowCore = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0105, 10, 8), flowMat, this.N);
    this.flowHalo = new THREE.InstancedMesh(new THREE.SphereGeometry(0.026, 10, 8), haloMat, this.N);
    this.flowCore.frustumCulled = this.flowHalo.frustumCulled = false;
    scene.add(this.flowCore, this.flowHalo);
    this.flowOffset = 0;
    this.flowSpeed = 0;

    // Wire-break spark at the junction box
    this.spark = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffa040, toneMapped: false }));
    this.spark.position.copy(plant.jbWorld);
    this.sparkLight = new THREE.PointLight(0xff7a2a, 0, 1.6, 2);
    this.sparkLight.position.copy(plant.jbWorld).add(new THREE.Vector3(0, 0, 0.12));
    scene.add(this.spark, this.sparkLight);

    const pos = plant.dynamic.surface.geometry.attributes.position;
    this.waveBase = Float32Array.from(pos.array);
    this.level = 0.5;
    this.levelTarget = 0.5;
    this.state = 'nominal';
  }

  setPartVisible(id, visible) {
    if (this.parts[id]) this.parts[id].object.visible = visible;
  }

  // ------------------------------------------------------------ live state

  applyReport(report) {
    const sim = report.simulation;
    const pass = report.load_check.status === 'pass';
    this.state = sim.state;
    if (sim.level_fraction !== null) this.levelTarget = sim.level_fraction;
    const ma = sim.loop_signal_ma;
    this.flowSpeed = sim.state === 'open_circuit' ? 0
      : sim.state === 'outside_load_envelope' ? 0.018
        : 0.012 + ma * 0.0048;
    const color = (FLOW[sim.state] || FLOW.nominal).color;
    this.flowCore.material.color.set(color);
    this.flowHalo.material.color.set(color);

    const v = report.inputs.supply_v;
    this.model.dynamic.psuPlate.draw([
      { text: 'POWER', y: 80, size: 22, weight: 700, color: '#d8dadb' },
      { text: `${v} V`, y: 150, size: 40, weight: 800 },
      { text: 'DC', y: 186, size: 24, weight: 600 },
      { text: 'DC OK ●', y: 300, size: 18, weight: 600 },
    ]);

    const L = this.model.dynamic.leds;
    L.psuLed.on(1);
    L.cpuRun.on(1);
    L.cpuErr.on(!pass || sim.state === 'open_circuit' ? 1 : 0);
    L.cpuMaint.on(0);
    L.smCh.forEach((l, i) => l.on(i === 0 && (sim.state === 'nominal' || sim.state === 'empty_tank') ? 1 : 0));
    this.blinkDiag = sim.state === 'open_circuit' || sim.state === 'outside_load_envelope';
    if (!this.blinkDiag) L.smDiag.on(0);

    const set = (...a) => this.setLabel(...a);
    const R = report.inputs.synthetic_additional_series_ohm;
    set('psu', 'G1 · Loop supply', `${v} V DC`, pass ? 'ok' : 'fail');
    set('jb', 'JB-03', sim.state === 'open_circuit' ? 'WIRE BREAK' : `+${R} Ω series (synthetic)`, sim.state === 'open_circuit' ? 'fail' : '');
    set('wika', 'WIKA LS-10', 'Reference · removed');
    this.report = report;
  }

  updateLive(sample) {
    if (!this.report) return;
    const state = sample.state;
    const bad = state === 'open_circuit' || state === 'outside_load_envelope';
    const ma = sample.ma === null ? 'suppressed' : `${sample.ma.toFixed(2)} mA`;
    const set = (...a) => this.setLabel(...a);
    set('probe', 'FMX11 · LT-301', ma, bad ? 'fail' : 'ok');
    set('tank', 'Tank T-03', `Level ${(sample.level * 100).toFixed(1)} % (physical)`);
    const count = state === 'open_circuit' ? 'DIAG · wire break'
      : sample.count === null ? 'Reading suppressed' : `AI0 = ${sample.count}`;
    set('sm1231', 'SM 1231 · AI0', count, bad ? 'fail' : 'ok');
  }

  tick(dt, t) {
    const D = this.model.dynamic;
    this.level += (this.levelTarget - this.level) * Math.min(1, dt * 0.8);
    const h = Math.max(0.001, this.level * (TANK.h - 0.06));
    D.water.scale.y = h;
    D.water.visible = D.surface.visible = this.level > 0.004;
    D.surface.position.y = TANK.y0 + 0.02 + h;
    const pos = D.surface.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = this.waveBase[i * 3];
      const y = this.waveBase[i * 3 + 1];
      pos.array[i * 3 + 2] = Math.sin(x * 9 + t * 1.7) * 0.0035 + Math.cos(y * 12 - t * 1.3) * 0.0028;
    }
    pos.needsUpdate = true;
    D.surface.geometry.computeVertexNormals();
    const absolute = TANK.y0 + 0.02 + h;
    D.glassWater.scale.y = Math.max(0.0005, Math.min(0.88, absolute - 0.24));

    // Loop current particles
    const flowing = this.flowSpeed > 0 && this.explode < 0.02;
    this.flowCore.visible = this.flowHalo.visible = flowing;
    if (flowing) {
      this.flowOffset = (this.flowOffset + dt * this.flowSpeed) % 1;
      const unstable = this.state === 'outside_load_envelope';
      const flicker = unstable ? (Math.random() > 0.5 ? 1 : 0.2) : 1;
      this.flowCore.material.opacity = 0.95 * flicker;
      this.flowHalo.material.opacity = 0.18 * flicker;
      for (let i = 0; i < this.N; i++) {
        const u = (i / this.N + this.flowOffset) % 1;
        const p = this.model.loopPath.getPointAt(u);
        if (unstable) p.addScalar((Math.random() - 0.5) * 0.006);
        this.tmp.makeTranslation(p.x, p.y, p.z);
        this.flowCore.setMatrixAt(i, this.tmp);
        this.flowHalo.setMatrixAt(i, this.tmp);
      }
      this.flowCore.instanceMatrix.needsUpdate = true;
      this.flowHalo.instanceMatrix.needsUpdate = true;
    }

    const open = this.state === 'open_circuit' && this.explode < 0.02;
    this.spark.visible = open && Math.random() > 0.35;
    this.spark.scale.setScalar(0.6 + Math.random() * 0.9);
    this.sparkLight.intensity = open ? (Math.random() > 0.6 ? 2 + Math.random() * 4 : 0.3) : 0;

    if (this.blinkDiag) this.model.dynamic.leds.smDiag.on(Math.sin(t * 8) > 0 ? 1 : 0.05);

  }
}
