(function () {
  const NOVA = window.NOVA;
  NOVA.pageControllers = NOVA.pageControllers || {};

  NOVA.pageControllers.product = function productPage() {
    const { fmt, products, $, params, grid } = NOVA.pageHelpers;
    const esc = NOVA.escapeHTML;
    const detailEl = $('#pdp-detail'), notFoundEl = $('#pdp-not-found');
    const showMissing = () => {
      document.title = 'Product not found | NOVA Home';
      if (detailEl) detailEl.hidden = true;
      if (notFoundEl) notFoundEl.hidden = false;
      const nameEl = $('#bc-name'); if (nameEl) nameEl.textContent = 'Not found';
    };
    // List catalogue resolves identity/pricing; detail API provides images+specs.
    const local = NOVA.find(params.get('id'));
    if (!local) {
      showMissing();
      return;
    }
    const paint = (p, detail) => {
    const apiImgs = detail && Array.isArray(detail.images) ? detail.images.map(i => i.image_path) : [];
    const imgs = apiImgs.length ? apiImgs : NOVA.imgs(p.id);
    const mainImage = $('#gallery-main');
    const off = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
    document.title = `${p.name} | NOVA Home`;
    const bcCat = $('#bc-cat'), bcName = $('#bc-name'), pdpCat = $('#pdp-cat'), pdpName = $('#pdp-name');
    if (!bcCat || !bcName || !pdpCat || !pdpName) return;
    bcCat.innerHTML = `<a href="shop.html?cat=${encodeURIComponent(p.cat)}">${esc(NOVA.catName(p.cat))}</a>`; bcName.textContent = p.name;
    pdpCat.textContent = NOVA.catName(p.cat); pdpName.textContent = p.name;
    /* No reviews table yet — show an honest empty state rather than a rating. */
    $('#pdp-rating').innerHTML = '<span class="text-muted-nova">No reviews yet</span>';
    $('#pdp-price').innerHTML = `${fmt(p.price)}${p.old ? `<span class="price--old"><span class="visually-hidden">Was </span>${fmt(p.old)}</span> <span class="pdp__discount-badge">Save ${off}%</span>` : ''}`;
    $('#pdp-desc').textContent = p.desc;
    const apiSpecs = detail && Array.isArray(detail.specifications) ? detail.specifications : [];
    const specRows = apiSpecs.length ? apiSpecs.map(s => [s.key, s.value]) : (p.specs || []);
    $('#pdp-specs').innerHTML = specRows.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('');
    if (mainImage && imgs[0]) { mainImage.src = imgs[0]; mainImage.alt = p.name; }
    const thumbsEl = $('#gallery-thumbs');
    if (thumbsEl) {
      thumbsEl.hidden = imgs.length <= 1;
      thumbsEl.innerHTML = imgs.length > 1 ? imgs.map((src, i) => `<button class="gallery__thumb" type="button" data-src="${esc(src)}" aria-label="Show image ${i + 1}"${i === 0 ? ' aria-current="true"' : ''}><img src="${esc(src)}" width="200" height="200" alt=""></button>`).join('') : '';
      thumbsEl.addEventListener('click', e => { const b = e.target.closest('.gallery__thumb'); if (!b || !mainImage || b.dataset.src === mainImage.getAttribute('src')) return; const wrap = mainImage.closest('.gallery__main'); if (wrap) wrap.classList.add('is-swap'); setTimeout(() => { mainImage.src = b.dataset.src; mainImage.onload = () => { if (wrap) wrap.classList.remove('is-swap'); }; setTimeout(() => { if (wrap) wrap.classList.remove('is-swap'); }, 300); }, 120); document.querySelectorAll('.gallery__thumb').forEach(t => { if (t === b) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current'); }); });
    }
    let qty = 1; const out = $('#qty-value'), add = $('#pdp-add'), minusBtn = $('#qty-minus'), plusBtn = $('#qty-plus');
    if (!out || !add || !minusBtn || !plusBtn) return;
    const stickyBar = $('#sticky-atc'), stickyAdd = $('#sticky-add');
    const mqMobile = window.matchMedia ? window.matchMedia('(max-width: 767.98px)') : null;
    const paintSticky = () => {
      if (!stickyBar || !stickyAdd) return;
      const nm = $('#sticky-name'), pr = $('#sticky-price'), old = $('#sticky-old');
      if (nm) nm.textContent = p.name;
      if (pr) pr.textContent = fmt(p.price);
      if (old) {
        if (p.old) { old.hidden = false; old.innerHTML = `<span class="visually-hidden">Was </span>${fmt(p.old)}`; }
        else { old.hidden = true; old.textContent = ''; }
      }
      stickyAdd.dataset.add = p.id;
      stickyAdd.dataset.qty = qty;
      stickyAdd.setAttribute('aria-label', `Add ${p.name} to cart`);
    };
    const sync = () => { out.textContent = qty; add.dataset.qty = qty; minusBtn.disabled = qty <= 1; plusBtn.disabled = qty >= 10; paintSticky(); };
    minusBtn.addEventListener('click', () => { qty = Math.max(1, qty - 1); sync(); });
    plusBtn.addEventListener('click', () => { qty = Math.min(10, qty + 1); sync(); });
    add.dataset.add = p.id; sync();
    /* Sticky mobile Add to Cart: compact mirror of price + CTA, shares PDP qty. */
    const syncStickyVis = visible => {
      if (!stickyBar || !stickyAdd) return;
      const show = visible && !!mqMobile && mqMobile.matches;
      stickyBar.hidden = !show;
      stickyBar.classList.toggle('is-visible', show);
      stickyAdd.tabIndex = show ? 0 : -1;
      document.body.classList.toggle('has-sticky-atc', show);
    };
    if (stickyBar && stickyAdd) {
      paintSticky();
      const actions = $('#pdp-actions');
      let pastActions = false;
      const isPastActions = () => pastActions;
      const updateState = past => {
        if (past !== pastActions) {
          pastActions = past;
          syncStickyVis(pastActions);
        }
      };
      if ('IntersectionObserver' in window && actions) {
        const io = new IntersectionObserver(es => {
          const en = es[0];
          updateState(!en.isIntersecting && en.boundingClientRect.bottom < 0);
        }, { threshold: 0 });
        io.observe(actions);
        window.addEventListener('scroll', () => {
          updateState(actions.getBoundingClientRect().bottom < 0);
        }, { passive: true });
      } else if (actions) {
        const onScroll = () => {
          updateState(actions.getBoundingClientRect().bottom < 0);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
      }
      if (mqMobile && mqMobile.addEventListener) mqMobile.addEventListener('change', () => syncStickyVis(isPastActions()));
      else if (mqMobile && mqMobile.addListener) mqMobile.addListener(() => syncStickyVis(isPastActions()));
    }
    const w = $('#pdp-wish'); w.dataset.wish = p.id; w.setAttribute('aria-pressed', String(NOVA.wish.has(p.id)));
    { const prod = p; const syncWishLabel = () => { const on = NOVA.wish.has(prod.id); w.setAttribute('aria-pressed', String(on)); w.setAttribute('aria-label', (on ? `Remove ${prod.name} from wishlist` : `Add ${prod.name} to wishlist`)); }; syncWishLabel(); document.addEventListener('wishlist:change', syncWishLabel); }
    const relGrid = $('#related-grid'); if (relGrid) relGrid.innerHTML = grid(products().filter(x => x.cat === p.cat && x.id !== p.id).concat(products().filter(x => x.cat !== p.cat)).slice(0, 4), new Set(NOVA.wish.ids()));
    /* Delivery estimator: city select + estimated ETA. Cairo default; stored city reused. */
    const shipBox = $('#ship-est'), shipSel = $('#ship-city');
    if (shipBox && shipSel) {
      const renderShipCities = () => {
        const selected = NOVA.delivery.get();
        NOVA.populateDeliveryCitySelect(shipSel);
        if (NOVA.deliveryCities[selected]) shipSel.value = selected;
      };
      renderShipCities();
      const paint = () => {
        const id = NOVA.delivery.get(), info = NOVA.delivery.info(id);
        if (shipSel.value !== id) shipSel.value = id;
        const days = $('#ship-days'), fee = $('#ship-fee'), res = shipBox.querySelector('.ship-est__result');
        let feeText = fmt(NOVA.DELIVERY_FEE);
        try { feeText = (NOVA.cart.subtotal() > 0 && NOVA.cart.delivery() === 0) ? 'Free' : fmt(NOVA.DELIVERY_FEE); } catch { /* keep standard fee */ }
        if (days) days.textContent = `${info.days} — ${info.name}`;
        if (fee) fee.textContent = feeText;
        if (res) { res.classList.add('is-swap'); requestAnimationFrame(() => requestAnimationFrame(() => res.classList.remove('is-swap'))); }
      };
      shipSel.value = NOVA.delivery.get();
      paint();
      shipSel.addEventListener('change', () => { NOVA.delivery.set(shipSel.value); paint(); });
      document.addEventListener('cart:change', () => { if (document.contains(shipBox)) paint(); });
      if (NOVA.storeSettingsReady) {
        NOVA.storeSettingsReady.then(() => {
          if (!document.contains(shipSel)) return;
          renderShipCities();
          paint();
        });
      }
    }
    try { NOVA.recent.add(p.id); } catch { /* never break PDP */ }
    NOVA.renderRecentlyViewed();
    };
    // Paint instantly from the list catalogue, then enrich gallery + specs.
    paint(local, null);
    fetch(`api/product.php?slug=${encodeURIComponent(local.id)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (!(j && j.success && j.data)) return;
        const detail = j.data;
        // Surgical enrichment only: specs + gallery. Never re-run full paint
        // (qty/wishlist/sticky listeners are already bound exactly once).
        if (Array.isArray(detail.specifications) && detail.specifications.length) {
          const rows = detail.specifications.map(s => [s.key, s.value]);
          const specBox = $('#pdp-specs');
          if (specBox) specBox.innerHTML = rows.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('');
        }
        if (Array.isArray(detail.images) && detail.images.length) {
          const paths = detail.images.map(i => i.image_path);
          const main = $('#gallery-main'), thumbs = $('#gallery-thumbs');
          if (main) {
            main.src = paths[0];
            main.alt = local.name;
          }
          if (thumbs) {
            thumbs.hidden = paths.length <= 1;
            thumbs.innerHTML = paths.length > 1 ? paths.map((src, i) => `<button class="gallery__thumb" type="button" data-src="${esc(src)}" aria-label="Show image ${i + 1}"${i === 0 ? ' aria-current="true"' : ''}><img src="${esc(src)}" width="200" height="200" alt=""></button>`).join('') : '';
          }
        }
      })
      .catch(() => { /* list data already painted; detail is enhancement */ });
  };
})();
