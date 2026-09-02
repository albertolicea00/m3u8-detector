const M3U8_RE = /\.(m3u8|m3u)(\?|$)/i;
const CONTENT_TYPE_RE = /mpegurl|x-mpegURL/i;
const MP4_RE = /\.(mp4|mkv|webm)(\?|#|$)/i;
const VIDEO_CT_RE = /^video\/(mp4|webm|x-matroska|ogg)/i;

// detected[tabId] = [{streamUrl, pageUrl, pageTitle, cookies, segments, segmentCount, ts}]
let detected = {};

function getMergedStreams(tabId, cb) {
  chrome.storage.local.get('pinnedStreams', ({ pinnedStreams = [] }) => {
    const tabEntries = (detected[tabId] || []).map(e => ({
      ...e, pinned: pinnedStreams.some(p => p.streamUrl === e.streamUrl),
    }));
    const tabUrls = new Set(tabEntries.map(e => e.streamUrl));
    const extraPinned = pinnedStreams
      .filter(p => !tabUrls.has(p.streamUrl))
      .map(e => ({ ...e, pinned: true }));
    cb([...tabEntries, ...extraPinned]);
  });
}

function pushUpdate(tabId) {
  updateBadge(tabId);
  getMergedStreams(tabId, (streams) => {
    chrome.tabs.sendMessage(tabId, { type: 'PANEL_UPDATE', streams }, () => {
      chrome.runtime.lastError;
    });
  });
}

// Fetch playlist from service worker (user's IP — bypasses IP-locked 403)
async function resolveSegments(url) {
  try {
    const hdrs = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36',
      'Referer': new URL(url).origin,
      'Accept': '*/*',
    };
    const res = await fetch(url, { headers: hdrs });
    if (!res.ok) return null;
    const text = await res.text();

    // Master playlist → pick highest-bandwidth variant
    if (text.includes('#EXT-X-STREAM-INF')) {
      const lines = text.split('\n');
      let bestUrl = null, bestBw = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXT-X-STREAM-INF')) {
          const m = lines[i].match(/BANDWIDTH=(\d+)/);
          const bw = m ? parseInt(m[1]) : 0;
          if (bw >= bestBw) {
            bestBw = bw;
            let uri = (lines[i + 1] || '').trim();
            if (uri && !uri.startsWith('http')) {
              uri = url.substring(0, url.lastIndexOf('/') + 1) + uri;
            }
            bestUrl = uri;
          }
        }
      }
      return bestUrl ? resolveSegments(bestUrl) : null;
    }

    // Media playlist → extract segment URLs
    const base = url.substring(0, url.lastIndexOf('/') + 1);
    const segs = text.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'))
      .map(l => l.startsWith('http') ? l : base + l);
    return segs.length ? segs : null;
  } catch {
    return null;
  }
}

function addStream(tabId, streamUrl, pageUrl, pageTitle, streamType = 'hls') {
  if (!detected[tabId]) detected[tabId] = [];
  if (detected[tabId].some(e => e.streamUrl === streamUrl)) return;

  const entry = {
    streamUrl, pageUrl: pageUrl || '', pageTitle: pageTitle || '',
    cookies: '', segments: null, segmentCount: null, ts: Date.now(), streamType,
  };
  detected[tabId].push(entry);

  const cookieP = pageUrl
    ? new Promise(r => chrome.cookies.getAll({ url: pageUrl }, c => {
        entry.cookies = (c || []).map(x => `${x.name}=${x.value}`).join('; ');
        r();
      }))
    : Promise.resolve();

  if (streamType === 'hls') {
    const segP = resolveSegments(streamUrl).then(segs => {
      if (segs) { entry.segments = segs; entry.segmentCount = segs.length; }
    });
    Promise.all([cookieP, segP]).then(() => pushUpdate(tabId));
  } else {
    cookieP.then(() => pushUpdate(tabId));
  }

  pushUpdate(tabId);
}

function updateBadge(tabId) {
  const count = (detected[tabId] || []).length;
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : '', tabId });
  chrome.action.setBadgeBackgroundColor({ color: '#e53935', tabId });
}

function addStreamFromTab(tabId, streamUrl, streamType = 'hls') {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) {
      addStream(tabId, streamUrl, '', '', streamType);
    } else {
      addStream(tabId, streamUrl, tab.url || '', tab.title || '', streamType);
    }
  });
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId < 0) return;
    if (M3U8_RE.test(details.url)) addStreamFromTab(details.tabId, details.url, 'hls');
    else if (details.type === 'media' && MP4_RE.test(details.url))
      addStreamFromTab(details.tabId, details.url, 'direct');
  },
  { urls: ['<all_urls>'] }
);

chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.tabId < 0) return;
    const ct = (details.responseHeaders || [])
      .find(h => h.name.toLowerCase() === 'content-type');
    if (!ct) return;
    if (CONTENT_TYPE_RE.test(ct.value)) addStreamFromTab(details.tabId, details.url, 'hls');
    else if (details.type === 'media' && VIDEO_CT_RE.test(ct.value))
      addStreamFromTab(details.tabId, details.url, 'direct');
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders']
);

// Toolbar icon click → toggle panel
chrome.action.onClicked.addListener((tab) => {
  if (tab.id < 0) return;
  chrome.tabs.sendMessage(tab.id, { type: 'PANEL_TOGGLE' }, () => { chrome.runtime.lastError; });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading' && changeInfo.url) {
    detected[tabId] = [];
    updateBadge(tabId);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => { delete detected[tabId]; });

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg.type === 'GET_STREAMS')      reply({ streams: detected[msg.tabId] || [] });
  if (msg.type === 'GET_STREAMS_PANEL') {
    getMergedStreams(sender.tab.id, (streams) => reply({ streams }));
    return true;
  }
  if (msg.type === 'CLEAR') {
    detected[msg.tabId] = []; updateBadge(msg.tabId); reply({ ok: true });
  }
  if (msg.type === 'CLEAR_PANEL') {
    const id = sender.tab.id;
    detected[id] = []; updateBadge(id);
    getMergedStreams(id, (streams) => {
      chrome.tabs.sendMessage(id, { type: 'PANEL_UPDATE', streams }, () => { chrome.runtime.lastError; });
    });
    reply({ ok: true });
  }
  if (msg.type === 'TOGGLE_PIN') {
    const tabId = sender.tab.id;
    const { streamUrl } = msg;
    chrome.storage.local.get('pinnedStreams', ({ pinnedStreams = [] }) => {
      const idx = pinnedStreams.findIndex(e => e.streamUrl === streamUrl);
      if (idx >= 0) {
        pinnedStreams.splice(idx, 1);
      } else {
        const entry = (detected[tabId] || []).find(e => e.streamUrl === streamUrl);
        if (entry) pinnedStreams.push({ ...entry });
      }
      chrome.storage.local.set({ pinnedStreams }, () => {
        pushUpdate(tabId);
        reply({ ok: true });
      });
    });
    return true;
  }
  if (msg.type === 'SET_NAME') {
    const tabId = sender.tab.id;
    const { streamUrl, customName } = msg;
    const entry = (detected[tabId] || []).find(e => e.streamUrl === streamUrl);
    if (entry) entry.customName = customName;
    chrome.storage.local.get('pinnedStreams', ({ pinnedStreams = [] }) => {
      const pinned = pinnedStreams.find(e => e.streamUrl === streamUrl);
      if (pinned) {
        pinned.customName = customName;
        chrome.storage.local.set({ pinnedStreams });
      }
      reply({ ok: true });
    });
    return true;
  }
  if (msg.type === 'OPEN_OPTIONS') {
    chrome.runtime.openOptionsPage();
  }
  if (msg.type === 'BODY_DETECTED') {
    addStream(sender.tab.id, msg.streamUrl, msg.pageUrl || '', msg.pageTitle || '');
  }
  return true;
});
