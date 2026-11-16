// Synthesized sound with WebAudio, no audio files. Every effect is a short
// oscillator or filtered-noise burst. M toggles mute; everything is guarded
// so the game plays silently when audio is unavailable.
let ctx = null;
let muted = false;

export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; return muted; }

function ac() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch (e) {
    ctx = null;
  }
  return ctx;
}

function tone(freq, dur, type, vol, slideTo) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  try {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.12, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur + 0.02);
  } catch (e) { /* audio is best-effort */ }
}

function noise(dur, vol, freq) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  try {
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq || 1800;
    f.Q.value = 0.8;
    const g = c.createGain();
    g.gain.value = vol || 0.08;
    src.connect(f);
    f.connect(g);
    g.connect(c.destination);
    src.start();
  } catch (e) { /* audio is best-effort */ }
}

export const sfx = {
  pour() { tone(880, 0.18, 'sine', 0.10, 1320); tone(1318, 0.12, 'sine', 0.05, 1760); },
  burn() { noise(0.12, 0.05, 2400); },
  bite() { tone(140, 0.25, 'sawtooth', 0.10, 70); },
  bell() { tone(660, 0.5, 'sine', 0.10); tone(990, 0.4, 'sine', 0.06); },
  pick() { tone(523, 0.12, 'triangle', 0.10); tone(784, 0.16, 'triangle', 0.10); },
  win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.5, 'sine', 0.10), i * 120)); },
  lose() { tone(220, 0.9, 'sawtooth', 0.08, 110); },
  click() { tone(1200, 0.05, 'square', 0.04); },
};
