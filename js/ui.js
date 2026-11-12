/* Shared UI: header, footer, product card, toast, reveal. Header/footer are injected so every page stays in sync;
   in PHP these become include files. */
(function () {
  const { fmt, catName } = NOVA;
  const esc = NOVA.escapeHTML;
  function card(p, wishSet) {
    const B = NOVA.BASE || '';
    const pid = encodeURIComponent(p.id);
    const imgs = NOVA.imgs(p.id);
    const a = esc(imgs[0]);
    const b = imgs.length > 1 && imgs[1] !== imgs[0] ? esc(imgs[1]) : null;
    const name = esc(p.name);
    const off = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
    const badge = off ? `<span class="badge-nova">-${off}%</span>` : p.isNew ? '<span class="badge-nova badge-nova--dark">New</span>' : '';
    const on = wishSet ? wishSet.has(p.id) : NOVA.wish.has(p.id);
    const wishLabel = esc(on ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`);
    const altImgHtml = b ? `<img class="product-card__img product-card__img--alt" src="${b}" width="600" height="600" loading="lazy" alt="" aria-hidden="true">` : '';
    const matTag = p.material ? `<span class="product-card__mat">${esc(p.material)}</span>` : '';
    return `<article class="product-card">
      <div class="product-card__media">
        <a href="${B}product.html?id=${pid}" data-quick="${esc(p.id)}" aria-label="Quick view ${name}" aria-haspopup="dialog" aria-controls="quickModal">
          <img class="product-card__img" src="${a}" width="600" height="600" loading="lazy" alt="${name}">${altImgHtml}
          <span class="product-card__preview-hint" aria-hidden="true"><i class="bi bi-eye" aria-hidden="true"></i><span>Quick view</span></span>
        </a>
        ${badge}<button class="wish-btn" type="button" data-wish="${esc(p.id)}" aria-pressed="${on}" aria-label="${wishLabel}"><i class="bi ${on ? 'bi-heart-fill' : 'bi-heart'}" aria-hidden="true"></i></button>
      </div>
      <div class="product-card__body"><span class="product-card__cat">${esc(catName(p.cat))}</span>${matTag}
        <h3 class="product-card__name"><a href="${B}product.html?id=${pid}">${name}</a></h3>
        <div class="price-row"><span class="price">${fmt(p.price)}</span>${p.old ? `<span class="price--old"><span class="visually-hidden">Was </span>${fmt(p.old)}</span>` : ''}</div>
        <button class="btn btn-ghost btn-sm product-card__add" type="button" data-add="${esc(p.id)}">Add to cart</button></div></article>`;
  }

  let toastFallbackEl = null;
  function toast(msg) {
    const body = document.getElementById('toastBody'), el = document.getElementById('toast');
    if (body) body.textContent = msg;
    if (window.bootstrap && window.bootstrap.Toast && el) { window.bootstrap.Toast.getOrCreateInstance(el, { delay: 2600 }).show(); return; }
    if (!toastFallbackEl) { toastFallbackEl = document.createElement('div'); toastFallbackEl.className = 'toast-fallback'; toastFallbackEl.setAttribute('role', 'status'); document.body.appendChild(toastFallbackEl); }
    toastFallbackEl.textContent = msg;
    clearTimeout(toastFallbackEl._t);
    toastFallbackEl._t = setTimeout(() => { toastFallbackEl.textContent = ''; }, 2600);
  }

  /* Free-delivery progress state. Single source of truth: NOVA.cart.subtotal() + NOVA.FREE_DELIVERY_OVER. */
  function deliveryProgress(subtotal) {
    const threshold = NOVA.FREE_DELIVERY_OVER;
    const sub = typeof subtotal === 'number' && Number.isFinite(subtotal) ? subtotal : NOVA.cart.subtotal();
    if (!(threshold > 0)) return { subtotal: sub, threshold, remaining: 0, pct: 1, unlocked: true };
    const remaining = Math.max(threshold - sub, 0);
    const pct = Math.min(sub / threshold, 1);
    return { subtotal: sub, threshold, remaining, pct, unlocked: remaining === 0 };
  }

  /* Compact cart-summary utility: hide when empty, otherwise show remaining/pct from cart state. */
  function renderDeliveryProgress() {
    const box = document.getElementById('ship-progress');
    if (!box) return;
    const msg = document.getElementById('ship-msg'), bar = document.getElementById('ship-bar'),
      fill = document.getElementById('ship-fill'), icon = document.getElementById('ship-icon');
    if (!msg || !bar || !fill) return;
    let empty = true, sub = 0;
    try { empty = NOVA.cart.items().length === 0; sub = NOVA.cart.subtotal(); }
    catch { box.hidden = true; return; }
    if (empty) { box.hidden = true; return; }
    const s = deliveryProgress(sub);
    const rounded = Math.round(s.pct * 100);
    box.hidden = false;
    box.classList.toggle('is-unlocked', s.unlocked);
    if (icon) icon.className = 'bi ' + (s.unlocked ? 'bi-check-circle' : 'bi-truck');
    msg.innerHTML = s.unlocked
      ? '<span class="ship-progress__body"><strong class="ship-progress__title">Free delivery unlocked</strong><small class="ship-progress__sub">Your order ships free.</small></span>'
      : `<span>Add <strong>${fmt(s.remaining)} more</strong> to unlock free delivery</span>`;
    fill.style.width = rounded + '%';
    bar.setAttribute('aria-valuenow', String(rounded));
    bar.setAttribute('aria-valuetext', s.unlocked ? 'Free delivery unlocked' : `${rounded}% of ${fmt(s.threshold)}`);
  }

  /* Shop the Look: render coordinated editorial collection from NOVA.lookSpots; opens existing Quick View. */
  function shopLook() {
    const list = document.getElementById('look-items'), totalEl = document.getElementById('look-total');
    if (!list) return;
    const items = (NOVA.lookSpots || []).map(s => NOVA.find(s.id)).filter(Boolean);
    if (!items.length) return;

    if (totalEl) {
      const sum = items.reduce((acc, p) => acc + (p.price || 0), 0);
      totalEl.textContent = fmt(sum);
    }

    list.innerHTML = items.map(p => `
      <article class="look-card" data-look="${esc(p.id)}">
        <div class="look-card__media">
          <img src="${esc(NOVA.imgs(p.id)[0])}" width="200" height="200" loading="lazy" alt="${esc(p.name)}">
          <button class="look-card__quick" type="button" data-quick="${esc(p.id)}" aria-label="Quick view ${esc(p.name)}">
            <i class="bi bi-eye" aria-hidden="true"></i>
          </button>
        </div>
        <div class="look-card__body">
          <span class="look-card__cat">${esc(catName(p.cat))}</span>
          <h4 class="look-card__name"><a href="${NOVA.BASE || ''}product.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a></h4>
          <div class="look-card__footer">
            <span class="look-card__price">${fmt(p.price)}</span>
            <span class="look-card__action">Quick View <i class="bi bi-arrow-right" aria-hidden="true"></i></span>
          </div>
        </div>
      </article>
    `).join('');
  }

  /* Phase 8: apply database-backed store settings to every static/mounted
     component. Runs once when settings:ready fires (or immediately if the
     fetch already resolved before mount). Constants NOVA.DELIVERY_FEE /
     NOVA.FREE_DELIVERY_OVER were synchronized by js/settings.js first, so
     one cart:change dispatch refreshes every computation-based consumer
     (cart summary, checkout summary, progress bar, PDP estimator) using
     their existing listeners — no new listeners, no re-render loops. */
  function applyStoreSettings() {
    const s = NOVA.storeSettings && NOVA.storeSettings.loaded ? NOVA.storeSettings.data : null;
    if (!s) return;
    document.querySelectorAll('[data-delivery-announcement]').forEach(el => { el.textContent = NOVA.shellUI.announcementText(); });
    document.querySelectorAll('[data-delivery-note]').forEach(el => { el.textContent = `Free delivery on orders over ${fmt(NOVA.FREE_DELIVERY_OVER)}.`; });
    document.querySelectorAll('[data-delivery-info]').forEach(el => { el.textContent = `Delivery across Egypt. ${fmt(NOVA.DELIVERY_FEE)} flat rate, free over ${fmt(NOVA.FREE_DELIVERY_OVER)}.`; });
    // Footer contact: validate link targets before writing them.
    const digits = String(s.phone).replace(/[^\d+]/g, '');
    document.querySelectorAll('[data-nova-tel]').forEach(a => {
      a.textContent = s.phone;
      if (/^\+?\d{7,15}$/.test(digits)) a.setAttribute('href', 'tel:' + digits.replace(/\s+/g, ''));
    });
    document.querySelectorAll('[data-nova-email]').forEach(a => {
      a.textContent = s.email;
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) a.setAttribute('href', 'mailto:' + s.email);
    });
    document.querySelectorAll('[data-nova-address]').forEach(el => { el.textContent = s.address; });
    document.querySelectorAll('[data-nova-business]').forEach(el => { el.textContent = s.business_name; });
    document.dispatchEvent(new CustomEvent('cart:change'));
  }

  /* Item 1: catalogue-dependent grids must never paint as an empty 0-item page
     while the API fetch is in flight. Show lightweight placeholders that the page
     controller replaces on catalog:ready (or with an error state on catalog:error). */
  function catalogSkeletons() {
    if (NOVA.catalog && NOVA.catalog.ready) return;
    const card = `<div class="col-6 col-lg-3"><div class="skeleton-card" aria-hidden="true"><span class="skeleton-card__media"></span><span class="skeleton-card__line"></span><span class="skeleton-card__line skeleton-card__line--short"></span></div></div>`;
    const cat = `<div class="col-6 col-md-4 col-lg"><div class="skeleton-card skeleton-card--category" aria-hidden="true"><span class="skeleton-card__media"></span><span class="skeleton-card__line skeleton-card__line--short"></span></div></div>`;
    [
      ['category-grid', 5, cat],
      ['featured-grid', 4, card],
      ['shop-grid', 8, card]
    ].forEach(([id, n, tpl]) => {
      const el = document.getElementById(id);
      if (el && !el.children.length) el.innerHTML = tpl.repeat(n);
    });
    /* If the catalogue fails, drop the placeholders; the page controller paints
       its own error state for the main grid. */
    document.addEventListener('catalog:error', () => {
      document.querySelectorAll('.skeleton-card').forEach(el => {
        const col = el.closest('[class*="col-"]');
        (col || el).remove();
      });
    }, { once: true });
  }

  function mount() {
    renderDeliveryProgress();
    document.addEventListener('cart:change', renderDeliveryProgress);
    if (NOVA.searchUI && typeof NOVA.searchUI.bind === 'function') NOVA.searchUI.bind();
    const headerSlot = document.getElementById('site-header'), footerSlot = document.getElementById('site-footer');
    if (headerSlot && NOVA.shellUI) headerSlot.innerHTML = NOVA.shellUI.header();
    if (footerSlot && NOVA.shellUI) footerSlot.innerHTML = NOVA.shellUI.footer();
    if (NOVA.shellUI) NOVA.shellUI.mount();
    catalogSkeletons();
    const hdr = document.getElementById('siteHeader');
    if (hdr) { const onScroll = () => hdr.classList.toggle('is-scrolled', window.scrollY > 40); onScroll(); window.addEventListener('scroll', onScroll, { passive: true }); }

    document.querySelectorAll('[data-delivery-note]').forEach(el => { el.textContent = `Free delivery on orders over ${fmt(NOVA.FREE_DELIVERY_OVER)}.`; });
    document.querySelectorAll('[data-delivery-info]').forEach(el => { el.textContent = `Delivery across Egypt. ${fmt(NOVA.DELIVERY_FEE)} flat rate, free over ${fmt(NOVA.FREE_DELIVERY_OVER)}.`; });
    /* Phase 8: patch announcement/footer with DB settings once available.
       Covers both orderings: settings resolved before mount (apply now) or
       later (one-time listener). Fallback constants stand until then. */
    if (NOVA.storeSettings && NOVA.storeSettings.loaded) {
      applyStoreSettings();
    } else {
      document.addEventListener('settings:ready', applyStoreSettings, { once: true });
    }

    const badge = () => { const n = NOVA.cart.count(); document.querySelectorAll('[data-cart-count]').forEach(el => { const changed = el.textContent !== '' && el.dataset.count !== undefined && String(n) !== String(el.dataset.count); el.textContent = n; el.dataset.count = n; if (changed && n > 0) { el.classList.remove('is-pop'); void el.offsetWidth; el.classList.add('is-pop'); } }); };
    badge(); document.addEventListener('cart:change', badge);
    /* The cart filters through NOVA.find(), so a stored cart reads as 0 until the
       catalogue resolves. Recompute the badge once products are available. */
    document.addEventListener('catalog:ready', badge);

    document.addEventListener('click', e => {
      const quick = e.target.closest('[data-quick]');
      if (quick) {
        if (quick instanceof HTMLAnchorElement) e.preventDefault();
        NOVA.quickViewUI.open(quick.dataset.quick, quick);
        return;
      }
      const look = e.target.closest('[data-look]');
      if (look) {
        const interactive = e.target.closest('a, button, input, select, textarea');
        if (interactive && interactive !== look) return;
        const trigger = look.matches('a, button') ? look : (look.querySelector('[data-quick]') || look);
        NOVA.quickViewUI.open(look.dataset.look, trigger);
        return;
      }
      const add = e.target.closest('[data-add]'), wish = e.target.closest('[data-wish]');
      if (add) { const prod = NOVA.find(add.dataset.add); if (!prod) { toast('Sorry, that product is no longer available.'); return; } const ok = NOVA.cart.add(prod.id, Number(add.dataset.qty) || 1); toast(ok ? prod.name + ' added to your cart' : 'Sorry, that product is no longer available.'); }
      if (wish) {
        const prod = NOVA.find(wish.dataset.wish);
        const on = NOVA.wish.toggle(wish.dataset.wish);
        if (!prod || on === null) return;
        document.querySelectorAll(`[data-wish="${wish.dataset.wish}"]`).forEach(b => { b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', (on ? `Remove ${prod.name} from wishlist` : `Add ${prod.name} to wishlist`)); const i = b.querySelector('i'); if (i && !b.classList.contains('btn')) i.className = 'bi ' + (on ? 'bi-heart-fill' : 'bi-heart'); b.classList.remove('is-beat'); void b.offsetWidth; b.classList.add('is-beat'); });
        toast(on ? `${prod.name} saved to your wishlist.` : `${prod.name} removed from your wishlist.`);
      }
    });

    const nl = document.getElementById('nl-email');
    if (nl && nl.form) nl.form.addEventListener('submit', e => { e.preventDefault(); const v = nl.value.trim(); if (!nl.checkValidity() || !v) { nl.reportValidity(); return; } toast('Thanks! The newsletter is not connected yet in this demo, so nothing was saved.'); nl.value = ''; });

    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } }), { threshold: .15 }) : null;
    document.querySelectorAll('[data-reveal]').forEach(el => io ? io.observe(el) : el.classList.add('is-visible'));
    requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('is-ready')));
  }
  NOVA.ui = { card, toast, mount, deliveryProgress, renderDeliveryProgress, openQuick: NOVA.quickViewUI.open, shopLook };
})();
