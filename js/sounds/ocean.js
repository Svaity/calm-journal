// ocean — pink noise with two slow LFOs:
// one swelling the gain (waves), one shifting the lowpass (changing brightness).

import { ensureCtx, makeNoiseBuffer } from '../audio.js';

export function startOcean() {
  const ctx = ensureCtx();
  const sound = { nodes: [], alive: true };
  const master = ctx.createGain();
  master.gain.value = 0;
  master.gain.linearRampToValueAtTime(0.45, ctx.currentTime + 2);
  master.connect(ctx.destination);
  sound.master = master;

  const src = ctx.createBufferSource();
  src.buffer = makeNoiseBuffer(ctx, 'pink', 6);
  src.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 800;

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.1;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.18;
  lfo.connect(lfoGain); lfoGain.connect(master.gain);
  lfo.start();

  const lfo2 = ctx.createOscillator();
  lfo2.frequency.value = 0.06;
  const lfo2Gain = ctx.createGain();
  lfo2Gain.gain.value = 250;
  lfo2.connect(lfo2Gain); lfo2Gain.connect(lp.frequency);
  lfo2.start();

  src.connect(lp); lp.connect(master);
  src.start();
  sound.nodes.push(src, lp, lfo, lfoGain, lfo2, lfo2Gain, master);

  return sound;
}
