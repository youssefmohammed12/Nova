/* Shared storefront shell, customer auth presentation, and header/footer templates. */
(function () {
  const NOVA = window.NOVA;
  const { fmt, catName } = NOVA;

  const page = document.body.dataset.page;
  const cur = p => (page === p ? ' aria-current="page"' : '');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

  /* Customer authentication state */
  NOVA.auth = NOVA.auth || { authenticated: false, customer: null, loaded: false };
  NOVA.csrfToken = NOVA.csrfToken || '';

  /* Single wording source for the announcement (threshold comes from the
     synchronized runtime constant — see js/settings.js Phase 8). */
  const announcementText = () => `Free delivery over ${fmt(NOVA.FREE_DELIVERY_OVER)} on eligible orders. Cash on delivery available.`;

  function updateCategoryNav() {
    if (!NOVA.categories || !NOVA.categories.length) return;
    const B = NOVA.BASE || '';
    const dd = document.querySelector('.site-header .dropdown-menu');
    if (dd) {
      dd.innerHTML = NOVA.categories.map(c => `<li><a class="dropdown-item" href="${B}shop.html?cat=${encodeURIComponent(c.id)}">${esc(c.name)}</a></li>`).join('');
    }
    const drawer = document.querySelector('.drawer-nav');
    if (drawer) {
      const isAuthed = Boolean(NOVA.auth && NOVA.auth.authenticated && NOVA.auth.customer);
      const myAccountLink = isAuthed ? `<li><a href="${B}account/index.php">My account</a></li>` : '';
      drawer.innerHTML = `
        <li><a href="${B}index.html">Home</a></li><li><a href="${B}shop.html">Shop</a></li>
        ${NOVA.categories.map(c => `<li><a href="${B}shop.html?cat=${encodeURIComponent(c.id)}">${esc(c.name)}</a></li>`).join('')}
        <li><a href="${B}shop.html?sort=new">New Arrivals</a></li><li><a href="${B}index.html#why-nova">About</a></li>${myAccountLink}<li><a href="#contact">Contact</a></li>
      `;
    }
    const fShop = document.querySelector('[data-footer-shop]');
    if (fShop) {
      fShop.innerHTML = `${NOVA.categories.map(c => `<li><a href="${B}shop.html?cat=${encodeURIComponent(c.id)}">${esc(c.name)}</a></li>`).join('')}<li><a href="${B}shop.html?sort=new">New Arrivals</a></li>`;
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
      /* Auth state is resolved: reveal the slot without a guest→signed-in flash. */
      slot.classList.remove('is-auth-pending');
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
    document.dispatchEvent(new CustomEvent('auth:change', {
      detail: { authenticated: isAuthed, customer: cust }
    }));
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
    /* Categories arrive asynchronously (catalog:ready). Show a hint instead of an
       empty dropdown on first paint; updateCategoryNav() replaces it with the real list. */
    const cats = (NOVA.categories && NOVA.categories.length)
      ? NOVA.categories.map(c => `<li><a class="dropdown-item" href="${B}shop.html?cat=${encodeURIComponent(c.id)}">${esc(c.name)}</a></li>`).join('')
      : '<li><span class="dropdown-item text-muted-nova">Loading categories…</span></li>';
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
        <div class="nav-auth-slot is-auth-pending" id="navAuthSlot">
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
          ${(NOVA.categories || []).map(c => `<li><a href="${B}shop.html?cat=${encodeURIComponent(c.id)}">${esc(c.name)}</a></li>`).join('')}
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
    const cat = (NOVA.categories || []).map(c => `<li><a href="${B}shop.html?cat=${encodeURIComponent(c.id)}">${esc(c.name)}</a></li>`).join('');
    return `<footer class="site-footer" id="contact"><div class="container"><div class="row g-4 g-lg-5">
      <div class="col-lg-4"><a class="brand" href="${B}index.html" aria-label="NOVA Home, homepage">NOVA <span>Home</span></a><p class="mt-3 pe-lg-4" style="line-height: 1.6;">Modern home and lifestyle pieces, chosen for quality and made to be lived with. Based in Cairo, delivering across Egypt.</p>
        <div class="footer-social" aria-label="Social media (demo placeholders, not live)"><span class="footer-social__soon" title="Instagram (demo placeholder)"><i class="bi bi-instagram" aria-hidden="true"></i></span><span class="footer-social__soon" title="Facebook (demo placeholder)"><i class="bi bi-facebook" aria-hidden="true"></i></span><span class="footer-social__soon" title="TikTok (demo placeholder)"><i class="bi bi-tiktok" aria-hidden="true"></i></span><span class="footer-social__soon" title="WhatsApp (demo placeholder)"><i class="bi bi-whatsapp" aria-hidden="true"></i></span></div><p class="footer-note">Sample links — social profiles are not live.</p></div>
      <div class="col-6 col-md-3 col-lg-2"><h2>Shop</h2><ul data-footer-shop>${cat}<li><a href="${B}shop.html?sort=new">New Arrivals</a></li></ul></div>
      <div class="col-6 col-md-3 col-lg-2"><h2>Customer care</h2><ul><li><a href="${B}shop.html">Shop all products</a></li><li><a href="${B}cart.html">View your cart</a></li><li><a href="${B}checkout.html">Checkout</a></li><li><a href="${B}index.html#why-nova">Why NOVA</a></li><li><a href="${B}account/index.php">My account</a></li><li><a href="${B}terms.html">Terms of Service</a></li><li><a href="${B}privacy.html">Privacy Policy</a></li></ul></div>
      <div class="col-12 col-md-6 col-lg-4"><h2>Contact</h2><ul class="footer-contact-list"><li class="footer-contact-item"><span class="footer-contact-icon"><i class="bi bi-telephone" aria-hidden="true"></i></span><span class="footer-contact-text"><a href="tel:+201001234567" data-nova-tel>+20 100 123 4567</a></span></li><li class="footer-contact-item"><span class="footer-contact-icon"><i class="bi bi-envelope" aria-hidden="true"></i></span><span class="footer-contact-text"><a href="mailto:hello@novahome.eg" data-nova-email>hello@novahome.eg</a></span></li><li class="footer-contact-item"><span class="footer-contact-icon"><i class="bi bi-geo-alt" aria-hidden="true"></i></span><span class="footer-contact-text" data-nova-address>Cairo, Egypt</span></li><li class="footer-contact-item"><span class="footer-contact-icon"><i class="bi bi-clock" aria-hidden="true"></i></span><span class="footer-contact-text">Daily, 10 AM to 9 PM</span></li></ul><p class="footer-note">Sample contact details for this demo store.</p></div>
    </div><div class="footer-bottom"><div class="footer-bottom__inner"><div>&copy; ${new Date().getFullYear()} <span data-nova-business>NOVA Home</span>. All rights reserved.</div><div class="footer-badges"><span class="footer-badge"><i class="bi bi-shield-check" aria-hidden="true"></i> Cash on Delivery</span><span class="footer-badge"><i class="bi bi-truck" aria-hidden="true"></i> Delivery estimates shown</span></div></div></div></div></footer>
    <div class="modal fade qv-modal" id="quickModal" tabindex="-1" aria-labelledby="qv-title" aria-describedby="qv-desc" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content qv">
      <div class="modal-header"><h2 class="h5 m-0" id="qv-title"></h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close quick view"></button></div>
      <div class="modal-body"><div class="qv__grid">
        <div class="qv__media"><img id="qv-img" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'/%3E" width="600" height="600" alt=""></div>
        <div class="qv__info">
          <p class="text-muted-nova mb-1 small" id="qv-cat"></p>
          <p class="small my-1" id="qv-rating"></p>
          <p class="qv__price my-2" id="qv-price"></p>
          <p class="stock small text-muted-nova"><i class="bi bi-info-circle me-1" aria-hidden="true"></i><span id="qv-stock">Availability is not tracked in this demo catalogue.</span></p>
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

  function mount() {
    checkAuth();
    if (NOVA.catalog && NOVA.catalog.ready) updateCategoryNav();
    else document.addEventListener('catalog:ready', updateCategoryNav);
  }

  NOVA.shellUI = Object.freeze({ header, footer, mount, announcementText });
})();
