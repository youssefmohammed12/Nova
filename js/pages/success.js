(function () {
  const NOVA = window.NOVA;
  NOVA.pageControllers = NOVA.pageControllers || {};

  NOVA.pageControllers.success = function successPage() {
    const { fmt, $ } = NOVA.pageHelpers;
    const esc = NOVA.escapeHTML;
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
        boxEl.innerHTML = '<p class="alert alert-info mb-0" role="status">No order confirmation could be loaded because no order reference was provided. If you recently placed an order, you can review it in your <a href="account/orders.php">order history</a> or <a href="shop.html">continue shopping</a>.</p>';
        boxEl.setAttribute('aria-busy', 'false');
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
        boxEl.innerHTML = '<p class="alert alert-warning mb-0" role="alert">Order details could not be loaded. Please sign in to the account used to place the order, then review your order history.</p>';
        boxEl.setAttribute('aria-busy', 'false');
      }
      const sub = $('#ok-sub'), del = $('#ok-del'), tot = $('#ok-total');
      if (sub) sub.textContent = '—';
      if (del) del.textContent = '—';
      if (tot) tot.textContent = '—';
    };

    if (!ref) { showMissing(); return; }
    if (boxEl) { boxEl.innerHTML = '<p class="text-muted-nova mb-0">Loading order details…</p>'; boxEl.setAttribute('aria-busy', 'true'); }
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
            ? items.map(i => `<div class="summary-line"><img src="${esc(i.slug ? NOVA.imgs(i.slug)[0] : (NOVA.BASE || '') + 'favicon.svg')}" width="52" height="52" alt=""><span>${esc(i.product_name)} x ${Number(i.quantity) || 0}</span><span>${fmt(i.line_total)}</span></div>`).join('')
            : '<p class="text-muted-nova mb-0">No items to display.</p>';
          boxEl.setAttribute('aria-busy', 'false');
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
  };
})();
