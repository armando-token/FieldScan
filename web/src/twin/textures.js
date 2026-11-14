import * as THREE from 'three';

// Procedural canvas textures so the twin works fully offline with no asset files.

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function toTexture(c, { repeat = [1, 1], srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function brushedMetal(base = 196) {
  const [c, g] = canvas(512, 512);
  g.fillStyle = `rgb(${base},${base},${base})`;
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    const y = Math.random() * 512;
    const v = base + (Math.random() - 0.5) * 34;
    g.strokeStyle = `rgba(${v},${v},${v},0.35)`;
    g.lineWidth = Math.random() * 1.4;
    g.beginPath();
    g.moveTo(Math.random() * -100, y);
    g.lineTo(512 + Math.random() * 100, y + (Math.random() - 0.5) * 2);
    g.stroke();
  }
  return toTexture(c, { repeat: [2, 2] });
}

export function checkerPlate() {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#5a5a5a';
  g.fillRect(0, 0, 256, 256);
  const lozenge = (x, y, a) => {
    g.save();
    g.translate(x, y);
    g.rotate(a);
    const grad = g.createLinearGradient(-18, 0, 18, 0);
    grad.addColorStop(0, '#3c3c3c');
    grad.addColorStop(0.5, '#a8a8a8');
    grad.addColorStop(1, '#3c3c3c');
    g.fillStyle = grad;
    g.beginPath();
    g.ellipse(0, 0, 20, 4.5, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  };
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      lozenge(x * 64 + 32, y * 64 + 32, (x + y) % 2 ? Math.PI / 4 : -Math.PI / 4);
    }
  }
  return toTexture(c, { repeat: [14, 10], srgb: false });
}

export function paintedSteel(color = '#c8ccc6') {
  const [c, g] = canvas(256, 256);
  g.fillStyle = color;
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1800; i++) {
    g.fillStyle = `rgba(0,0,0,${Math.random() * 0.04})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  return toTexture(c, { repeat: [4, 2] });
}

// Text plate (nameplates, module fronts). Returns { texture, draw(lines) } so it can be redrawn live.
export function textPlate({ w = 512, h = 256, bg = '#2d3236', fg = '#e6e9ea', accent = null, border = null } = {}) {
  const [c, g] = canvas(w, h);
  const texture = toTexture(c);
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  const draw = lines => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    if (accent) {
      g.fillStyle = accent;
      g.fillRect(0, 0, w, h * 0.18);
    }
    if (border) {
      g.strokeStyle = border;
      g.lineWidth = 6;
      g.strokeRect(6, 6, w - 12, h - 12);
    }
    for (const line of lines) {
      g.fillStyle = line.color || fg;
      g.font = `${line.weight || 600} ${line.size || 34}px Helvetica, Arial, sans-serif`;
      g.textAlign = line.align || 'left';
      g.fillText(line.text, line.align === 'center' ? w / 2 : line.x ?? 24, line.y);
    }
    texture.needsUpdate = true;
  };
  return { texture, draw };
}

export function ductSlots() {
  const [c, g] = canvas(256, 64);
  g.fillStyle = '#9ea3a5';
  g.fillRect(0, 0, 256, 64);
  g.fillStyle = '#2b2f31';
  for (let x = 6; x < 256; x += 16) g.fillRect(x, 0, 6, 46);
  return toTexture(c, { repeat: [6, 1] });
}
