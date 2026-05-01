// Entry point — wires the modules together.

import { initTheme } from './theme.js';
import { initJournal } from './journal.js';
import { initAudio } from './audio.js';
import { initTimer } from './timer.js';

initTheme();
initJournal();
initAudio();
initTimer();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
