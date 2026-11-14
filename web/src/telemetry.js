// Simulated live telemetry derived from the evaluated report.
// First-order lag on the loop current, small Gaussian-like noise and supply ripple.

const HISTORY = 160; // 40 s at 4 Hz
const DESIGN_A = 0.022;

const noise = amplitude => (Math.random() + Math.random() + Math.random() - 1.5) * amplitude;

export class Telemetry {
  constructor(onSample) {
    this.onSample = onSample;
    this.report = null;
    this.current = 0;
    this.level = 0.5;
    this.history = [];
    this.timer = null;
  }

  setReport(report) {
    this.report = report;
  }

  start() {
    if (!this.timer) this.timer = setInterval(() => this.tick(), 250);
  }

  tick() {
    const r = this.report;
    if (!r) return;
    const state = r.simulation.state;
    const supply = r.inputs.supply_v;
    const physicalLevel = r.simulation.level_fraction ?? this.level;
    this.level += (physicalLevel - this.level) * 0.08;

    let target;
    if (state === 'open_circuit') target = 0;
    else if (state === 'outside_load_envelope') target = null;
    else target = r.simulation.loop_signal_ma;

    let ma = null;
    if (target !== null) {
      this.current += (target - this.current) * 0.35;
      ma = Math.max(0, this.current + (target === 0 ? 0 : noise(0.012)));
    } else {
      this.current += (0 - this.current) * 0.35;
    }

    const loadOhm = r.load_check.evaluated_ohm;
    const v = supply - (ma ?? 0) / 1000 * 0.05 + noise(0.02);
    const terminalAtDesign = supply - DESIGN_A * loadOhm;
    const count = ma !== null && state !== 'open_circuit'
      ? Math.round(Math.max(0, (ma - 4) / 16 * 27648)) : null;

    const sample = {
      t: Date.now(),
      state,
      ma,
      supply: v,
      terminalAtDesign,
      count,
      level: this.level,
      diag: state === 'open_circuit' ? 'Wire break' : state === 'outside_load_envelope' ? 'Reading suppressed' : 'OK',
    };
    this.last = sample;
    this.history.push(sample);
    if (this.history.length > HISTORY) this.history.shift();
    this.onSample(sample);
  }
}

export function drawChart(canvas, history) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const pad = { l: 46, r: 14, t: 22, b: 14 };
  const plotH = (h - pad.t - pad.b - 28) / 2;
  const plots = [
    { y0: pad.t, title: 'Loop current [mA]', min: 0, max: 24, key: 'ma', color: '#5fd4d0', guides: [4, 20] },
    { y0: pad.t + plotH + 28, title: 'Supply [V]', min: 0, max: 28, key: 'supply', color: '#ffc857', guides: [12, 24] },
  ];
  ctx.font = '20px ui-monospace, Menlo, monospace';
  for (const p of plots) {
    const y = v => p.y0 + plotH - (v - p.min) / (p.max - p.min) * plotH;
    ctx.fillStyle = '#8ea2a9';
    ctx.fillText(p.title, pad.l, p.y0 - 4);
    ctx.strokeStyle = '#1c2a31';
    ctx.lineWidth = 1;
    ctx.strokeRect(pad.l, p.y0, w - pad.l - pad.r, plotH);
    for (const g of p.guides) {
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(pad.l, y(g));
      ctx.lineTo(w - pad.r, y(g));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillText(String(g), 6, y(g) + 6);
    }
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let drawing = false;
    history.forEach((s, i) => {
      const x = pad.l + i / (HISTORY - 1) * (w - pad.l - pad.r);
      const v = s[p.key];
      if (v === null || v === undefined) {
        drawing = false;
        ctx.fillStyle = 'rgba(255,138,92,.25)';
        ctx.fillRect(x - 1, p.y0, 3, plotH);
        return;
      }
      if (drawing) ctx.lineTo(x, y(v));
      else ctx.moveTo(x, y(v));
      drawing = true;
    });
    ctx.stroke();
  }
}
