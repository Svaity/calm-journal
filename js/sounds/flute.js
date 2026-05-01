// flute — pre-composed melodic phrases in raga Yaman.
// Voice = sine fundamental + octave + triangle 3rd harmonic + breath noise + vibrato.

import { ensureCtx, makeNoiseBuffer, makeReverb, midiToFreq } from '../audio.js';

const ROOT = 60; // middle C
const BEAT = 0.55; // seconds per beat

const PHRASES = [
  [[0,2],[2,2],[4,3],[2,1],[0,4]],
  [[7,1],[9,1],[11,2],[9,1],[7,3],[4,3]],
  [[4,1],[2,1],[4,1],[7,2],[9,2],[7,1],[4,3]],
  [[12,2],[11,1],[9,1],[7,2],[4,2],[2,3]],
  [[0,1],[4,1],[7,1],[12,3],[9,1],[7,1],[4,4]],
  [[7,1],[9,2],[7,1],[4,2],[2,1],[0,4]],
];

function playNote(ctx, master, freq, when, duration, velocity) {
  const t = when;
  const noteGain = ctx.createGain();
  const attack = 0.12;
  const release = Math.min(0.4, duration * 0.4);
  noteGain.gain.setValueAtTime(0, t);
  noteGain.gain.linearRampToValueAtTime(velocity, t + attack);
  noteGain.gain.linearRampToValueAtTime(velocity * 0.9, t + duration - release);
  noteGain.gain.linearRampToValueAtTime(0, t + duration);
  noteGain.connect(master);

  const o1 = ctx.createOscillator();
  o1.type = 'sine';
  o1.frequency.value = freq;

  const o2 = ctx.createOscillator();
  o2.type = 'sine';
  o2.frequency.value = freq * 2;
  const g2 = ctx.createGain(); g2.gain.value = 0.18;

  const o3 = ctx.createOscillator();
  o3.type = 'triangle';
  o3.frequency.value = freq * 3;
  const g3 = ctx.createGain(); g3.gain.value = 0.04;

  // vibrato — gentle, comes in after attack
  const vib = ctx.createOscillator();
  vib.frequency.value = 5;
  const vibAmt = ctx.createGain();
  vibAmt.gain.setValueAtTime(0, t);
  vibAmt.gain.linearRampToValueAtTime(freq * 0.006, t + attack + 0.2);
  vib.connect(vibAmt);
  vibAmt.connect(o1.frequency);

  // breath noise
  const breath = ctx.createBufferSource();
  breath.buffer = makeNoiseBuffer(ctx, 'white', duration + 0.5);
  const bf = ctx.createBiquadFilter();
  bf.type = 'bandpass';
  bf.frequency.value = freq * 2;
  bf.Q.value = 0.7;
  const bg = ctx.createGain(); bg.gain.value = 0.025;

  o1.connect(noteGain);
  o2.connect(g2); g2.connect(noteGain);
  o3.connect(g3); g3.connect(noteGain);
  breath.connect(bf); bf.connect(bg); bg.connect(noteGain);

  const stopT = t + duration + 0.1;
  o1.start(t); o1.stop(stopT);
  o2.start(t); o2.stop(stopT);
  o3.start(t); o3.stop(stopT);
  vib.start(t); vib.stop(stopT);
  breath.start(t); breath.stop(stopT);
}

export function startFlute() {
  const ctx = ensureCtx();
  const sound = { nodes: [], alive: true };
  const master = ctx.createGain();
  master.gain.value = 0;
  master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.2);

  const reverb = makeReverb(ctx, 3, 3);
  const wet = ctx.createGain(); wet.gain.value = 0.3;
  const dry = ctx.createGain(); dry.gain.value = 0.8;
  master.connect(dry); dry.connect(ctx.destination);
  master.connect(reverb); reverb.connect(wet); wet.connect(ctx.destination);
  sound.master = master;
  sound.nodes.push(master, reverb, wet, dry);

  const playPhrase = () => {
    if (!sound.alive) return;
    const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    let t = ctx.currentTime + 0.05;
    phrase.forEach(([offset, beats]) => {
      const freq = midiToFreq(ROOT + offset);
      const dur = beats * BEAT;
      playNote(ctx, master, freq, t, dur * 0.92, 0.32 + Math.random() * 0.06);
      t += dur;
    });
    const phraseLen = (t - ctx.currentTime) * 1000;
    const pause = 1200 + Math.random() * 1800;
    setTimeout(playPhrase, phraseLen + pause);
  };
  setTimeout(playPhrase, 600);

  return sound;
}
