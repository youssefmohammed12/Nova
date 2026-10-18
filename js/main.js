/* Page-specific behaviour, chosen by <body data-page="..."> */
(function () {
  const { fmt, ui } = NOVA;
  const products = () => NOVA.products || [];
  const $ = (s, root) => (root || document).querySelector(s), params = new URLSearchParams(location.search);
  const grid = (list, wishSet) => list.map(p => `<div class="col-6 col-lg-3">${ui.card(p, wishSet)}</div>`).join('');
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const line = (p, qty) => `<div class="summary-line"><img src="${NOVA.imgs(p.id)[0]}" width="52" height="52" alt=""><span>${p.name} x ${qty}</span><span>${fmt(p.price * qty)}</span></div>`;
  /* Recently Viewed: one storage read, resolve via NOVA.find, reuse ui.card. Hidden when empty. */
  const renderRecent = () => {
    const section = $('#recent-section'), g = $('#recent-grid');
    if (!section || !g) return;
    let ids = [];
    try { ids = NOVA.recent.items(); } catch { ids = []; }
    const list = ids.map(id => NOVA.find(id)).filter(Boolean).slice(0, 6);
    if (!list.length) { section.hidden = true; g.innerHTML = ''; return; }
    section.hidden = false;
    g.innerHTML = grid(list, new Set(NOVA.wish.ids()));
  };

  /* ── Authenticated checkout (2026-10-17) ──────────────────────────────
     api/orders.php rejects unauthenticated order creation with 401, so the
     cart CTA and checkout page send signed-out visitors to
     login.php?return=checkout. That return value is whitelisted server-side
     (the literal 'checkout' only — never a raw URL), and the localStorage
     cart survives every redirect. */
  const CO_LOGIN = 'account/login.php?return=checkout';
  const customerAuthed = () => fetch((NOVA.BASE || '') + 'api/customer-auth.php', { headers: { Accept: 'application/json' }, cache: 'no-store' })
    .then(r => (r.ok ? r.json() : null))
    .then(j => !!(j && j.success && j.data && j.data.authenticated))
    .catch(() => false);

  const pages = {
    home() {
      const catGrid = $('#category-grid'), featGrid = $('#featured-grid'), slides = $('#bestseller-slides');
      if (!catGrid || !featGrid || !slides) return;
      catGrid.innerHTML = NOVA.categories.map(c => `<div class="col-6 col-md-4 col-lg"><a class="category-card" href="shop.html?cat=${c.id}"><img src="assets/images/${c.image}" width="600" height="750" loading="lazy" alt="${c.name} collection"><span class="category-card__label">${c.name}<i class="bi bi-arrow-right" aria-hidden="true"></i></span></a></div>`).join('');
      const wishSet = new Set(NOVA.wish.ids());
      featGrid.innerHTML = grid(products().filter(p => ['sahara-vase', 'luna-floor-lamp', 'nile-basket-set', 'aswan-side-table'].includes(p.id)), wishSet);
      slides.innerHTML = products().filter(p => p.best).map(p => `<div class="swiper-slide">${ui.card(p, wishSet)}</div>`).join('');
      renderRecent();
      if (ui.shopLook) ui.shopLook();
      if (!window.Swiper) return;
      new Swiper('#bestsellers', { slidesPerView: 1.6, spaceBetween: 16, navigation: { nextEl: '#best-next', prevEl: '#best-prev' }, breakpoints: { 576: { slidesPerView: 2.4 }, 992: { slidesPerView: 4, spaceBetween: 24 } } });
    },
    shop() {
      const searchEl = $('#f-search'), sortEl = $('#f-sort'), catBox = $('#cat-filters'), pillsBox = $('#cat-pills'), gridEl = $('#shop-grid'), countEl = $('#result-count'), filtersEl = $('#filters'), bannerEl = $('#wish-banner'), activeFiltersEl = $('#active-filters'), titleEl = $('#shop-title');
      if (!searchEl || !sortEl || !catBox || !gridEl || !countEl || !filtersEl) return;

      const catIds = new Set(NOVA.categories.map(c => c.id));
      const rawCat = params.get('cat') || 'all';
      const rawSort = params.get('sort') || 'featured';
      const validSorts = new Set(['featured', 'new', 'low', 'high', 'alpha']);
      const validPrices = new Set(['all', 'u500', 'u600', 'm1500', 'm3000', 'o3000']);
      const validMats = new Set(['all', 'wood', 'ceramic', 'metal', 'glass', 'textile']);

      const s = {
        q: params.get('q') || '',
        cat: (rawCat === 'all' || catIds.has(rawCat)) ? rawCat : 'all',
        material: validMats.has(params.get('material')) ? params.get('material') : 'all',
        price: validPrices.has(params.get('price')) ? params.get('price') : 'all',
        sort: validSorts.has(rawSort) ? rawSort : 'featured',
        wish: params.get('wish') === '1'
      };

      searchEl.value = s.q;
      sortEl.value = s.sort;

      const ranges = {
        all: [0, 1e9],
        u500: [0, 500],
        u600: [0, 600],
        m1500: [600, 1500],
        m3000: [1500, 3000],
        o3000: [3000, 1e9]
      };

      const matchMaterial = (matString, filterVal) => {
        if (!filterVal || filterVal === 'all') return true;
        const m = (matString || '').toLowerCase();
        if (filterVal === 'wood') return m.includes('wood') || m.includes('oak') || m.includes('beech') || m.includes('fibre') || m.includes('fiber') || m.includes('hyacinth') || m.includes('seagrass') || m.includes('natural');
        if (filterVal === 'ceramic') return m.includes('ceramic') || m.includes('stoneware') || m.includes('stone') || m.includes('alabaster');
        if (filterVal === 'metal') return m.includes('metal') || m.includes('steel') || m.includes('brass') || m.includes('copper');
        if (filterVal === 'glass') return m.includes('glass') || m.includes('alabaster') || m.includes('mirror');
        if (filterVal === 'textile') return m.includes('fabric') || m.includes('boucle') || m.includes('cotton') || m.includes('linen') || m.includes('wool') || m.includes('wax');
        return m.includes(filterVal.toLowerCase());
      };

      const priceLabels = {
        u500: 'Under EGP 500',
        u600: 'Under EGP 600',
        m1500: 'EGP 600 to 1,500',
        m3000: 'EGP 1,500 to 3,000',
        o3000: 'Over EGP 3,000'
      };

      const matLabels = {
        wood: 'Wood & Natural',
        ceramic: 'Ceramic & Stone',
        metal: 'Metal & Brass',
        glass: 'Glass & Alabaster',
        textile: 'Textile & Wax'
      };

      const syncUrl = () => {
        const p = new URLSearchParams();
        if (s.cat && s.cat !== 'all') p.set('cat', s.cat);
        if (s.q) p.set('q', s.q);
        if (s.material && s.material !== 'all') p.set('material', s.material);
        if (s.price && s.price !== 'all') p.set('price', s.price);
        if (s.sort && s.sort !== 'featured') p.set('sort', s.sort);
        if (s.wish) p.set('wish', '1');
        const qs = p.toString();
        try { history.replaceState({}, '', qs ? `shop.html?${qs}` : 'shop.html'); } catch (_) {}
      };

      const paintCategoryNav = () => {
        const allProds = products();
        const cats = [{ id: 'all', name: 'All Pieces' }, ...NOVA.categories];

        if (pillsBox) {
          pillsBox.innerHTML = cats.map(c => {
            const cnt = c.id === 'all' ? allProds.length : allProds.filter(p => p.cat === c.id).length;
            const on = c.id === s.cat;
            return `<button class="cat-pill${on ? ' is-active' : ''}" type="button" data-cat-pill="${c.id}" aria-pressed="${on}"><span>${c.name}</span><span class="cat-pill__count">${cnt}</span></button>`;
          }).join('');
        }

        catBox.innerHTML = [{ id: 'all', name: 'All products' }, ...NOVA.categories].map(c => {
          const cnt = c.id === 'all' ? allProds.length : allProds.filter(p => p.cat === c.id).length;
          return `<div class="form-check"><input class="form-check-input" type="radio" name="cat" id="cat-${c.id}" value="${c.id}"${c.id === s.cat ? ' checked' : ''}><label class="form-check-label d-flex justify-content-between align-items-center" for="cat-${c.id}"><span>${c.name}</span><span class="badge rounded-pill text-bg-light border text-muted">${cnt}</span></label></div>`;
        }).join('');
      };

      const syncControls = () => {
        if (searchEl && searchEl.value !== s.q) searchEl.value = s.q;
        if (sortEl && sortEl.value !== s.sort) sortEl.value = s.sort;

        const catRadio = filtersEl.querySelector(`input[name="cat"][value="${s.cat}"]`);
        if (catRadio) catRadio.checked = true;

        const matRadio = filtersEl.querySelector(`input[name="material"][value="${s.material}"]`);
        if (matRadio) matRadio.checked = true;

        const priceVal = (s.price === 'u500' && !filtersEl.querySelector('input[name="price"][value="u500"]')) ? 'u600' : s.price;
        const priceRadio = filtersEl.querySelector(`input[name="price"][value="${priceVal}"]`);
        if (priceRadio) priceRadio.checked = true;

        if (pillsBox) {
          pillsBox.querySelectorAll('[data-cat-pill]').forEach(btn => {
            const on = btn.dataset.catPill === s.cat;
            btn.classList.toggle('is-active', on);
            btn.setAttribute('aria-pressed', String(on));
          });
        }
      };

      paintCategoryNav();

      const render = () => {
        const wishSet = new Set(NOVA.wish.ids());
        const allProds = products();

        const curRange = ranges[s.price] || ranges.all;
        let l = allProds.filter(p =>
          (s.cat === 'all' || p.cat === s.cat) &&
          (!s.q || p.name.toLowerCase().includes(s.q.toLowerCase()) || p.desc.toLowerCase().includes(s.q.toLowerCase())) &&
          matchMaterial(p.material, s.material) &&
          p.price >= curRange[0] && p.price <= curRange[1] &&
          (!s.wish || wishSet.has(p.id))
        );

        if (s.sort === 'low') l.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
        else if (s.sort === 'high') l.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name));
        else if (s.sort === 'new') l.sort((a, b) => !!b.isNew - !!a.isNew || a.name.localeCompare(b.name));
        else if (s.sort === 'alpha') l.sort((a, b) => a.name.localeCompare(b.name));

        if (titleEl) {
          if (s.wish) titleEl.textContent = 'Saved Wishlist';
          else if (s.cat !== 'all') titleEl.textContent = NOVA.catName(s.cat);
          else if (s.q) titleEl.textContent = `Search: “${s.q}”`;
          else titleEl.textContent = 'All Pieces';
        }

        const wishCount = wishSet.size;
        if (bannerEl) {
          bannerEl.hidden = !s.wish;
          if (s.wish) {
            const label = bannerEl.querySelector('[data-wish-count]');
            if (label) label.textContent = `${wishCount} saved item${wishCount === 1 ? '' : 's'}`;
          }
        }

        countEl.textContent = `${l.length} piece${l.length === 1 ? '' : 's'}`;

        if (activeFiltersEl) {
          const chips = [];
          if (s.cat !== 'all') chips.push({ key: 'cat', label: NOVA.catName(s.cat) });
          if (s.material !== 'all' && matLabels[s.material]) chips.push({ key: 'material', label: matLabels[s.material] });
          const pKey = s.price === 'u500' ? 'u600' : s.price;
          if (s.price !== 'all' && priceLabels[pKey]) chips.push({ key: 'price', label: priceLabels[pKey] });
          if (s.q) chips.push({ key: 'q', label: `“${s.q}”` });
          if (s.wish) chips.push({ key: 'wish', label: 'Wishlist' });

          if (chips.length) {
            activeFiltersEl.hidden = false;
            activeFiltersEl.innerHTML = `
              <div class="active-filters__list">
                <span class="active-filters__label small text-muted-nova">Active filters:</span>
                ${chips.map(c => `<button class="filter-chip" type="button" data-remove-filter="${c.key}"><span>${c.label}</span><i class="bi bi-x" aria-hidden="true"></i><span class="visually-hidden">Remove filter ${c.label}</span></button>`).join('')}
                <button class="btn btn-link btn-sm p-0 active-filters__clear text-decoration-none" type="button" id="reset-filters" data-action="reset-filters">Clear all</button>
              </div>`;
          } else {
            activeFiltersEl.hidden = true;
            activeFiltersEl.innerHTML = '';
          }
        }

        if (s.wish && !l.length) {
          gridEl.innerHTML = '<div class="col-12"><div class="empty-state"><i class="bi bi-heart" aria-hidden="true"></i><h2 class="h4">Your wishlist is empty</h2><p>You have not saved any pieces yet. Tap the heart on any product to keep it here.</p><button class="btn btn-nova" type="button" id="exit-wishlist" data-action="reset-filters">Browse all products</button></div></div>';
        } else if (!l.length) {
          gridEl.innerHTML = '<div class="col-12"><div class="empty-state"><i class="bi bi-search" aria-hidden="true"></i><h2 class="h4">No pieces match your selection</h2><p>Try clearing some filters, selecting a different material, or resetting search to view all pieces.</p><button class="btn btn-ghost" type="button" id="reset-filters" data-action="reset-filters">Reset all filters</button></div></div>';
        } else {
          gridEl.innerHTML = l.map(p => `<div class="col-6 col-md-4">${ui.card(p, wishSet)}</div>`).join('');
        }

        syncControls();
        syncUrl();
      };

      searchEl.addEventListener('input', debounce(e => {
        s.q = e.target.value.trim();
        gridEl.classList.add('is-loading');
        render();
        requestAnimationFrame(() => requestAnimationFrame(() => gridEl.classList.remove('is-loading')));
      }, 150));

      sortEl.addEventListener('change', e => {
        s.sort = e.target.value;
        render();
      });

      filtersEl.addEventListener('change', e => {
        if (e.target.name === 'cat') s.cat = e.target.value;
        if (e.target.name === 'material') s.material = e.target.value;
        if (e.target.name === 'price') s.price = e.target.value;
        render();
      });

      if (pillsBox) {
        pillsBox.addEventListener('click', e => {
          const pill = e.target.closest('[data-cat-pill]');
          if (!pill) return;
          s.cat = pill.dataset.catPill;
          render();
        });
      }

      document.addEventListener('click', e => {
        if (!e.target || !e.target.closest) return;
        const removeBtn = e.target.closest('[data-remove-filter]');
        if (removeBtn) {
          const k = removeBtn.dataset.removeFilter;
          if (k === 'cat') s.cat = 'all';
          else if (k === 'material') s.material = 'all';
          else if (k === 'price') s.price = 'all';
          else if (k === 'q') { s.q = ''; if (searchEl) searchEl.value = ''; }
          else if (k === 'wish') s.wish = false;
          render();
          return;
        }

        const resetBtn = e.target.closest('#reset-filters, #clear-all-filters, #sidebar-reset, #exit-wishlist, [data-action="reset-filters"]');
        if (resetBtn) {
          s.q = '';
          s.cat = 'all';
          s.material = 'all';
          s.price = 'all';
          s.sort = 'featured';
          s.wish = false;
          if (searchEl) { searchEl.value = ''; searchEl.blur(); }
          const shopPanel = document.getElementById('shopPanel');
          if (shopPanel) shopPanel.hidden = true;
          render();
          return;
        }
      });

      document.addEventListener('wishlist:change', () => { if (s.wish) render(); });
      render();
    },
    product() {
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
      const off = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
      document.title = `${p.name} | NOVA Home`;
      const bcCat = $('#bc-cat'), bcName = $('#bc-name'), pdpCat = $('#pdp-cat'), pdpName = $('#pdp-name');
      if (!bcCat || !bcName || !pdpCat || !pdpName) return;
      bcCat.innerHTML = `<a href="shop.html?cat=${p.cat}">${NOVA.catName(p.cat)}</a>`; bcName.textContent = p.name;
      pdpCat.textContent = NOVA.catName(p.cat); pdpName.textContent = p.name;
      $('#pdp-rating').innerHTML = `<span class="stars" aria-hidden="true">${'★'.repeat(Math.round(p.rating))}${'☆'.repeat(5 - Math.round(p.rating))}</span> <span class="visually-hidden">Rated ${p.rating} out of 5,</span> ${p.rating} (${p.reviews} reviews)`;
      $('#pdp-price').innerHTML = `${fmt(p.price)}${p.old ? `<span class="price--old"><span class="visually-hidden">Was </span>${fmt(p.old)}</span> <span class="badge text-bg-danger ms-1">Save ${off}%</span>` : ''}`;
      $('#pdp-desc').textContent = p.desc;
      const apiSpecs = detail && Array.isArray(detail.specifications) ? detail.specifications : [];
      const specRows = apiSpecs.length ? apiSpecs.map(s => [s.key, s.value]) : (p.specs || []);
      $('#pdp-specs').innerHTML = specRows.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join('');
      main.src = imgs[0]; main.alt = p.name;
      const thumbsEl = $('#gallery-thumbs');
      if (thumbsEl) {
        thumbsEl.hidden = imgs.length <= 1;
        thumbsEl.innerHTML = imgs.length > 1 ? imgs.map((src, i) => `<button class="gallery__thumb" type="button" data-src="${src}" aria-label="Show image ${i + 1}"${i === 0 ? ' aria-current="true"' : ''}><img src="${src}" width="200" height="200" alt=""></button>`).join('') : '';
        thumbsEl.addEventListener('click', e => { const b = e.target.closest('.gallery__thumb'); if (!b || b.dataset.src === main.src) return; const wrap = main.closest('.gallery__main'); if (wrap) wrap.classList.add('is-swap'); setTimeout(() => { main.src = b.dataset.src; main.onload = () => { if (wrap) wrap.classList.remove('is-swap'); }; setTimeout(() => { if (wrap) wrap.classList.remove('is-swap'); }, 300); }, 120); document.querySelectorAll('.gallery__thumb').forEach(t => { if (t === b) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current'); }); });
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
      /* Delivery estimator: city select + demo estimate. Cairo default; stored city reused. */
      const shipBox = $('#ship-est'), shipSel = $('#ship-city');
      if (shipBox && shipSel) {
        shipSel.innerHTML = NOVA.delivery.ids().map(id => `<option value="${id}">${NOVA.deliveryCities[id].name}</option>`).join('');
        const paint = () => {
          const id = NOVA.delivery.get(), info = NOVA.delivery.info(id);
          if (shipSel.value !== id) shipSel.value = id;
          const days = $('#ship-days'), fee = $('#ship-fee'), res = shipBox.querySelector('.ship-est__result');
          let feeText = fmt(NOVA.DELIVERY_FEE);
          try { feeText = (NOVA.cart.subtotal() > 0 && NOVA.cart.delivery() === 0) ? 'Free' : fmt(NOVA.DELIVERY_FEE); } catch { /* keep standard fee */ }
          if (days) days.textContent = `${info.days} — ${info.name} (demo estimate)`;
          if (fee) fee.textContent = feeText;
          if (res) { res.classList.add('is-swap'); requestAnimationFrame(() => requestAnimationFrame(() => res.classList.remove('is-swap'))); }
        };
        shipSel.value = NOVA.delivery.get();
        paint();
        shipSel.addEventListener('change', () => { NOVA.delivery.set(shipSel.value); paint(); });
        document.addEventListener('cart:change', () => { if (document.contains(shipBox)) paint(); });
      }
      try { NOVA.recent.add(p.id); } catch { /* never break PDP */ }
      renderRecent();
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
            if (specBox) specBox.innerHTML = rows.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join('');
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
              thumbs.innerHTML = paths.length > 1 ? paths.map((src, i) => `<button class="gallery__thumb" type="button" data-src="${src}" aria-label="Show image ${i + 1}"${i === 0 ? ' aria-current="true"' : ''}><img src="${src}" width="200" height="200" alt=""></button>`).join('') : '';
            }
          }
        })
        .catch(() => { /* list data already painted; detail is enhancement */ });
    },
    cart() {
      const filledEl = $('#cart-filled'), emptyEl = $('#cart-empty'), linesEl = $('#cart-lines');
      if (!filledEl || !emptyEl || !linesEl) return;
      // Authenticated checkout: point the CTA at login when signed out.
      // (A race just falls through to the checkout page gate, which redirects.)
      const coBtn = $('#cart-checkout');
      if (coBtn) customerAuthed().then(ok => { if (!ok) coBtn.setAttribute('href', CO_LOGIN); });
      const render = () => {
        const items = NOVA.cart.items(), full = items.length > 0;
        filledEl.hidden = !full; emptyEl.hidden = full;
        if (!full) return;
        linesEl.innerHTML = items.map(i => { const p = NOVA.find(i.id); return `<li class="cart-item"><img src="${NOVA.imgs(p.id)[0]}" width="110" height="110" alt="${p.name}"><div><h2><a href="product.html?id=${p.id}" class="text-decoration-none">${p.name}</a></h2><span class="text-muted-nova small">${fmt(p.price)} each</span>
          <div class="cart-item__row"><div class="qty" role="group" aria-label="Quantity for ${p.name}"><button type="button" data-dec="${p.id}" aria-label="Decrease quantity"${i.qty <= 1 ? ' disabled' : ''}>&minus;</button><output>${i.qty}</output><button type="button" data-inc="${p.id}" aria-label="Increase quantity"${i.qty >= 10 ? ' disabled' : ''}>+</button></div><span class="price">${fmt(p.price * i.qty)}</span></div>
          <button class="link-remove" type="button" data-remove="${p.id}">Remove</button></div></li>`; }).join('');
        summary();
      };
      const summary = () => { const d = NOVA.cart.delivery(); const sub = $('#sum-sub'), del = $('#sum-del'), tot = $('#sum-total'); if (sub) sub.textContent = fmt(NOVA.cart.subtotal()); if (del) del.textContent = d ? fmt(d) : 'Free'; if (tot) tot.textContent = fmt(NOVA.cart.total()); if (ui.renderDeliveryProgress) ui.renderDeliveryProgress(); };
      linesEl.addEventListener('click', e => {
        const t = e.target.closest('button'); if (!t) return; const cur = id => NOVA.cart.items().find(item => item.id === id);
        if (t.dataset.inc) { const c = cur(t.dataset.inc); if (c) NOVA.cart.setQty(t.dataset.inc, c.qty + 1); }
        if (t.dataset.dec) { const c = cur(t.dataset.dec); if (c) NOVA.cart.setQty(t.dataset.dec, c.qty - 1); }
        if (t.dataset.remove) NOVA.cart.remove(t.dataset.remove);
        render();
      });
      document.addEventListener('cart:change', render);
      render();
    },
    checkout() {
      const linesEl = $('#co-lines'), form = $('#checkout-form');
      if (!linesEl || !form) return;
      /* Checkout requires a customer session (2026-10-17). Signed-out
         visitors are redirected to the login flow with a whitelisted
         return=checkout; the localStorage cart is untouched by the redirect.
         A session that expires mid-checkout is caught by the 401 handler in
         the submit flow below. */
      customerAuthed().then(ok => { if (!ok) location.replace(CO_LOGIN); });
      const cartMsg = $('#co-cart-msg'), placeBtn = $('#place-order');
      const renderSummary = () => {
        const items = NOVA.cart.items();
        linesEl.innerHTML = items.map(i => line(NOVA.find(i.id), i.qty)).join('') || '<p class="text-muted-nova">Your cart is empty. <a href="shop.html">Browse the shop</a></p>';
        const d = NOVA.cart.delivery();
        const sub = $('#sum-sub'), del = $('#sum-del'), tot = $('#sum-total');
        if (sub) sub.textContent = fmt(NOVA.cart.subtotal());
        if (del) del.textContent = d ? fmt(d) : 'Free';
        if (tot) tot.textContent = fmt(NOVA.cart.total());
        if (placeBtn) placeBtn.disabled = items.length === 0;
        return items;
      };
      renderSummary();
      /* Phase 9: prefill from the authenticated customer's profile + default
         saved address. 401s/failures simply keep whatever is in the form.
         Purely presentation — submission is unchanged. */
      (function prefillFromAccount() {
        const fill = (id, val) => { const el = form.querySelector('#' + id); if (el && val && !el.value) el.value = val; };
        const base = NOVA.BASE || '';
        fetch(base + 'api/customer-profile.php', { headers: { Accept: 'application/json' } })
          .then(r => (r.ok ? r.json() : null))
          .then(j => {
            if (!(j && j.success && j.data)) return null;
            fill('c-name', j.data.name);
            // Normalise stored phones (e.g. '+20 112 345 6789') so the strict
            // input pattern validates the prefilled value.
            fill('c-phone', String(j.data.phone || '').replace(/\s+/g, ''));
            return fetch(base + 'api/customer-addresses.php', { headers: { Accept: 'application/json' } });
          })
          .then(r => (r ? (r.ok ? r.json() : null) : null))
          .then(j => {
            if (!(j && j.success && Array.isArray(j.data))) return;
            const dflt = j.data.find(a => a.is_default) || null;
            if (!dflt) return;
            fill('c-address', dflt.address);
            fill('c-apt', dflt.apartment);
            const citySel = form.querySelector('#c-city');
            if (citySel) {
              const opt = [...citySel.options].find(o => o.text.trim().toLowerCase() === String(dflt.city).toLowerCase());
              if (opt) citySel.value = opt.value || opt.text;
            }
          })
          .catch(() => { /* profile fetch failed: keep the current form values */ });
      })();
      document.addEventListener('cart:change', renderSummary);
      /* Reuse stored estimator city so checkout does not force a reselect. Read-only. */
      const coCity = $('#c-city');
      if (coCity) {
        const map = { Cairo: 'cairo', Giza: 'giza', Alexandria: 'alexandria' };
        let cur = null;
        try { cur = NOVA.delivery.get(); } catch { cur = null; }
        const info = cur && NOVA.deliveryCities[cur];
        if (info) {
          const match = [...coCity.options].find(o => o.text.trim().toLowerCase() === info.name.toLowerCase() || map[o.text.trim()] === cur);
          if (match) { coCity.value = match.value || match.text; }
        }
        const coDest = document.createElement('p');
        coDest.className = 'small text-muted-nova mt-2 mb-0';
        coDest.id = 'co-dest';
        const coPaint = () => {
          let id = null;
          try { id = NOVA.delivery.get(); } catch { id = null; }
          const label = (id && NOVA.deliveryCities[id] && NOVA.deliveryCities[id].name) || NOVA.deliveryCities[NOVA.delivery.def].name;
          coDest.textContent = `Delivery to: ${label} (demo estimate)`;
        };
        coPaint();
        coCity.closest('.col-md-6').appendChild(coDest);
        coCity.addEventListener('change', () => {
          const t = coCity.options[coCity.selectedIndex] ? coCity.options[coCity.selectedIndex].text.trim().toLowerCase() : '';
          const found = Object.keys(NOVA.deliveryCities).find(k => NOVA.deliveryCities[k].name.toLowerCase() === t);
          if (found) { NOVA.delivery.set(found); coPaint(); }
        });
      }
      /* Real Phase 3 order submission: POST the form + cart to api/orders.php.
         Prices/totals are NOT trusted — the server recalculates everything. */
      const coError = document.createElement('p');
      coError.className = 'alert alert-danger mt-3 mb-0';
      coError.id = 'co-error';
      coError.hidden = true;
      coError.setAttribute('role', 'alert');
      form.appendChild(coError);
      const coFail = msg => {
        coError.textContent = msg;
        coError.hidden = false;
        coError.focus();
        if (placeBtn) { placeBtn.disabled = false; placeBtn.textContent = 'Place order'; }
      };
      form.addEventListener('submit', e => {
        e.preventDefault();
        form.classList.add('was-validated');
        coError.hidden = true;
        const items = renderSummary();
        if (!items.length) {
          if (cartMsg) { cartMsg.hidden = false; cartMsg.focus(); }
          else { linesEl.focus(); }
          return;
        }
        if (!form.checkValidity()) { const bad = form.querySelector(':invalid'); if (bad) bad.focus(); return; }
        if (placeBtn) { placeBtn.disabled = true; placeBtn.textContent = 'Placing order…'; }
        const val = id => { const el = form.querySelector('#' + id); return el ? el.value.trim() : ''; };
        const payload = {
          customer_name: val('c-name'), phone: val('c-phone'), email: val('c-email'),
          city: val('c-city'), apartment: val('c-apt'), address: val('c-address'),
          notes: val('c-notes'), payment_method: 'cod',
          items: items.map(i => ({ slug: i.id, qty: i.qty }))
        };
        const post = token => fetch('api/orders.php', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, csrf_token: token })
        }).then(async r => {
          let body = null;
          try { body = await r.json(); } catch { body = null; }
          return { status: r.status, body };
        });
        fetch('api/csrf.php', { headers: { Accept: 'application/json' } })
          .then(r => (r.ok ? r.json() : null))
          .then(j => {
            const token = j && j.success && j.data ? j.data.csrf_token : null;
            if (!token) throw new Error('csrf');
            return post(token);
          })
          .then(({ status, body }) => {
            if (status === 401) {
              // Session expired or signed out mid-checkout: return to the
              // login flow. The cart is NOT cleared (clear() runs only after
              // the server confirms a created order below).
              location.replace(CO_LOGIN);
              return;
            }
            if (!body || !body.success) {
              const msg = (body && body.error) || 'Unable to create order. Please try again.';
              coFail(msg);
              return;
            }
            const d = body.data || {};
            // No sessionStorage snapshot (Phase 4): the success page reads the
            // order from MySQL via the session-authorized api/order.php.
            NOVA.cart.clear();
            location.href = 'order-success.html?ref=' + encodeURIComponent(d.order_ref || '');
          })
          .catch(() => coFail('Could not reach the server. Check your connection and try again.'));
      });
    },
    success() {
      /* Phase 4: the database is the only source of truth. sessionStorage is
         not read at all (tamper-proof by construction). The ref in the URL is
         display/navigation only — api/order.php authorizes via the session. */
      const ref = new URLSearchParams(location.search).get('ref') || '';
      const refEl = $('#ok-ref'), boxEl = $('#ok-summary'), metaEl = $('#ok-meta');
      const refLineEl = $('#ok-ref-line'), titleEl = $('#ok-title'), subEl = $('#ok-subtitle');
      const iconEl = $('#ok-icon'), iconI = $('#ok-icon-i'), bcEl = $('#ok-bc'), infoList = $('#ok-info-list');

      const showMissing = () => {
        document.title = 'Order status | NOVA Home';
        if (bcEl) bcEl.textContent = 'Order status';
        if (titleEl) titleEl.textContent = 'No order specified';
        if (subEl) subEl.textContent = 'Storefront order status';
        if (iconEl) iconEl.className = 'success-check success-check--info';
        if (iconI) iconI.className = 'bi bi-info-circle';
        if (refLineEl) refLineEl.hidden = true;
        if (infoList) infoList.hidden = true;
        if (metaEl) metaEl.textContent = '';
        if (boxEl) {
          boxEl.innerHTML = '<p class="alert alert-info mb-0">No order confirmation could be loaded because no order reference was provided. If you recently placed an order, you can review it in your <a href="account/orders.php">order history</a> or <a href="shop.html">continue shopping</a>.</p>';
        }
        const sub = $('#ok-sub'), del = $('#ok-del'), tot = $('#ok-total');
        if (sub) sub.textContent = '—';
        if (del) del.textContent = '—';
        if (tot) tot.textContent = '—';
      };

      const showFail = () => {
        document.title = 'Order not found | NOVA Home';
        if (bcEl) bcEl.textContent = 'Order status';
        if (titleEl) titleEl.textContent = 'Order details unavailable';
        if (subEl) subEl.textContent = 'Order verification';
        if (iconEl) iconEl.className = 'success-check success-check--warning';
        if (iconI) iconI.className = 'bi bi-exclamation-triangle';
        if (refLineEl) refLineEl.hidden = true;
        if (infoList) infoList.hidden = true;
        if (metaEl) metaEl.textContent = '';
        if (boxEl) {
          boxEl.innerHTML = '<p class="alert alert-warning mb-0">Order details could not be loaded. Please ensure you are logged into the account used to place the order, or keep your order reference and contact us if you need assistance.</p>';
        }
        const sub = $('#ok-sub'), del = $('#ok-del'), tot = $('#ok-total');
        if (sub) sub.textContent = '—';
        if (del) del.textContent = '—';
        if (tot) tot.textContent = '—';
      };

      if (!ref) { showMissing(); return; }
      if (boxEl) boxEl.innerHTML = '<p class="text-muted-nova mb-0">Loading order details…</p>';
      fetch('api/order.php?ref=' + encodeURIComponent(ref), { headers: { Accept: 'application/json' } })
        .then(async r => ({ status: r.status, body: await r.json().catch(() => null) }))
        .then(({ status, body }) => {
          if (status !== 200 || !body || !body.success || !body.data) { showFail(); return; }
          const d = body.data;
          document.title = 'Order confirmed | NOVA Home';
          if (bcEl) bcEl.textContent = 'Order confirmed';
          if (titleEl) titleEl.textContent = 'Your order is confirmed';
          if (subEl) subEl.textContent = 'Thank you — cash on delivery';
          if (iconEl) iconEl.className = 'success-check';
          if (iconI) iconI.className = 'bi bi-check-lg';
          if (refLineEl) refLineEl.hidden = false;
          if (infoList) infoList.hidden = false;
          if (refEl) refEl.textContent = d.order_ref || ref;
          const items = Array.isArray(d.items) ? d.items : [];
          if (boxEl) {
            boxEl.innerHTML = items.length
              ? items.map(i => `<div class="summary-line"><img src="${i.slug ? NOVA.imgs(i.slug)[0] : (NOVA.BASE || '') + 'favicon.svg'}" width="52" height="52" alt=""><span>${i.product_name} x ${i.quantity}</span><span>${fmt(i.line_total)}</span></div>`).join('')
              : '<p class="text-muted-nova mb-0">No items to display.</p>';
          }
          const sub = $('#ok-sub'), del = $('#ok-del'), tot = $('#ok-total');
          if (sub) sub.textContent = fmt(d.subtotal);
          if (del) del.textContent = d.delivery_fee ? fmt(d.delivery_fee) : 'Free';
          if (tot) tot.textContent = fmt(d.total);
          if (metaEl) {
            const bits = [d.customer_name, [d.address, d.city].filter(x => x).join(', ')].filter(Boolean);
            metaEl.textContent = bits.length ? `Delivering to ${bits.join(' — ')}.` : '';
          }
        })
        .catch(() => showFail());
    }
  };
  document.addEventListener('DOMContentLoaded', () => {
    ui.mount();
    const pageKey = document.body.dataset.page;
    const run = () => (pages[pageKey] || (() => {}))();
    // Catalogue-backed pages wait for MySQL data; chrome-only pages run now.
    // cart/checkout/account-wishlist/admin render NOVA.find()/catalogue data,
    // so they wait as well. Pure-chrome pages (login/register demo forms) run now.
    if (['home', 'shop', 'product', 'cart', 'checkout', 'success', 'account', 'admin'].includes(pageKey)
      || document.querySelector('#cart-filled, #co-lines, #account-wish-grid, #ap-rows, #ac-rows')) {
      if (NOVA.catalog && NOVA.catalog.ready) {
        run();
      } else {
        document.addEventListener('catalog:ready', run, { once: true });
        document.addEventListener('catalog:error', () => {
          const hosts = {
            home: '#featured-grid', shop: '#shop-grid', product: '#pdp-detail'
          };
          const hostSelector = hosts[pageKey];
          if (!hostSelector) return;
          const el = document.querySelector(hostSelector);
          if (el) {
            el.innerHTML = '<div class="col-12"><div class="empty-state"><i class="bi bi-wifi-off" aria-hidden="true"></i><p>Could not load products. Please check your connection and refresh.</p><button class="btn btn-ghost" type="button" onclick="location.reload()">Retry</button></div></div>';
          }
        }, { once: true });
      }
    } else {
      run();
    }
    demoForms(); adminPreview(); accountPreview();
    // Catalogue-dependent previews re-render once MySQL data arrives.
    document.addEventListener('catalog:ready', () => { adminPreview(); accountPreview(); });
  });

  /* Demo-only forms: validate honestly, never pretend to save. */
  function demoForms() {
    document.querySelectorAll('#demo-login, #demo-register, #demo-profile, #demo-settings, #demo-product-form').forEach(f => {
      f.addEventListener('submit', e => {
        e.preventDefault(); f.classList.add('was-validated');
        if (f.id === 'demo-register') {
          const a = f.querySelector('#r-pass'), b = f.querySelector('#r-pass2');
          if (a && b) b.setCustomValidity(a.value && b.value && a.value !== b.value ? 'Passwords must match.' : '');
        }
        if (!f.checkValidity()) { const bad = f.querySelector(':invalid'); if (bad) bad.focus(); return; }
        NOVA.ui.toast('Demo only: nothing was saved. The backend will enable this later.');
      });
    });
    document.querySelectorAll('[data-demo]').forEach(b => b.addEventListener('click', () => NOVA.ui.toast('Demo only: this action is disabled until the backend is added.')));
  }

  /* Admin static previews: render real catalogue data into demo tables. */
  function adminPreview() {
    const q = $('#ap-q'), catSel = $('#ap-cat'), rows = $('#ap-rows');
    if (rows) {
      const stockOf = p => (p.id.length * 7) % 9;
      const renderCats = () => { if (catSel && catSel.options.length <= 1) NOVA.categories.forEach(c => { const o = document.createElement('option'); o.value = c.id; o.textContent = c.name; catSel.appendChild(o); }); };
      const render = () => {
        const term = (q ? q.value : '').toLowerCase(), cat = catSel ? catSel.value : 'all';
        rows.innerHTML = products()
          .filter(p => (cat === 'all' || p.cat === cat) && p.name.toLowerCase().includes(term))
          .map(p => { const st = stockOf(p); return `<tr><td><span class="d-flex align-items-center gap-2"><img class="thumb-sm" src="${NOVA.imgs(p.id)[0]}" width="44" height="44" alt="" loading="lazy"><span><strong>${p.name}</strong><br><span class="text-muted-nova small">${p.id}</span></span></span></td><td>${NOVA.catName(p.cat)}</td><td>${fmt(p.price)}</td><td>${st <= 2 ? `<span class="status status--pending">Low (${st})</span>` : st}</td><td><span class="status status--active">Active</span></td><td><a class="btn btn-ghost btn-sm" href="product-form.html?id=${p.id}">Edit</a></td></tr>`; }).join('')
          || '<tr><td colspan="6" class="text-muted-nova">No products match.</td></tr>';
      };
      renderCats(); render();
      if (q) q.addEventListener('input', render);
      if (catSel) catSel.addEventListener('change', render);
    }
    const catRows = $('#ac-rows');
    if (catRows) {
      catRows.innerHTML = NOVA.categories.map(c => { const n = products().filter(p => p.cat === c.id).length; return `<tr><td><strong>${c.name}</strong><br><span class="text-muted-nova small">${c.id}</span></td><td>${n}</td><td><span class="status status--active">Active</span></td><td><span class="d-flex gap-2"><button class="btn btn-ghost btn-sm" type="button" data-demo>Edit</button><button class="btn btn-ghost btn-sm" type="button" data-demo>Hide</button></span></td></tr>`; }).join('');
    }
    const pfCat = $('#pf-cat');
    if (pfCat) {
      NOVA.categories.forEach(c => { const o = document.createElement('option'); o.value = c.id; o.textContent = c.name; pfCat.appendChild(o); });
      const p = NOVA.find(new URLSearchParams(location.search).get('id'));
      if (p) {
        const title = $('#pf-title'); if (title) title.textContent = `Edit ${p.name} (demo)`;
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
        set('pf-name', p.name); set('pf-slug', p.id); set('pf-price', p.price); set('pf-old', p.old || ''); set('pf-desc', p.desc);
        pfCat.value = p.cat;
        const specs = $('#pf-specs'); if (specs) specs.value = (p.specs || []).map(([k, v]) => `${k}: ${v}`).join('\n');
        const isNew = $('#pf-new'); if (isNew) isNew.checked = !!p.isNew;
        const best = $('#pf-best'); if (best) best.checked = !!p.best;
      }
    }
    const aoRows = $('#ao-rows');
    if (aoRows) {
      document.querySelectorAll('[data-status]').forEach(btn => btn.addEventListener('click', () => {
        document.querySelectorAll('[data-status]').forEach(b => { b.setAttribute('aria-pressed', String(b === btn)); b.classList.toggle('btn-nova', b === btn); b.classList.toggle('btn-ghost', b !== btn); });
        const v = btn.dataset.status;
        aoRows.querySelectorAll('tr').forEach(tr => { tr.hidden = v !== 'all' && tr.dataset.s !== v; });
        const cards = $('#ao-cards');
        if (cards) {
          const map = { pending: 'status--pending', shipped: 'status--shipped', delivered: 'status--delivered' };
          cards.querySelectorAll('.admin-card').forEach(c => {
            const badge = c.querySelector('.status');
            const key = badge && Object.keys(map).find(k => badge.classList.contains(map[k]));
            c.hidden = v !== 'all' && key !== v;
          });
        }
      }));
    }
    const orderRef = new URLSearchParams(location.search).get('ref');
    if (orderRef) {
      ['ao-ref', 'ao-ref-h', 'demo-ref', 'bc-ref'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = orderRef; });
    }
  }

  /* Account static preview: render the real local wishlist with store card language. */
  function accountPreview() {
    const wishCount = document.querySelector('[data-demo-wish-count]');
    if (wishCount) wishCount.textContent = NOVA.wish.ids().length;
    const grid = $('#account-wish-grid');
    if (grid) {
      const renderGrid = () => {
        const ids = NOVA.wish.ids();
        const list = ids.map(id => NOVA.find(id)).filter(Boolean);
        grid.innerHTML = list.length ? list.map(p => `<div class="col-6 col-lg-4">${ui.card(p, new Set(ids))}</div>`).join('')
          : '<div class="col-12"><div class="empty-state"><i class="bi bi-heart" aria-hidden="true"></i><h2 class="h4">Your wishlist is empty</h2><p>Tap the heart on any product to keep it here.</p><a class="btn btn-nova" href="../shop.html">Continue shopping</a></div></div>';
      };
      renderGrid();
      document.addEventListener('wishlist:change', renderGrid);
    }
  }
})();
