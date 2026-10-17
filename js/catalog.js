/* Catalogue loader (Phase 2B): single fetch of categories + products from the
   PHP read APIs. Replaces the hardcoded NOVA.categories / NOVA.products arrays
   while keeping every other NOVA.* helper (delivery, search, BASE, fmt, lookSpots)
   exactly as before. Emits 'catalog:ready' / 'catalog:error' on document. */
(function () {
  window.NOVA = window.NOVA || {};
  const base = (NOVA.BASE || '');
  const EP = {
    categories: base + 'api/categories.php',
    products: base + 'api/products.php?limit=100'
  };
  function normProduct(p) {
    return {
      id: String(p.id || p.slug || ''),
      cat: String(p.category || p.cat || ''),
      name: String(p.name || ''),
      price: Number(p.price) || 0,
      old: p.oldPrice != null ? Number(p.oldPrice) : (p.old != null ? Number(p.old) : undefined),
      rating: Number(p.rating) || 0,
      reviews: Number(p.reviews) || 0,
      best: !!(p.isBest || p.best),
      isNew: !!(p.isNew || p.is_new),
      desc: String(p.description || p.desc || ''),
      material: String(p.material || ''),
      specs: [],
      image: p.image || null
    };
  }
  NOVA.catalog = { ready: false, error: null };
  NOVA.catalogReady = new Promise(resolve => {
    async function load() {
      try {
        const [cRes, pRes] = await Promise.all([fetch(EP.categories), fetch(EP.products)]);
        if (!cRes.ok || !pRes.ok) throw new Error('catalog fetch failed');
        const cJson = await cRes.json(), pJson = await pRes.json();
        if (!cJson.success || !pJson.success) throw new Error('catalog payload invalid');
        NOVA.categories = (cJson.data || []).map(c => ({
          id: String(c.slug || c.id), name: String(c.name),
          image: String(c.image || '').split('/').pop()
        }));
        NOVA.products = (pJson.data || []).map(normProduct);
        NOVA.catalog.ready = true;
        document.dispatchEvent(new CustomEvent('catalog:ready'));
      } catch (err) {
        NOVA.catalog.error = err;
        NOVA.categories = [];
        NOVA.products = [];
        document.dispatchEvent(new CustomEvent('catalog:error'));
      }
      resolve();
    }
    // Start immediately: classic scripts run before DOMContentLoaded fires,
    // so the fetch is already in flight when main.js registers its listener.
    load();
  });
})();
