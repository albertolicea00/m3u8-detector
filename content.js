// Inject interceptor into page's main JS world (before any player code runs)
const s = document.createElement('script');
s.src = chrome.runtime.getURL('interceptor.js');
(document.head || document.documentElement).prepend(s);
s.onload = () => s.remove();

// Bridge: relay detected streams from page world → background
window.addEventListener('__m3u8_detected__', (e) => {
  chrome.runtime.sendMessage({ type: 'BODY_DETECTED', url: e.detail.url });
});
