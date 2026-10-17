/* Shared UI: header, footer, product card, toast, reveal. Header/footer are injected so every page stays in sync;
   in PHP these become include files. */
(function () {
  const { fmt, catName } = NOVA;
  const page = document.body.dataset.page;
  const cur = p => (page === p ? ' aria-current="page"' : '');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

  /* Customer authentication state */
  NOVA.auth = NOVA.auth || { authenticated: false, customer: null, loaded: false };
  NOVA.csrfToken = NOVA.csrfToken || '';

  /* Single wording source for the announcement (threshold comes from the
     synchronized runtime constant — see js/settings.js Phase 8). */
  const announcementText = () => `Free delivery over ${fmt(NOVA.FREE_DELIVERY_OVER)} across Cairo and Giza. Cash on delivery available.`;

  function updateCategoryNav() {
    if (!NOVA.categories || !NOVA.categories.length) return;
    const B = NOVA.BASE || '';
    const dd = document.querySelector('.site-header .dropdown-menu');
    if (dd) {
      dd.innerHTML = NOVA.categories.map(c => `<li><a class="dropdown-item" href="${B}shop.html?cat=${c.id}">${c.name}</a></li>`).join('');
    }
    const drawer = document.querySelector('.drawer-nav');
    if (drawer) {
      const isAuthed = Boolean(NOVA.auth && NOVA.auth.authenticated && NOVA.auth.customer);
      const myAccountLink = isAuthed ? `<li><a href="${B}account/index.php">My account</a></li>` : '';
      drawer.innerHTML = `
        <li><a href="${B}index.html">Home</a></li><li><a href="${B}shop.html">Shop</a></li>
        ${NOVA.categories.map(c => `<li><a href="${B}shop.html?cat=${c.id}">${c.name}</a></li>`).join('')}
        <li><a href="${B}shop.html?sort=new">New Arrivals</a></li><li><a href="${B}index.html#why-nova">About</a></li>${myAccountLink}<li><a href="#contact">Contact</a></li>
      `;
    }
    const fShop = document.querySelector('[data-footer-shop]');
    if (fShop) {
      fShop.innerHTML = `${NOVA.categories.map(c => `<li><a href="${B}shop.html?cat=${c.id}">${c.name}</a></li>`).join('')}<li><a href="${B}shop.html?sort=new">New Arrivals</a></li>`;
    }
  }

  function renderAuthUI() {
    const B = NOVA.BASE || '';
    const isAuthed = Boolean(NOVA.auth && NOVA.auth.authenticated && NOVA.auth.customer);
    const cust = isAuthed ? NOVA.auth.customer : null;
    const slot = document.getElementById('navAuthSlot');
    if (slot) {
      if (isAuthed && cust) {
        const fullName = cust.name || 'Account';
        const firstName = fullName.split(' ')[0] || fullName;
        slot.innerHTML = `
          <div class="dropdown d-none d-lg-inline-block">
            <button class="nav-account-btn dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Account menu">
              <i class="bi bi-person me-1" aria-hidden="true"></i>
              <span class="nav-account-name">${esc(firstName)}</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end nav-account-menu">
              <li class="dropdown-header">Signed in as <strong>${esc(fullName)}</strong></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item" href="${B}account/index.php"><i class="bi bi-grid me-2" aria-hidden="true"></i>Dashboard</a></li>
              <li><a class="dropdown-item" href="${B}account/orders.php"><i class="bi bi-bag me-2" aria-hidden="true"></i>Orders</a></li>
              <li><a class="dropdown-item" href="${B}account/wishlist.html"><i class="bi bi-heart me-2" aria-hidden="true"></i>Wishlist</a></li>
              <li><a class="dropdown-item" href="${B}account/addresses.php"><i class="bi bi-geo-alt me-2" aria-hidden="true"></i>Addresses</a></li>
              <li><a class="dropdown-item" href="${B}account/profile.php"><i class="bi bi-person me-2" aria-hidden="true"></i>Profile</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><button class="dropdown-item text-danger cust-logout-btn" type="button"><i class="bi bi-box-arrow-right me-2" aria-hidden="true"></i>Sign out</button></li>
            </ul>
          </div>
        `;
      } else {
        slot.innerHTML = `
          <div class="nav-guest-actions d-none d-lg-inline-flex align-items-center gap-1">
            <a class="nav-auth-link" href="${B}account/login.php">Sign in</a>
            <a class="btn btn-sm btn-ghost nav-register-btn" href="${B}account/register.php">Register</a>
          </div>
        `;
      }
    }

    const drawerFoot = document.querySelector('#navDrawer .drawer-footer');
    if (drawerFoot) {
      if (isAuthed && cust) {
        const fullName = cust.name || 'Account';
        drawerFoot.innerHTML = `
          <div class="drawer-user-info mb-3">
            <small class="text-muted-nova d-block">Signed in as</small>
            <strong class="text-ink">${esc(fullName)}</strong>
          </div>
          <div class="d-flex flex-column gap-2 mb-3">
            <a href="${B}account/index.php" class="btn btn-ghost btn-sm justify-content-start"><i class="bi bi-grid me-2" aria-hidden="true"></i>Account Dashboard</a>
            <a href="${B}account/orders.php" class="btn btn-ghost btn-sm justify-content-start"><i class="bi bi-bag me-2" aria-hidden="true"></i>My Orders</a>
            <a href="${B}account/wishlist.html" class="btn btn-ghost btn-sm justify-content-start"><i class="bi bi-heart me-2" aria-hidden="true"></i>Saved Wishlist</a>
            <button class="btn btn-ghost btn-sm justify-content-start text-danger cust-logout-btn" type="button"><i class="bi bi-box-arrow-right me-2" aria-hidden="true"></i>Sign out</button>
          </div>
          <p class="small text-muted-nova mb-0" data-delivery-note>Free delivery on orders over ${fmt(NOVA.FREE_DELIVERY_OVER)}.</p>
        `;
      } else {
        drawerFoot.innerHTML = `
          <div class="d-flex flex-column gap-2 mb-3">
            <a href="${B}account/login.php" class="btn btn-nova btn-sm justify-content-center"><i class="bi bi-box-arrow-in-right me-2" aria-hidden="true"></i>Sign in</a>
            <a href="${B}account/register.php" class="btn btn-ghost btn-sm justify-content-center"><i class="bi bi-person-plus me-2" aria-hidden="true"></i>Create account</a>
            <a href="${B}account/wishlist.html" class="btn btn-ghost btn-sm justify-content-start"><i class="bi bi-heart me-2" aria-hidden="true"></i>Saved Wishlist</a>
          </div>
          <p class="small text-muted-nova mb-0" data-delivery-note>Free delivery on orders over ${fmt(NOVA.FREE_DELIVERY_OVER)}.</p>
        `;
      }
    }
    updateCategoryNav();
  }

  async function checkAuth() {
    const B = NOVA.BASE || '';
    if (window.NOVA_CUSTOMER && typeof window.NOVA_CUSTOMER === 'object') {
      NOVA.auth.authenticated = Boolean(window.NOVA_CUSTOMER.authenticated);
      NOVA.auth.customer = window.NOVA_CUSTOMER.customer || null;
      NOVA.csrfToken = window.NOVA_CUSTOMER.csrf_token || '';
      NOVA.auth.loaded = true;
      renderAuthUI();
      return;
    }
    try {
      const res = await fetch(B + 'api/customer-auth.php', { cache: 'no-store' });
      if (!res.ok) throw new Error('auth check failed');
      const json = await res.json();
      if (json && json.success && json.data) {
        NOVA.auth.authenticated = Boolean(json.data.authenticated);
        NOVA.auth.customer = json.data.customer || null;
        NOVA.csrfToken = json.data.csrf_token || '';
      }
    } catch {
      NOVA.auth.authenticated = false;
      NOVA.auth.customer = null;
    } finally {
      NOVA.auth.loaded = true;
      renderAuthUI();
    }
  }

  async function performLogout() {
    const B = NOVA.BASE || '';
    const csrf = NOVA.csrfToken || '';
    try {
      await fetch(B + 'api/customer-logout.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ csrf_token: csrf })
      });
    } catch {}
    window.location.href = B + 'index.html';
  }

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.cust-logout-btn');
    if (btn) {
      e.preventDefault();
      performLogout();
    }
  });

  function header() {
    const B = NOVA.BASE || '';
    const cats = (NOVA.categories || []).map(c => `<li><a class="dropdown-item" href="${B}shop.html?cat=${c.id}">${c.name}</a></li>`).join('');
    return `
    <div class="announcement" data-delivery-announcement>${announcementText()}</div>
    <header class="site-header" id="siteHeader"><div class="container site-header__inner">
      <button class="icon-btn site-header__menu" type="button" data-bs-toggle="offcanvas" data-bs-target="#navDrawer" aria-controls="navDrawer" aria-label="Open menu"><i class="bi bi-list" aria-hidden="true"></i></button>
      <a class="brand" href="${B}index.html" aria-label="NOVA Home, homepage">NOVA <span>Home</span></a>
      <nav aria-label="Main"><ul class="main-nav">
        <li><a href="${B}index.html"${cur('home')}>Home</a></li>
        <li><a href="${B}shop.html"${cur('shop')}>Shop</a></li>
        <li class="dropdown"><button class="dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">Categories</button><ul class="dropdown-menu">${cats}</ul></li>
        <li><a href="${B}shop.html?sort=new">New Arrivals</a></li>
        <li><a href="${B}index.html#why-nova">About</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul></nav>
      <div class="header-actions">
        <button class="icon-btn" type="button" data-bs-toggle="modal" data-bs-target="#searchModal" aria-label="Search products"><i class="bi bi-search" aria-hidden="true"></i></button>
        <a class="icon-btn d-none d-lg-inline-flex" href="${B}shop.html?wish=1" aria-label="Wishlist"><i class="bi bi-heart" aria-hidden="true"></i></a>
        <div class="nav-auth-slot" id="navAuthSlot">
          <div class="nav-guest-actions d-none d-lg-inline-flex align-items-center gap-1">
            <a class="nav-auth-link" href="${B}account/login.php">Sign in</a>
            <a class="btn btn-sm btn-ghost nav-register-btn" href="${B}account/register.php">Register</a>
          </div>
        </div>
        <a class="icon-btn" href="${B}cart.html" aria-label="Cart"><i class="bi bi-bag" aria-hidden="true"></i><span class="cart-badge" data-cart-count data-count="0" aria-live="polite"></span></a>
      </div>
    </div></header>
    <div class="offcanvas offcanvas-start" tabindex="-1" id="navDrawer" aria-labelledby="navDrawerLabel">
      <div class="offcanvas-header"><span class="brand" id="navDrawerLabel">NOVA <span>Home</span></span><button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close menu"></button></div>
      <div class="offcanvas-body">
        <ul class="drawer-nav">
          <li><a href="${B}index.html">Home</a></li><li><a href="${B}shop.html">Shop</a></li>
          ${(NOVA.categories || []).map(c => `<li><a href="${B}shop.html?cat=${c.id}">${c.name}</a></li>`).join('')}
          <li><a href="${B}shop.html?sort=new">New Arrivals</a></li><li><a href="${B}index.html#why-nova">About</a></li><li><a href="#contact">Contact</a></li>
        </ul>
        <div class="drawer-footer">
          <div class="d-flex flex-column gap-2 mb-3">
            <a href="${B}account/login.php" class="btn btn-nova btn-sm justify-content-center"><i class="bi bi-box-arrow-in-right me-2" aria-hidden="true"></i>Sign in</a>
            <a href="${B}account/register.php" class="btn btn-ghost btn-sm justify-content-center"><i class="bi bi-person-plus me-2" aria-hidden="true"></i>Create account</a>
            <a href="${B}account/wishlist.html" class="btn btn-ghost btn-sm justify-content-start"><i class="bi bi-heart me-2" aria-hidden="true"></i>Saved Wishlist</a>
          </div>
          <p class="small text-muted-nova mb-0" data-delivery-note>Free delivery on orders over EGP 1,500.</p>
        </div>
      </div>
    </div>
    <div class="modal fade" id="searchModal" tabindex="-1" aria-labelledby="searchTitle" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content p-3">
      <form action="${B}shop.html" method="get" role="search"><label class="form-label fw-semibold" id="searchTitle" for="searchInput">Search products</label>
      <div class="search-wrap"><input class="form-control" id="searchInput" name="q" type="search" placeholder="Lamps, vases, baskets" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="searchPanel" aria-autocomplete="list"><button class="btn btn-nova" type="submit">Search</button><div class="search-panel" id="searchPanel" role="listbox" aria-label="Search suggestions" hidden></div></div></form>
    </div></div></div>`;
  }

  function footer() {
    const B = NOVA.BASE || '';
    const cat = (NOVA.categories || []).map(c => `<li><a href="${B}shop.html?cat=${c.id}">${c.name}</a></li>`).join('');
    return `<footer class="site-footer" id="contact"><div class="container"><div class="row g-4 g-lg-5">
      <div class="col-lg-4"><a class="brand" href="${B}index.html" aria-label="NOVA Home, homepage">NOVA <span>Home</span></a><p class="mt-3 pe-lg-4" style="line-height: 1.6;">Modern home and lifestyle pieces, chosen for quality and made to be lived with. Based in Cairo, delivering across Egypt.</p>
        <div class="footer-social" aria-label="Social media (coming soon)"><span class="footer-social__soon" title="Instagram (coming soon)"><i class="bi bi-instagram" aria-hidden="true"></i></span><span class="footer-social__soon" title="Facebook (coming soon)"><i class="bi bi-facebook" aria-hidden="true"></i></span><span class="footer-social__soon" title="TikTok (coming soon)"><i class="bi bi-tiktok" aria-hidden="true"></i></span><span class="footer-social__soon" title="WhatsApp (coming soon)"><i class="bi bi-whatsapp" aria-hidden="true"></i></span></div><p class="footer-note">Social profiles coming soon.</p></div>
      <div class="col-6 col-md-3 col-lg-2"><h2>Shop</h2><ul data-footer-shop>${cat}<li><a href="${B}shop.html?sort=new">New Arrivals</a></li></ul></div>
      <div class="col-6 col-md-3 col-lg-2"><h2>Customer care</h2><ul><li><a href="${B}shop.html">Shop all products</a></li><li><a href="${B}cart.html">View your cart</a></li><li><a href="${B}checkout.html">Checkout</a></li><li><a href="${B}index.html#why-nova">Why NOVA</a></li><li><a href="${B}account/index.php">My account</a></li></ul></div>
      <div class="col-12 col-md-6 col-lg-4"><h2>Contact</h2><ul class="footer-contact-list"><li class="footer-contact-item"><span class="footer-contact-icon"><i class="bi bi-telephone" aria-hidden="true"></i></span><span class="footer-contact-text"><a href="tel:+201001234567" data-nova-tel>+20 100 123 4567</a></span></li><li class="footer-contact-item"><span class="footer-contact-icon"><i class="bi bi-envelope" aria-hidden="true"></i></span><span class="footer-contact-text"><a href="mailto:hello@novahome.eg" data-nova-email>hello@novahome.eg</a></span></li><li class="footer-contact-item"><span class="footer-contact-icon"><i class="bi bi-geo-alt" aria-hidden="true"></i></span><span class="footer-contact-text" data-nova-address>Cairo, Egypt</span></li><li class="footer-contact-item"><span class="footer-contact-icon"><i class="bi bi-clock" aria-hidden="true"></i></span><span class="footer-contact-text">Daily, 10 AM to 9 PM</span></li></ul></div>
    </div><div class="footer-bottom"><div class="footer-bottom__inner"><div>&copy; ${new Date().getFullYear()} <span data-nova-business>NOVA Home</span>. All rights reserved.</div><div class="footer-badges"><span class="footer-badge"><i class="bi bi-shield-check" aria-hidden="true"></i> Cash on Delivery</span><span class="footer-badge"><i class="bi bi-truck" aria-hidden="true"></i> Cairo & Giza Express</span></div></div></div></div></footer>
    <div class="modal fade" id="quickModal" tabindex="-1" aria-labelledby="qv-title" aria-hidden="true"><div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg"><div class="modal-content qv">
      <div class="modal-header"><h2 class="h5 m-0" id="qv-title"></h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close quick view"></button></div>
      <div class="modal-body"><div class="qv__grid">
        <div class="qv__media"><img id="qv-img" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'/%3E" width="600" height="600" alt=""></div>
        <div class="qv__info">
          <p class="text-muted-nova mb-1 small" id="qv-cat"></p>
          <p class="small my-1" id="qv-rating"></p>
          <p class="qv__price my-2" id="qv-price"></p>
          <p class="stock small"><i class="bi bi-check-circle me-1" aria-hidden="true"></i><span id="qv-stock">In stock, ships within 2 working days</span></p>
          <p class="qv__desc" id="qv-desc"></p>
          <div class="d-flex flex-wrap align-items-center gap-2 my-3">
            <div class="qty" role="group" aria-label="Quantity"><button id="qv-minus" type="button" aria-label="Decrease quantity">&minus;</button><output id="qv-qty" aria-live="polite">1</output><button id="qv-plus" type="button" aria-label="Increase quantity">+</button></div>
            <button class="btn btn-nova flex-grow-1" id="qv-add" type="button" data-add="" data-qty="1">Add to cart</button></div>
          <div class="d-flex flex-wrap gap-2">
            <button class="btn btn-ghost btn-sm" id="qv-wish" type="button" aria-pressed="false" data-wish=""><i class="bi bi-heart me-1" aria-hidden="true"></i><span>Wishlist</span></button>
            <a class="btn btn-ghost btn-sm" id="qv-link" href="#">View Full Details</a></div>
        </div>
      </div></div>
    </div></div>
    <div class="toast-container position-fixed bottom-0 end-0 p-3"><div id="toast" class="toast nova-toast" role="status" aria-live="polite" aria-atomic="true"><div class="d-flex"><div class="toast-body" id="toastBody"></div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div></div></div>`;
  }

  function card(p, wishSet) {
    const B = NOVA.BASE || '';
    const imgs = NOVA.imgs(p.id);
    const a = imgs[0];
    const b = imgs.length > 1 && imgs[1] !== imgs[0] ? imgs[1] : null;
    const off = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
    const badge = off ? `<span class="badge-nova">-${off}%</span>` : p.isNew ? '<span class="badge-nova badge-nova--dark">New</span>' : '';
    const on = wishSet ? wishSet.has(p.id) : NOVA.wish.has(p.id);
    const wishLabel = (on ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`).replace(/"/g, '&quot;');
    const altImgHtml = b ? `<img class="product-card__img product-card__img--alt" src="${b}" width="600" height="600" loading="lazy" alt="" aria-hidden="true">` : '';
    const matTag = p.material ? `<span class="product-card__mat"> · ${p.material}</span>` : '';
    return `<article class="product-card">
      <div class="product-card__media">
        <a href="${B}product.html?id=${p.id}" aria-label="View ${p.name}"><img class="product-card__img" src="${a}" width="600" height="600" loading="lazy" alt="${p.name}">${altImgHtml}</a>
        ${badge}<button class="wish-btn" type="button" data-wish="${p.id}" aria-pressed="${on}" aria-label="${wishLabel}"><i class="bi ${on ? 'bi-heart-fill' : 'bi-heart'}" aria-hidden="true"></i></button>
        <button class="quick-btn" type="button" data-quick="${p.id}" aria-label="Quick view ${p.name.replace(/"/g, '&quot;')}"><i class="bi bi-eye" aria-hidden="true"></i><span>Quick View</span></button>
      </div>
      <div class="product-card__body"><span class="product-card__cat">${catName(p.cat)}${matTag}</span>
        <h3 class="product-card__name"><a href="${B}product.html?id=${p.id}">${p.name}</a></h3>
        <div class="price-row"><span class="price">${fmt(p.price)}</span>${p.old ? `<span class="price--old"><span class="visually-hidden">Was </span>${fmt(p.old)}</span>` : ''}</div>
        <button class="btn btn-ghost btn-sm product-card__add" type="button" data-add="${p.id}">Add to cart</button></div></article>`;
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
    if (trigger) qvTrigger = trigger;
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
    set('qv-stock', 'In stock, ships within 2 working days');
    const rating = qvGet('qv-rating');
    if (rating) rating.innerHTML = `<span class="stars" aria-hidden="true">${'★'.repeat(Math.round(p.rating))}${'☆'.repeat(5 - Math.round(p.rating))}</span> <span class="visually-hidden">Rated ${p.rating} out of 5,</span> ${p.rating} (${p.reviews} reviews)`;
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
      if (modal) modal.addEventListener('hidden.bs.modal', () => {
        qvId = null; qvQty = 1;
        if (qvTrigger && document.contains(qvTrigger)) {
          try {
            qvTrigger.focus({ preventScroll: true });
            if (!qvTrigger.matches(':focus-visible')) {
              qvTrigger.blur();
            }
          } catch {
            try { qvTrigger.blur(); } catch (_) {}
          }
        }
        qvTrigger = null;
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('padding-right');
        document.body.style.removeProperty('overflow');
        document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
      });
    }
    const modalEl = qvGet('quickModal');
    if (!modalEl) return;
    if (window.bootstrap && window.bootstrap.Modal) window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
    else { modalEl.classList.add('show'); modalEl.style.display = 'block'; }
  }

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
      panel.innerHTML = `<p class="search-panel__empty">No products found for &ldquo;${q.replace(/</g, '&lt;')}&rdquo;. <a href="${B}shop.html">View all products</a></p>`;
    } else {
      panel.innerHTML = list.map((p, i) => `<button class="search-opt" type="button" role="option" aria-selected="false" data-pid="${p.id}" id="sopt-${i}"><img src="${NOVA.imgs(p.id)[0]}" width="44" height="44" loading="lazy" alt=""><span class="search-opt__text"><strong>${p.name}</strong><small>${catName(p.cat)}</small></span><span class="search-opt__price">${fmt(p.price)}</span></button>`).join('')
        + `<button class="search-opt__all" type="button" role="option" aria-selected="false" data-all="${q.replace(/"/g, '&quot;')}"><span>View all results</span><i class="bi bi-arrow-right" aria-hidden="true"></i></button>`;
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
      <article class="look-card" data-look="${p.id}">
        <div class="look-card__media">
          <img src="${NOVA.imgs(p.id)[0]}" width="200" height="200" loading="lazy" alt="${p.name}">
          <button class="look-card__quick" type="button" data-quick="${p.id}" aria-label="Quick view ${p.name.replace(/"/g, '&quot;')}">
            <i class="bi bi-eye" aria-hidden="true"></i>
          </button>
        </div>
        <div class="look-card__body">
          <span class="look-card__cat">${catName(p.cat)}</span>
          <h4 class="look-card__name"><a href="${NOVA.BASE || ''}product.html?id=${p.id}">${p.name}</a></h4>
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
    document.querySelectorAll('[data-delivery-announcement]').forEach(el => { el.textContent = announcementText(); });
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

  function mount() {
    renderDeliveryProgress();
    document.addEventListener('cart:change', renderDeliveryProgress);
    searchBind();
    const headerSlot = document.getElementById('site-header'), footerSlot = document.getElementById('site-footer');
    if (headerSlot) headerSlot.innerHTML = header();
    if (footerSlot) footerSlot.innerHTML = footer();
    checkAuth();
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

    /* Category nav sync: ensure dropdown, drawer, and footer have categories */
    if (NOVA.catalog && NOVA.catalog.ready) {
      updateCategoryNav();
    } else {
      document.addEventListener('catalog:ready', updateCategoryNav);
    }

    const badge = () => { const n = NOVA.cart.count(); document.querySelectorAll('[data-cart-count]').forEach(el => { const changed = el.textContent !== '' && el.dataset.count !== undefined && String(n) !== String(el.dataset.count); el.textContent = n; el.dataset.count = n; if (changed && n > 0) { el.classList.remove('is-pop'); void el.offsetWidth; el.classList.add('is-pop'); } }); };
    badge(); document.addEventListener('cart:change', badge);

    document.addEventListener('click', e => {
      const look = e.target.closest('[data-look]');
      if (look) { openQuick(look.dataset.look, look); return; }
      const quick = e.target.closest('[data-quick]');
      if (quick) { openQuick(quick.dataset.quick, quick); return; }
      const add = e.target.closest('[data-add]'), wish = e.target.closest('[data-wish]');
      if (add) { const prod = NOVA.find(add.dataset.add); if (!prod) { toast('Sorry, that product is no longer available.'); return; } const ok = NOVA.cart.add(prod.id, Number(add.dataset.qty) || 1); toast(ok ? prod.name + ' added to your cart' : 'Sorry, that product is no longer available.'); }
      if (wish) {
        const on = NOVA.wish.toggle(wish.dataset.wish);
        const prod = NOVA.find(wish.dataset.wish);
        document.querySelectorAll(`[data-wish="${wish.dataset.wish}"]`).forEach(b => { b.setAttribute('aria-pressed', String(on)); if (prod) b.setAttribute('aria-label', (on ? `Remove ${prod.name} from wishlist` : `Add ${prod.name} to wishlist`)); const i = b.querySelector('i'); if (i && !b.classList.contains('btn')) i.className = 'bi ' + (on ? 'bi-heart-fill' : 'bi-heart'); b.classList.remove('is-beat'); void b.offsetWidth; b.classList.add('is-beat'); });
        toast(on ? 'Saved to your wishlist' : 'Removed from your wishlist');
      }
    });

    const nl = document.getElementById('nl-email');
    if (nl && nl.form) nl.form.addEventListener('submit', e => { e.preventDefault(); const v = nl.value.trim(); if (!nl.checkValidity() || !v) { nl.reportValidity(); return; } toast('Thanks! The newsletter is not connected yet in this demo, so nothing was saved.'); nl.value = ''; });

    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } }), { threshold: .15 }) : null;
    document.querySelectorAll('[data-reveal]').forEach(el => io ? io.observe(el) : el.classList.add('is-visible'));
    requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('is-ready')));
  }
  NOVA.ui = { card, toast, mount, deliveryProgress, renderDeliveryProgress, openQuick, shopLook };
})();
