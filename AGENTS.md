# AGENTS.md — AI Agent Guide

Read [ARCHITECTURE.md](ARCHITECTURE.md) first — it has the full file map, component diagram, message flow, and build/release instructions.

---

## Domain knowledge — HLS download

Full reference in [`dl-mtv` skill](https://github.com/albertolicea00/agentskills/tree/main/skills/dl-mtv/references/m3u8.md): pipeline steps, obfuscation table, PNG wrapper strip, signed URL expiry, parallel download pattern, full-season batch script.

Key extension-specific note: the extension resolves HLS playlists from inside the browser (service worker) using the user's IP and cookies — bypassing IP-locked playlist tokens that would 403 from any cloud IP.

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
