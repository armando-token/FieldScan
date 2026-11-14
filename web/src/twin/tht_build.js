import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as T from './textures.js';
import { mesh, box, cyl, makeMaterials, led, tube } from './build.js';

// Engine-room bulkhead with the TZ THT-02 RS-485 sensor (BOAT-ER-TH-02).
// Probe geometry follows the FieldScan THT02_spec zones, in millimetres from the
// strainer tip: head 0–32, seal 32–38, DIP barrel 38–68, flange 68–88 (seam at 78),
// RS-485 barrel 88–122, gland 122–140. Ø16 body. The probe hangs strainer-down.

const mm = v => v / 1000;
export const PROBE = { x: -0.03, y0: 1.282, z: 0.031 };
export const JBX = { x: 0.3, y: 1.66, z: 0.0 };
export const GW = { x: 0.64, y: 1.43, z: 0.0 };

function lathe(profile, material, opts = {}) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(mm(r), mm(y)));
  return mesh(new THREE.LatheGeometry(pts, opts.segments ?? 72), material, opts);
}

function canvasTex(w, h, paint, { repeat = [1, 1], srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// White = solid metal, black = slot. Used as an alpha cut-out for the strainer.
function slotMask() {
  return canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#fff';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#000';
    const cols = 16;
    for (let row = 0; row < 5; row++) {
      for (let c = 0; c < cols; c++) {
        const x = (c + (row % 2) * 0.5) * (w / cols) + 6;
        const y = 22 + row * 46;
        g.beginPath();
        g.roundRect(x, y, w / cols - 14, 26, 10);
        g.fill();
      }
    }
  }, { srgb: false });
}

function pcbTexture(kind) {
  return canvasTex(256, 512, (g, w, h) => {
    g.fillStyle = '#1d6b3f';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(215,190,90,0.55)';
    g.lineWidth = 5;
    for (let i = 0; i < 9; i++) {
      g.beginPath();
      g.moveTo(20 + i * 24, h);
      g.lineTo(20 + i * 24, h * 0.62 - i * 6);
      g.lineTo(w * 0.5, h * 0.4 - i * 12);
      g.stroke();
    }
    g.fillStyle = '#e8e2c8';
    g.font = '600 26px Helvetica, Arial';
    g.fillText(kind === 'dip' ? 'THT-02 ADDR' : 'RS485 · LDO', 20, 40);
    g.fillText('SW1', 30, 120);
    g.fillStyle = '#c9a646';
    for (let i = 0; i < 6; i++) g.fillRect(28 + i * 36, h - 34, 20, 20);
  });
}

function bulkheadTexture() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#c9cec6';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`;
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    // Weld seams and some rust bloom at the bottom
    g.strokeStyle = 'rgba(80,80,70,0.35)';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(0, h * 0.33);
    g.lineTo(w, h * 0.33);
    g.stroke();
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(120,60,30,${Math.random() * 0.12})`;
      g.beginPath();
      g.arc(Math.random() * w, h - Math.random() * 60, 3 + Math.random() * 10, 0, Math.PI * 2);
      g.fill();
    }
  }, { repeat: [3, 2] });
}

// ---------------------------------------------------------------- probe

function buildProbe(M, X) {
  const group = new THREE.Group();
  group.position.set(PROBE.x, PROBE.y0, PROBE.z);

  // Head: strainer, seal ring, DIP barrel shell and the lower flange half. Unscrews at the seam.
  const head = new THREE.Group();
  const strainer = mesh(new THREE.CylinderGeometry(mm(8), mm(8), mm(28), 72, 1, true), X.strainer, { pos: [0, mm(16), 0] });
  const cap = lathe([[0, 0], [6.8, 0], [7.8, 0.6], [8, 1.6], [8, 2], [0, 2]], M.stainless);
  const ring = lathe([[0, 30], [8, 30], [8, 32], [0, 32]], M.stainless);
  const mesh2 = mesh(new THREE.CylinderGeometry(mm(6.6), mm(6.6), mm(27), 48, 1, true), X.membrane, { pos: [0, mm(16), 0], cast: false });
  const seal = lathe([[7.6, 32], [8.05, 32.4], [8.25, 35], [8.05, 37.6], [7.6, 38]], X.rubber);
  const barrel = lathe([[0, 37.8], [7.6, 37.8], [8, 38.4], [8, 67.4], [8.4, 68], [9, 68.6], [9, 77.6], [8.6, 78], [7.4, 78], [7.4, 38.2], [0, 38.2]], X.barrel);
  head.add(strainer, cap, ring, mesh2, seal, barrel);
  for (const y of [52, 53]) head.add(lathe([[8.01, y], [8.06, y + 0.2], [8.01, y + 0.4]], M.stainlessDark, { cast: false }));
  // SHT30 humidity/temperature element inside the strainer
  const sht = new THREE.Group();
  sht.add(mesh(box(mm(7), mm(14), mm(1)), X.pcbDip, { pos: [0, mm(12), 0], cat: 'internal' }));
  sht.add(mesh(box(mm(2.5), mm(2.5), mm(0.9)), M.chip, { pos: [0, mm(7), mm(0.9)], cat: 'internal' }));
  sht.add(mesh(box(mm(2.6), mm(1), mm(0.2)), M.white, { pos: [0, mm(7), mm(1.4)], cat: 'internal' }));
  head.add(sht);

  // Body: upper flange half with bracket, threaded stub and the RS-485 barrel. Stays on the bulkhead.
  const body = new THREE.Group();
  const stub = lathe([[0, 70], [7.2, 70], [7.2, 78.2], [0, 78.2]], M.stainlessDark);
  body.add(stub);
  for (let y = 70.6; y < 78; y += 0.9) body.add(lathe([[7.15, y], [7.55, y + 0.35], [7.15, y + 0.7]], M.stainless, { cast: false, segments: 48 }));
  body.add(lathe([[7.4, 78], [8.6, 78], [9, 78.4], [9, 87.4], [8.6, 88], [8, 88.4], [8, 121.4], [7.6, 122], [0, 122], [0, 78]], X.barrel));
  body.add(lathe([[8.6, 77.95], [9.02, 78.1], [9.02, 78.4], [8.6, 78.2]], M.black, { cast: false }));
  // Bracket 42 × 20 mm, Ø4.2 holes at 32 mm spacing, welded to the flange.
  const bracket = mesh(new RoundedBoxGeometry(mm(42), mm(20), mm(2), 2, mm(1.2)), M.stainless, { pos: [0, mm(80), mm(-17)] });
  body.add(bracket, mesh(box(mm(8), mm(14), mm(9)), M.stainless, { pos: [0, mm(80), mm(-11.5)] }));
  for (const sx of [-16, 16]) {
    body.add(mesh(cyl(mm(3.6), mm(2.2), 24), M.stainlessDark, { pos: [mm(sx), mm(80), mm(-15.4)], rot: [Math.PI / 2, 0, 0] }));
    const slot = mesh(box(mm(4.4), mm(0.7), mm(0.6)), M.black, { pos: [mm(sx), mm(80), mm(-14.2)], rot: [0, 0, sx > 0 ? 0.5 : -0.3], cast: false });
    body.add(slot);
  }
  body.add(mesh(box(mm(10), mm(4), mm(0.05)), X.laser, { pos: [0, mm(104), mm(8.02)], cast: false }));

  // Gland (nut + dome) that slides up the cable once unscrewed.
  const gland = new THREE.Group();
  gland.add(mesh(cyl(mm(8.6), mm(7), 6), X.nickel, { pos: [0, mm(126), 0] }));
  gland.add(lathe([[0, 129.4], [7.75, 129.4], [7.75, 131], [6.6, 135], [4.2, 138.6], [3.2, 140], [0, 140]], X.rubber));
  gland.add(lathe([[2.7, 139.5], [2.7, 141], [0, 141]], X.rubber, { cast: false }));

  // DIP-8 address PCB (fixed to the body; exposed when the head is unscrewed).
  const dip = new THREE.Group();
  const dipPcb = mesh(box(mm(11), mm(36), mm(1.2)), X.pcbDip, { pos: [0, mm(56), 0] });
  dip.add(dipPcb);
  const block = mesh(box(mm(6), mm(21.5), mm(3)), X.dipBody, { pos: [0, mm(55), mm(2.1)] });
  dip.add(block);
  dip.add(mesh(box(mm(3), mm(1.6), mm(0.1)), X.onMark, { pos: [mm(-1.4), mm(66.6), mm(3.62)], cast: false }));
  const sliders = [];
  for (let i = 0; i < 8; i++) {
    const y = mm(64 - i * 2.54 - 0.4);
    dip.add(mesh(box(mm(4.2), mm(1.3), mm(0.2)), M.black, { pos: [0, y, mm(3.62)], cast: false }));
    const knob = mesh(box(mm(1.6), mm(1.15), mm(1)), X.slider, { pos: [mm(1.1), y, mm(3.9)] });
    knob.userData.dip = i;
    sliders.push(knob);
    dip.add(knob);
  }
  dip.add(mesh(box(mm(1.2), mm(1.2), mm(0.2)), M.gold, { pos: [mm(-4.2), mm(40), mm(0.65)], cast: false }));

  // RS-485 transceiver + regulator PCB in the lower barrel, with the four lead colours.
  const rs = new THREE.Group();
  rs.add(mesh(box(mm(11), mm(30), mm(1.2)), X.pcbRs, { pos: [0, mm(105), 0] }));
  rs.add(mesh(box(mm(4), mm(5), mm(1.5)), M.chip, { pos: [mm(-1.5), mm(108), mm(1.3)] }));
  rs.add(mesh(box(mm(3.5), mm(4), mm(1.6)), M.chip, { pos: [mm(2), mm(98), mm(1.3)] }));
  rs.add(mesh(box(mm(1.6), mm(0.9), mm(0.9)), M.ceramic, { pos: [mm(2.5), mm(110), mm(1)] }));
  const wireColors = [X.wireRed, X.wireBlack, X.wireYellow, X.wireGreen];
  wireColors.forEach((m, i) => {
    const x = mm(-3 + i * 2);
    rs.add(tube([[x, mm(118), mm(0.7)], [x * 0.6, mm(124), mm(0.5)], [x * 0.3, mm(136), 0], [x * 0.2, mm(146), 0]], mm(0.55), m, { segments: 24, cat: 'signal' }));
  });

  group.add(head, body, gland, dip, rs);
  return { group, head, body, gland, dip, rs, sht, sliders };
}

// ---------------------------------------------------------------- surroundings

function buildRoom(M, X) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.PlaneGeometry(4.2, 2.6), X.bulkhead, { pos: [0.2, 1.4, 0], cast: false }));
  g.add(mesh(new THREE.PlaneGeometry(4.2, 2.6), M.floor, { rot: [-Math.PI / 2, 0, 0], pos: [0.2, 0.1, 1.3], cast: false }));
  // Vertical stiffeners (bulb flats) and a deck longitudinal
  for (const x of [-0.75, 1.15]) {
    g.add(mesh(box(0.012, 2.6, 0.14), X.frame, { pos: [x, 1.4, 0.07] }));
    g.add(mesh(cyl(0.016, 2.6, 16), X.frame, { pos: [x, 1.4, 0.14] }));
  }
  g.add(mesh(box(4.2, 0.012, 0.16), X.frame, { pos: [0.2, 2.42, 0.08] }));
  const stencil = T.textPlate({ w: 256, h: 128, bg: '#c9cec6', fg: '#3b3f3a' });
  stencil.draw([{ text: 'FR 42', y: 88, size: 72, weight: 800, align: 'center' }]);
  g.add(mesh(new THREE.PlaneGeometry(0.2, 0.1), new THREE.MeshStandardMaterial({ map: stencil.texture, roughness: 0.8 }), { pos: [-0.42, 2.12, 0.002], cast: false }));
  const warn = T.textPlate({ w: 512, h: 160, bg: '#f2c230', fg: '#111' });
  warn.draw([{ text: 'SWITCHBOARD VENT · SENSOR ZONE', y: 70, size: 34, weight: 800, align: 'center' }, { text: 'Do not paint over sensors', y: 125, size: 28, weight: 600, align: 'center' }]);
  g.add(mesh(new THREE.PlaneGeometry(0.26, 0.08), new THREE.MeshStandardMaterial({ map: warn.texture, roughness: 0.6 }), { pos: [0.3, 2.0, 0.002], cast: false }));
  // Cable tray with bundled cables
  const tray = new THREE.Group();
  tray.add(mesh(box(3.6, 0.006, 0.22), M.stainlessDark, { pos: [0.2, 1.9, 0.18] }));
  for (const z of [0.07, 0.29]) tray.add(mesh(box(3.6, 0.05, 0.006), M.stainlessDark, { pos: [0.2, 1.925, z] }));
  for (let x = -1.4; x < 1.8; x += 0.6) tray.add(mesh(box(0.02, 0.1, 0.24), M.stainlessDark, { pos: [x, 1.95, 0.18] }));
  [[0.11, 0.012, M.cable], [0.14, 0.009, X.greyCable], [0.17, 0.014, M.cable], [0.205, 0.008, X.orangeCable], [0.24, 0.011, M.cable]].forEach(([z, r, m]) =>
    tray.add(mesh(cyl(r, 3.6, 16), m, { pos: [0.2, 1.906 + r, z], rot: [0, 0, Math.PI / 2] })));
  g.add(tray);
  // Pipes near the deck
  for (const [y, m] of [[0.55, M.pipeBlue], [0.75, X.pipeGrey]]) {
    g.add(mesh(cyl(0.04, 4.2, 28), m, { pos: [0.2, y, 0.16], rot: [0, 0, Math.PI / 2] }));
  }
  // Fluorescent fixture
  g.add(mesh(box(1.2, 0.05, 0.14), M.white, { pos: [0.2, 2.55, 0.6] }));
  g.add(mesh(box(1.12, 0.012, 0.09), M.lamp, { pos: [0.2, 2.524, 0.6], cast: false }));
  g.traverse(o => { if (o.isMesh) o.userData.cat = 'structure'; });
  return g;
}

function buildPlate(M, plateLines) {
  const g = new THREE.Group();
  g.position.set(PROBE.x + 0.035, 1.355, 0);
  g.add(mesh(new RoundedBoxGeometry(0.17, 0.2, 0.006, 2, 0.004), M.stainless, { pos: [0, 0, 0.003] }));
  for (const [x, y] of [[-0.075, 0.09], [0.075, 0.09], [-0.075, -0.09], [0.075, -0.09]]) {
    g.add(mesh(cyl(0.004, 0.004, 16), M.stainlessDark, { pos: [x, y, 0.007], rot: [Math.PI / 2, 0, 0] }));
  }
  const plate = T.textPlate({ w: 512, h: 360, bg: '#e9ebe6', fg: '#1b1d1f', border: '#2b2f31' });
  const lines = plateLines.map((text, i) => ({
    text, y: 60 + i * 52, size: i === 0 ? 44 : i === plateLines.length - 1 ? 22 : 26,
    weight: i === 0 ? 800 : 600, x: 30, color: i === plateLines.length - 1 ? '#a3261b' : undefined,
  }));
  plate.draw(lines);
  const face = mesh(new THREE.PlaneGeometry(0.075, 0.053), new THREE.MeshStandardMaterial({ map: plate.texture, roughness: 0.45, metalness: 0.3 }), { pos: [0.04, -0.035, 0.0064], cast: false });
  g.add(face);
  for (const [x, y] of [[0.006, -0.009], [0.074, -0.009], [0.006, -0.061], [0.074, -0.061]]) {
    g.add(mesh(cyl(0.0015, 0.001, 12), M.stainlessDark, { pos: [x, y, 0.0068], rot: [Math.PI / 2, 0, 0], cast: false }));
  }
  const tag = T.textPlate({ w: 512, h: 96, bg: '#1d3e66', fg: '#ffffff' });
  tag.draw([{ text: 'BOAT-ER-TH-02', y: 64, size: 50, weight: 800, align: 'center' }]);
  g.add(mesh(new THREE.PlaneGeometry(0.075, 0.014), new THREE.MeshStandardMaterial({ map: tag.texture, roughness: 0.5 }), { pos: [0.04, 0.03, 0.0064], cast: false }));
  return { group: g, faceWorld: new THREE.Vector3(PROBE.x + 0.075, 1.32, 0.03) };
}

function buildJunction(M, X) {
  const g = new THREE.Group();
  g.position.set(JBX.x, JBX.y, JBX.z);
  const body = mesh(new RoundedBoxGeometry(0.16, 0.12, 0.06, 3, 0.006), X.polyGrey, { pos: [0, 0, 0.03] });
  g.add(body);
  const lid = new THREE.Group();
  lid.position.set(0, 0, 0.061);
  lid.add(mesh(new RoundedBoxGeometry(0.162, 0.122, 0.012, 3, 0.005), X.polyGrey));
  for (const [x, y] of [[-0.07, 0.05], [0.07, 0.05], [-0.07, -0.05], [0.07, -0.05]]) lid.add(mesh(cyl(0.004, 0.003, 16), M.stainlessDark, { pos: [x, y, 0.007], rot: [Math.PI / 2, 0, 0] }));
  const label = T.textPlate({ w: 512, h: 128, bg: '#f4f4f0', fg: '#111' });
  label.draw([{ text: 'JB-ER-07', y: 62, size: 56, weight: 800, align: 'center' }, { text: 'RS-485 SEG B', y: 110, size: 30, weight: 600, align: 'center' }]);
  lid.add(mesh(new THREE.PlaneGeometry(0.08, 0.02), new THREE.MeshStandardMaterial({ map: label.texture, roughness: 0.6 }), { pos: [0, 0.025, 0.0062], cast: false }));
  g.add(lid);
  // DIN terminal strip inside
  const strip = new THREE.Group();
  const colors = [M.termRed, M.black, X.termYellow, X.termGreen, M.termGrey, M.termGrey];
  colors.forEach((m, i) => strip.add(mesh(box(0.0062, 0.04, 0.03), m, { pos: [-0.018 + i * 0.0068, 0, 0.022] })));
  strip.add(mesh(box(0.11, 0.035, 0.0075), M.din, { pos: [0, 0, 0.004] }));
  g.add(strip);
  for (const x of [-0.04, 0.0, 0.04]) g.add(mesh(cyl(0.007, 0.016, 6), X.polyDark, { pos: [x, -0.067, 0.03] }));
  g.add(mesh(cyl(0.007, 0.016, 6), X.polyDark, { pos: [0.087, -0.02, 0.03], rot: [0, 0, Math.PI / 2] }));
  return { group: g, lid, cableIn: new THREE.Vector3(JBX.x - 0.04, JBX.y - 0.075, 0.03), trunkOut: new THREE.Vector3(JBX.x + 0.095, JBX.y - 0.02, 0.03) };
}

function buildGateway(M, X) {
  const g = new THREE.Group();
  g.position.set(GW.x, GW.y, GW.z);
  g.add(mesh(new RoundedBoxGeometry(0.2, 0.17, 0.012, 2, 0.004), M.cabinet, { pos: [0, 0, 0.006] }));
  g.add(mesh(box(0.18, 0.035, 0.0075), M.din, { pos: [0, -0.01, 0.016] }));
  const housing = mesh(new RoundedBoxGeometry(0.106, 0.09, 0.058, 3, 0.004), X.polyLight, { pos: [0, -0.01, 0.048] });
  g.add(housing);
  const lcd = T.textPlate({ w: 512, h: 256, bg: '#0b1e14', fg: '#7dffb0' });
  const screen = mesh(new THREE.PlaneGeometry(0.062, 0.031), new THREE.MeshBasicMaterial({ map: lcd.texture, toneMapped: false }), { pos: [-0.012, 0.004, 0.0775], cast: false });
  screen.material.userData.keep = true;
  g.add(mesh(box(0.068, 0.037, 0.002), M.black, { pos: [-0.012, 0.004, 0.0767], cast: false }), screen);
  const brand = T.textPlate({ w: 512, h: 80, bg: '#d9dcdf', fg: '#2a2e31' });
  brand.draw([{ text: 'MODBUS MASTER · SYNTHETIC', y: 54, size: 36, weight: 800, align: 'center' }]);
  g.add(mesh(new THREE.PlaneGeometry(0.09, 0.014), new THREE.MeshStandardMaterial({ map: brand.texture, roughness: 0.6 }), { pos: [0, -0.04, 0.0772], cast: false }));
  const leds = { pwr: led(0x3dff7a), tx: led(0x3dff7a), rx: led(0xffb02e), err: led(0xff3030) };
  Object.values(leds).forEach((l, i) => g.add(mesh(cyl(0.0022, 0.002, 16), l.material, { pos: [0.033, 0.017 - i * 0.009, 0.0775], rot: [Math.PI / 2, 0, 0], cast: false })));
  const tags = T.textPlate({ w: 128, h: 256, bg: '#d9dcdf', fg: '#2a2e31' });
  tags.draw(['PWR', 'TX', 'RX', 'ERR'].map((t, i) => ({ text: t, y: 50 + i * 58, size: 34, weight: 700, x: 10 })));
  g.add(mesh(new THREE.PlaneGeometry(0.012, 0.038), new THREE.MeshStandardMaterial({ map: tags.texture }), { pos: [0.044, 0.004, 0.0772], cast: false }));
  for (let i = 0; i < 4; i++) g.add(mesh(box(0.008, 0.01, 0.012), X.termGreen, { pos: [-0.04 + i * 0.01, -0.06, 0.05] }));
  return { group: g, lcd, leds, port: new THREE.Vector3(GW.x - 0.04, GW.y - 0.066, 0.05) };
}

// ---------------------------------------------------------------- scene

export function buildThtScene(plateLines) {
  const M = makeMaterials();
  const std = (color, roughness, metalness, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
  const brushed = T.brushedMetal(205);
  const X = {
    strainer: new THREE.MeshStandardMaterial({ color: 0xb8c4d0, metalness: 0.9, roughness: 0.3, map: brushed, alphaMap: slotMask(), alphaTest: 0.5, side: THREE.DoubleSide }),
    membrane: std(0xf3f3ee, 0.9, 0, { side: THREE.DoubleSide }),
    barrel: new THREE.MeshPhysicalMaterial({ color: 0xc9d0d6, metalness: 0.92, roughness: 0.24, map: brushed, clearcoat: 0.2 }),
    nickel: std(0xb9bcbc, 0.32, 0.95),
    rubber: std(0x16181a, 0.8, 0.02),
    laser: std(0x6d7378, 0.6, 0.5),
    pcbDip: std(0xffffff, 0.55, 0.1, { map: pcbTexture('dip') }),
    pcbRs: std(0xffffff, 0.55, 0.1, { map: pcbTexture('rs') }),
    dipBody: std(0xc0262d, 0.45, 0.05),
    onMark: std(0xffffff, 0.5, 0),
    slider: std(0xf4f4ef, 0.35, 0.02),
    wireRed: std(0xc0282a, 0.5, 0.05),
    wireBlack: std(0x141414, 0.5, 0.05),
    wireYellow: std(0xe8c21c, 0.5, 0.05),
    wireGreen: std(0x2f9b4a, 0.5, 0.05),
    termYellow: std(0xe0b81e, 0.6, 0.05),
    termGreen: std(0x2f8a45, 0.6, 0.05),
    polyGrey: std(0x9ea6aa, 0.5, 0.05),
    polyDark: std(0x2e3337, 0.6, 0.05),
    polyLight: std(0xdfe2e4, 0.45, 0.05),
    greyCable: std(0x8a8f92, 0.6, 0.05),
    orangeCable: std(0xd0601e, 0.6, 0.05),
    pipeGrey: std(0x8b9196, 0.5, 0.4),
    frame: std(0xb9beb6, 0.7, 0.25),
    bulkhead: std(0xffffff, 0.8, 0.12, { map: bulkheadTexture() }),
  };

  for (const m of [M.stainless, M.stainlessDark, M.black, X.barrel, X.rubber, X.nickel]) m.side = THREE.DoubleSide;

  const room = buildRoom(M, X);
  const probe = buildProbe(M, X);
  const plate = buildPlate(M, plateLines);
  const jb = buildJunction(M, X);
  const gw = buildGateway(M, X);

  const root = new THREE.Group();
  root.add(room, plate.group, probe.group, jb.group, gw.group);
  root.updateMatrixWorld(true);

  // 4-core lead (Ø5 mm) from the gland to JB-ER-07, and the RS-485 trunk to the master.
  const glandTop = new THREE.Vector3(PROBE.x, PROBE.y0 + mm(141), PROBE.z);
  const lead = tube([
    [glandTop.x, glandTop.y, glandTop.z], [glandTop.x, glandTop.y + 0.05, glandTop.z + 0.004],
    [glandTop.x + 0.06, glandTop.y + 0.13, 0.03], [jb.cableIn.x - 0.02, jb.cableIn.y - 0.06, 0.03],
    [jb.cableIn.x, jb.cableIn.y - 0.012, 0.03], [jb.cableIn.x, jb.cableIn.y + 0.01, 0.03],
  ], mm(2.5), M.cable, { cat: 'signal', segments: 160, tension: 0.3 });
  const trunk = tube([
    [jb.trunkOut.x, jb.trunkOut.y, 0.03], [jb.trunkOut.x + 0.06, jb.trunkOut.y - 0.01, 0.034],
    [gw.port.x - 0.05, gw.port.y - 0.05, 0.05], [gw.port.x, gw.port.y - 0.02, 0.05], [gw.port.x, gw.port.y + 0.004, 0.05],
  ], mm(3.2), X.greyCable, { cat: 'signal', segments: 140, tension: 0.3 });
  const cabling = new THREE.Group();
  cabling.add(lead, trunk);
  root.add(cabling);
  for (const c of [lead, trunk]) for (let u = 0.12; u < 0.95; u += 0.28) {
    const p = c.userData.curve.getPointAt(u);
    if (Math.abs(p.z) > 0.012) cabling.add(mesh(box(0.012, 0.004, Math.max(0.004, p.z)), M.black, { pos: [p.x, p.y, p.z / 2], cast: false }));
  }

  // Path of the animated RTU packets: master → trunk → JB → lead → transceiver PCB.
  const busPath = new THREE.CurvePath();
  busPath.add(new THREE.LineCurve3(new THREE.Vector3(GW.x - 0.012, GW.y + 0.004, 0.08), gw.port.clone().setZ(0.05)));
  const trunkRev = trunk.userData.curve.points.slice().reverse();
  busPath.add(new THREE.CatmullRomCurve3(trunkRev, false, 'catmullrom', 0.3));
  busPath.add(new THREE.LineCurve3(jb.trunkOut.clone(), jb.cableIn.clone()));
  const leadRev = lead.userData.curve.points.slice().reverse();
  busPath.add(new THREE.CatmullRomCurve3(leadRev, false, 'catmullrom', 0.3));
  busPath.add(new THREE.LineCurve3(glandTop.clone(), new THREE.Vector3(PROBE.x, PROBE.y0 + mm(105), PROBE.z)));

  const P = {
    tht: {
      object: probe.group, name: 'TZ THT-02 · BOAT-ER-TH-02', role: 'RS-485 Modbus RTU temperature & humidity sensor', cat: 'shell', color: '#b8c4d0',
      explode: [0, 0, 0],
      specs: [
        ['Interface', 'RS-485 · Modbus RTU', 'oem', 'TZ-THT02-UM-V1.0'],
        ['Line format', '8N1 · default 9600 baud', 'oem', 'TZ-THT02-UM-V1.0'],
        ['Address', 'DIP-8 (128…1)', 'oem', 'TZ-THT02-UM-V1.0'],
        ['Body', 'Ø16 × 140 mm', 'fieldscan'],
        ['Serial', 'SYN-2411-0042', 'synthetic'],
        ['Order variant', 'Not confirmed', 'pending'],
      ],
    },
    'tht-gland': { object: probe.gland, parent: 'tht', name: 'Waterproof gland', role: 'Rear gland nut · step 1: unscrew', cat: 'shell', color: '#b8c4d0', explode: [0, 0.05, 0], spin: [0, 1, 0, Math.PI * 6], window: [0, 0.35],
      specs: [['Zone', '122–140 mm · Ø15.5', 'fieldscan'], ['Cable', 'Ø5 mm · 4 cores · 1 m', 'fieldscan']] },
    'tht-head': { object: probe.head, parent: 'tht', name: 'Sensor head + DIP barrel', role: 'Step 2: unscrew at the middle seam', cat: 'shell', color: '#b8c4d0', explode: [0, -0.085, 0], spin: [0, 1, 0, -Math.PI * 5], window: [0.3, 0.7],
      specs: [['Zones', 'Strainer 0–32 · seal 32–38 · barrel 38–68 mm', 'fieldscan'], ['Strainer', 'Slotted stainless', 'fieldscan']] },
    'tht-sht': { object: probe.sht, parent: 'tht-head', name: 'Sensing element (SHT30)', role: 'Temperature and humidity element behind the strainer', cat: 'internal', color: '#ffd166', explode: [0, 0, 0],
      specs: [['Element', 'SHT30 (FieldScan reference)', 'fieldscan'], ['Fault marker', '7FFF H', 'oem', 'TZ-THT02-UM-V1.0']] },
    'tht-dip': { object: probe.dip, parent: 'tht', name: 'DIP-8 address switch', role: 'Sets the Modbus slave address (§ 5)', cat: 'internal', color: '#ffd166', explode: [0, -0.004, 0.022], window: [0.65, 1],
      specs: [['Weights', '1:128 2:64 3:32 4:16 5:8 6:4 7:2 8:1', 'oem', 'TZ-THT02-UM-V1.0'], ['Current address', 'live', 'live']] },
    'tht-rs485': { object: probe.rs, parent: 'tht', name: 'RS-485 transceiver PCB', role: 'Line driver + regulator · leads Red V+, Black GND, Yellow A+, Green B−', cat: 'internal', color: '#ffd166', explode: [0, 0, 0.026], window: [0.7, 1],
      specs: [['Leads', 'Red V+ · Black GND · Yellow A+ · Green B−', 'oem', 'TZ-THT02-UM-V1.0'], ['Supply', 'DC 5–24 V (plate)', 'synthetic']] },
    'tht-body': { object: probe.body, parent: 'tht', name: 'Flange, bracket and RS-485 barrel', role: 'Bracket 42 × 20 mm · Ø4.2 holes at 32 mm', cat: 'shell', color: '#b8c4d0', explode: [0, 0, 0],
      specs: [['Zones', 'Flange 68–88 · barrel 88–122 mm', 'fieldscan']] },
    plate: { object: plate.group, name: 'Mounting plate + nameplate', role: 'Synthetic nameplate for the demo', cat: 'structure', color: '#c9d1d4', explode: [0, 0, 0],
      specs: [['Plate text', 'Synthetic', 'synthetic']] },
    jb: { object: jb.group, name: 'Junction box JB-ER-07', role: 'RS-485 segment B marshalling', cat: 'electronics', color: '#ffb347', explode: [0, 0, 0], specs: [['Segment', 'B · 9600 8N1', 'synthetic']] },
    'jb-lid': { object: jb.lid, parent: 'jb', name: 'JB-ER-07 lid', role: '4-screw cover', cat: 'electronics', color: '#ffb347', explode: [0, 0, 0.09], window: [0, 0.5], specs: [] },
    gateway: { object: gw.group, name: 'Modbus master (synthetic)', role: 'Polls address 1 · FC03 · registers 0–1', cat: 'electronics', color: '#ffb347', explode: [0, 0, 0],
      specs: [['Master polls', 'Address 1', 'synthetic'], ['Function', '03 · 2 registers from 0', 'synthetic'], ['Timeout', '1000 ms', 'synthetic']] },
    cabling: { object: cabling, name: 'RS-485 cabling', role: 'Sensor lead + segment B trunk', cat: 'signal', color: '#6fe3a1', explode: [0, 0, 0], specs: [] },
  };
  for (const def of Object.values(P).reverse()) {
    def.object.traverse(o => { if (o.isMesh && !o.userData.cat) o.userData.cat = def.cat; });
  }

  return {
    root, room, parts: P, busPath, sliders: probe.sliders,
    dynamic: { lcd: gw.lcd, leds: gw.leds },
    anchors: {
      tht: new THREE.Vector3(-0.03, mm(60), 0.02),
      jb: new THREE.Vector3(0, 0.085, 0.03),
      gateway: new THREE.Vector3(0, 0.1, 0.05),
    },
    probeWorld: new THREE.Vector3(PROBE.x, PROBE.y0 + mm(70), PROBE.z),
    plateWorld: plate.faceWorld,
  };
}
