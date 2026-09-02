# M3U8 Detector

Chrome extension (Manifest V3) that detects HLS streams on any page, resolves segment URLs from the service worker (bypassing IP-locked playlist tokens), and exports everything needed to download streams with the companion Colab notebook.

---

## Install

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** → select this folder (`m3u8-detector/`)

---

## Files

```
manifest.json      Extension manifest v3 (v1.4)
background.js      Service worker — intercepts requests, resolves playlists, stores streams
content.js         Injects interceptor.js into page; bridges XHR/fetch events to background
interceptor.js     Runs in page MAIN world — wraps XHR and fetch to detect m3u8 URLs
panel.js           Sidebar panel injected into every page (shadow DOM, Octotree-style)
options.html       Options page — workflow guide + notebook download
options.js         Options page logic — Colab notebook embedded as inline JSON string
popup.html         (unused — kept for reference, not loaded by manifest)
popup.js           (unused — kept for reference, not loaded by manifest)
```

---

## Panel

Click the toolbar icon to toggle the sidebar panel (or pin it open with 📌).

Each detected stream shows:
- **Page title** (yellow) and page URL (gray)
- **Stream URL** (blue)
- Segment resolution status → `✓ N segments ready` once resolved
- Copy buttons: stream URL, page URL, cookies
- **⬇ N segs** button — downloads `_segments.txt` (one URL per line) — *alternative export*
- **⚙** → opens Options page

Footer:
- **Copy JSON** — copies all streams to clipboard
- **Save JSON** — downloads `m3u8_<hostname>_<timestamp>.json` ← *use this with Colab*
- **Clear** — clears detected streams for current tab

---

## Colab Workflow

> Solves the IP-lock problem: morencius.com embeds `ip_cidr` in signed playlist URLs, so Colab (Google datacenter IP) gets 403. The extension resolves playlists from your browser (your IP) and exports the TikTok CDN segment URLs, which are NOT IP-locked.

### Steps

1. Go to the movie page. Extension intercepts the stream automatically.
2. Wait for `✓ N segments ready` in the panel (usually 1–3 seconds).
3. Click **Save JSON** → saves `m3u8_*.json` to your Downloads.
4. Open Options (⚙) → click **⬇ Download downloader.ipynb** → open in Google Colab.
5. Run **Cell 1** (installs ffmpeg, mounts Drive).
6. Run **Cell 2** → click **⬆ Load JSON** → select the `m3u8_*.json` file.
   - Auto-populates all detected streams as downloadable movies.
   - Each stream uses `pageTitle` as the movie name.
7. Click **✓ Apply**.
8. Run **Cell 3** (loads functions), then **Cell 4** (downloads + muxes → Drive).

Output: `MyDrive/Movies/<name>.mp4`

### JSON export format

```json
[
  {
    "pageTitle": "Toy Story 5",
    "pageUrl": "https://morencius.com/...",
    "streamUrl": "https://…/master.m3u8",
    "cookies": "popUnderAdsEnabled=true",
    "segmentCount": 611,
    "segments": ["https://cdn.tiktok.com/…/seg001.image", "…"],
    "detectedAt": "2026-09-02T10:00:00.000Z"
  }
]
```

---

## Technical notes

- **IP-lock bypass**: `resolveSegments()` in `background.js` runs inside the Chrome service worker — same machine, same IP as the browser. Fetches the IP-locked playlist successfully. TikTok CDN segment URLs are time-limited (via `x-expires`) but NOT IP-locked, so Colab downloads them fine.
- **PNG wrapper**: TikTok CDN segments have a 1×1 PNG prepended to disguise MPEG-TS as image files. The Colab notebook detects the `\x89PNG` magic bytes and strips the wrapper up to the `IEND` marker before muxing.
- **Shadow DOM panel**: `panel.js` creates a shadow root so extension styles never bleed into the host page.
- **Bridge pattern**: `interceptor.js` runs in the page MAIN world (can intercept XHR/fetch) but cannot access `chrome.runtime`. It dispatches a `CustomEvent` → `content.js` (isolated world) picks it up → forwards to background via `chrome.runtime.sendMessage`.
