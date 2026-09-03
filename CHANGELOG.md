# Changelog — M3U8 Detector

All notable changes to this project are documented here.

---

## [1.11] — 2026-09-03

### Fixed
- **`background.js`** — cookie collection now also queries `streamUrl`'s own origin, not just `pageUrl`. A domain-scoped session/clearance cookie set on the CDN host (e.g. Cloudflare-protected segment hosts) was previously dropped entirely because `chrome.cookies.getAll` was only scoped to the page's domain.
- **`hls-colab.ipynb`** — `pageUrl` and `cookies` from the extension's exported JSON were parsed on upload but never carried into the download queue (`MOVIES`), so every segment request went out with no `Cookie` header and a fabricated `Referer` (the CDN's own host instead of the real page). Both are now threaded through `get_segments` / `download_direct` / `download_all` / `retry_failed`.
- **`hls-colab.ipynb`** `combine()` — crashed with `list index out of range` when 0 segments downloaded successfully; now raises a clear `RuntimeError` instead.
- **`hls-colab.ipynb`** — `requests.Session` now mounts an `HTTPAdapter(pool_maxsize=64)`; the previous default (`10`) was smaller than the worker-count slider (up to 30), causing `Connection pool is full, discarding connection` warnings under load.

---

## [1.10] — 2026-09-02

### Changed
- Icons moved from `icons/` to `src/icons/`. Source SVG stays at root as `icon.svg`.
- Release ZIPs now generated into `dist/` instead of `../releases/`.
- README rewritten: updated file tree, workflow docs, added links to ARCHITECTURE.md, CONTRIBUTING.md, CHANGELOG.md.

---

## [1.9] — 2026-09-02

### Added
- **`hls-local.sh`** — interactive bash script (parallel curl, PNG-wrapper strip, ffmpeg mux) that downloads HLS and direct-MP4 streams to `~/Downloads` instead of Google Drive. Downloadable from the Options page alongside the Colab notebook.
- **Local downloader card** in Options page with step-by-step instructions and download button.
- **`src/scripts/`** directory for supplementary scripts; `tests/` reserved for automated tests.

### Changed
- `web_accessible_resources` now includes `src/scripts/hls-local.sh`.
- ARCHITECTURE file map updated to reflect new folder structure.
- Release ZIP command includes `src/` directory.

---

## [1.8] — 2026-09-02

### Added
- **New minimal app icon** — High-contrast, wall-to-wall design featuring a red detection dot and bold lowercase `m3u8` typography, scaled for maximum visibility across 16px to 512px icon sizes.
- **Repository documentation** — Added `ARCHITECTURE.md` (system design, sequence diagram, build & release guides for Chrome Web Store and Firefox AMO), `CONTRIBUTING.md` (contribution guidelines), and `LICENSE` (MIT License).
- **Local download script support** — Added `hls-local.sh` documentation for downloading HLS and direct MP4 streams locally on macOS/Linux via `ffmpeg`.

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
