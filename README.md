# Toolbox Adventure – Focus (PWA)

This is a super-simple, kid-friendly **Progressive Web App** to finish the Toolbox Adventure:
- Steps: Apprentice Focus → Handle → Color & Timer → Tool Oath
- Focus Mode toggle
- Read‑Aloud speeches (Web Speech API)
- Auto‑saved progress (localStorage)
- Offline capable (service worker)

## Quick Start (edit + preview)

1. **Unzip** this folder somewhere handy.
2. Open a terminal in the folder and run a tiny local server:
   ```bash
   python3 -m http.server 8080
   ```
3. Visit **http://localhost:8080** in your browser.
4. Edit **`app.jsx`** and refresh the page to see changes.

> Tip: Everything is plain files. No build tools required.

## Where to Edit

- **`app.jsx`** → Main app logic (steps, checklists, timer, speeches).  
  - Change speeches near the top (`apprenticeSpeech`, `toolOath`).
  - Tweak steps in the `steps` array (titles, checklists, flow).
  - UI tweaks: JSX + Tailwind utility classes.
- **`index.html`** → Page shell. Loads React + Tailwind + your `app.jsx`.
- **`manifest.webmanifest`** → App name, theme colors, icons.
- **`sw.js`** → Service worker (offline caching list).
- **`icons/`** → Replace with your own 192x192 and 512x512 PNGs if you want.

## Install on a Tablet (PWA)

1. Host the folder with HTTPS (Netlify, GitHub Pages, etc.).
2. Open the site in Chrome on the tablet.
3. Tap menu (⋮) → **Add to Home screen** → **Install**.

The app then opens full‑screen and works offline after first load.

## Make an APK Later (optional)

When you’re ready to ship a real Android APK, we can wrap this same folder with **Capacitor** (or Cordova/Tauri):
- No code rewrite needed.
- You’ll edit the same `app.jsx` & `index.html`, rebuild, and reinstall the APK.

## Common Tweaks

- **Change default timer**: search for `15 * 60` in `app.jsx` and edit.
- **Rename color defaults**: update the `color` and `colorName` states near the top.
- **Reset saved progress**: open DevTools → Application → Local Storage → remove keys starting with `ta_`.

## Files

- `index.html` – shell page
- `app.jsx` – app code
- `manifest.webmanifest` – PWA metadata
- `sw.js` – service worker (offline)
- `icons/` – app icons

---

Built for calm focus and easy edits. Have fun building together. 🔧


## New: Stickers, XP, and Avatar
- **XP**: Completing missions gives 10 XP each.
- **Stickers** unlock at XP 10/20/30/40 and can be placed on the box preview.
- **Avatar** items unlock at XP 15/25/35 (Hat, Goggles, Gloves). Colors are editable.
- All progress saved to localStorage.


## New: Shop, Daily Streak, and Abilities
- **Daily Check‑in**: +5 XP per day, tracked locally. Keeps a running streak.
- **Shop**: Spend XP to unlock extra stickers and abilities (Focus Boost, Timer Freeze, Glow Paint).
- **Abilities**:

  - *Focus Boost*: next mission completion grants **2× XP**.

  - *Timer Freeze*: one-tap pause of the drying timer (single use).

  - *Glow Paint*: cosmetic glow on the box preview.

- XP is reduced on purchase; owned items persist via localStorage.


## Parent Dashboard & Daily Board
- **First-open reset**: On first open each day, the board regenerates from **Core** + random **Rotating** quest pools and updates streak.
- **Quest Pools editor** (PIN-locked): edit Core/Rotating quests and their XP values.
- **Quest Logbook**: daily records with XP, streak, quests, and milestones.
- **Dynamic XP**: mission XP now sums the XP value for each finished quest (with multipliers from challenges/abilities).


## Summary Snapshot & Next Unlocks
- **Save Snapshot**: Summary screen now exports a PNG (box + avatar + XP + next unlock).
- **Precise Next Unlock**: Progress bar and text use real thresholds (stickers at 10/20/30/40 XP; avatar gear at 15/25/35 XP).


## Audio & Snapshot
- Tiny WebAudio **SoundManager** with mute + volume (header). Sounds: dawn, clink, ding.
- **DOM Snapshot**: If `html2canvas` is present (CDN included), the Summary screen is captured as a PNG. Falls back to canvas snapshot otherwise.
- **Milestones config** available at top of `app.jsx` (edit `MILESTONES` array).


## Parent Dashboard Upgrades
- **Editable Milestones**: Change XP thresholds and reward names directly in the dashboard. Auto-sorted by XP. Reset to defaults anytime.
- **Export Logbook (CSV)**: One click to download a CSV containing per-day totals, quests, and milestones.


## Sticker Book & CSV Import
- **Sticker Book**: New screen showing all stickers/badges. Unlocked items are highlighted, locked are dimmed.
- **CSV Import**: In Dashboard, you can import **Core/Rotating quests** from CSV files with headers `name,xp`, and **Milestones** with headers `xpThreshold,reward`.


## Streak Badge Tiers & Seasonal Track
- **Badge Tiers**: Streak badges can be labeled Bronze/Silver/Gold; fanfare colors match tier.
- **Seasonal Track**: Monthly streak with its own badge config and editor. Auto-resets each new month, logs milestones, and celebrates with fanfare.


## Seasonal Data Loader & Quest Pools CSV (single file)
- **seasons.json**: Drop this file next to `index.html` to define season windows and their XP milestones. The app auto-loads and prefers active season milestones for the Summary's Next Unlock.
- **Quest Pools CSV**: Export both Core + Rotating pools to a single `quest-pools.csv` (columns: type,name,xp). Import the same file to replace both pools in one go.
