// ===== Manual HTML Override Loader (v1) =====
(() => {
  try {
    const key = 'ST_OVERRIDE_HTML';
    const raw = localStorage.getItem(key);
    if (raw && raw.trim().startsWith('<!')) {
      document.open();
      document.write(raw);
      document.close();
    }
  } catch (e) {}
})();
