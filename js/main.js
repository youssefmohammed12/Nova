/* Page-specific behaviour, chosen by <body data-page="..."> */
(function () {
  const { fmt, ui } = NOVA;
  const esc = NOVA.escapeHTML;
  const products = () => NOVA.products || [];
  const $ = (s, root) => (root || document).querySelector(s), params = new URLSearchParams(location.search);
  const grid = (list, wishSet) => list.map(p => `<div class="col-6 col-lg-3">${ui.card(p, wishSet)}</div>`).join('');
  NOVA.renderRecentlyViewed = () => {
    const section = $('#recent-section'), recentGrid = $('#recent-grid');
    if (!section || !recentGrid) return;

    let ids = [];
    try { ids = NOVA.recent.items(); } catch { ids = []; }
    const recentlyViewed = ids.map(id => NOVA.find(id)).filter(Boolean).slice(0, 6);

    if (!recentlyViewed.length) {
      section.hidden = true;
      recentGrid.innerHTML = '';
      return;
    }

    section.hidden = false;
    recentGrid.innerHTML = grid(recentlyViewed, new Set(NOVA.wish.ids()));
  };
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const line = (p, qty) => `<div class="summary-line"><img src="${esc(NOVA.imgs(p.id)[0])}" width="52" height="52" alt=""><span>${esc(p.name)} x ${Number(qty) || 0}</span><span>${fmt(p.price * qty)}</span></div>`;


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

  // Stable helpers shared by the extracted page controllers.
  NOVA.pageHelpers = Object.freeze({ fmt, ui, products, $, params, grid, debounce, line, customerAuthed, CO_LOGIN });

  document.addEventListener('DOMContentLoaded', () => {
    ui.mount();
    const pageKey = document.body.dataset.page;
    const run = () => {
      const handler = NOVA.pageControllers && NOVA.pageControllers[pageKey];
      if (typeof handler === 'function') handler();
    };
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
      const renderCats = () => { if (catSel && catSel.options.length <= 1) NOVA.categories.forEach(c => { const o = document.createElement('option'); o.value = c.id; o.textContent = c.name; catSel.appendChild(o); }); };
      const render = () => {
        const term = (q ? q.value : '').toLowerCase(), cat = catSel ? catSel.value : 'all';
        rows.innerHTML = products()
          .filter(p => (cat === 'all' || p.cat === cat) && p.name.toLowerCase().includes(term))
          .map(p => `<tr><td><span class="d-flex align-items-center gap-2"><img class="thumb-sm" src="${esc(NOVA.imgs(p.id)[0])}" width="44" height="44" alt="" loading="lazy"><span><strong>${esc(p.name)}</strong><br><span class="text-muted-nova small">${esc(p.id)}</span></span></span></td><td>${esc(NOVA.catName(p.cat))}</td><td>${fmt(p.price)}</td><td><span class="text-muted-nova">Not tracked</span></td><td><span class="status status--active">Active</span></td><td><a class="btn btn-ghost btn-sm" href="product-form.html?id=${encodeURIComponent(p.id)}">Edit</a></td></tr>`).join('')
          || '<tr><td colspan="6" class="text-muted-nova">No products match.</td></tr>';
      };
      renderCats(); render();
      if (q) q.addEventListener('input', render);
      if (catSel) catSel.addEventListener('change', render);
    }
    const catRows = $('#ac-rows');
    if (catRows) {
      catRows.innerHTML = NOVA.categories.map(c => { const n = products().filter(p => p.cat === c.id).length; return `<tr><td><strong>${esc(c.name)}</strong><br><span class="text-muted-nova small">${esc(c.id)}</span></td><td>${n}</td><td><span class="status status--active">Active</span></td><td><span class="d-flex gap-2"><button class="btn btn-ghost btn-sm" type="button" data-demo>Edit</button><button class="btn btn-ghost btn-sm" type="button" data-demo>Hide</button></span></td></tr>`; }).join('');
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

  /* Account preview: wait for the catalogue before deciding that a saved list is empty. */
  function accountPreview() {
    const wishCount = document.querySelector('[data-demo-wish-count]');
    const grid = $('#account-wish-grid');
    const renderWishlist = () => {
      if (!NOVA.catalog || !NOVA.catalog.ready) {
        if (wishCount) wishCount.textContent = '—';
        if (grid) {
          grid.innerHTML = NOVA.catalog && NOVA.catalog.error
            ? '<div class="col-12"><div class="empty-state" role="status"><i class="bi bi-wifi-off" aria-hidden="true"></i><h2 class="h4">Saved pieces are unavailable</h2><p>We could not load the product catalogue. Please refresh and try again.</p><a class="btn btn-ghost" href="../shop.html">Browse the shop</a></div></div>'
            : '<div class="col-12"><p class="text-muted-nova py-3" role="status">Loading your saved pieces…</p></div>';
        }
        return;
      }

      const ids = NOVA.wish.ids();
      if (wishCount) wishCount.textContent = ids.length;
      if (!grid) return;
      const list = ids.map(id => NOVA.find(id)).filter(Boolean);
      grid.innerHTML = list.length
        ? list.map(p => '<div class="col-6 col-lg-4">' + ui.card(p, new Set(ids)) + '</div>').join('')
        : '<div class="col-12"><div class="empty-state"><i class="bi bi-heart" aria-hidden="true"></i><h2 class="h4">Your wishlist is empty</h2><p>Tap the heart on any product to keep it here.</p><a class="btn btn-nova" href="../shop.html">Continue shopping</a></div></div>';
      const shopViewLink = document.getElementById('wish-open-shop-view');
      if (shopViewLink) shopViewLink.hidden = list.length === 0;
    };

    if ((wishCount || grid) && document.body.dataset.wishlistPreviewBound !== 'true') {
      document.body.dataset.wishlistPreviewBound = 'true';
      document.addEventListener('wishlist:change', renderWishlist);
      document.addEventListener('catalog:ready', renderWishlist);
      document.addEventListener('catalog:error', renderWishlist);
    }
    renderWishlist();
  }
})();
