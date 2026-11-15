// Hands-free voice loop: continuous microphone, energy-based voice activity detection,
// one 16 kHz mono WAV per utterance, and barge-in while the assistant is speaking.

const FRAME = 2048;
const PRE_ROLL_MS = 300;
const END_SILENCE_MS = 750;
const MIN_SPEECH_MS = 280;
const MAX_UTTERANCE_MS = 15000;
const TARGET_RATE = 16000;

function rms(buf) {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  return Math.sqrt(sum / buf.length);
}

function concat(chunks) {
  const out = new Float32Array(chunks.reduce((n, c) => n + c.length, 0));
  let offset = 0;
  for (const c of chunks) { out.set(c, offset); offset += c.length; }
  return out;
}

function downsample(samples, rate) {
  if (rate === TARGET_RATE) return samples;
  const ratio = rate / TARGET_RATE;
  const out = new Float32Array(Math.floor(samples.length / ratio));
  for (let i = 0; i < out.length; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(samples.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j++) sum += samples[j];
    out[i] = sum / Math.max(1, end - start);
  }
  return out;
}

export function encodeWavBase64(samples, rate) {
  const pcm = downsample(samples, rate);
  const buffer = new ArrayBuffer(44 + pcm.length * 2);
  const view = new DataView(buffer);
  const text = (offset, s) => { for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i)); };
  text(0, 'RIFF'); view.setUint32(4, 36 + pcm.length * 2, true); text(8, 'WAVE');
  text(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, TARGET_RATE, true); view.setUint32(28, TARGET_RATE * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  text(36, 'data'); view.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) {
    const v = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(44 + i * 2, v < 0 ? v * 0x8000 : v * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export class VoiceLoop {
  // handlers: onLevel(level, speaking), onSpeechStart(), onUtterance(wavBase64, ms), isAssistantSpeaking(), onBargeIn()
  constructor(handlers) {
    this.h = handlers;
    this.active = false;
    this.paused = false;
  }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
    });
    this.ctx = new AudioContext();
    this.rate = this.ctx.sampleRate;
    const source = this.ctx.createMediaStreamSource(this.stream);
    // ScriptProcessor keeps this dependency-free under a strict CSP (no worklet module needed).
    this.node = this.ctx.createScriptProcessor(FRAME, 1, 1);
    this.node.onaudioprocess = e => this.onFrame(new Float32Array(e.inputBuffer.getChannelData(0)));
    source.connect(this.node);
    this.node.connect(this.ctx.destination);
    this.frameMs = (FRAME / this.rate) * 1000;
    this.floor = 0.006;
    this.preRoll = [];
    this.chunks = null;
    this.voiceMs = 0;
    this.silenceMs = 0;
    this.loudMs = 0;
    this.active = true;
  }

  stop() {
    this.active = false;
    this.node?.disconnect();
    this.stream?.getTracks().forEach(t => t.stop());
    this.ctx?.close();
    this.node = this.stream = this.ctx = null;
    this.chunks = null;
  }

  onFrame(frame) {
    // Paused while an utterance is being transcribed, so turns never overlap.
    if (!this.active || this.paused) return;
    const level = rms(frame);
    const assistantSpeaking = this.h.isAssistantSpeaking?.();
    // Higher bar while the assistant talks, so its own voice does not trigger a turn.
    const threshold = Math.max(assistantSpeaking ? 0.05 : 0.018, this.floor * (assistantSpeaking ? 6 : 3));
    const voiced = level > threshold;
    if (!this.chunks && !voiced) this.floor = this.floor * 0.97 + level * 0.03;
    this.h.onLevel?.(Math.min(1, level / 0.12), Boolean(this.chunks));

    if (this.paused) return;
    if (!this.chunks) {
      this.preRoll.push(frame);
      while (this.preRoll.length * this.frameMs > PRE_ROLL_MS) this.preRoll.shift();
      this.loudMs = voiced ? this.loudMs + this.frameMs : 0;
      if (this.loudMs >= (assistantSpeaking ? 220 : 90)) {
        if (assistantSpeaking) this.h.onBargeIn?.();
        this.chunks = [...this.preRoll];
        this.voiceMs = this.loudMs;
        this.silenceMs = 0;
        this.h.onSpeechStart?.();
      }
      return;
    }
    this.chunks.push(frame);
    if (voiced) { this.voiceMs += this.frameMs; this.silenceMs = 0; } else this.silenceMs += this.frameMs;
    const total = this.chunks.length * this.frameMs;
    if (this.silenceMs >= END_SILENCE_MS || total >= MAX_UTTERANCE_MS) {
      const chunks = this.chunks;
      const speechMs = this.voiceMs;
      this.chunks = null;
      this.preRoll = [];
      this.loudMs = 0;
      if (speechMs >= MIN_SPEECH_MS) this.h.onUtterance?.(encodeWavBase64(concat(chunks), this.rate), total);
      else this.h.onDiscard?.();
    }
  }
}
