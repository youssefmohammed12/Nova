(function () {
  const NOVA = window.NOVA;
  NOVA.pageControllers = NOVA.pageControllers || {};

  NOVA.pageControllers.shop = function shopPage() {
    const { ui, products, $, params, debounce } = NOVA.pageHelpers;
    const esc = NOVA.escapeHTML;
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
          return `<button class="cat-pill${on ? ' is-active' : ''}" type="button" data-cat-pill="${esc(c.id)}" aria-pressed="${on}"><span>${esc(c.name)}</span><span class="cat-pill__count">${cnt}</span></button>`;
        }).join('');
      }

      catBox.innerHTML = [{ id: 'all', name: 'All products' }, ...NOVA.categories].map(c => {
        const cnt = c.id === 'all' ? allProds.length : allProds.filter(p => p.cat === c.id).length;
        return `<div class="form-check"><input class="form-check-input" type="radio" name="cat" id="cat-${esc(c.id)}" value="${esc(c.id)}"${c.id === s.cat ? ' checked' : ''}><label class="form-check-label d-flex justify-content-between align-items-center" for="cat-${esc(c.id)}"><span>${esc(c.name)}</span><span class="badge rounded-pill text-bg-light border text-muted">${cnt}</span></label></div>`;
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

      /* "New Arrivals" is a view, not just an ordering: the nav links and the
         sort option both point at ?sort=new, so show only flagged new pieces. */
      if (s.sort === 'new') l = l.filter(p => p.isNew);

      if (s.sort === 'low') l.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
      else if (s.sort === 'high') l.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name));
      else if (s.sort === 'new') l.sort((a, b) => !!b.isNew - !!a.isNew || a.name.localeCompare(b.name));
      else if (s.sort === 'alpha') l.sort((a, b) => a.name.localeCompare(b.name));

      if (titleEl) {
        if (s.wish) titleEl.textContent = 'Saved Wishlist';
        else if (s.cat !== 'all') titleEl.textContent = NOVA.catName(s.cat);
        else if (s.q) titleEl.textContent = `Search: “${s.q}”`;
        else if (s.sort === 'new') titleEl.textContent = 'New Arrivals';
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
              ${chips.map(c => `<button class="filter-chip" type="button" data-remove-filter="${esc(c.key)}"><span>${esc(c.label)}</span><i class="bi bi-x" aria-hidden="true"></i><span class="visually-hidden">Remove filter ${esc(c.label)}</span></button>`).join('')}
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
  };
})();
