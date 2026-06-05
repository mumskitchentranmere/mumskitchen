// Node.js v25 provides `localStorage` as a global but without working methods.
// Patch it to a functional in-memory implementation so the Next.js dev overlay
// and any other code that guards with `typeof localStorage !== 'undefined'` works.
if (typeof localStorage !== 'undefined' && typeof localStorage.getItem !== 'function') {
  const _store = Object.create(null);
  Object.defineProperty(global, 'localStorage', {
    value: {
      getItem:    (key) => Object.prototype.hasOwnProperty.call(_store, key) ? _store[key] : null,
      setItem:    (key, value) => { _store[String(key)] = String(value); },
      removeItem: (key) => { delete _store[String(key)]; },
      clear:      () => { for (const k in _store) delete _store[k]; },
      get length() { return Object.keys(_store).length; },
      key:        (index) => Object.keys(_store)[index] ?? null,
    },
    writable: true,
    configurable: true,
  });
}
