# AGENTS.md — AI Agent Guide

Read [ARCHITECTURE.md](ARCHITECTURE.md) first — it has the full file map, component diagram, message flow, and build/release instructions.

---

## Rules

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
- Version bump → `manifest.json` `"version"` field **and** `CHANGELOG.md` entry.
- File move/rename → update all references in `manifest.json`.

### Style

- No comments explaining what code does — names should do that.
- Comment only for non-obvious WHY (CDN quirk, hidden constraint, workaround).
- No TypeScript. No bundler. No build step.
- Shadow DOM CSS: custom properties in `:host` (dark) + `@media (prefers-color-scheme: light) :host` override. GitHub-dark/light palette only.

---

## Context invalidation guard (panel.js)

Any new `chrome.*` call in `panel.js` must go through these helpers — already defined in the file:

```javascript
sendMsg({ type: '...' })           // for chrome.runtime.sendMessage
safeStorage(() => chrome.storage.local.get(...))  // for storage calls
```

If either guard detects the context is gone, it calls `showStale()` which shows "Reload page to reconnect".

---

## Common task map

| Task | Files |
|------|-------|
| Add stream property | `background.js` → `panel.js` (render + buildJSON) → `hls-colab.ipynb` → `hls-local.sh` |
| Add message type | `background.js` (onMessage) + caller via `sendMsg()` |
| Add options section | `options.html` + `options.js` + `web_accessible_resources` if new file |
| Add permission | `manifest.json` |
| Update icon | Edit `icon.svg` → export PNGs to `src/icons/` at 16/32/48/128/512px |
