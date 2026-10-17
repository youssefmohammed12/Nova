/* NOVA catalogue: frontend-only constants + helpers (Phase 2B).
   Product/category RECORDS now come from MySQL via js/catalog.js — do not add
   product objects here. Everything below is UI behaviour, not catalogue data.
   DELIVERY_FEE / FREE_DELIVERY_OVER are FALLBACK display values only: at load
   js/settings.js synchronizes them from api/store-settings.php (database). */
window.NOVA = window.NOVA || {};
NOVA.categories = [];
NOVA.products = [];
NOVA.FREE_DELIVERY_OVER = 1500;
NOVA.DELIVERY_FEE = 60;
/* Base path prefix so pages inside account/ or admin/ can reuse the same assets and links. */
NOVA.BASE = /(^|\/)(account|admin)\//.test(location.pathname) ? '../' : '';
/* Gallery paths: prefer the DB primary image when the loader resolved one,
   otherwise fall back to the legacy filename convention. */
NOVA.imgs = id => {
  const found = (NOVA.products || []).find(p => p.id === id);
  if (found && found.image) {
    const src = (NOVA.BASE && !found.image.startsWith(NOVA.BASE)) ? `${NOVA.BASE}${found.image}` : found.image;
    return [src];
  }
  return [`${NOVA.BASE}assets/images/${id}.svg`];
};
NOVA.fmt = n => 'EGP ' + n.toLocaleString('en-US');
NOVA.find = id => NOVA.products.find(p => p.id === id);
NOVA.catName = id => (NOVA.categories.find(c => c.id === id) || {}).name || '';
/* Shop the Look scene: presentation-only hotspot coordinates (percentages of the scene). */
NOVA.lookSpots = [
  { id: 'luna-floor-lamp', x: 21, y: 30 },
  { id: 'cairo-boucle-chair', x: 69, y: 62 },
  { id: 'aswan-side-table', x: 47, y: 68 },
  { id: 'sahara-vase', x: 55, y: 55 }
];
/* Demo delivery estimates per city (frontend prototype only, not courier guarantees). */
NOVA.deliveryCities = {
  cairo: { name: 'Cairo', days: '1–2 working days' },
  giza: { name: 'Giza', days: '1–2 working days' },
  alexandria: { name: 'Alexandria', days: '2–3 working days' },
  fayoum: { name: 'Fayoum', days: '2–4 working days' },
  other: { name: 'Other Egypt', days: '3–5 working days' }
};
NOVA.delivery = {
  key: 'nova_delivery_city',
  def: 'cairo',
  ids() { return Object.keys(NOVA.deliveryCities); },
  get() {
    try {
      const v = String(localStorage.getItem(NOVA.delivery.key) || '').toLowerCase();
      if (v && NOVA.deliveryCities[v]) return v;
    } catch { /* storage unavailable: fall through to default */ }
    return NOVA.delivery.def;
  },
  set(id) {
    if (!NOVA.deliveryCities[id]) return false;
    try { localStorage.setItem(NOVA.delivery.key, id); } catch { /* ignore: page state still updates */ }
    return true;
  },
  info(id) { return NOVA.deliveryCities[id] || NOVA.deliveryCities[NOVA.delivery.def]; }
};
/* Lightweight in-memory search over the static catalogue. No duplicate data, no library. */
NOVA.search = {
  popular: ['Lamps', 'Vases', 'Lighting', 'Storage'],
  norm(q) { return String(q == null ? '' : q).toLowerCase().replace(/\s+/g, ' ').trim(); },
  suggestions(raw, limit = 5) {
    const q = NOVA.search.norm(raw);
    if (!q) return [];
    const out = [];
    for (const p of NOVA.products) {
      const name = p.name.toLowerCase();
      const cat = NOVA.catName(p.cat).toLowerCase();
      const extra = ((p.desc || '') + ' ' + (p.specs || []).map(s => s.join(' ')).join(' ')).toLowerCase();
      let rank = -1;
      if (name.startsWith(q)) rank = 0;
      else if (name.includes(q)) rank = 1;
      else if (cat.includes(q)) rank = 2;
      else if (extra.includes(q)) rank = 3;
      else if (q.indexOf(' ') !== -1) {
        const toks = q.split(' '), hasAll = t => toks.every(tok => t.indexOf(tok) !== -1);
        if (hasAll(name)) rank = 1;
        else if (hasAll(cat)) rank = 2;
        else if (hasAll(extra)) rank = 3;
      }
      if (rank >= 0) out.push({ p, rank });
    }
    out.sort((a, b) => a.rank - b.rank || a.p.name.localeCompare(b.p.name));
    const n = Math.max(1, Math.min(10, Math.floor(Number(limit)) || 5));
    return out.slice(0, n).map(s => s.p);
  }
};
