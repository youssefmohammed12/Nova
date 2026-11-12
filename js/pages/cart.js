(function () {
  const NOVA = window.NOVA;
  NOVA.pageControllers = NOVA.pageControllers || {};

  NOVA.pageControllers.cart = function cartPage() {
    const { fmt, ui, $, customerAuthed, CO_LOGIN } = NOVA.pageHelpers;
    const esc = NOVA.escapeHTML;
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
      linesEl.innerHTML = items.map(i => { const p = NOVA.find(i.id); const id = esc(p.id); const name = esc(p.name); return `<li class="cart-item"><img src="${esc(NOVA.imgs(p.id)[0])}" width="110" height="110" alt="${name}"><div><h2><a href="product.html?id=${encodeURIComponent(p.id)}" class="text-decoration-none">${name}</a></h2><span class="text-muted-nova small">${fmt(p.price)} each</span>
        <div class="cart-item__row"><div class="qty" role="group" aria-label="Quantity for ${name}"><button type="button" data-dec="${id}" aria-label="Decrease quantity"${i.qty <= 1 ? ' disabled' : ''}>&minus;</button><output>${i.qty}</output><button type="button" data-inc="${id}" aria-label="Increase quantity"${i.qty >= 10 ? ' disabled' : ''}>+</button></div><span class="price">${fmt(p.price * i.qty)}</span></div>
        <button class="link-remove" type="button" data-remove="${id}">Remove</button></div></li>`; }).join('');
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
  };
})();
