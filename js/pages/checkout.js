(function () {
  const NOVA = window.NOVA;
  NOVA.pageControllers = NOVA.pageControllers || {};

  NOVA.pageControllers.checkout = function checkoutPage() {
    const { fmt, $, line, customerAuthed, CO_LOGIN } = NOVA.pageHelpers;
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
            const opt = [...citySel.options].find(o =>
              o.text.trim().toLowerCase() === String(dflt.city).toLowerCase() ||
              o.value.toLowerCase() === String(dflt.city).toLowerCase()
            );
            if (opt) {
              citySel.value = opt.value || opt.text;
              // Keep the shared estimator city and checkout destination in sync
              // with the selected default address.
              if (NOVA.delivery.set(citySel.value)) {
                citySel.dispatchEvent(new Event('change', { bubbles: true }));
              }
            }
          }
        })
        .catch(() => { /* profile fetch failed: keep the current form values */ });
    })();
    document.addEventListener('cart:change', renderSummary);
    /* Reuse stored estimator city so checkout does not force a reselect. Read-only. */
    const coCity = $('#c-city');
    if (coCity) {
      const renderCheckoutCities = () => {
        const selected = coCity.value;
        NOVA.populateDeliveryCitySelect(coCity, true);
        if (selected && NOVA.deliveryCities[selected]) coCity.value = selected;
        else {
          const saved = NOVA.delivery.get();
          if (NOVA.deliveryCities[saved]) coCity.value = saved;
        }
      };
      renderCheckoutCities();
      if (NOVA.storeSettingsReady) NOVA.storeSettingsReady.then(renderCheckoutCities);
      let cur = null;
      try { cur = NOVA.delivery.get(); } catch { cur = null; }
      const info = cur && NOVA.deliveryCities[cur];
      if (info) {
        const match = [...coCity.options].find(o => o.value === cur || o.text.trim().toLowerCase() === info.name.toLowerCase());
        if (match) coCity.value = match.value;
      }
      const coDest = document.createElement('p');
      coDest.className = 'small text-muted-nova mt-2 mb-0';
      coDest.id = 'co-dest';
      const coPaint = () => {
        let id = null;
        try { id = NOVA.delivery.get(); } catch { id = null; }
        const label = (id && NOVA.deliveryCities[id] && NOVA.deliveryCities[id].name) || NOVA.deliveryCities[NOVA.delivery.def].name;
        coDest.textContent = `Delivery to: ${label}`;
      };
      coPaint();
      coCity.closest('.col-md-6').appendChild(coDest);
      coCity.addEventListener('change', () => {
        if (NOVA.delivery.set(coCity.value)) coPaint();
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
  };
})();
