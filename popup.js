function fmt(ts) {
  return new Date(ts).toLocaleTimeString();
}

function render(streams) {
  const empty = document.getElementById('empty');
  const list = document.getElementById('list');
  const count = document.getElementById('count');

  count.textContent = `${streams.length} stream${streams.length !== 1 ? 's' : ''}`;
  list.innerHTML = '';

  if (streams.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  // newest first
  [...streams].reverse().forEach(({ url, ts }) => {
    const item = document.createElement('div');
    item.className = 'item';

    const urlEl = document.createElement('div');
    urlEl.className = 'url';
    urlEl.textContent = url;

    const meta = document.createElement('div');
    meta.className = 'meta';

    const time = document.createElement('span');
    time.className = 'time';
    time.textContent = fmt(ts);

    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'Copiar URL';
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(url).then(() => {
        btn.textContent = 'Copiado!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copiar URL';
          btn.classList.remove('copied');
        }, 1500);
      });
    });

    meta.appendChild(time);
    meta.appendChild(btn);
    item.appendChild(urlEl);
    item.appendChild(meta);
    list.appendChild(item);
  });
}

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab) return;
  const tabId = tab.id;

  chrome.runtime.sendMessage({ type: 'GET_STREAMS', tabId }, ({ streams }) => {
    render(streams);
  });

  document.getElementById('clear-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'CLEAR', tabId }, () => {
      render([]);
    });
  });
});
