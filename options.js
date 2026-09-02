// ── Helpers ──────────────────────────────────────────────────────────────────
function svgIcon(path, extra = '') {
  return `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${path}</svg>`;
}

const ICON = {
  download: svgIcon('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
  unpin:    svgIcon('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
  copy:     svgIcon('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
};

// ── Markdown → HTML (minimal) ─────────────────────────────────────────────────
function md2html(md) {
  let html = md
    // fenced code blocks
    .replace(/```[\w]*\n([\s\S]*?)```/g, (_, code) =>
      `<pre><code>${code.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code></pre>`)
    // headings
    .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // hr
    .replace(/^---$/gm, '<hr>')
    // blockquote
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // unordered list items
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    // ordered list items
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    // paragraphs: blank lines
    .replace(/\n{2,}/g, '</p><p>');

  // Wrap consecutive <li> in <ul> (simple)
  html = html.replace(/(<li>.*<\/li>\n?)+/gs, m => `<ul>${m}</ul>`);

  return `<p>${html}</p>`;
}

// ── Pinned Streams ────────────────────────────────────────────────────────────
function loadPinnedStreams() {
  chrome.storage.local.get('pinnedStreams', ({ pinnedStreams = [] }) => {
    const list  = document.getElementById('pinned-list');
    const empty = document.getElementById('pinned-empty');
    const count = document.getElementById('pin-count');

    count.textContent = pinnedStreams.length;
    list.querySelectorAll('.pin-item').forEach(el => el.remove());

    if (!pinnedStreams.length) {
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    [...pinnedStreams].sort((a, b) => b.ts - a.ts).forEach(entry => {
      const { streamUrl, pageUrl, customName, pageTitle, segments, segmentCount, ts } = entry;
      const name = customName || pageTitle || streamUrl.split('/').pop().split('?')[0] || 'Untitled';

      const item = document.createElement('div');
      item.className = 'pin-item';
      item.innerHTML = `
        <div class="pin-name" title="${name}">${name}</div>
        <div class="pin-url"  title="${pageUrl || ''}">${pageUrl || streamUrl}</div>
        <div class="pin-meta">${segmentCount != null ? segmentCount + ' segments' : '—'} &middot; ${new Date(ts).toLocaleString()}</div>
        <div class="pin-actions" id="pa-${ts}"></div>
      `;

      const actions = item.querySelector(`#pa-${ts}`);

      // Unpin button
      const unpinBtn = document.createElement('button');
      unpinBtn.className = 'pin-btn danger';
      unpinBtn.innerHTML = ICON.unpin + ' Unpin';
      unpinBtn.addEventListener('click', () => {
        chrome.storage.local.get('pinnedStreams', ({ pinnedStreams: ps = [] }) => {
          const updated = ps.filter(e => e.streamUrl !== streamUrl);
          chrome.storage.local.set({ pinnedStreams: updated }, loadPinnedStreams);
        });
      });
      actions.appendChild(unpinBtn);

      // Download segments button
      if (segments && segments.length) {
        const dlBtn = document.createElement('button');
        dlBtn.className = 'pin-btn dl';
        dlBtn.innerHTML = ICON.download + ' Segments';
        dlBtn.addEventListener('click', () => {
          const safe = name.replace(/[^a-z0-9]/gi, '_').slice(0, 40);
          const blob = new Blob([segments.join('\n')], { type: 'text/plain' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `${safe}_segments.txt`;
          a.click();
          URL.revokeObjectURL(a.href);
        });
        actions.appendChild(dlBtn);
      }

      // Copy stream URL button
      const cpBtn = document.createElement('button');
      cpBtn.className = 'pin-btn';
      cpBtn.innerHTML = ICON.copy + ' URL';
      cpBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(streamUrl).then(() => {
          cpBtn.innerHTML = ICON.copy + ' Copied!';
          setTimeout(() => { cpBtn.innerHTML = ICON.copy + ' URL'; }, 1500);
        });
      });
      actions.appendChild(cpBtn);

      list.appendChild(item);
    });
  });
}

// ── Notebook download ─────────────────────────────────────────────────────────
document.getElementById('btn-nb').addEventListener('click', async () => {
  const status = document.getElementById('nb-status');
  try {
    const res  = await fetch(chrome.runtime.getURL('hls-colab.ipynb'));
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'hls-colab.ipynb';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    status.textContent = 'Saved — open in Google Colab to use';
    setTimeout(() => { status.textContent = ''; }, 4000);
  } catch (e) {
    status.style.color = 'var(--accent)';
    status.textContent = 'Error: ' + e.message;
  }
});

// ── README ────────────────────────────────────────────────────────────────────
async function loadReadme() {
  try {
    const res  = await fetch(chrome.runtime.getURL('README.md'));
    const text = await res.text();
    document.getElementById('readme-content').innerHTML = md2html(text);
  } catch {
    document.getElementById('readme-content').innerHTML =
      '<p>Could not load documentation.</p>';
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const manifest = chrome.runtime.getManifest();
  document.getElementById('ver').textContent = 'v' + manifest.version;

  loadPinnedStreams();
  loadReadme();

  // Listen for storage changes (unpin from panel while options open)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.pinnedStreams) loadPinnedStreams();
  });
});
