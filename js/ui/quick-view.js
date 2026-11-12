/* Shared Quick View modal controller. */
(function () {
  const NOVA = window.NOVA;
  const { fmt, catName } = NOVA;
  const toast = message => { if (NOVA.ui && NOVA.ui.toast) NOVA.ui.toast(message); };

  /* Quick View: one shared Bootstrap modal, populated from NOVA.find(). No duplicated state. */
  let qvId = null, qvQty = 1, qvBound = false, qvTrigger = null;
  const qvGet = id => document.getElementById(id);
  function qvSyncQty() {
    const out = qvGet('qv-qty'), add = qvGet('qv-add'), minus = qvGet('qv-minus'), plus = qvGet('qv-plus');
    if (!out || !add) return;
    qvQty = Math.max(1, Math.min(10, qvQty));
    out.textContent = qvQty;
    add.dataset.qty = qvQty;
    if (minus) minus.disabled = qvQty <= 1;
    if (plus) plus.disabled = qvQty >= 10;
  }
  function qvSyncWish() {
    const w = qvGet('qv-wish'), p = qvId && NOVA.find(qvId);
    if (!w || !p) return;
    const on = NOVA.wish.has(p.id);
    w.dataset.wish = p.id;
    w.setAttribute('aria-pressed', String(on));
    w.setAttribute('aria-label', on ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`);
  }
  function openQuick(id, trigger) {
    const p = NOVA.find(id);
    if (!p) { toast('Sorry, that product is no longer available.'); return; }
    qvId = p.id; qvQty = 1;
    qvTrigger = trigger && typeof trigger.focus === 'function' ? trigger : null;
    const B = NOVA.BASE || '';
    const set = (elId, v) => { const el = qvGet(elId); if (el) el.textContent = v; };
    const img = qvGet('qv-img');
    if (img) {
      img.classList.add('is-swap');
      img.src = NOVA.imgs(p.id)[0];
      img.alt = p.name;
      requestAnimationFrame(() => requestAnimationFrame(() => img.classList.remove('is-swap')));
    }
    set('qv-title', p.name);
    set('qv-cat', catName(p.cat));
    set('qv-desc', p.desc || '');
    set('qv-stock', 'Availability is not tracked in this demo catalogue.');
    /* No reviews table exists yet, so show an honest empty state instead of
       seeding a star rating that no customer can verify. */
    const rating = qvGet('qv-rating');
    if (rating) rating.innerHTML = '<span class="text-muted-nova">No reviews yet</span>';
    const price = qvGet('qv-price'), off = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
    if (price) price.innerHTML = `${fmt(p.price)}${p.old ? `<span class="price--old"><span class="visually-hidden">Was </span>${fmt(p.old)}</span> <span class="badge text-bg-danger ms-1">Save ${off}%</span>` : ''}`;
    const add = qvGet('qv-add');
    if (add) { add.dataset.add = p.id; }
    const link = qvGet('qv-link');
    if (link) { link.href = `${B}product.html?id=${p.id}`; link.setAttribute('aria-label', `View full details for ${p.name}`); }
    qvSyncQty();
    qvSyncWish();
    if (!qvBound) {
      qvBound = true;
      const minus = qvGet('qv-minus'), plus = qvGet('qv-plus');
      if (minus) minus.addEventListener('click', () => { qvQty = Math.max(1, qvQty - 1); qvSyncQty(); });
      if (plus) plus.addEventListener('click', () => { qvQty = Math.min(10, qvQty + 1); qvSyncQty(); });
      document.addEventListener('wishlist:change', () => { const m = qvGet('quickModal'); if (m && m.classList.contains('show')) qvSyncWish(); });
      const modal = qvGet('quickModal');
      if (modal) {
        /* Move focus out before Bootstrap marks the dialog aria-hidden. */
        modal.addEventListener('hide.bs.modal', () => {
          const active = document.activeElement;
          if (active && modal.contains(active) && typeof active.blur === 'function') active.blur();
        });
        modal.addEventListener('hidden.bs.modal', () => {
          qvId = null;
          qvQty = 1;
          if (qvTrigger && document.contains(qvTrigger)) {
            try { qvTrigger.focus({ preventScroll: true }); } catch (_) {}
          }
          qvTrigger = null;
        });
      }
    }
    const modalEl = qvGet('quickModal');
    if (!modalEl) return;
    if (window.bootstrap && window.bootstrap.Modal) window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
    else { modalEl.classList.add('show'); modalEl.style.display = 'block'; }
  }

  NOVA.quickViewUI = Object.freeze({ open: openQuick });
})();
