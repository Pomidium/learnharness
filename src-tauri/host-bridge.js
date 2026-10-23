(() => {
  if (location.hostname !== '127.0.0.1') return;
  let zoom = 1;
  const subscribers = new Set();
  const invoke = (command, args) => window.__TAURI_INTERNALS__.invoke(command, args);
  Object.defineProperty(window, 'lh', { configurable: false, value: Object.freeze({
    platform: 'darwin',
    expandWindow: () => { void invoke('expand_window').catch(console.error); },
    getZoom: () => Promise.resolve(zoom),
    onZoom: (callback) => { subscribers.add(callback); return () => subscribers.delete(callback); }
    // There is intentionally no updater until an actual signed update channel exists.
  }) });
  window.addEventListener('keydown', (event) => {
    if (!event.metaKey || event.altKey || event.ctrlKey || event.shiftKey && event.key !== '+') return;
    const key = event.key;
    if (key !== '=' && key !== '+' && key !== '-' && key !== '0') return;
    event.preventDefault();
    if (event.repeat) return;
    const next = key === '0' ? 1 : Math.max(0.5, Math.min(2, Math.round((zoom + (key === '-' ? -0.1 : 0.1)) * 10) / 10));
    void invoke('set_zoom', { factor: next }).then(value => {
      zoom = value;
      for (const subscriber of subscribers) subscriber(zoom);
    }).catch(console.error);
  }, true);
})();
