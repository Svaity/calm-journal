// 5-minute breath timer. Mirrored in the toolbar and beside the date.

import { flash } from './journal.js';
import { ensureCtx } from './audio.js';

const TIMER_DURATION = 5 * 60;
let remaining = TIMER_DURATION;
let timerInterval = null;

const timerEls = [document.getElementById('timer'), document.getElementById('timer-date')];
const timerBtn = document.getElementById('btn-timer');
const pulseEl = document.getElementById('pulse');

function fmt(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function renderTimer() {
  timerEls.forEach(el => { el.textContent = fmt(remaining); });
}

function startTimer() {
  if (timerInterval) return;
  timerEls.forEach(el => el.classList.add('running'));
  timerBtn.textContent = 'pause';
  timerInterval = setInterval(() => {
    remaining--;
    renderTimer();
    if (remaining <= 0) finishTimer();
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerEls.forEach(el => el.classList.remove('running'));
  timerBtn.textContent = 'start';
}

function resetTimer() {
  pauseTimer();
  remaining = TIMER_DURATION;
  renderTimer();
}

function playChime() {
  try {
    const ctx = ensureCtx();
    const t = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t + i * 0.15);
      g.gain.linearRampToValueAtTime(0.18, t + i * 0.15 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.15 + 2.5);
      o.connect(g); g.connect(ctx.destination);
      o.start(t + i * 0.15); o.stop(t + i * 0.15 + 2.6);
    });
  } catch (e) {}
}

function finishTimer() {
  pauseTimer();
  remaining = TIMER_DURATION;
  renderTimer();
  pulseEl.classList.add('on');
  setTimeout(() => pulseEl.classList.remove('on'), 4000);
  playChime();
  flash('time');
}

export function initTimer() {
  timerBtn.addEventListener('click', () => { if (timerInterval) pauseTimer(); else startTimer(); });
  timerEls.forEach(el => el.addEventListener('click', resetTimer));
  renderTimer();
}
