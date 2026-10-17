/* Store settings loader (Phase 8): fetches the PUBLIC read-only settings
   endpoint once, validates the six supported fields, then synchronizes the
   runtime delivery constants (NOVA.DELIVERY_FEE / NOVA.FREE_DELIVERY_OVER)
   from the database. Emits 'settings:ready' (success) or 'settings:error'
   on document. On failure the products.js fallback constants remain in use
   and the page keeps working; a later page load recovers automatically. */
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
