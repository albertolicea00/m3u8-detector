(function () {
  function isM3U8Body(text) {
    return typeof text === 'string' && text.trimStart().startsWith('#EXTM3U');
  }

  function report(url) {
    window.dispatchEvent(new CustomEvent('__m3u8_detected__', { detail: { url: String(url) } }));
  }

  // --- Wrap XMLHttpRequest ---
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__intercepted_url__ = url;
    this.addEventListener('load', function () {
      try {
        if (isM3U8Body(this.responseText)) report(this.__intercepted_url__);
      } catch (_) {}
    });
    return origOpen.apply(this, arguments);
  };

  // --- Wrap fetch ---
  const origFetch = window.fetch;
  window.fetch = async function () {
    const req = arguments[0];
    const url = req instanceof Request ? req.url : String(req);
    const response = await origFetch.apply(this, arguments);
    try {
      response.clone().text().then(text => {
        if (isM3U8Body(text)) report(url);
      }).catch(() => {});
    } catch (_) {}
    return response;
  };
})();
