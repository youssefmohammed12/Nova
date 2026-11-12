/* Shared header/shop search autocomplete controller. */
(function () {
  const NOVA = window.NOVA;
  const { fmt, catName } = NOVA;
  const esc = NOVA.escapeHTML;

  /* Search autocomplete: one delegated controller for header + shop inputs. Max 5 rows. */
  const searchCtl = { input: null, panel: null, items: [], active: -1, shop: false };
  function searchClose() {
    if (searchCtl.panel) searchCtl.panel.hidden = true;
    if (searchCtl.input) searchCtl.input.setAttribute('aria-expanded', 'false');
    searchCtl.input = null; searchCtl.panel = null; searchCtl.items = []; searchCtl.active = -1; searchCtl.shop = false;
  }
  function searchAllUrl(q) { return `${NOVA.BASE || ''}shop.html?q=${encodeURIComponent(NOVA.search.norm(q))}`; }
  function searchOpen(input, panel, isShop) {
    const q = NOVA.search.norm(input.value), B = NOVA.BASE || '';
    searchCtl.input = input; searchCtl.panel = panel; searchCtl.shop = !!isShop;
    input.setAttribute('aria-expanded', 'true');
    if (!q) {
      searchCtl.items = []; searchCtl.active = -1;
      panel.innerHTML = `<p class="search-panel__label">Popular searches</p><div class="search-panel__chips">${NOVA.search.popular.map(t => `<button class="search-chip" type="button" data-chip="${t}">${t}</button>`).join('')}</div>`;
      panel.hidden = false;
      return;
    }
    const list = NOVA.search.suggestions(q, 5);
    searchCtl.items = list; searchCtl.active = -1;
    if (!list.length) {
      panel.innerHTML = `<p class="search-panel__empty">No products found for &ldquo;${esc(q)}&rdquo;. <a href="${B}shop.html">View all products</a></p>`;
    } else {
      panel.innerHTML = list.map((p, i) => `<button class="search-opt" type="button" role="option" aria-selected="false" data-pid="${esc(p.id)}" id="sopt-${i}"><img src="${esc(NOVA.imgs(p.id)[0])}" width="44" height="44" loading="lazy" alt=""><span class="search-opt__text"><strong>${esc(p.name)}</strong><small>${esc(catName(p.cat))}</small></span><span class="search-opt__price">${fmt(p.price)}</span></button>`).join('')
        + `<button class="search-opt__all" type="button" role="option" aria-selected="false" data-all="${esc(q)}"><span>View all results</span><i class="bi bi-arrow-right" aria-hidden="true"></i></button>`;
    }
    panel.hidden = false;
  }
  function searchPaintActive() {
    if (!searchCtl.panel) return;
    searchCtl.panel.querySelectorAll('.search-opt, .search-opt__all, .search-chip').forEach((el, i) => {
      const on = i === searchCtl.active;
      el.classList.toggle('is-active', on);
      if (el.classList.contains('search-opt') || el.classList.contains('search-opt__all')) el.setAttribute('aria-selected', String(on));
    });
  }

  function searchPickActive() {
    const { input, panel, items, active, shop } = searchCtl;
    if (!input) return false;
    if (active < 0) return false;
    if (items.length) {
      if (active < items.length) location.href = `${NOVA.BASE || ''}product.html?id=${items[active].id}`;
      else location.href = searchAllUrl(input.value);
      return true;
    }
    const chips = panel ? [...panel.querySelectorAll('.search-chip')] : [];
    if (chips[active]) {
      input.value = chips[active].dataset.chip;
      searchOpen(input, panel, shop);
      return true;
    }
    return false;
  }
  function searchBind() {
    const panelFor = input => input.id === 'f-search' ? document.getElementById('shopPanel') : document.getElementById('searchPanel');
    document.addEventListener('focusin', e => {
      const input = e.target.closest && e.target.closest('#searchInput, #f-search');
      if (!input) { if (searchCtl.panel && !(e.target.closest && e.target.closest('#searchPanel, #shopPanel'))) searchClose(); return; }
      if (searchCtl.input === input && searchCtl.panel && !searchCtl.panel.hidden) return;
      const panel = panelFor(input);
      if (panel) searchOpen(input, panel, input.id === 'f-search');
    });
    document.addEventListener('input', e => {
      const input = e.target.closest && e.target.closest('#searchInput, #f-search');
      if (!input) return;
      const panel = panelFor(input);
      if (panel) searchOpen(input, panel, input.id === 'f-search');
    });
    document.addEventListener('keydown', e => {
      const input = e.target.closest && e.target.closest('#searchInput, #f-search');
      if (input) {
        const panel = panelFor(input);
        if (!panel || panel.hidden) return;
        if (e.key === 'Escape') { e.stopPropagation(); searchClose(); return; }
        if (e.key === 'Enter') {
          if (searchCtl.shop) { searchClose(); return; }
          if (searchPickActive()) e.preventDefault();
          return;
        }
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        const chipCount = searchCtl.items.length ? 0 : searchCtl.panel.querySelectorAll('.search-chip').length;
        const count = searchCtl.items.length + (searchCtl.items.length ? 1 : 0) || chipCount;
        if (!count) return;
        e.preventDefault();
        searchCtl.active = e.key === 'ArrowDown' ? (searchCtl.active + 1) % count : (searchCtl.active - 1 + count) % count;
        searchPaintActive();
        return;
      }
      if (e.key === 'Escape' && searchCtl.panel) searchClose();
    });
    document.addEventListener('click', e => {
      const inside = e.target.closest && e.target.closest('#searchPanel, #shopPanel, #searchInput, #f-search');
      if (inside) {
        const chip = e.target.closest('[data-chip]');
        if (chip && searchCtl.input) {
          searchCtl.input.value = chip.dataset.chip;
          searchCtl.input.focus();
          searchOpen(searchCtl.input, searchCtl.panel, searchCtl.shop);
          return;
        }
        const pid = e.target.closest('[data-pid]');
        if (pid) { location.href = `${NOVA.BASE || ''}product.html?id=${pid.dataset.pid}`; return; }
        const all = e.target.closest('[data-all]');
        if (all) {
          if (searchCtl.shop && searchCtl.input) {
            searchCtl.input.value = all.dataset.all;
            searchCtl.input.dispatchEvent(new Event('input', { bubbles: true }));
            searchClose();
            return;
          }
          location.href = searchAllUrl(all.dataset.all);
        }
        return;
      }
      if (searchCtl.panel) searchClose();
    });
  }

  NOVA.searchUI = Object.freeze({ bind: searchBind });
})();
