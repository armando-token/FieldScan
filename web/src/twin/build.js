import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as T from './textures.js';

// World units are metres. Y is up. The probe and modules are drawn close to real size;
// the FMX11 probe is scaled ×1.3 so it stays readable inside a 1 200 L tank.

export const TANK = { x: -1.2, z: -0.2, w: 1.4, h: 1.1, d: 0.9, y0: 0.12 };
TANK.top = TANK.y0 + TANK.h;
export const CAB = { x: 1.55, y: 1.15, z: -1.22, w: 0.8, h: 1.0, d: 0.3 };
export const JB = { x: 0.25, y: 2.07, z: -1.25 };
const WALL_Z = -1.4;
const TRAY = { y: 2.05, z: -1.22 };
const PROBE = { x: TANK.x + 0.4, z: TANK.z + 0.15, bottom: TANK.y0 + 0.05 };
const GLAND_Y = TANK.top + 0.06;

export function mesh(geometry, material, opts = {}) {
  const m = new THREE.Mesh(geometry, material);
  if (opts.pos) m.position.set(...opts.pos);
  if (opts.rot) m.rotation.set(...opts.rot);
  if (opts.cat) m.userData.cat = opts.cat;
  m.castShadow = opts.cast ?? true;
  m.receiveShadow = opts.receive ?? true;
  return m;
}

export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export const cyl = (r, h, seg = 32, r2 = r) => new THREE.CylinderGeometry(r, r2, h, seg);

export function makeMaterials() {
  const tex = {
    brushed: T.brushedMetal(),
    checker: T.checkerPlate(),
    bulkhead: T.paintedSteel('#d3d6d0'),
    cabinet: T.paintedSteel('#d4d7d3'),
    duct: T.ductSlots(),
  };
  const std = (color, roughness, metalness, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
  return {
    stainless: new THREE.MeshPhysicalMaterial({
      color: 0xd6dbde, metalness: 0.92, roughness: 0.28, map: tex.brushed, clearcoat: 0.15,
    }),
    stainlessDark: std(0x9aa2a6, 0.38, 0.9),
    floor: std(0x878f94, 0.55, 0.75, { bumpMap: tex.checker, bumpScale: 1.6 }),
    bulkhead: std(0xffffff, 0.78, 0.15, { map: tex.bulkhead }),
    frame: std(0xbfc3bd, 0.7, 0.25),
    primer: std(0x7e3426, 0.8, 0.2),
    cabinet: std(0xffffff, 0.5, 0.25, { map: tex.cabinet }),
    plate: std(0xc4c9cc, 0.42, 0.8),
    din: std(0xe4e7ea, 0.22, 1),
    duct: std(0xffffff, 0.7, 0.05, { map: tex.duct }),
    ductLid: std(0xa7acae, 0.65, 0.05),
    siemens: std(0x2b3034, 0.55, 0.1),
    siemensTerm: std(0x3c4247, 0.6, 0.1),
    psu: std(0xd8dadb, 0.5, 0.15),
    white: std(0xf0f0ee, 0.5, 0.05),
    black: std(0x141618, 0.55, 0.05),
    termGrey: std(0x9ba2a6, 0.6, 0.05),
    termBlue: std(0x2f6db5, 0.6, 0.05),
    termRed: std(0xb3362c, 0.6, 0.05),
    termPE: std(0x4f9a3c, 0.6, 0.05),
    cable: std(0x1b1d1f, 0.55, 0.05),
    wireRed: std(0xb22222, 0.5, 0.05),
    wireBlue: std(0x1f4fa8, 0.5, 0.05),
    jb: std(0x8e979c, 0.55, 0.1),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.22, depthWrite: false,
    }),
    water: new THREE.MeshPhysicalMaterial({
      color: 0x1d6b9e, metalness: 0, roughness: 0.08, transparent: true, opacity: 0.62, depthWrite: false,
    }),
    waterSurface: new THREE.MeshPhysicalMaterial({
      color: 0x3a95c9, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.75, side: THREE.DoubleSide,
    }),
    ceramic: std(0xf1eee6, 0.35, 0.02),
    diaphragm: std(0xd9c27a, 0.3, 0.8),
    pcb: std(0x17663a, 0.55, 0.1),
    chip: std(0x111111, 0.4, 0.2),
    gold: std(0xd4af37, 0.3, 1),
    capPlastic: std(0x39434a, 0.5, 0.05),
    red: std(0xc0392b, 0.45, 0.1),
    crate: std(0x33505e, 0.6, 0.05),
    foam: std(0x252525, 0.95, 0),
    pipeBlue: std(0x2c63a8, 0.55, 0.3),
    pipeGreen: std(0x3c7a4a, 0.55, 0.3),
    lamp: std(0xffffff, 0.3, 0, { emissive: 0xfff2dc, emissiveIntensity: 2.2 }),
    ledOff: () => std(0x202020, 0.4, 0, { emissive: 0x000000 }),
  };
}

export function led(color) {
  const m = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: color, emissiveIntensity: 0, roughness: 0.3 });
  m.userData.keep = true;
  return { material: m, on: (v = 1) => { m.emissiveIntensity = v * 3; } };
}

export function tube(points, radius, material, opts = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, 'catmullrom', opts.tension ?? 0.2);
  const m = mesh(new THREE.TubeGeometry(curve, opts.segments ?? 200, radius, 10, false), material, opts);
  m.userData.curve = curve;
  return m;
}

// ---------------------------------------------------------------- room / hull

function buildRoom(M) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.PlaneGeometry(9, 7), M.floor, { rot: [-Math.PI / 2, 0, 0], pos: [0, 0, 0.6], cast: false }));
  g.add(mesh(new THREE.PlaneGeometry(9, 3.2), M.bulkhead, { pos: [0, 1.6, WALL_Z], cast: false }));
  const side = mesh(new THREE.PlaneGeometry(7, 3.2), M.bulkhead, { pos: [-3.4, 1.6, 0.6], rot: [0, Math.PI / 2, 0], cast: false });
  g.add(side);
  for (let x = -4.2; x <= 4.2; x += 0.7) {
    if (Math.abs(x - CAB.x) < 0.55 || Math.abs(x - JB.x) < 0.2) continue;
    g.add(mesh(box(0.06, 3.2, 0.14), M.frame, { pos: [x, 1.6, WALL_Z + 0.07] }));
  }
  for (let z = -0.7; z <= 3.5; z += 0.7) g.add(mesh(box(0.14, 3.2, 0.06), M.frame, { pos: [-3.33, 1.6, z] }));
  // Deck beams and fluorescent fixtures
  for (const z of [-0.9, 0.5]) {
    g.add(mesh(box(9, 0.2, 0.1), M.frame, { pos: [0, 2.95, z] }));
    for (const x of [-1.6, 1.2]) {
      g.add(mesh(box(1.25, 0.05, 0.14), M.white, { pos: [x, 2.82, z] }));
      g.add(mesh(box(1.18, 0.012, 0.09), M.lamp, { pos: [x, 2.794, z], cast: false }));
    }
  }
  // Service pipes along the bulkhead (ISO 14726 style colour bands)
  const pipe = (y, material) => {
    const p = mesh(cyl(0.045, 9, 24), material, { pos: [0, y, WALL_Z + 0.2], rot: [0, 0, Math.PI / 2] });
    g.add(p);
    for (let x = -4; x <= 4; x += 1.4) {
      if (Math.abs(x - CAB.x) < 0.5) continue;
      g.add(mesh(box(0.04, 0.03, 0.2), M.stainlessDark, { pos: [x, y - 0.06, WALL_Z + 0.1] }));
    }
  };
  pipe(0.42, M.pipeBlue);
  pipe(2.45, M.pipeGreen);
  g.traverse(o => { if (o.isMesh) o.userData.cat = 'structure'; });
  return g;
}

// ---------------------------------------------------------------- tank

function buildTank(M) {
  const g = new THREE.Group();
  g.position.set(TANK.x, 0, TANK.z);
  const cy = TANK.y0 + TANK.h / 2;
  g.add(mesh(new RoundedBoxGeometry(TANK.w, TANK.h, TANK.d, 5, 0.045), M.stainless, { pos: [0, cy, 0], cat: 'shell' }));
  // Stiffeners and weld seam
  for (const x of [-0.48, 0.3]) g.add(mesh(box(0.05, TANK.h - 0.12, 0.018), M.stainless, { pos: [x, cy, TANK.d / 2 + 0.009], cat: 'shell' }));
  g.add(mesh(box(TANK.w + 0.004, 0.012, TANK.d + 0.004), M.stainlessDark, { pos: [0, cy + 0.18, 0], cat: 'shell' }));
  for (const x of [-0.45, 0.45]) {
    g.add(mesh(box(0.1, TANK.y0, TANK.d + 0.14), M.primer, { pos: [x, TANK.y0 / 2, 0], cat: 'structure' }));
  }
  const plate = T.textPlate({ w: 512, h: 256, bg: '#e8ebec', fg: '#1b2226', border: '#1b2226' });
  plate.draw([
    { text: 'FRESH WATER', y: 70, size: 46, weight: 700 },
    { text: 'TANK T-03 · 1 200 L', y: 122, size: 34 },
    { text: 'LEVEL LOOP LT-301 · 4–20 mA', y: 168, size: 28, weight: 500 },
    { text: 'SYNTHETIC INSTALLATION DATA', y: 222, size: 22, weight: 700, color: '#a5561e' },
  ]);
  g.add(mesh(new THREE.PlaneGeometry(0.42, 0.21), new THREE.MeshStandardMaterial({ map: plate.texture, roughness: 0.55, metalness: 0.2 }),
    { pos: [-0.09, 0.86, TANK.d / 2 + 0.002], cat: 'shell', cast: false }));

  // Probe nozzle with cable gland
  const nozzle = [PROBE.x - TANK.x, TANK.top, PROBE.z - TANK.z];
  g.add(mesh(cyl(0.05, 0.04), M.stainless, { pos: [nozzle[0], nozzle[1] + 0.02, nozzle[2]], cat: 'shell' }));
  g.add(mesh(cyl(0.032, 0.035, 6), M.stainlessDark, { pos: [nozzle[0], nozzle[1] + 0.055, nozzle[2]], cat: 'shell' }));
  // Vent gooseneck, fill line, outlet valve
  const vx = -0.55;
  g.add(tube([[vx, TANK.top, -0.3], [vx, TANK.top + 0.3, -0.3], [vx, TANK.top + 0.42, -0.22], [vx, TANK.top + 0.36, -0.12]], 0.024, M.stainlessDark, { cat: 'shell', segments: 40 }));
  g.add(mesh(cyl(0.04, 2.95 - TANK.top), M.pipeBlue, { pos: [0.05, (2.95 + TANK.top) / 2, -0.3], cat: 'shell' }));
  g.add(mesh(cyl(0.065, 0.02), M.stainlessDark, { pos: [0.05, TANK.top + 0.01, -0.3], cat: 'shell' }));
  g.add(mesh(cyl(0.034, 0.2), M.stainlessDark, { pos: [-0.35, 0.3, TANK.d / 2 + 0.1], rot: [Math.PI / 2, 0, 0], cat: 'shell' }));
  g.add(mesh(new THREE.SphereGeometry(0.055, 24, 16), M.stainless, { pos: [-0.35, 0.3, TANK.d / 2 + 0.17], cat: 'shell' }));
  g.add(mesh(box(0.16, 0.018, 0.03), M.red, { pos: [-0.29, 0.37, TANK.d / 2 + 0.17], cat: 'shell' }));

  // Sight glass
  const sx = 0.6;
  const sz = TANK.d / 2 + 0.06;
  for (const y of [0.24, 1.12]) g.add(mesh(cyl(0.016, 0.07), M.stainlessDark, { pos: [sx, y, TANK.d / 2 + 0.03], rot: [Math.PI / 2, 0, 0], cat: 'shell' }));
  g.add(mesh(cyl(0.02, 0.9), M.glass, { pos: [sx, 0.68, sz], cat: 'shell', cast: false }));
  for (const dx of [-0.03, 0.03]) g.add(mesh(cyl(0.004, 0.9), M.stainlessDark, { pos: [sx + dx, 0.68, sz + 0.02], cat: 'shell' }));
  const glassGeo = cyl(0.014, 1, 16);
  glassGeo.translate(0, 0.5, 0);
  const glassWater = mesh(glassGeo, new THREE.MeshStandardMaterial({ color: 0x2d84bd, roughness: 0.1, transparent: true, opacity: 0.85 }),
    { pos: [sx, 0.24, sz], cat: 'fluid', cast: false });
  g.add(glassWater);

  // Water body and animated surface
  const innerW = TANK.w - 0.06;
  const innerD = TANK.d - 0.06;
  const waterGeo = box(innerW, 1, innerD);
  waterGeo.translate(0, 0.5, 0);
  const water = mesh(waterGeo, M.water, { pos: [0, TANK.y0 + 0.02, 0], cat: 'fluid', cast: false, receive: false });
  water.renderOrder = 2;
  const surface = mesh(new THREE.PlaneGeometry(innerW, innerD, 28, 18), M.waterSurface, { rot: [-Math.PI / 2, 0, 0], cat: 'fluid', cast: false });
  surface.renderOrder = 3;
  g.add(water, surface);
  return { group: g, water, surface, glassWater, innerHeight: TANK.h - 0.06, glassSpan: 0.88 };
}

function buildManhole(M) {
  const g = new THREE.Group();
  g.position.set(TANK.x - 0.25, TANK.top, TANK.z);
  g.add(mesh(cyl(0.25, 0.03, 48), M.stainless, { pos: [0, 0.015, 0] }));
  g.add(mesh(cyl(0.23, 0.025, 48), M.stainless, { pos: [0, 0.042, 0] }));
  const bolts = new THREE.InstancedMesh(cyl(0.012, 0.022, 6), M.stainlessDark, 12);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    m4.makeTranslation(Math.cos(a) * 0.205, 0.064, Math.sin(a) * 0.205);
    bolts.setMatrixAt(i, m4);
  }
  bolts.castShadow = true;
  g.add(bolts);
  g.add(mesh(new THREE.TorusGeometry(0.06, 0.009, 10, 24, Math.PI), M.stainlessDark, { pos: [0, 0.055, 0] }));
  return g;
}

// ---------------------------------------------------------------- FMX11 probe

function buildProbe(M) {
  const g = new THREE.Group();
  g.position.set(PROBE.x, 0, PROBE.z);
  const r = 0.028;
  const b = PROBE.bottom;
  const housing = new THREE.Group();
  housing.add(mesh(cyl(r, 0.17), M.stainless, { pos: [0, b + 0.045 + 0.085, 0] }));
  housing.add(mesh(cyl(0.012, 0.035, 24, r), M.stainless, { pos: [0, b + 0.215 + 0.0175, 0] }));
  for (const y of [b + 0.07, b + 0.19]) housing.add(mesh(new THREE.TorusGeometry(r, 0.0015, 6, 32), M.stainlessDark, { pos: [0, y, 0], rot: [Math.PI / 2, 0, 0] }));
  // In-tank cable with vent tube up to the gland
  const cableLen = GLAND_Y - (b + 0.25);
  housing.add(mesh(cyl(0.0075, cableLen, 12), M.cable, { pos: [0, b + 0.25 + cableLen / 2, 0], cat: 'signal' }));

  const cap = new THREE.Group();
  cap.position.y = b + 0.02;
  cap.add(mesh(cyl(r + 0.003, 0.04), M.capPlastic));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    cap.add(mesh(cyl(0.006, 0.012, 10), M.black, { pos: [Math.cos(a) * (r + 0.001), -0.004, Math.sin(a) * (r + 0.001)], rot: [0, -a, Math.PI / 2] }));
  }

  const cell = new THREE.Group();
  cell.position.y = b + 0.055;
  cell.add(mesh(cyl(0.022, 0.014), M.ceramic, { cat: 'internal' }));
  cell.add(mesh(cyl(0.019, 0.002), M.diaphragm, { pos: [0, -0.008, 0], cat: 'internal' }));

  const pcb = new THREE.Group();
  pcb.position.y = b + 0.13;
  pcb.add(mesh(box(0.032, 0.11, 0.003), M.pcb, { cat: 'internal' }));
  pcb.add(mesh(box(0.012, 0.012, 0.003), M.chip, { pos: [0, 0.02, 0.003], cat: 'internal' }));
  pcb.add(mesh(box(0.008, 0.006, 0.003), M.chip, { pos: [-0.006, -0.02, 0.003], cat: 'internal' }));
  pcb.add(mesh(box(0.004, 0.004, 0.004), M.gold, { pos: [0.009, -0.035, 0.003], cat: 'internal' }));

  g.add(housing, cap, cell, pcb);
  g.scale.setScalar(1);
  return { group: g, housing, cap, cell, pcb };
}

// ---------------------------------------------------------------- field cabling and junction box

function buildJunctionBox(M) {
  const g = new THREE.Group();
  g.position.set(JB.x, JB.y, JB.z);
  g.add(mesh(box(0.2, 0.2, 0.1), M.jb, { pos: [0, 0, -0.01] }));
  g.add(mesh(box(0.04, 0.04, 0.15), M.stainlessDark, { pos: [0, 0, -0.09] }));
  for (const x of [-0.105, 0.105]) g.add(mesh(cyl(0.016, 0.03, 16), M.black, { pos: [x, 0, 0.03], rot: [0, 0, Math.PI / 2] }));
  const strip = new THREE.Group();
  for (let i = 0; i < 4; i++) strip.add(mesh(box(0.012, 0.04, 0.03), i === 1 ? M.termBlue : M.termGrey, { pos: [-0.02 + i * 0.013, 0, 0.0], cat: 'internal' }));
  g.add(strip);
  const lid = new THREE.Group();
  lid.position.z = 0.05;
  lid.add(mesh(box(0.21, 0.21, 0.02), M.jb));
  for (const [x, y] of [[-0.085, -0.085], [0.085, -0.085], [-0.085, 0.085], [0.085, 0.085]]) {
    lid.add(mesh(cyl(0.007, 0.006, 12), M.stainlessDark, { pos: [x, y, 0.012], rot: [Math.PI / 2, 0, 0] }));
  }
  const tag = T.textPlate({ w: 256, h: 96, bg: '#f3d23a', fg: '#111' });
  tag.draw([{ text: 'JB-03', y: 60, size: 46, weight: 800, align: 'center' }]);
  lid.add(mesh(new THREE.PlaneGeometry(0.09, 0.034), new THREE.MeshStandardMaterial({ map: tag.texture, roughness: 0.6 }), { pos: [0, 0.05, 0.011], cast: false }));
  g.add(lid);
  return { group: g, lid, strip };
}

function buildTray(M) {
  const g = new THREE.Group();
  const seg = (x0, x1) => {
    const w = x1 - x0;
    const cx = (x0 + x1) / 2;
    g.add(mesh(box(w, 0.006, 0.13), M.stainlessDark, { pos: [cx, TRAY.y, TRAY.z] }));
    for (const dz of [-0.065, 0.065]) g.add(mesh(box(w, 0.04, 0.004), M.stainlessDark, { pos: [cx, TRAY.y + 0.02, TRAY.z + dz] }));
    for (let x = x0 + 0.2; x < x1; x += 0.6) g.add(mesh(box(0.03, 0.03, 0.2), M.stainlessDark, { pos: [x, TRAY.y - 0.02, WALL_Z + 0.1] }));
  };
  seg(-0.95, JB.x - 0.13);
  seg(JB.x + 0.13, CAB.x - 0.15);
  return g;
}

function fieldCablePoints(tbWorld) {
  const gx = PROBE.x;
  const gz = PROBE.z;
  const cy = TRAY.y + 0.02;
  const cz = TRAY.z;
  const cx = CAB.x - 0.25;
  const cabTop = CAB.y + CAB.h / 2;
  return [
    [gx, GLAND_Y, gz], [gx, GLAND_Y + 0.25, gz], [gx, 1.82, gz - 0.12], [gx, 1.98, gz - 0.55],
    [gx + 0.05, cy, cz + 0.12], [gx + 0.25, cy, cz], [JB.x - 0.3, cy, cz], [JB.x - 0.11, cy, cz],
    [JB.x, cy - 0.01, cz], [JB.x + 0.11, cy, cz], [JB.x + 0.4, cy, cz], [cx - 0.3, cy, cz],
    [cx - 0.04, cy - 0.02, cz], [cx, cy - 0.12, cz], [cx, cabTop + 0.12, CAB.z], [cx, cabTop, CAB.z],
    [cx, cabTop - 0.08, CAB.z - 0.05], [cx, CAB.y + 0.12, CAB.z - 0.06], [cx, CAB.y + 0.02, CAB.z - 0.06],
    [tbWorld.x - 0.04, tbWorld.y + 0.1, CAB.z - 0.07], [tbWorld.x, tbWorld.y + 0.035, CAB.z - 0.08],
  ];
}

// ---------------------------------------------------------------- control cabinet

function buildCabinet(M) {
  const g = new THREE.Group();
  g.position.set(CAB.x, CAB.y, CAB.z);
  const { w, h, d } = CAB;
  const t = 0.015;
  const shell = new THREE.Group();
  shell.add(mesh(box(w, h, t), M.cabinet, { pos: [0, 0, -d / 2 + t / 2] }));
  for (const s of [-1, 1]) shell.add(mesh(box(t, h, d), M.cabinet, { pos: [s * (w / 2 - t / 2), 0, 0] }));
  for (const s of [-1, 1]) shell.add(mesh(box(w, t, d), M.cabinet, { pos: [0, s * (h / 2 - t / 2), 0] }));
  shell.add(mesh(box(w - 0.06, h - 0.06, 0.004), M.plate, { pos: [0, 0, -d / 2 + t + 0.01] }));
  const plateFront = -d / 2 + t + 0.012;
  const railY = { upper: 0.27, lower: -0.2 };
  for (const y of Object.values(railY)) shell.add(mesh(box(w - 0.1, 0.035, 0.0075), M.din, { pos: [0, y, plateFront + 0.004] }));
  for (const y of [0.43, 0.05, -0.38]) {
    shell.add(mesh(box(w - 0.08, 0.06, 0.055), M.duct, { pos: [0, y, plateFront + 0.028] }));
    shell.add(mesh(box(w - 0.08, 0.064, 0.006), M.ductLid, { pos: [0, y, plateFront + 0.058] }));
  }
  shell.add(mesh(cyl(0.016, 0.03, 16), M.black, { pos: [-0.25, h / 2 + 0.012, 0] }));
  g.add(shell);

  const base = plateFront + 0.0075;
  const parts = {};
  let cursor = -0.33;
  const place = width => { const x = cursor + width / 2; cursor += width; return x; };

  // Breaker
  const breaker = new THREE.Group();
  breaker.position.set(place(0.036), railY.upper, base + 0.035);
  breaker.add(mesh(box(0.036, 0.09, 0.07), M.white, { cat: 'electronics' }));
  breaker.add(mesh(box(0.012, 0.022, 0.016), M.black, { pos: [0, 0.006, 0.042], cat: 'electronics' }));
  parts.breaker = breaker;
  cursor += 0.012;

  // Power supply with live voltage plate
  const psuPlate = T.textPlate({ w: 128, h: 320, bg: '#d8dadb', fg: '#20262a', accent: '#20262a' });
  const psu = new THREE.Group();
  psu.position.set(place(0.05), railY.upper, base + 0.055);
  const psuFront = new THREE.MeshStandardMaterial({ map: psuPlate.texture, roughness: 0.5 });
  psu.add(mesh(box(0.05, 0.125, 0.11), [M.psu, M.psu, M.psu, M.psu, psuFront, M.psu], { cat: 'electronics' }));
  const psuLed = led(0x3cff6e);
  psu.add(mesh(box(0.006, 0.004, 0.004), psuLed.material, { pos: [0.012, 0.045, 0.056], cast: false }));
  for (const y of [0.068, -0.068]) for (let i = 0; i < 3; i++) psu.add(mesh(box(0.012, 0.012, 0.02), M.siemensTerm, { pos: [-0.016 + i * 0.016, y, 0.03], cat: 'electronics' }));
  parts.psu = psu;
  cursor += 0.03;

  // SIMATIC CPU
  const cpuPlate = T.textPlate({ w: 440, h: 400, bg: '#2b3034', fg: '#e6e9ea' });
  cpuPlate.draw([
    { text: 'SIEMENS', y: 52, size: 40, weight: 800, color: '#00a5a5' },
    { text: 'SIMATIC S7-1200', y: 104, size: 32 },
    { text: 'CPU 1214C', y: 170, size: 46, weight: 700 },
    { text: 'DC/DC/DC', y: 214, size: 28, weight: 500 },
    { text: 'synthetic model', y: 370, size: 22, weight: 500, color: '#c49a3a' },
  ]);
  const cpu = new THREE.Group();
  cpu.position.set(place(0.11), railY.upper, base + 0.0375);
  const cpuFront = new THREE.MeshStandardMaterial({ map: cpuPlate.texture, roughness: 0.5 });
  cpu.add(mesh(box(0.11, 0.1, 0.075), [M.siemens, M.siemens, M.siemens, M.siemens, cpuFront, M.siemens], { cat: 'electronics' }));
  for (const y of [0.044, -0.044]) cpu.add(mesh(box(0.104, 0.014, 0.012), M.siemensTerm, { pos: [0, y, 0.035], cat: 'electronics' }));
  const cpuRun = led(0x3cff6e);
  const cpuErr = led(0xff3b30);
  const cpuMaint = led(0xffb000);
  [cpuRun, cpuErr, cpuMaint].forEach((l, i) => cpu.add(mesh(box(0.008, 0.004, 0.003), l.material, { pos: [-0.045, 0.018 - i * 0.009, 0.038], cast: false })));
  parts.cpu = cpu;
  cursor += 0.002;

  // SM 1231 analog input module
  const smPlate = T.textPlate({ w: 180, h: 400, bg: '#2b3034', fg: '#e6e9ea' });
  smPlate.draw([
    { text: 'SM 1231', y: 60, size: 34, weight: 700 },
    { text: 'AI 4×13 bit', y: 100, size: 24, weight: 500 },
    { text: '6ES7231-', y: 330, size: 21, weight: 500 },
    { text: '4HD32-0XB0', y: 358, size: 21, weight: 500 },
  ]);
  const sm = new THREE.Group();
  sm.position.set(place(0.045), railY.upper, base + 0.0375);
  const smFront = new THREE.MeshStandardMaterial({ map: smPlate.texture, roughness: 0.5 });
  sm.add(mesh(box(0.045, 0.1, 0.075), [M.siemens, M.siemens, M.siemens, M.siemens, smFront, M.siemens], { cat: 'electronics' }));
  for (const y of [0.044, -0.044]) sm.add(mesh(box(0.04, 0.014, 0.012), M.siemensTerm, { pos: [0, y, 0.035], cat: 'electronics' }));
  const smDiag = led(0xff3b30);
  const smCh = [0, 1, 2, 3].map(() => led(0x3cff6e));
  sm.add(mesh(box(0.007, 0.004, 0.003), smDiag.material, { pos: [-0.012, 0.02, 0.038], cast: false }));
  smCh.forEach((l, i) => sm.add(mesh(box(0.005, 0.003, 0.003), l.material, { pos: [0.004 + (i % 2) * 0.009, 0.02 - Math.floor(i / 2) * 0.007, 0.038], cast: false })));
  parts.sm1231 = sm;

  // Terminal blocks X1 on the lower rail
  const terminals = new THREE.Group();
  terminals.position.set(-0.04, railY.lower, base + 0.0225);
  const colors = [M.termGrey, M.termGrey, M.termBlue, M.termBlue, M.termRed, M.termGrey, M.termGrey, M.termGrey, M.termGrey, M.termPE];
  colors.forEach((m, i) => {
    terminals.add(mesh(box(0.0078, 0.055, 0.045), m, { pos: [i * 0.0082, 0, 0], cat: 'electronics' }));
    terminals.add(mesh(cyl(0.0022, 0.003, 8), M.stainlessDark, { pos: [i * 0.0082, 0.018, 0.0235], rot: [Math.PI / 2, 0, 0], cat: 'electronics' }));
  });
  terminals.add(mesh(box(0.012, 0.05, 0.04), M.termGrey, { pos: [-0.01, 0, 0] }));
  parts.terminals = terminals;

  // Door (hinged on the left, opened ~110°)
  const doorPlate = T.textPlate({ w: 384, h: 128, bg: '#f2f2f0', fg: '#111' });
  doorPlate.draw([
    { text: '+A1  LEVEL MONITORING', y: 56, size: 30, weight: 700 },
    { text: '24 V DC · T-03 / LT-301', y: 100, size: 24, weight: 500 },
  ]);
  const door = new THREE.Group();
  door.position.set(-w / 2, 0, d / 2);
  const doorPanel = new THREE.Group();
  doorPanel.position.x = w / 2;
  doorPanel.add(mesh(box(w, h, 0.018), M.cabinet, { pos: [0, 0, 0.009] }));
  doorPanel.add(mesh(box(0.025, 0.1, 0.03), M.black, { pos: [w / 2 - 0.05, 0, 0.033] }));
  doorPanel.add(mesh(new THREE.PlaneGeometry(0.24, 0.08), new THREE.MeshStandardMaterial({ map: doorPlate.texture, roughness: 0.6 }), { pos: [0, 0.38, 0.019], cast: false }));
  doorPanel.add(mesh(box(0.22, 0.3, 0.02), M.ductLid, { pos: [0, -0.1, -0.01] }));
  door.add(doorPanel);
  door.rotation.y = -1.92;
  parts.door = door;

  Object.values(parts).forEach(p => g.add(p));
  return {
    group: g, parts, psuPlate,
    leds: { psuLed, cpuRun, cpuErr, cpuMaint, smDiag, smCh },
    terminalWorld: () => terminals.localToWorld(new THREE.Vector3(0.0082, 0, 0.02)),
    smWorld: () => sm.localToWorld(new THREE.Vector3(0, -0.05, 0.03)),
    psuWorld: () => psu.localToWorld(new THREE.Vector3(0, -0.062, 0.03)),
  };
}

// ---------------------------------------------------------------- reference device (removed WIKA LS-10)

function buildSpares(M) {
  const g = new THREE.Group();
  g.position.set(-0.05, 0, 0.75);
  g.rotation.y = -0.35;
  g.add(mesh(box(0.5, 0.012, 0.32), M.crate, { pos: [0, 0.006, 0] }));
  for (const s of [-1, 1]) {
    g.add(mesh(box(0.5, 0.11, 0.012), M.crate, { pos: [0, 0.055, s * 0.154] }));
    g.add(mesh(box(0.012, 0.11, 0.32), M.crate, { pos: [s * 0.244, 0.055, 0] }));
  }
  g.add(mesh(box(0.47, 0.04, 0.29), M.foam, { pos: [0, 0.032, 0] }));
  const wika = new THREE.Group();
  wika.position.set(-0.06, 0.07, 0.02);
  wika.add(mesh(cyl(0.021, 0.17), M.stainless, { rot: [0, 0, Math.PI / 2] }));
  wika.add(mesh(cyl(0.023, 0.03), M.capPlastic, { pos: [-0.1, 0, 0], rot: [0, 0, Math.PI / 2] }));
  wika.add(mesh(new THREE.TorusGeometry(0.065, 0.006, 8, 40), M.cable, { pos: [0.14, -0.012, 0], rot: [Math.PI / 2, 0, 0] }));
  wika.add(mesh(new THREE.TorusGeometry(0.055, 0.006, 8, 40), M.cable, { pos: [0.14, -0.002, 0], rot: [Math.PI / 2, 0, 0] }));
  const tag = T.textPlate({ w: 384, h: 128, bg: '#fafafa', fg: '#222', border: '#c0392b' });
  tag.draw([
    { text: 'REFERENCE · REMOVED', y: 52, size: 28, weight: 800, color: '#c0392b' },
    { text: 'WIKA LS-10 · 4–20 mA', y: 98, size: 26, weight: 600 },
  ]);
  wika.add(mesh(new THREE.PlaneGeometry(0.15, 0.05), new THREE.MeshStandardMaterial({ map: tag.texture, roughness: 0.7 }), { pos: [0.02, 0.025, 0.06], rot: [-Math.PI / 2, 0, 0], cast: false }));
  g.add(wika);
  return { group: g, wika };
}

// ---------------------------------------------------------------- assembly

export function buildPlant() {
  const M = makeMaterials();
  const room = buildRoom(M);
  const tank = buildTank(M);
  const manhole = buildManhole(M);
  const probe = buildProbe(M);
  const jb = buildJunctionBox(M);
  const tray = buildTray(M);
  const cabinet = buildCabinet(M);
  const spares = buildSpares(M);

  const root = new THREE.Group();
  root.add(room, tank.group, manhole, probe.group, jb.group, tray, cabinet.group, spares.group);
  root.updateMatrixWorld(true);

  const tb = cabinet.terminalWorld();
  const field = tube(fieldCablePoints(tb), 0.0085, M.cable, { cat: 'signal', segments: 500, tension: 0.1 });
  const sm = cabinet.smWorld();
  const psuOut = cabinet.psuWorld();
  const wireSig = tube([[tb.x + 0.0082, tb.y + 0.03, tb.z], [tb.x + 0.01, tb.y + 0.12, tb.z + 0.01], [sm.x, sm.y - 0.12, sm.z + 0.012], [sm.x, sm.y, sm.z]], 0.0025, M.wireRed, { cat: 'signal', segments: 60 });
  const wireRet = tube([[tb.x + 0.0164, tb.y + 0.03, tb.z], [tb.x + 0.02, tb.y + 0.12, tb.z + 0.012], [sm.x + 0.008, sm.y - 0.12, sm.z + 0.014], [sm.x + 0.008, sm.y, sm.z]], 0.0025, M.wireBlue, { cat: 'signal', segments: 60 });
  const wirePsu = tube([[psuOut.x, psuOut.y, psuOut.z], [psuOut.x, psuOut.y - 0.12, psuOut.z + 0.01], [tb.x - 0.01, tb.y + 0.12, tb.z + 0.012], [tb.x + 0.008, tb.y + 0.03, tb.z]], 0.0025, M.wireRed, { cat: 'signal', segments: 60 });
  const cabling = new THREE.Group();
  cabling.add(field, wireSig, wireRet, wirePsu);
  root.add(cabling);

  // Path followed by the animated loop-current particles: probe → field cable → PLC input.
  const loopPath = new THREE.CurvePath();
  loopPath.add(new THREE.LineCurve3(new THREE.Vector3(PROBE.x, PROBE.bottom + 0.25, PROBE.z), new THREE.Vector3(PROBE.x, GLAND_Y, PROBE.z)));
  loopPath.add(field.userData.curve);
  loopPath.add(wireSig.userData.curve);

  const P = {
    tank: {
      object: tank.group, name: 'Freshwater tank T-03', role: 'Stainless storage tank · 1 200 L', cat: 'shell', color: '#5fd4d0',
      explode: [-0.45, 0, 0.1],
      specs: [['Capacity', '1 200 L', 'synthetic'], ['Level loop', 'LT-301 · 4–20 mA', 'synthetic'], ['Material', 'To confirm', 'pending']],
    },
    manhole: { object: manhole, parent: 'tank', name: 'Manhole cover', role: 'Bolted inspection cover · 12 × M12', cat: 'shell', color: '#5fd4d0', explode: [0, 0.75, 0], specs: [['Fasteners', '12 bolts', 'synthetic']] },
    probe: {
      object: probe.group, name: 'Waterpilot FMX11 (candidate)', role: 'Endress+Hauser hydrostatic level probe · 2-wire 4–20 mA', cat: 'shell', color: '#ffd166',
      explode: [0.35, 0.35, 1.05],
      specs: [
        ['Output', '4–20 mA, 2-wire', 'oem', 'EH-TI01524P'],
        ['Min. terminal voltage', '8 V', 'oem', 'EH-TI01524P'],
        ['Design current', '22 mA', 'oem', 'EH-TI01524P'],
        ['Max. load', '(V − 8 V) / 0.022 A', 'oem', 'EH-TI01524P'],
        ['Order code / range', 'Not confirmed', 'pending'],
      ],
    },
    'probe-cap': { object: probe.cap, parent: 'probe', name: 'Protective cap', role: 'Removable inlet cap', cat: 'shell', color: '#ffd166', explode: [0, -0.16, 0], specs: [['Material', 'To confirm', 'pending']] },
    'probe-cell': { object: probe.cell, parent: 'probe', name: 'Ceramic measuring cell', role: 'Hydrostatic pressure sensor + diaphragm', cat: 'internal', color: '#ffd166', explode: [0.08, -0.08, 0], specs: [['Principle', 'Hydrostatic pressure', 'oem', 'EH-TI01524P'], ['Range', 'Not confirmed', 'pending']] },
    'probe-pcb': { object: probe.pcb, parent: 'probe', name: 'Signal electronics', role: 'Converts pressure to a 4–20 mA loop current', cat: 'internal', color: '#ffd166', explode: [-0.09, 0.04, 0], specs: [['Loop current', 'live', 'live']] },
    jb: { object: jb.group, name: 'Junction box JB-03', role: 'Field junction · terminal strip', cat: 'electronics', color: '#ffb347', explode: [0, 0, 0.3], specs: [['Additional series load', 'live', 'synthetic']] },
    'jb-lid': { object: jb.lid, parent: 'jb', name: 'JB-03 lid', role: '4-screw cover', cat: 'electronics', color: '#ffb347', explode: [0, 0, 0.22], specs: [] },
    tray: { object: tray, name: 'Cable tray', role: 'Perforated tray along the bulkhead', cat: 'structure', color: '#8ea2a9', explode: [0, 0.3, 0], specs: [] },
    cabinet: { object: cabinet.group, name: 'Control cabinet +A1', role: 'Level monitoring enclosure', cat: 'shell', color: '#5fd4d0', explode: [0.35, 0, 0], specs: [['Enclosure', '800 × 1000 × 300 mm', 'synthetic']] },
    door: { object: cabinet.parts.door, parent: 'cabinet', name: 'Cabinet door', role: 'Hinged door with drawing pocket', cat: 'shell', color: '#5fd4d0', explode: [-0.4, 0, 0.35], specs: [] },
    breaker: { object: cabinet.parts.breaker, parent: 'cabinet', name: 'Circuit breaker F1', role: 'Loop supply protection', cat: 'electronics', color: '#ffb347', explode: [-0.05, 0.08, 0.3], specs: [['Rating', 'To confirm', 'pending']] },
    psu: { object: cabinet.parts.psu, parent: 'cabinet', name: 'Loop power supply G1', role: 'DIN-rail DC supply for the 4–20 mA loop', cat: 'electronics', color: '#ffb347', explode: [-0.02, 0.1, 0.4], specs: [['Output', 'live', 'synthetic']] },
    cpu: { object: cabinet.parts.cpu, parent: 'cabinet', name: 'SIMATIC S7-1200 CPU', role: 'PLC controller (model not in evidence)', cat: 'electronics', color: '#ffb347', explode: [0, 0.12, 0.5], specs: [['Model', 'CPU 1214C (synthetic)', 'synthetic']] },
    sm1231: {
      object: cabinet.parts.sm1231, parent: 'cabinet', name: 'SM 1231 AI · 6ES7231-4HD32-0XB0', role: 'Analog input module · channel AI0 in 4–20 mA mode', cat: 'electronics', color: '#ffb347',
      explode: [0.1, 0.12, 0.62],
      specs: [
        ['Mode', '4–20 mA', 'oem', 'SIEMENS-SM1231'],
        ['Input impedance', '≥ 270 Ω, < 290 Ω', 'oem', 'SIEMENS-SM1231'],
        ['Evaluated bound', '290 Ω', 'oem', 'SIEMENS-SM1231'],
        ['Nominal range', '0 – 27 648', 'oem', 'SIEMENS-SM1231'],
        ['Wire-break diagnostic', 'Qualitative', 'oem', 'SIEMENS-SM1231'],
      ],
    },
    terminals: { object: cabinet.parts.terminals, parent: 'cabinet', name: 'Terminal blocks X1', role: 'Field-to-PLC marshalling', cat: 'electronics', color: '#ffb347', explode: [0, -0.12, 0.35], specs: [] },
    cabling: { object: cabling, name: 'Loop cabling', role: 'Shielded 2-core field cable + internal wiring', cat: 'signal', color: '#6fe3a1', explode: [0, 0, 0], specs: [['Resistance', 'Included in synthetic load', 'synthetic']] },
    wika: {
      object: spares.group, name: 'WIKA LS-10 (reference, removed)', role: 'Original level transmitter being replaced', cat: 'shell', color: '#c9d1d4',
      explode: [0, 0.45, 0.2],
      specs: [['Output', '4–20 mA', 'oem', 'WIKA-LS10'], ['Installed variant', 'Not confirmed', 'pending']],
    },
  };

  // Default category for meshes without one. Children first so sub-parts keep their own category.
  for (const def of Object.values(P).reverse()) {
    def.object.traverse(o => { if (o.isMesh && !o.userData.cat) o.userData.cat = def.cat; });
  }

  return {
    root, room, parts: P, loopPath,
    dynamic: {
      water: tank.water, surface: tank.surface, glassWater: tank.glassWater, innerHeight: tank.innerHeight, glassSpan: tank.glassSpan,
      psuPlate: cabinet.psuPlate, leds: cabinet.leds, jbStrip: jb.strip,
    },
    anchors: {
      tank: new THREE.Vector3(0, TANK.top + 0.12, 0),
      probe: new THREE.Vector3(0, PROBE.bottom + 0.3, 0),
      jb: new THREE.Vector3(0, 0.13, 0),
      psu: new THREE.Vector3(0, 0.08, 0.05),
      sm1231: new THREE.Vector3(0, 0.07, 0.04),
      wika: new THREE.Vector3(0, 0.14, 0),
    },
    jbWorld: new THREE.Vector3(JB.x, JB.y, JB.z + 0.02),
  };
}
