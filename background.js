const M3U8_RE = /\.(m3u8|m3u)(\?|$)/i;
const CONTENT_TYPE_RE = /mpegurl|x-mpegURL/i;

// detected[tabId] = [{streamUrl, pageUrl, pageTitle, ts}]
let detected = {};

function addStream(tabId, streamUrl, pageUrl, pageTitle) {
  if (!detected[tabId]) detected[tabId] = [];
  if (detected[tabId].some(e => e.streamUrl === streamUrl)) return;
  detected[tabId].push({ streamUrl, pageUrl: pageUrl || '', pageTitle: pageTitle || '', ts: Date.now() });
  updateBadge(tabId);
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

// Detect by URL pattern
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId < 0) return;
    if (M3U8_RE.test(details.url)) addStreamFromTab(details.tabId, details.url);
  },
  { urls: ['<all_urls>'] }
);

// Detect by Content-Type header (catches obfuscated URLs like .txt serving m3u8)
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

// Clear when tab navigates away
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading' && changeInfo.url) {
    detected[tabId] = [];
    updateBadge(tabId);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  delete detected[tabId];
});

// Respond to popup queries
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg.type === 'GET_STREAMS') {
    reply({ streams: detected[msg.tabId] || [] });
  }
  if (msg.type === 'CLEAR') {
    detected[msg.tabId] = [];
    updateBadge(msg.tabId);
    reply({ ok: true });
  }
  if (msg.type === 'BODY_DETECTED') {
    addStream(sender.tab.id, msg.streamUrl, msg.pageUrl || '', msg.pageTitle || '');
  }
  return true;
});
