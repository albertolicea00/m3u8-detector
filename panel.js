(function () {
  if (document.getElementById('__m3u8_host__')) return;

  // ── Shadow host (fixed, full-height, right side) ─────────────────────────
  const host = document.createElement('div');
  host.id = '__m3u8_host__';
  Object.assign(host.style, {
    position: 'fixed', top: '0', right: '0', height: '100%',
    zIndex: '2147483647', pointerEvents: 'none',
  });
  document.documentElement.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });

  // ── Styles ────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Tab handle (collapsed) ── */
    .m-tab {
      position: absolute;
      right: 0;
      top: 38%;
      pointer-events: all;
      cursor: pointer;
      background: #e94560;
      color: #fff;
      font: 600 11px/1 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 12px 5px;
      border-radius: 6px 0 0 6px;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      letter-spacing: 1px;
      user-select: none;
      box-shadow: -2px 0 8px rgba(0,0,0,.35);
      transition: background .15s, right .2s;
    }
    .m-tab:hover { background: #c62a47; }
    .m-tab.shifted { right: 380px; }

    /* ── Panel ── */
    .m-panel {
      position: absolute;
      top: 0;
      right: -381px;
      width: 380px;
      height: 100%;
      background: #1a1a2e;
      border-left: 1px solid #0f3460;
      pointer-events: all;
      display: flex;
      flex-direction: column;
      transition: right .2s ease;
      box-shadow: -4px 0 20px rgba(0,0,0,.45);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      color: #e0e0e0;
    }
    .m-panel.open { right: 0; }

    /* header */
    .m-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 12px;
      background: #16213e;
      border-bottom: 1px solid #0f3460;
      flex-shrink: 0;
    }
    .m-title  { color: #e94560; font-size: 14px; font-weight: 600; flex: 1; }
    .m-count  { color: #888; font-size: 11px; }
    .m-icon {
      background: none;
      border: none;
      cursor: pointer;
      color: #666;
      font-size: 13px;
      padding: 3px 5px;
      border-radius: 3px;
      line-height: 1;
      flex-shrink: 0;
    }
    .m-icon:hover { background: #0f3460; color: #e0e0e0; }
    .m-icon.on    { color: #e94560; }

    /* body / list */
    .m-body {
      flex: 1;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #0f3460 transparent;
    }
    .m-empty { padding: 28px 14px; color: #444; text-align: center; font-size: 12px; }

    .m-item {
      padding: 9px 12px;
      border-bottom: 1px solid #0f3460;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .m-item:hover { background: #16213e; }
    .m-page-title { font-size: 12px; color: #f0c040; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .m-page-url   { font-size: 10px; color: #555;    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .m-stream-url { font-size: 10px; color: #a8d8ea; word-break: break-all; line-height: 1.4; margin-top: 2px; }
    .m-row        { display: flex; align-items: center; gap: 6px; margin-top: 4px; flex-wrap: wrap; }
    .m-time       { font-size: 10px; color: #444; flex: 1; }

    .m-copy {
      font-size: 10px;
      padding: 2px 6px;
      border: 1px solid #0f3460;
      background: #0f3460;
      color: #a8d8ea;
      border-radius: 3px;
      cursor: pointer;
      white-space: nowrap;
    }
    .m-copy:hover { background: #e94560; border-color: #e94560; color: #fff; }
    .m-copy.ok    { background: #2e7d32; border-color: #2e7d32; color: #fff; }

    /* footer */
    .m-footer {
      padding: 8px 12px;
      background: #16213e;
      border-top: 1px solid #0f3460;
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }
    .m-btn {
      flex: 1;
      font-size: 11px;
      padding: 5px 8px;
      border-radius: 4px;
      cursor: pointer;
      border: 1px solid;
      background: transparent;
    }
    .m-btn.export { border-color: #4caf50; color: #4caf50; }
    .m-btn.export:hover { background: #4caf50; color: #fff; }
    .m-btn.clr    { border-color: #e94560; color: #e94560; }
    .m-btn.clr:hover  { background: #e94560; color: #fff; }
  `;
  shadow.appendChild(style);

  // ── Tab handle ────────────────────────────────────────────────────────────
  const tab = document.createElement('div');
  tab.className = 'm-tab';
  tab.textContent = 'M3U8 (0)';
  shadow.appendChild(tab);

  // ── Panel shell ───────────────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.className = 'm-panel';
  panel.innerHTML = `
    <div class="m-header">
      <span class="m-title">M3U8 Detector</span>
      <span class="m-count" id="m-count">0 streams</span>
      <button class="m-icon" id="m-pin" title="Pin panel">📌</button>
      <button class="m-icon" id="m-close" title="Close">✕</button>
    </div>
    <div class="m-body" id="m-body">
      <div class="m-empty" id="m-empty">No streams detected on this page.</div>
    </div>
    <div class="m-footer">
      <button class="m-btn export" id="m-copy-json">Copy JSON</button>
      <button class="m-btn export" id="m-export">Save JSON</button>
      <button class="m-btn clr"    id="m-clear">Clear</button>
    </div>
  `;
  shadow.appendChild(panel);

  // ── State ─────────────────────────────────────────────────────────────────
  let streams = [];
  let isOpen  = false;
  let isPinned = false;

  const $ = id => shadow.getElementById(id);

  function open() {
    isOpen = true;
    panel.classList.add('open');
    tab.classList.add('shifted');
  }
  function close() {
    if (isPinned) return;
    isOpen = false;
    panel.classList.remove('open');
    tab.classList.remove('shifted');
  }
  function setPin(val) {
    isPinned = val;
    $('m-pin').classList.toggle('on', isPinned);
    chrome.storage.local.set({ m3u8_pinned: isPinned });
    if (!isPinned && !isOpen) panel.classList.remove('open');
  }

  // Restore pin
  chrome.storage.local.get('m3u8_pinned', ({ m3u8_pinned }) => {
    if (m3u8_pinned) { isPinned = true; $('m-pin').classList.add('on'); open(); }
  });

  // ── Render ────────────────────────────────────────────────────────────────
  function copyBtn(label, text) {
    const btn = document.createElement('button');
    btn.className = 'm-copy';
    btn.textContent = label;
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('ok');
        setTimeout(() => { btn.textContent = label; btn.classList.remove('ok'); }, 1500);
      });
    });
    return btn;
  }

  function render() {
    const body = $('m-body');
    body.querySelectorAll('.m-item').forEach(el => el.remove());

    tab.textContent = `M3U8 (${streams.length})`;
    $('m-count').textContent = `${streams.length} stream${streams.length !== 1 ? 's' : ''}`;
    $('m-empty').style.display = streams.length ? 'none' : 'block';

    [...streams].reverse().forEach(({ streamUrl, pageUrl, pageTitle, cookies = '', segments = null, segmentCount = null, ts }) => {
      const item = document.createElement('div');
      item.className = 'm-item';

      if (pageTitle) {
        const el = document.createElement('div');
        el.className = 'm-page-title'; el.textContent = pageTitle; el.title = pageTitle;
        item.appendChild(el);
      }
      if (pageUrl) {
        const el = document.createElement('div');
        el.className = 'm-page-url'; el.textContent = pageUrl; el.title = pageUrl;
        item.appendChild(el);
      }

      const su = document.createElement('div');
      su.className = 'm-stream-url'; su.textContent = streamUrl;
      item.appendChild(su);

      const segLine = document.createElement('div');
      segLine.style.cssText = 'font-size:10px;margin-top:3px;';
      if (segments === null) {
        segLine.style.color = '#888';
        segLine.textContent = '⏳ Resolving segments…';
      } else {
        segLine.style.color = '#4caf50';
        segLine.textContent = `✓ ${segmentCount} segments ready`;
      }
      item.appendChild(segLine);

      const row = document.createElement('div');
      row.className = 'm-row';

      const time = document.createElement('span');
      time.className = 'm-time';
      time.textContent = new Date(ts).toLocaleTimeString();
      row.appendChild(time);
      row.appendChild(copyBtn('Copy stream', streamUrl));
      if (pageUrl) row.appendChild(copyBtn('Copy page', pageUrl));
      if (cookies)  row.appendChild(copyBtn('Copy cookies', cookies));
      if (segments) {
        const safe = (pageTitle || 'segments').replace(/[^a-z0-9]/gi, '_').slice(0, 30);
        const dlBtn = document.createElement('button');
        dlBtn.className = 'm-copy';
        dlBtn.textContent = `⬇ ${segmentCount} segs`;
        dlBtn.style.cssText = 'border-color:#4caf50;color:#4caf50;';
        dlBtn.addEventListener('click', () => {
          const blob = new Blob([segments.join('\n')], { type: 'text/plain' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob); a.download = `${safe}_segments.txt`; a.click();
          URL.revokeObjectURL(a.href);
        });
        row.appendChild(dlBtn);
      }

      item.appendChild(row);
      body.appendChild(item);
    });
  }

  // ── Event listeners ───────────────────────────────────────────────────────
  tab.addEventListener('click', () => { isOpen ? close() : open(); });

  $('m-close').addEventListener('click', () => { setPin(false); close(); });
  $('m-pin').addEventListener('click', () => { setPin(!isPinned); if (isPinned) open(); });

  // Click outside to close (unpinned)
  document.addEventListener('click', (e) => {
    if (!isPinned && isOpen && !e.composedPath().includes(host)) close();
  }, true);

  $('m-clear').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_PANEL' }, () => {
      streams = []; render();
    });
  });

  function buildJSON() {
    return JSON.stringify(streams.map(({ streamUrl, pageUrl, pageTitle, cookies = '', segments = null, segmentCount = null, ts }) => ({
      pageTitle, pageUrl, streamUrl, cookies, segmentCount, segments,
      detectedAt: new Date(ts).toISOString(), detectedAtMs: ts,
    })), null, 2);
  }

  $('m-copy-json').addEventListener('click', () => {
    navigator.clipboard.writeText(buildJSON()).then(() => {
      const btn = $('m-copy-json');
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy JSON'; }, 1500);
    });
  });

  $('m-export').addEventListener('click', () => {
    const blob = new Blob([buildJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `m3u8_${location.hostname}_${Date.now()}.json`;
    a.click();
  });

  // ── Init from background ──────────────────────────────────────────────────
  chrome.runtime.sendMessage({ type: 'GET_STREAMS_PANEL' }, (res) => {
    streams = (res && res.streams) || [];
    render();
  });

  // Live push + toggle from background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'PANEL_TOGGLE') { isOpen ? close() : open(); return; }
    if (msg.type !== 'PANEL_UPDATE') return;
    streams = msg.streams;
    render();
    if (!isOpen) {
      tab.style.background = '#ff6b6b';
      setTimeout(() => { tab.style.background = ''; }, 600);
    }
  });
})();
