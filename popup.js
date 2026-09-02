function fmtTime(ts) { return new Date(ts).toLocaleTimeString(); }
function fmtISO(ts)  { return new Date(ts).toISOString(); }

function copyBtn(label, text) {
  const btn = document.createElement('button');
  btn.className = 'copy-btn';
  btn.textContent = label;
  btn.addEventListener('click', () => {
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = label; btn.classList.remove('copied'); }, 1500);
    });
  });
  return btn;
}

function dlBtn(label, filename, content, mime = 'text/plain') {
  const btn = document.createElement('button');
  btn.className = 'copy-btn';
  btn.textContent = label;
  btn.style.borderColor = '#4caf50';
  btn.style.color = '#4caf50';
  btn.addEventListener('click', () => {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  return btn;
}

let allStreams = [];

function render(streams) {
  allStreams = streams;
  const empty = document.getElementById('empty');
  const list  = document.getElementById('list');
  const count = document.getElementById('count');

  count.textContent = `${streams.length} stream${streams.length !== 1 ? 's' : ''}`;
  list.innerHTML = '';

  if (streams.length === 0) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  [...streams].reverse().forEach(({ streamUrl = '', pageUrl = '', pageTitle = '', cookies = '', segments = null, segmentCount = null, ts }) => {
    const item = document.createElement('div');
    item.className = 'item';

    if (pageTitle) {
      const el = document.createElement('div');
      el.className = 'page-title'; el.textContent = pageTitle; el.title = pageTitle;
      item.appendChild(el);
    }
    if (pageUrl) {
      const el = document.createElement('div');
      el.className = 'page-url'; el.textContent = pageUrl; el.title = pageUrl;
      item.appendChild(el);
    }

    const su = document.createElement('div');
    su.className = 'stream-url'; su.textContent = streamUrl;
    item.appendChild(su);

    // Segment status line
    const segLine = document.createElement('div');
    segLine.className = 'time';
    segLine.style.marginTop = '2px';
    if (segments === null) {
      segLine.textContent = '⏳ Resolving segments…';
    } else {
      segLine.textContent = `✓ ${segmentCount} segments resolved`;
      segLine.style.color = '#4caf50';
    }
    item.appendChild(segLine);

    const row = document.createElement('div');
    row.className = 'row';

    const time = document.createElement('span');
    time.className = 'time'; time.textContent = fmtTime(ts);
    row.appendChild(time);

    row.appendChild(copyBtn('Copy stream', streamUrl));
    if (pageUrl) row.appendChild(copyBtn('Copy page', pageUrl));
    if (cookies)  row.appendChild(copyBtn('Copy cookies', cookies));
    if (segments) {
      const safe = pageTitle.replace(/[^a-z0-9]/gi, '_').slice(0, 30) || 'segments';
      row.appendChild(dlBtn(`⬇ segments (${segmentCount})`, `${safe}_segments.txt`, segments.join('\n')));
    }

    item.appendChild(row);
    list.appendChild(item);
  });
}

function exportJSON(streams, tabTitle) {
  const data = streams.map(({ streamUrl, pageUrl, pageTitle, cookies = '', segmentCount = null, ts }) => ({
    pageTitle, pageUrl, streamUrl, cookies, segmentCount,
    detectedAt: fmtISO(ts), detectedAtMs: ts,
  }));
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  const safe = (tabTitle || 'streams').replace(/[^a-z0-9]/gi, '_').slice(0, 40);
  a.download = `m3u8_${safe}_${Date.now()}.json`;
  a.href = URL.createObjectURL(blob);
  a.click();
  URL.revokeObjectURL(a.href);
}

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab) return;
  const tabId = tab.id;

  chrome.runtime.sendMessage({ type: 'GET_STREAMS', tabId }, ({ streams }) => render(streams));

  document.getElementById('export-btn').addEventListener('click', () => exportJSON(allStreams, tab.title));
  document.getElementById('clear-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'CLEAR', tabId }, () => render([]));
  });
});
