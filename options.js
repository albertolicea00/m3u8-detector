document.addEventListener('DOMContentLoaded', () => {
  const manifest = chrome.runtime.getManifest();
  document.getElementById('ver').textContent = 'v' + manifest.version;
  document.getElementById('ver-full').textContent =
    manifest.name + ' v' + manifest.version + ' — ' + manifest.description;

  document.getElementById('btn-nb').addEventListener('click', async () => {
    const status = document.getElementById('nb-status');
    try {
      const res = await fetch(chrome.runtime.getURL('downloader.ipynb'));
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'downloader.ipynb';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      status.textContent = '✓ Saved — open in Google Colab to use';
      setTimeout(() => { status.textContent = ''; }, 4000);
    } catch (e) {
      status.textContent = '✗ Error: ' + e.message;
      status.style.color = '#e94560';
    }
  });
});
