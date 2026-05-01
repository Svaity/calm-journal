// Journal entries: storage, today's date, entries overlay.

const STORAGE_KEY = 'calm-journal-entries';

const bodyEl = document.getElementById('body');
const dateEl = document.getElementById('date');
const statusEl = document.getElementById('status');
const backTodayBtn = document.getElementById('back-today');
const overlay = document.getElementById('overlay');
const entriesList = document.getElementById('entries-list');

let currentKey = todayKey();
let saveTimer = null;

export function flash(msg) {
  statusEl.textContent = msg;
  statusEl.classList.add('show');
  clearTimeout(flash._t);
  flash._t = setTimeout(() => statusEl.classList.remove('show'), 1500);
}

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDateLong(key) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `<span class="weekday">${weekdays[date.getDay()]}</span>${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function loadAll() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch (e) { return {}; }
}

function saveAll(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function loadEntry(key) {
  currentKey = key;
  const entries = loadAll();
  bodyEl.value = entries[key] || '';
  dateEl.innerHTML = formatDateLong(key);
  if (key === todayKey()) backTodayBtn.classList.add('hidden');
  else backTodayBtn.classList.remove('hidden');
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, 600);
}

export function persist() {
  const entries = loadAll();
  const text = bodyEl.value;
  if (text.trim()) entries[currentKey] = text;
  else delete entries[currentKey];
  saveAll(entries);
  flash('saved');
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function renderEntries() {
  const entries = loadAll();
  if (!(todayKey() in entries)) entries[todayKey()] = '';

  const keys = Object.keys(entries).sort().reverse();
  if (keys.length === 0) {
    entriesList.innerHTML = '<div class="entry-empty">no entries yet</div>';
    return;
  }
  entriesList.innerHTML = keys.map(k => {
    const text = entries[k] || '';
    const preview = text.replace(/\n/g, ' ').slice(0, 80) || (k === todayKey() ? 'today — empty' : 'empty');
    const cur = k === currentKey ? ' current' : '';
    return `
      <div class="entry-item${cur}" data-key="${k}">
        <button class="entry-delete" data-key="${k}" title="delete">×</button>
        <div class="entry-date">${formatDateLong(k)}</div>
        <div class="entry-preview">${escapeHtml(preview)}</div>
      </div>
    `;
  }).join('');
}

export function initJournal() {
  bodyEl.addEventListener('input', scheduleSave);
  bodyEl.addEventListener('blur', persist);
  window.addEventListener('beforeunload', persist);
  // iOS Safari/PWA fires these more reliably than beforeunload
  window.addEventListener('pagehide', persist);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) persist();
  });

  // ask iOS for persistent storage so entries aren't auto-evicted
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }

  backTodayBtn.addEventListener('click', () => loadEntry(todayKey()));

  document.getElementById('btn-entries').addEventListener('click', () => {
    persist();
    renderEntries();
    overlay.classList.add('show');
  });
  document.getElementById('close-overlay').addEventListener('click', () => overlay.classList.remove('show'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('show'); });

  entriesList.addEventListener('click', (e) => {
    const del = e.target.closest('.entry-delete');
    if (del) {
      e.stopPropagation();
      const key = del.dataset.key;
      if (confirm('delete this entry?')) {
        const all = loadAll();
        delete all[key];
        saveAll(all);
        if (key === currentKey) loadEntry(todayKey());
        renderEntries();
      }
      return;
    }
    const item = e.target.closest('.entry-item');
    if (item) {
      persist();
      loadEntry(item.dataset.key);
      overlay.classList.remove('show');
    }
  });

  loadEntry(todayKey());

  // only auto-focus on desktop — on mobile this hides the toolbar behind the keyboard
  if (window.matchMedia('(min-width: 540px)').matches) {
    bodyEl.focus();
  }
}
