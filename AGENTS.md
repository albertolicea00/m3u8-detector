# AGENTS.md — AI Agent Guide

Read [ARCHITECTURE.md](ARCHITECTURE.md) first — it has the full file map, component diagram, message flow, and build/release instructions.

---

## Domain knowledge — HLS download

### HLS structure

```
master.m3u8 (or .txt)
  └── index-v1-a1.m3u8          ← media playlist
        ├── seg-1.ts / .woff2 / .image / .jpg
        ├── seg-2.ts
        └── ...
```

The extension resolves this tree from inside the browser (service worker) using the user's IP and cookies — bypassing IP-locked playlist tokens that would 403 from any cloud IP.

### Download decision tree

```
Try ffmpeg direct
  └── exit 183 / "not in allowed_segment_extensions"?
        └── Fetch media playlist → extract segment URLs
              ├── Absolute (https://) → grep '^https'
              └── Relative           → prefix with BASE_URL
        └── Download in parallel (xargs -P 15 curl)
        └── PNG wrapper on segments? → strip IEND marker
        └── ffmpeg -c copy -bsf:a aac_adtstoasc → MP4
```

### Obfuscation patterns

| Fake ext | Real content | Platform | Extra |
|---|---|---|---|
| `.woff2` | MPEG-TS | vscdn.xyz, streamtape | Extension only |
| `.image` | PNG + MPEG-TS | TikTok CDN via proxy | **PNG header prepended** |
| `.jpg`, `.png` | MPEG-TS | Generic piracy hosts | Extension only |
| `.txt` | M3U8 playlist | Various | Extension only |

ffmpeg detects by magic bytes, not extension — so `.woff2` segments mux fine once on disk.

### PNG wrapper strip (TikTok CDN)

Segments have a valid 1×1 PNG prepended to the real MPEG-TS. Detect with `file seg.bin` → "PNG image data, 1 x 1" but hundreds of KB.

```python
IEND = b'IEND\xaeB\x60\x82'  # PNG end marker + CRC (8 bytes)
segs = sorted(glob.glob(f"{workdir}/seg-*.ts"), key=lambda p: int(...))
with open("combined.ts", "wb") as out:
    for path in segs:
        data = open(path, "rb").read()
        pos = data.find(IEND)
        out.write(data[pos + len(IEND):] if pos != -1 else data)
```

Already implemented in `src/notebooks/hls-colab.ipynb` and `src/scripts/hls-local.sh`.

### Signed URL expiry

TikTok CDN signs segment URLs with `x-expires=UNIX_TIMESTAMP`. After expiry → 403.

```bash
date -r 1817324583   # macOS: check if expired
```

Fix: re-fetch the media playlist (get fresh signed URLs), re-download only missing segments.

### Parallel download pattern

```bash
# Build indexed list
i=0
while IFS= read -r url; do
  i=$((i+1)); printf "%04d\t%s\n" "$i" "$url"
done < segments.txt | \
xargs -P 15 -L 1 bash -c '
  idx="${1%%$'"'"'\t'"'"'*}"; url="${1#*$'"'"'\t'"'"'}"
  out="seg-${idx}.ts"
  [ -f "$out" ] && exit 0
  curl -sfL --retry 3 -H "User-Agent: Mozilla/5.0" -o "$out" "$url"
' _
```

### Serie / batch download approach

For downloading a full season from a listing page (e.g. cuevana3l.biz):

```
Season page URL
  └── curl HTML → grep episodio-[0-9]+ links
        └── per episode:
              1. yt-dlp (handles JS-rendered players)
              2. curl HTML → iframe src → grep m3u8/txt URL
              3. ffmpeg direct
              4. manual segment download + PNG strip
        └── subliminal → .es.srt subtitles
```

Fallback for JS-only players (m3u8 not in HTML): capture URLs manually with DevTools → Network → m3u8.

---

## Extension rules

### Never

- Call `chrome.runtime.openOptionsPage()` from `panel.js` / `content.js` — SW only. Send `{ type: 'OPEN_OPTIONS' }` to background instead.
- Call `chrome.runtime.sendMessage()` directly in `panel.js`. Use `sendMsg()`.
- Call `chrome.storage.local.*` directly in `panel.js`. Use `safeStorage(() => ...)`.
- Add external `<script>` URLs to `options.html` — MV3 CSP blocks them.
- Move `manifest.json` out of project root.
- Commit anything in `dist/` — gitignored.
- Re-add `popup.html` / `popup.js` — intentionally removed.

### Always

- New `chrome.*` call in `panel.js` → wrap in `sendMsg()` or `safeStorage()`.
- New file fetchable by the extension → add to `web_accessible_resources` in `manifest.json`.
- New message type → add `case` to `onMessage` switch in `background.js`.
- Version bump → `manifest.json` `"version"` **and** `CHANGELOG.md` entry.
- File move/rename → update all references in `manifest.json`.

### Style

- No comments explaining what code does.
- Comment only for non-obvious WHY (CDN quirk, hidden constraint, workaround).
- No TypeScript. No bundler. No build step.
- Shadow DOM CSS: custom properties in `:host` (dark) + `@media (prefers-color-scheme: light) :host`. GitHub-dark/light palette only.

---

## Context invalidation guard (panel.js)

Any new `chrome.*` call in `panel.js` must go through these helpers:

```javascript
sendMsg({ type: '...' })                          // chrome.runtime.sendMessage
safeStorage(() => chrome.storage.local.get(...))  // chrome.storage.*
```

Both check `isCtx()` first and call `showStale()` ("Reload page to reconnect") if context is gone.

---

## Common task map

| Task | Files |
|------|-------|
| Add stream property | `background.js` → `panel.js` (render + buildJSON) → `hls-colab.ipynb` → `hls-local.sh` |
| Add message type | `background.js` (onMessage) + caller via `sendMsg()` |
| Add options section | `options.html` + `options.js` + `web_accessible_resources` if new file |
| Add permission | `manifest.json` |
| Update icon | Edit `icon.svg` → export PNGs to `src/icons/` at 16/32/48/128/512px |
| Fix expired segment URLs | Re-fetch media playlist → re-download missing segments |
| Add new CDN obfuscation | Add pattern to `background.js` detection regex + document in this file |
