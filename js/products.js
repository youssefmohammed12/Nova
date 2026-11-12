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
   otherwise fall back to the site favicon as a neutral placeholder. */
NOVA.imgs = id => {
  const found = (NOVA.products || []).find(p => p.id === id);
  if (found && found.image) {
    const src = (NOVA.BASE && !found.image.startsWith(NOVA.BASE)) ? `${NOVA.BASE}${found.image}` : found.image;
    return [src];
  }
  return [`${NOVA.BASE}favicon.svg`];
};
NOVA.fmt = n => 'EGP ' + n.toLocaleString('en-US');
/* Escape untrusted database/API text before interpolating it into HTML templates.
   Admin-entered product/category names, descriptions, specs and material labels
   remain plain text in storage; output contexts must encode them. */
NOVA.escapeHTML = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
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
/* Complete fallback only; the public settings endpoint supplies the authoritative city labels. */
NOVA.deliveryCities = {
  cairo: { name: 'Cairo', days: '1–2 working days' },
  giza: { name: 'Giza', days: '1–2 working days' },
  alexandria: { name: 'Alexandria', days: '2–3 working days' },
  mansoura: { name: 'Mansoura', days: '2–4 working days' },
  tanta: { name: 'Tanta', days: '2–4 working days' },
  fayoum: { name: 'Fayoum', days: '2–4 working days' },
  other: { name: 'Other Egypt', days: '3–5 working days' }
};
NOVA.populateDeliveryCitySelect = (select, includePlaceholder = false) => {
  if (!(select instanceof HTMLSelectElement)) return;
  const previousValue = select.value;
  const previousLabel = select.selectedOptions[0]?.textContent?.trim().toLowerCase() || '';
  select.replaceChildren();
  if (includePlaceholder) {
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Choose city';
    select.appendChild(placeholder);
  }
  Object.entries(NOVA.deliveryCities).forEach(([id, city]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = city.name;
    select.appendChild(option);
  });
  const match = [...select.options].find(option =>
    option.value === previousValue ||
    (previousLabel && option.textContent.trim().toLowerCase() === previousLabel)
  );
  if (match) select.value = match.value;
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
/* Shared in-memory search rules for autocomplete and Shop results. */
NOVA.search = {
  popular: ['Lamps', 'Vases', 'Lighting', 'Storage'],
  norm(q) { return String(q == null ? '' : q).toLowerCase().replace(/\s+/g, ' ').trim(); },
  tokens(raw) {
    return NOVA.search.norm(raw).split(' ').filter(Boolean).map(word => {
      if (word.length > 4 && word.endsWith('ies')) return word.slice(0, -3) + 'y';
      if (word.length > 4 && /(sses|xes|zes|ches|shes)$/.test(word)) return word.slice(0, -2);
      if (word.length > 3 && word.endsWith('s') && !/(ss|us|is)$/.test(word)) return word.slice(0, -1);
      return word;
    });
  },
  searchableText(product) {
    return [
      product.name,
      NOVA.catName(product.cat),
      product.desc,
      product.material,
      ...(product.specs || []).map(spec => Array.isArray(spec) ? spec.join(' ') : String(spec || ''))
    ].join(' ').toLowerCase();
  },
  matches(product, raw) {
    const terms = NOVA.search.tokens(raw);
    if (!terms.length) return false;
    const text = NOVA.search.searchableText(product);
    return terms.every(term => text.includes(term));
  },
  suggestions(raw, limit = 5) {
    const q = NOVA.search.norm(raw);
    const terms = NOVA.search.tokens(q);
    if (!terms.length) return [];
    const out = [];
    for (const p of NOVA.products) {
      const name = String(p.name || '').toLowerCase();
      const cat = NOVA.catName(p.cat).toLowerCase();
      const extra = [p.desc, p.material, ...(p.specs || []).map(spec =>
        Array.isArray(spec) ? spec.join(' ') : String(spec || '')
      )].join(' ').toLowerCase();
      let rank = -1;
      if (name.startsWith(q) || name.startsWith(terms.join(' '))) rank = 0;
      else if (terms.every(term => name.includes(term))) rank = 1;
      else if (terms.every(term => cat.includes(term))) rank = 2;
      else if (terms.every(term => extra.includes(term))) rank = 3;
      else if (NOVA.search.matches(p, q)) rank = 4;
      if (rank >= 0) out.push({ p, rank });
    }
    out.sort((a, b) => a.rank - b.rank || a.p.name.localeCompare(b.p.name));
    const n = Math.max(1, Math.min(10, Math.floor(Number(limit)) || 5));
    return out.slice(0, n).map(s => s.p);
  }
};
