<div align="center">

<img src="icons/icon-512.png" width="140" alt="calm" />

# calm

*A minimal journal for quiet days.*

### [→ open the app](https://svaity.github.io/calm-journal/)

![PWA](https://img.shields.io/badge/PWA-ready-6b8e7f?style=flat-square)
![No build](https://img.shields.io/badge/build-none-c5d4cb?style=flat-square)
![Offline](https://img.shields.io/badge/works-offline-6b8e7f?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-c5d4cb?style=flat-square)

</div>

---

## ✦ A quiet space

Most apps shout. They notify, badge, gamify, recommend.

**calm** does none of that.

It's a single page. Today's date at the top. A page below.
You write. You stop. The words save themselves.

If the room is too quiet, there's a forest or an ocean.
If the silence is too loud, a flute or a sitar plays softly.
If you need to focus, a five-minute timer sits beside the date — start it, breathe, write.

That's the whole app. Nothing else.

---

## ✦ What's inside

🌿 &nbsp;**Two ambient layers** — pick one nature sound (*forest* or *ocean*) and one instrument (*flute* or *sitar*). They blend. Everything is procedurally generated with the Web Audio API; no audio files, no streaming.

📅 &nbsp;**One entry per day** — today's date is your title. Yesterday is one tap away in the *entries* view.

⏱ &nbsp;**5-minute breath timer** — a soft three-note chime and a green pulse when time's up.

🌗 &nbsp;**Light & dark themes** — tap the small half-circle to switch. Your choice persists.

💾 &nbsp;**Local-first** — everything is saved on your device in `localStorage`. No accounts, no cloud, no telemetry, no analytics.

📱 &nbsp;**Installable** — add it to your iPhone home screen and it runs fullscreen, offline, like a native app.

---

## ✦ Install on your iPhone

1. Open [`svaity.github.io/calm-journal`](https://svaity.github.io/calm-journal/) in **Safari**
2. Tap the **Share** icon (square with up-arrow)
3. Scroll down → **Add to Home Screen**
4. Tap the new `calm` icon — you're in

> Web Audio on iPhone uses **media volume** (not the ringer). Press the side volume buttons while a sound plays to set it. The app routes audio through the media bus so the silent switch won't mute it.

On desktop, just open the link in any modern browser.

---

## ✦ Under the hood

A small static site. No build step. No bundler. No dependencies. Plain ES modules served straight to the browser.

```
calm-journal/
├── index.html              markup only
├── manifest.json           PWA manifest
├── sw.js                   service worker (offline + cache)
├── css/
│   └── style.css           all styling
├── icons/
│   ├── icon-180.png        Apple touch icon
│   ├── icon-192.png        PWA icon
│   └── icon-512.png        high-res / maskable
└── js/
    ├── app.js              entry — wires the modules
    ├── journal.js          entries, today's date, save/load, entries view
    ├── theme.js            light/dark toggle
    ├── timer.js            5-min breath timer
    ├── audio.js            AudioContext, helpers, sound registry, iOS unlock
    └── sounds/
        ├── forest.js
        ├── ocean.js
        ├── flute.js
        └── sitar.js
```

### The sounds

🌬 &nbsp;**flute** — sine fundamental + octave shimmer + a touch of triangle for breath, gentle vibrato that fades in after the attack, faint band-passed white noise for breathiness. Notes follow short pre-composed phrases in raga Yaman so it never sounds random.

🪕 &nbsp;**sitar** — plucked harmonics with sharp attack and long decay, tiny upward pitch bend (*meend*) on each note, a high band-passed noise burst for sympathetic-string buzz, and a continuous tanpura-style drone (Sa + Pa + Sa) underneath.

🌲 &nbsp;**forest** — pink noise through a low-pass filter modulated by a slow LFO (wind), with occasional bird-like chirps from a quick sine sweep.

🌊 &nbsp;**ocean** — pink noise with two slow LFOs: one swelling the gain (waves), one shifting the filter cutoff (changing brightness).

### The storage

Entries live in `localStorage` as `{ "yyyy-mm-dd": "text" }`. Auto-saves are debounced (~600 ms) and also flush on `blur`, `pagehide`, and `visibilitychange` — the latter two matter for iOS Safari, which doesn't fire `beforeunload` reliably for PWAs. The app calls `navigator.storage.persist()` to ask iOS not to evict data after long inactivity.

---

## ✦ Run it locally

It's just a folder of static files. Any local web server works:

```bash
npx serve .
# or
python -m http.server 8000
```

Then open `http://localhost:8000`. (Opening `index.html` via `file://` mostly works, but the service worker won't register.)

---

## ✦ Why this exists

Some days the blinking cursor in a blank Notion page feels like a job interview, not a place to think. This is the opposite of that — open, breathe, write, close. No prompts, no streaks, no AI suggesting what you should feel.

If it helps you too, that's enough.

---

<div align="center">

*calm — a minimal journal for quiet days.*

</div>
