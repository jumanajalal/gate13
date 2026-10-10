import { getCtx } from './pa';

let on = true;
export const setSfx = (v: boolean) => {
  on = v;
};

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.12, at = 0) {
  const c = getCtx();
  if (!on || !c) return;
  const t0 = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

/** Tiny synthesised feedback sounds so the room feels alive. No assets, works offline. */
export const sfx = {
  open: () => tone(480, 0.07, 'triangle'),
  granted: () => {
    tone(660, 0.1);
    tone(990, 0.18, 'sine', 0.12, 0.1);
  },
  denied: () => tone(160, 0.28, 'sawtooth', 0.07),
  stamp: () => {
    tone(90, 0.14, 'square', 0.14);
    tone(60, 0.2, 'sine', 0.2, 0.02);
  },
  string: () => tone(300, 0.35, 'sawtooth', 0.05),
};
