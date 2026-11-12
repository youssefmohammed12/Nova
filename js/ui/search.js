/* Shared header/shop search autocomplete controller. */
(function () {
  const NOVA = window.NOVA;
  const { fmt, catName } = NOVA;
  const esc = NOVA.escapeHTML;

  /* One delegated controller for header + shop inputs. Focus remains in the
     combobox; aria-activedescendant tracks the active listbox option. */
  const searchCtl = { input: null, panel: null, items: [], active: -1, shop: false };
  const optionNodes = () => searchCtl.panel
    ? [...searchCtl.panel.querySelectorAll('[role="option"]')]
    : [];

  function searchClose() {
    if (searchCtl.panel) searchCtl.panel.hidden = true;
    if (searchCtl.input) {
      searchCtl.input.setAttribute('aria-expanded', 'false');
      searchCtl.input.removeAttribute('aria-activedescendant');
    }
    searchCtl.input = null;
    searchCtl.panel = null;
    searchCtl.items = [];
    searchCtl.active = -1;
    searchCtl.shop = false;
  }

  function searchAllUrl(q) {
    const query = NOVA.search.norm(q);
    return query ? `${NOVA.BASE || ''}shop.html?q=${encodeURIComponent(query)}` : `${NOVA.BASE || ''}shop.html`;
  }

  function searchOpen(input, panel, isShop) {
    const q = NOVA.search.norm(input.value), B = NOVA.BASE || '';
    searchCtl.input = input;
    searchCtl.panel = panel;
    searchCtl.shop = !!isShop;
    searchCtl.items = [];
    searchCtl.active = -1;
    input.setAttribute('aria-expanded', 'true');
    input.removeAttribute('aria-activedescendant');

    if (!q) {
      panel.innerHTML = `
        <div class="search-panel__label" role="presentation">Popular searches</div>
        <div class="search-panel__chips">
          ${NOVA.search.popular.map((term, i) => `<button class="search-chip" type="button" role="option" aria-selected="false" tabindex="-1" id="schip-${i}" data-chip="${esc(term)}">${esc(term)}</button>`).join('')}
        </div>`;
      panel.hidden = false;
      return;
    }

    const list = NOVA.search.suggestions(q, 5);
    searchCtl.items = list;
    if (!list.length) {
      panel.innerHTML = `
        <div class="search-panel__empty" role="presentation">No products found for “${esc(q)}”.</div>
        <button class="search-opt__all" type="button" role="option" aria-selected="false" tabindex="-1" id="sopt-all" data-all="">
          <span>Browse all products</span><i class="bi bi-arrow-right" aria-hidden="true"></i>
        </button>`;
    } else {
      panel.innerHTML = list.map((p, i) => `
        <button class="search-opt" type="button" role="option" aria-selected="false" tabindex="-1" data-pid="${esc(p.id)}" id="sopt-${i}">
          <img src="${esc(NOVA.imgs(p.id)[0])}" width="44" height="44" loading="lazy" alt="">
          <span class="search-opt__text"><strong>${esc(p.name)}</strong><small>${esc(catName(p.cat))}</small></span>
          <span class="search-opt__price">${fmt(p.price)}</span>
        </button>`).join('')
        + `
        <button class="search-opt__all" type="button" role="option" aria-selected="false" tabindex="-1" id="sopt-all" data-all="${esc(q)}">
          <span>View all results</span><i class="bi bi-arrow-right" aria-hidden="true"></i>
        </button>`;
    }
    panel.hidden = false;
  }

  function searchPaintActive() {
    const options = optionNodes();
    options.forEach((el, index) => {
      const on = index === searchCtl.active;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-selected', String(on));
    });
    const active = options[searchCtl.active];
    if (searchCtl.input) {
      if (active && active.id) searchCtl.input.setAttribute('aria-activedescendant', active.id);
      else searchCtl.input.removeAttribute('aria-activedescendant');
    }
    if (active && typeof active.scrollIntoView === 'function') {
      active.scrollIntoView({ block: 'nearest' });
    }
  }

  function searchPickActive() {
    const { input, panel, shop, active } = searchCtl;
    if (!input || !panel || active < 0) return false;
    const option = optionNodes()[active];
    if (!option) return false;

    if (option.dataset.pid) {
      location.href = `${NOVA.BASE || ''}product.html?id=${encodeURIComponent(option.dataset.pid)}`;
      return true;
    }
    if (option.hasAttribute('data-chip')) {
      input.value = option.dataset.chip;
      searchOpen(input, panel, shop);
      return true;
    }
    if (option.hasAttribute('data-all')) {
      if (shop) {
        input.value = option.dataset.all || '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        searchClose();
      } else {
        location.href = option.dataset.all
          ? searchAllUrl(option.dataset.all)
          : `${NOVA.BASE || ''}shop.html`;
      }
      return true;
    }
    return false;
  }

  function searchBind() {
    const panelFor = input => input.id === 'f-search'
      ? document.getElementById('shopPanel')
      : document.getElementById('searchPanel');

    document.addEventListener('focusin', e => {
      const input = e.target.closest && e.target.closest('#searchInput, #f-search');
      if (!input) {
        if (searchCtl.panel && !(e.target.closest && e.target.closest('#searchPanel, #shopPanel'))) {
          searchClose();
        }
        return;
      }
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

        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          searchClose();
          return;
        }
        if (e.key === 'Enter') {
          if (searchCtl.active >= 0 && searchPickActive()) {
            e.preventDefault();
            return;
          }
          searchClose();
          return;
        }
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;

        const count = optionNodes().length;
        if (!count) return;
        e.preventDefault();
        searchCtl.active = e.key === 'ArrowDown'
          ? (searchCtl.active + 1) % count
          : (searchCtl.active - 1 + count) % count;
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
        if (pid) {
          location.href = `${NOVA.BASE || ''}product.html?id=${encodeURIComponent(pid.dataset.pid)}`;
          return;
        }
        const all = e.target.closest('[data-all]');
        if (all) {
          if (searchCtl.shop && searchCtl.input) {
            searchCtl.input.value = all.dataset.all || '';
            searchCtl.input.dispatchEvent(new Event('input', { bubbles: true }));
            searchClose();
            return;
          }
          location.href = all.dataset.all
            ? searchAllUrl(all.dataset.all)
            : `${NOVA.BASE || ''}shop.html`;
        }
        return;
      }
      if (searchCtl.panel) searchClose();
    });
  }

  NOVA.searchUI = Object.freeze({ bind: searchBind });
})();
