/* Store settings loader: validates the public payload and synchronizes
   delivery pricing + allowed city labels from the server. ETA copy remains
   explicitly indicative and presentation-only. On failure, safe frontend
   fallbacks remain available and the page continues to work. */
(function () {
  window.NOVA = window.NOVA || {};
  const base = (NOVA.BASE || '');
  NOVA.storeSettings = { loaded: false, error: null, data: null };
  NOVA.storeSettingsReady = new Promise(resolve => {
    async function load() {
      try {
        const res = await fetch(base + 'api/store-settings.php', { cache: 'no-store' });
        if (!res.ok) throw new Error('settings fetch failed');
        const json = await res.json();
        if (!json.success || !json.data || typeof json.data !== 'object') throw new Error('settings payload invalid');
        const d = json.data;
        // Type-validate every supported field before accepting any of it.
        const strings = ['business_name', 'phone', 'email', 'address'];
        for (const k of strings) {
          if (typeof d[k] !== 'string') throw new Error('settings field invalid: ' + k);
        }
        const fee = d.delivery_fee, threshold = d.free_delivery_threshold;
        if (!Number.isInteger(fee) || fee < 0 || !Number.isInteger(threshold) || threshold < 0) {
          throw new Error('settings money fields invalid');
        }
        const cities = d.delivery_cities;
        if (!cities || typeof cities !== 'object' || Array.isArray(cities)) {
          throw new Error('settings delivery cities invalid');
        }
        const cityEntries = Object.entries(cities);
        if (!cityEntries.length || cityEntries.some(([id, name]) =>
          !/^[a-z][a-z0-9_]*$/.test(id) || typeof name !== 'string' || !name.trim()
        )) {
          throw new Error('settings delivery cities invalid');
        }
        const etaByCity = {
          cairo: '1–2 working days',
          giza: '1–2 working days',
          alexandria: '2–3 working days',
          mansoura: '2–4 working days',
          tanta: '2–4 working days',
          fayoum: '2–4 working days',
          other: '3–5 working days'
        };
        NOVA.deliveryCities = Object.fromEntries(cityEntries.map(([id, name]) => [
          id,
          { name: name.trim(), days: etaByCity[id] || '3–5 working days' }
        ]));
        if (!NOVA.deliveryCities[NOVA.delivery.get()]) {
          NOVA.delivery.set(NOVA.delivery.def);
        }
        NOVA.storeSettings.data = d;
        NOVA.storeSettings.loaded = true;
        // Single controlled synchronization point for delivery constants
        // (Step 7): every UI component reads these two runtime values.
        NOVA.DELIVERY_FEE = fee;
        NOVA.FREE_DELIVERY_OVER = threshold;
        document.dispatchEvent(new CustomEvent('settings:ready'));
      } catch (err) {
        NOVA.storeSettings.error = err;
        document.dispatchEvent(new CustomEvent('settings:error'));
      }
      resolve();
    }
    // Start immediately (same pattern as catalog.js): the request is already
    // in flight before DOMContentLoaded, so no consumer races on ordering.
    load();
  });
})();
