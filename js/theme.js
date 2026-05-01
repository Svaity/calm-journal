// Light / dark theme toggle, persisted in localStorage.

const THEME_KEY = 'calm-theme';

function applyTheme(t) {
  if (t === 'dark') document.body.classList.add('dark');
  else document.body.classList.remove('dark');
}

export function initTheme() {
  applyTheme(localStorage.getItem(THEME_KEY) || 'light');
  document.getElementById('btn-theme').addEventListener('click', () => {
    const next = document.body.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });
}
