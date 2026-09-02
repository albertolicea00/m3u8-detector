function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString();
}

function fmtISO(ts) {
  return new Date(ts).toISOString();
}

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

let allStreams = [];

function render(streams) {
  allStreams = streams;
  const empty = document.getElementById('empty');
  const list  = document.getElementById('list');
  const count = document.getElementById('count');

  count.textContent = `${streams.length} stream${streams.length !== 1 ? 's' : ''}`;
  list.innerHTML = '';

  if (streams.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  [...streams].reverse().forEach(({ streamUrl = '', pageUrl = '', pageTitle = '', cookies = '', ts }) => {
    const item = document.createElement('div');
    item.className = 'item';

    if (pageTitle) {
      const title = document.createElement('div');
      title.className = 'page-title';
      title.textContent = pageTitle;
      title.title = pageTitle;
      item.appendChild(title);
    }

    if (pageUrl) {
      const purl = document.createElement('div');
      purl.className = 'page-url';
      purl.textContent = pageUrl;
      purl.title = pageUrl;
      item.appendChild(purl);
    }

    const surl = document.createElement('div');
    surl.className = 'stream-url';
    surl.textContent = streamUrl;
    item.appendChild(surl);

    const row = document.createElement('div');
    row.className = 'row';

    const time = document.createElement('span');
    time.className = 'time';
    time.textContent = fmtTime(ts);
    row.appendChild(time);

    row.appendChild(copyBtn('Copy stream URL', streamUrl));
    if (pageUrl) row.appendChild(copyBtn('Copy page URL', pageUrl));
    if (cookies)  row.appendChild(copyBtn('Copy cookies', cookies));

    item.appendChild(row);
    list.appendChild(item);
  });
}

function exportJSON(streams, tabTitle) {
  const data = streams.map(({ streamUrl, pageUrl, pageTitle, cookies = '', ts }) => ({
    pageTitle,
    pageUrl,
    streamUrl,
    cookies,
    detectedAt: fmtISO(ts),
    detectedAtMs: ts,
  }));
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const safe = (tabTitle || 'streams').replace(/[^a-z0-9]/gi, '_').slice(0, 40);
  a.download = `m3u8_${safe}_${Date.now()}.json`;
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);
}

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab) return;
  const tabId = tab.id;

  chrome.runtime.sendMessage({ type: 'GET_STREAMS', tabId }, ({ streams }) => {
    render(streams);
  });

  document.getElementById('export-btn').addEventListener('click', () => {
    exportJSON(allStreams, tab.title);
  });

  document.getElementById('clear-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'CLEAR', tabId }, () => render([]));
  });
});
