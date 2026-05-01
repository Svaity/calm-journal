// sitar — plucked harmonics with a tiny upward meend, sympathetic-string buzz,
// over a sustained tanpura-style drone (Sa + Pa + Sa).

import { ensureCtx, makeNoiseBuffer, makeReverb, midiToFreq } from '../audio.js';

const ROOT = 50; // D3
const BEAT = 0.5;

// raga Yaman: Sa Re Ga Ma# Pa Dha Ni Sa = 0 2 4 6 7 9 11 12
const PHRASES = [
  [[0,1],[2,1],[4,2],[2,1],[0,3]],
  [[7,1],[9,1],[11,1],[12,2],[11,1],[9,2]],
  [[4,1],[6,1],[7,2],[6,1],[4,1],[2,3]],
  [[12,1],[11,1],[9,2],[7,1],[6,1],[4,2],[2,3]],
  [[0,1],[2,1],[4,1],[7,2],[4,1],[2,1],[0,3]],
  [[9,1],[7,1],[9,1],[11,2],[12,3]],
];

function playNote(ctx, master, freq, when, velocity) {
  const t = when;
  const dur = 3.2;
  const noteGain = ctx.createGain();
  noteGain.gain.setValueAtTime(0, t);
  noteGain.gain.linearRampToValueAtTime(velocity, t + 0.005);
  noteGain.gain.exponentialRampToValueAtTime(velocity * 0.45, t + 0.25);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  noteGain.connect(master);

  const harmonics = [
    { mult: 1,  amp: 1.0,  type: 'triangle', detune: 0 },
    { mult: 2,  amp: 0.55, type: 'triangle', detune: 4 },
    { mult: 3,  amp: 0.32, type: 'sine',     detune: -3 },
    { mult: 4,  amp: 0.22, type: 'sine',     detune: 5 },
    { mult: 5,  amp: 0.16, type: 'sine',     detune: -4 },
    { mult: 6,  amp: 0.10, type: 'sine',     detune: 6 },
    { mult: 7,  amp: 0.07, type: 'sine',     detune: -5 },
  ];
  harmonics.forEach(h => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = h.type;
    o.detune.value = h.detune;
    // small upward bend ~30 cents (meend)
    o.frequency.setValueAtTime(freq * h.mult * 0.985, t);
    o.frequency.exponentialRampToValueAtTime(freq * h.mult, t + 0.08);
    g.gain.value = h.amp;
    o.connect(g); g.connect(noteGain);
    o.start(t); o.stop(t + dur + 0.1);
  });

  // sympathetic-string buzz on attack
  const buzz = ctx.createBufferSource();
  buzz.buffer = makeNoiseBuffer(ctx, 'white', 0.3);
  const bf = ctx.createBiquadFilter();
  bf.type = 'bandpass';
  bf.frequency.value = freq * 4;
  bf.Q.value = 8;
  const bg = ctx.createGain();
  bg.gain.setValueAtTime(velocity * 0.3, t);
  bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
  buzz.connect(bf); bf.connect(bg); bg.connect(noteGain);
  buzz.start(t); buzz.stop(t + 0.3);
}

export function startSitar() {
  const ctx = ensureCtx();
  const sound = { nodes: [], alive: true };
  const master = ctx.createGain();
  master.gain.value = 0;
  master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.5);

  const reverb = makeReverb(ctx, 2.5, 3);
  const wet = ctx.createGain(); wet.gain.value = 0.28;
  const dry = ctx.createGain(); dry.gain.value = 0.85;
  master.connect(dry); dry.connect(ctx.destination);
  master.connect(reverb); reverb.connect(wet); wet.connect(ctx.destination);
  sound.master = master;
  sound.nodes.push(master, reverb, wet, dry);

  // tanpura drone: low Sa + low Pa + Sa
  const droneFreqs = [
    midiToFreq(ROOT - 12),
    midiToFreq(ROOT - 12 + 7),
    midiToFreq(ROOT),
  ];
  droneFreqs.forEach((f, idx) => {
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f;
    o.detune.value = (Math.random() - 0.5) * 6;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 3 + idx);
    const swell = ctx.createOscillator();
    swell.frequency.value = 0.05 + idx * 0.02;
    const swellAmt = ctx.createGain();
    swellAmt.gain.value = 0.025;
    swell.connect(swellAmt); swellAmt.connect(g.gain);
    swell.start();
    o.connect(g); g.connect(master);
    o.start();
    sound.nodes.push(o, g, swell, swellAmt);
  });

  const playPhrase = () => {
    if (!sound.alive) return;
    const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    let t = ctx.currentTime + 0.05;
    phrase.forEach(([offset, beats]) => {
      const freq = midiToFreq(ROOT + offset);
      playNote(ctx, master, freq, t, 0.32 + Math.random() * 0.08);
      t += beats * BEAT;
    });
    const phraseLen = (t - ctx.currentTime) * 1000;
    const pause = 1500 + Math.random() * 2000;
    setTimeout(playPhrase, phraseLen + pause);
  };
  setTimeout(playPhrase, 1200);

  return sound;
}
