/* Cart + wishlist kept in localStorage for the demo. Replace the storage calls with API requests later. */
(function () {
  const KEY = 'nova_cart', WISH = 'nova_wish';
  const QTY_MIN = 1, QTY_MAX = 10;
  const clampQty = qty => Math.max(QTY_MIN, Math.min(QTY_MAX, qty));
  const isValidId = id => typeof id === 'string' && id !== '' && !!NOVA.find(id);
  function readList(k) {
    let parsed;
    try { parsed = JSON.parse(localStorage.getItem(k)); }
    catch { return []; }
    if (!Array.isArray(parsed)) return [];
    return parsed;
  }
  function readCart() {
    const list = readList(KEY), clean = [];
    for (const entry of list) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
      if (!isValidId(entry.id)) continue;
      const qty = Math.floor(Number(entry.qty));
      if (!Number.isFinite(qty)) continue;
      clean.push({ id: entry.id, qty: clampQty(qty) });
    }
    return clean;
  }
  function readWish() {
    return readList(WISH).filter(id => typeof id === 'string' && id !== '');
  }
  const save = (k, v, eventName) => {
    try { localStorage.setItem(k, JSON.stringify(v)); }
    catch {
      if (NOVA.ui && typeof NOVA.ui.toast === 'function') NOVA.ui.toast('Could not save: browser storage is unavailable.');
      return;
    }
    document.dispatchEvent(new CustomEvent(eventName));
  };
  NOVA.cart = {
    items: () => readCart(),
    count: function () { return this.items().reduce((s, i) => s + i.qty, 0); },
    add(id, qty = 1) {
      if (!isValidId(id)) return false;
      const n = Math.floor(Number(qty));
      if (!Number.isFinite(n)) return false;
      const c = readCart(), i = c.find(x => x.id === id);
      const amount = clampQty(n < QTY_MIN ? QTY_MIN : n);
      if (i) i.qty = clampQty(i.qty + amount);
      else c.push({ id, qty: amount });
      save(KEY, c, 'cart:change');
      return true;
    },
    setQty(id, qty) { const c = readCart(), i = c.find(x => x.id === id); if (!i) return; const n = Math.floor(Number(qty)); if (!Number.isFinite(n)) return; i.qty = clampQty(n); save(KEY, c, 'cart:change'); },
    remove(id) { save(KEY, readCart().filter(x => x.id !== id), 'cart:change'); },
    clear() { save(KEY, [], 'cart:change'); },
    subtotal() { return this.items().reduce((s, i) => s + NOVA.find(i.id).price * i.qty, 0); },
    delivery() { const s = this.subtotal(); return s === 0 || s >= NOVA.FREE_DELIVERY_OVER ? 0 : NOVA.DELIVERY_FEE; },
    total() { return this.subtotal() + this.delivery(); }
  };
  NOVA.wish = {
    has: id => readWish().includes(id),
    ids: () => readWish(),
    toggle(id) { if (typeof id !== 'string' || !id) return false; const w = readWish(), on = !w.includes(id); save(WISH, on ? [...w, id] : w.filter(x => x !== id), 'wishlist:change'); return on; }
  };
  /* Recently viewed: newest-first list of product IDs (max 6). Never throws. */
  const RECENT = 'nova_recently_viewed', RECENT_MAX = 6;
  function readRecentIds() {
    let parsed;
    try { parsed = JSON.parse(localStorage.getItem(RECENT)); }
    catch { return []; }
    if (!Array.isArray(parsed)) return [];
    const seen = new Set(), out = [];
    for (const id of parsed) {
      if (typeof id !== 'string' || !id || seen.has(id)) continue;
      if (!NOVA.find(id)) continue;
      seen.add(id);
      out.push(id);
      if (out.length >= RECENT_MAX) break;
    }
    return out;
  }
  NOVA.recent = {
    items: () => readRecentIds(),
    add(id) {
      if (typeof id !== 'string' || !id || !NOVA.find(id)) return;
      const next = [id, ...readRecentIds().filter(x => x !== id)].slice(0, RECENT_MAX);
      try { localStorage.setItem(RECENT, JSON.stringify(next)); }
      catch { /* storage unavailable: fail gracefully, section simply won't persist */ }
    },
    clear() {
      try { localStorage.removeItem(RECENT); }
      catch { /* ignore */ }
    }
  };
})();
