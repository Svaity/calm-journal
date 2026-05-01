// Audio core: AudioContext lifecycle, shared synth helpers, sound registry,
// iOS silent-switch workaround. Each sound lives in ./sounds/<name>.js and
// exports a start function that returns { master, nodes, alive }.

import { startForest } from './sounds/forest.js';
import { startOcean } from './sounds/ocean.js';
import { startFlute } from './sounds/flute.js';
import { startSitar } from './sounds/sitar.js';

let audioCtx = null;
const activeSounds = {};

const STARTERS = {
  forest: startForest,
  ocean: startOcean,
  flute: startFlute,
  sitar: startSitar,
};

const SOUND_CATEGORY = {
  forest: 'nature',
  ocean: 'nature',
  flute: 'instrument',
  sitar: 'instrument',
};

export function ensureCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  unlockMediaBusForIOS();
  return audioCtx;
}

// iOS silent-switch fix: play a silent HTML5 audio element so iOS routes
// Web Audio through the media bus (ignoring the hardware mute switch).
let _silentAudio = null;
function unlockMediaBusForIOS() {
  if (_silentAudio) return;
  const a = document.createElement('audio');
  a.setAttribute('playsinline', '');
  a.setAttribute('webkit-playsinline', '');
  a.loop = true;
  a.preload = 'auto';
  // generate a 0.1s silent WAV at runtime
  const sampleRate = 8000;
  const numSamples = Math.floor(sampleRate * 0.1);
  const buf = new ArrayBuffer(44 + numSamples);
  const dv = new DataView(buf);
  const writeStr = (o, s) => { for (let i=0;i<s.length;i++) dv.setUint8(o+i, s.charCodeAt(i)); };
  writeStr(0,'RIFF'); dv.setUint32(4, 36+numSamples, true); writeStr(8,'WAVE');
  writeStr(12,'fmt '); dv.setUint32(16,16,true); dv.setUint16(20,1,true); dv.setUint16(22,1,true);
  dv.setUint32(24,sampleRate,true); dv.setUint32(28,sampleRate,true);
  dv.setUint16(32,1,true); dv.setUint16(34,8,true);
  writeStr(36,'data'); dv.setUint32(40, numSamples, true);
  for (let i=0;i<numSamples;i++) dv.setUint8(44+i, 128);
  a.src = URL.createObjectURL(new Blob([buf], {type:'audio/wav'}));
  a.play().catch(()=>{});
  _silentAudio = a;
}

export function makeNoiseBuffer(ctx, type = 'white', seconds = 4) {
  const len = ctx.sampleRate * seconds;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  if (type === 'white') {
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  } else if (type === 'pink') {
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.0168980;
      data[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  }
  return buf;
}

export function makeReverb(ctx, seconds = 2.5, decay = 3.5) {
  const conv = ctx.createConvolver();
  const len = ctx.sampleRate * seconds;
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  conv.buffer = ir;
  return conv;
}

export const midiToFreq = m => 440 * Math.pow(2, (m - 69) / 12);

function stopOne(name) {
  const s = activeSounds[name];
  if (!s) return;
  s.alive = false;
  if (s.master && audioCtx) {
    const t = audioCtx.currentTime;
    s.master.gain.cancelScheduledValues(t);
    s.master.gain.setValueAtTime(s.master.gain.value, t);
    s.master.gain.linearRampToValueAtTime(0.0001, t + 0.5);
  }
  setTimeout(() => {
    s.nodes.forEach(n => { try { n.stop && n.stop(); n.disconnect && n.disconnect(); } catch(e){} });
  }, 600);
  delete activeSounds[name];
  const btn = document.querySelector(`button[data-sound="${name}"]`);
  if (btn) btn.classList.remove('active');
}

function toggleSound(name) {
  if (activeSounds[name]) { stopOne(name); return; }
  // stop any other sound in the same category
  const cat = SOUND_CATEGORY[name];
  Object.keys(activeSounds).forEach(other => {
    if (SOUND_CATEGORY[other] === cat) stopOne(other);
  });
  const start = STARTERS[name];
  if (!start) return;
  const sound = start();
  if (sound) {
    activeSounds[name] = sound;
    document.querySelector(`button[data-sound="${name}"]`).classList.add('active');
  }
}

export function initAudio() {
  document.querySelectorAll('button[data-sound]').forEach(btn => {
    btn.addEventListener('click', () => toggleSound(btn.dataset.sound));
  });

  // resume audio context when app returns to foreground
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(()=>{});
    }
  });
}
