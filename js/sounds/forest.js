// forest — pink noise through a slowly-modulated lowpass (wind),
// plus occasional sine-sweep chirps.

import { ensureCtx, makeNoiseBuffer } from '../audio.js';

export function startForest() {
  const ctx = ensureCtx();
  const sound = { nodes: [], alive: true };
  const master = ctx.createGain();
  master.gain.value = 0;
  master.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 2);
  master.connect(ctx.destination);
  sound.master = master;

  const src = ctx.createBufferSource();
  src.buffer = makeNoiseBuffer(ctx, 'pink', 5);
  src.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1200;

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.08;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 400;
  lfo.connect(lfoGain); lfoGain.connect(lp.frequency);
  lfo.start();

  src.connect(lp); lp.connect(master);
  src.start();
  sound.nodes.push(src, lp, lfo, lfoGain, master);

  const chirp = () => {
    if (!sound.alive) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const og = ctx.createGain();
    osc.frequency.setValueAtTime(1800 + Math.random() * 800, t);
    osc.frequency.exponentialRampToValueAtTime(2400 + Math.random() * 600, t + 0.12);
    og.gain.setValueAtTime(0, t);
    og.gain.linearRampToValueAtTime(0.04, t + 0.02);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(og); og.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.22);
    setTimeout(chirp, 4000 + Math.random() * 9000);
  };
  setTimeout(chirp, 3000 + Math.random() * 4000);

  return sound;
}
