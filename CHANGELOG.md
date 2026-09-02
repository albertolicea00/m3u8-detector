# Changelog — M3U8 Detector

All notable changes to this project are documented here.

---

## [1.7] — 2026-09-02

### Added
- **Firefox support** — `browser_specific_settings.gecko` in manifest (`strict_min_version: 109.0`). All `chrome.*` calls work via Firefox's built-in compatibility shim.
- **Light / dark mode** — both the panel and the options page now auto-detect browser/OS theme via `prefers-color-scheme`. Dark uses GitHub-dark palette (`#0d1117`). Light uses GitHub-light palette (`#ffffff`).
- **Direct video detection** (MP4/WebM/MKV) — extension now detects `<video>` element requests for `.mp4`, `.mkv`, `.webm` files via `webRequest` (type: `media`) and video content-type responses. Shown as "Direct video" label in panel. Captured in exported JSON as `streamType: "direct"`.
- **Colab direct-download support** — Colab notebook now branches on `streamType`. HLS streams go through the existing segment pipeline; direct MP4 streams are downloaded with a single streaming request + progress bar (no ffmpeg mux needed).

### Changed
- Panel CSS refactored to CSS custom properties (`--p-bg`, `--p-accent`, etc.) — enables clean theme switching without duplicating rules.
- Options page `btn.ok` background changed to `rgba` so it renders correctly on light backgrounds.

---

## [1.6] — 2026-09-02

### Added
- Extension icons (`icons/icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`, `icon512.png`) registered in manifest `icons` and `action.default_icon`.

---

## [1.5] — 2026-09-02

### Fixed
- `chrome.runtime.openOptionsPage is not a function` error in panel — `panel.js` now sends `OPEN_OPTIONS` message to background, which calls `openOptionsPage()` from the service worker context where it is available.

### Added
- MP4 URL and video content-type detection groundwork in background listeners.

---

## [1.4] — 2026-09-01

### Added
- **Inline name editing** per stream — click the stream name in the panel to rename; custom name persists with pin and is used as MP4 filename in Colab.
- **Pin feature** — streams can be pinned to survive Clear and page navigation; stored in `chrome.storage.local`.
- **Options page redesign** — centered GitHub-dark layout with sticky nav, tabs (Streams / Notebook / Help), GitHub link, README rendered as help docs.
- **SVG icons** in panel header and per-item pin button (replacing emojis).
- **Pinned items at bottom** of panel list with "PINNED" divider.
- **Colab notebook** (`hls-colab.ipynb`) embedded in extension folder; downloadable from Options page via `chrome.runtime.getURL`.
- `buildJSON()` exports full `segments` array (not just count) so Colab skips re-fetching the playlist.

---

## [1.3] — 2026-09-01

### Added
- Colab notebook reads JSON exported by extension (`⬆ Load JSON` button); no separate segment `.txt` file needed.
- `customName` and `name` fields in exported JSON for MP4 filename resolution.

---

## [1.2] — 2026-08-31

### Added
- Panel `getMergedStreams()` — merges ephemeral `detected[tabId]` with persistent `pinnedStreams` from storage.
- `CLEAR_PANEL` only clears ephemeral tab state; pinned streams survive via storage re-injection.
- `SET_NAME` handler updates both ephemeral and pinned storage entries.

---

## [1.1] — 2026-08-31

### Added
- Shadow DOM sidebar panel (Octotree-style, fixed right side).
- Badge count on toolbar icon.
- `resolveSegments()` — service worker fetches IP-locked m3u8 playlists using user's IP, extracts CDN segment URLs.
- `interceptor.js` XHR/fetch hook injected into MAIN world for player-level detection.
