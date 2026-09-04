# M3U8 Detector

Chrome/Firefox extension (Manifest V3) that detects HLS streams on any page, resolves segment URLs from the service worker (bypassing IP-locked playlist tokens), detects direct MP4/WebM/MKV video requests, and exports everything needed to download streams with the companion Colab notebook or local bash script.

---

## 📥 Installation

### 🌐 From Extension Stores (Recommended)

Installing from the official stores is the easiest way to get **M3U8 Detector** and ensure it stays updated automatically.

> ⚠️ **Firefox, Chrome, Edge, Opera versions on the way — review in progress**

<!--
- 🟢 **Chrome** (Brave, Vivaldi): [Download from Chrome Web Store](https://chromewebstore.google.com/detail/m3u8-detector)
- 🔵 **Edge**: [Download from Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/m3u8-detector)
- 🔴 **Opera**: [Download from Opera Add-ons](https://addons.opera.com/extensions/details/m3u8-detector)
- 🦊 **Firefox**: [Download from Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/m3u8-detector/)
-->

### 🛠️ Manual Installation (Developer Mode)

**Chrome**
1. `chrome://extensions` → enable **Developer mode**
2. **Load unpacked** → select the `m3u8-detector/` folder

**Firefox**
1. `about:debugging` → **This Firefox** → **Load Temporary Add-on**
2. Select `manifest.json` inside `m3u8-detector/`

---

## Files

```
manifest.json           Extension manifest v3
icon.svg                Source SVG icon
src/
  background.js         Service worker — intercepts requests, resolves playlists, stores streams
  content.js            Injects interceptor.js into page; bridges XHR/fetch events to background
  interceptor.js        Runs in page MAIN world — wraps XHR and fetch to detect m3u8 URLs
  panel.js              Sidebar panel injected into every page (shadow DOM)
  options.html          Options page — pinned streams, notebook/script download, help
  options.js            Options page logic
  notebooks/
    hls-colab.ipynb     Google Colab notebook — HLS + direct MP4 → Google Drive
  scripts/
    hls-local.sh        Local bash script — HLS + direct MP4 → ~/Downloads
  icons/
    icon16.png … icon512.png
```

---

## Panel

Click the toolbar icon to toggle the sidebar panel.

Each detected stream shows:
- **Page title** (yellow) and page URL (gray)
- **Stream URL** (blue) or "Direct video" label for MP4/WebM
- Segment resolution status → `✓ N segments ready` once resolved
- Copy buttons: stream URL, page URL, cookies
- **Pin** — survives Clear and page navigation
- **⚙** → opens Options page

Footer:
- **Save JSON** — downloads `m3u8_<hostname>_<timestamp>.json` ← *use this with Colab or hls-local.sh*
- **Clear** — clears detected streams for current tab

---

## Download workflow

### Option A — Google Colab (saves to Google Drive)

1. Browse to the movie page — extension auto-detects and resolves segments.
2. Wait for `✓ N segments ready` → click **Save JSON**.
3. Open Options → **Download hls-colab.ipynb** → open in Google Colab.
4. Run Cell 1 → Cell 2 → **Load JSON** → select file → **Apply** → run Cell 3 & 4.

Output: `MyDrive/Movies/<name>.mp4`

### Option B — Local script (saves to ~/Downloads)

1. Open Options → **Download hls-local.sh**
2. `chmod +x hls-local.sh`
3. `./hls-local.sh path/to/m3u8_*.json`

Requires: `curl`, `ffmpeg`, `python3`

---

## Colab technical notes

> Solves the IP-lock problem: some sites embed `ip_cidr` in signed playlist URLs so Colab (Google datacenter IP) gets 403. The extension resolves playlists from your browser (your IP) and exports the CDN segment URLs, which are NOT IP-locked.

- **PNG wrapper**: TikTok CDN segments have a 1×1 PNG prepended to disguise MPEG-TS. Both the notebook and `hls-local.sh` detect the `\x89PNG` magic bytes and strip the wrapper up to the `IEND` marker.
- **Shadow DOM panel**: `panel.js` uses a shadow root — extension styles never bleed into the host page.
- **Bridge pattern**: `interceptor.js` (MAIN world) dispatches `CustomEvent` → `content.js` (isolated world) → `chrome.runtime.sendMessage` → background.

---

## JSON export format

```json
[
  {
    "pageTitle": "Toy Story 5",
    "pageUrl": "https://example.com/...",
    "streamUrl": "https://cdn.example.com/master.m3u8",
    "streamType": "hls",
    "cookies": "popUnderAdsEnabled=true",
    "segmentCount": 611,
    "segments": ["https://cdn.example.com/seg001.ts", "…"],
    "detectedAt": "2026-09-02T10:00:00.000Z"
  }
]
```

`streamType` is `"hls"` or `"direct"` (for MP4/WebM detected via `<video>` element).

---

## Docs

- [ARCHITECTURE.md](ARCHITECTURE.md) — system design, component diagram, build & release guide
- [CONTRIBUTING.md](CONTRIBUTING.md) — contribution guidelines
- [CHANGELOG.md](CHANGELOG.md) — version history

## Agent skill

HLS download knowledge (pipeline, obfuscation patterns, PNG strip, signed URLs, full-season batch) lives in the skill [dl-mtv](https://github.com/albertolicea00/agentskills/tree/main/skills/dl-mtv). Install it so your AI agent knows how to download what this extension detects:

```bash
npx skills add albertolicea00/agentskills --skill dl-mtv -g
```
