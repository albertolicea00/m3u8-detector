const M3U8_RE = /\.(m3u8|m3u)(\?|$)/i;
const CONTENT_TYPE_RE = /mpegurl|x-mpegURL/i;

// detected[tabId] = [{streamUrl, pageUrl, pageTitle, cookies, ts}]
let detected = {};

function pushUpdate(tabId) {
  updateBadge(tabId);
  chrome.tabs.sendMessage(tabId, { type: 'PANEL_UPDATE', streams: detected[tabId] }, () => {
    chrome.runtime.lastError;
  });
}

function addStream(tabId, streamUrl, pageUrl, pageTitle) {
  if (!detected[tabId]) detected[tabId] = [];
  if (detected[tabId].some(e => e.streamUrl === streamUrl)) return;

  const entry = { streamUrl, pageUrl: pageUrl || '', pageTitle: pageTitle || '', cookies: '', ts: Date.now() };
  detected[tabId].push(entry);

  // Grab all cookies for the page URL (includes HttpOnly)
  if (pageUrl) {
    chrome.cookies.getAll({ url: pageUrl }, (cookies) => {
      entry.cookies = (cookies || []).map(c => `${c.name}=${c.value}`).join('; ');
      pushUpdate(tabId);
    });
  } else {
    pushUpdate(tabId);
  }
}

function updateBadge(tabId) {
  const count = (detected[tabId] || []).length;
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : '', tabId });
  chrome.action.setBadgeBackgroundColor({ color: '#e53935', tabId });
}

function addStreamFromTab(tabId, streamUrl) {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) {
      addStream(tabId, streamUrl, '', '');
    } else {
      addStream(tabId, streamUrl, tab.url || '', tab.title || '');
    }
  });
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId < 0) return;
    if (M3U8_RE.test(details.url)) addStreamFromTab(details.tabId, details.url);
  },
  { urls: ['<all_urls>'] }
);

chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.tabId < 0) return;
    const ct = (details.responseHeaders || [])
      .find(h => h.name.toLowerCase() === 'content-type');
    if (ct && CONTENT_TYPE_RE.test(ct.value)) addStreamFromTab(details.tabId, details.url);
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders']
);

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading' && changeInfo.url) {
    detected[tabId] = [];
    updateBadge(tabId);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  delete detected[tabId];
});

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg.type === 'GET_STREAMS') {
    reply({ streams: detected[msg.tabId] || [] });
  }
  if (msg.type === 'CLEAR') {
    detected[msg.tabId] = [];
    updateBadge(msg.tabId);
    reply({ ok: true });
  }
  if (msg.type === 'GET_STREAMS_PANEL') {
    reply({ streams: detected[sender.tab.id] || [] });
  }
  if (msg.type === 'CLEAR_PANEL') {
    const tabId = sender.tab.id;
    detected[tabId] = [];
    updateBadge(tabId);
    chrome.tabs.sendMessage(tabId, { type: 'PANEL_UPDATE', streams: [] }, () => { chrome.runtime.lastError; });
    reply({ ok: true });
  }
  if (msg.type === 'BODY_DETECTED') {
    addStream(sender.tab.id, msg.streamUrl, msg.pageUrl || '', msg.pageTitle || '');
  }
  return true;
});
