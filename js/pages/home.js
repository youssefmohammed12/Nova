/*
 * Homepage page controller.
 * Keeps homepage-specific rendering out of the shared page dispatcher.
 */
(function () {
  'use strict';

  const $ = (selector, root) => (root || document).querySelector(selector);
  const getProducts = () => Array.isArray(NOVA.products) ? NOVA.products : [];
  const esc = NOVA.escapeHTML;

  const renderProductGrid = (list, wishlist) => list
    .map(product => `<div class="col-6 col-lg-3">${NOVA.ui.card(product, wishlist)}</div>`)
    .join('');

  function renderHomePage() {
    const categoryGrid = $('#category-grid');
    const featuredGrid = $('#featured-grid');
    const bestsellerSlides = $('#bestseller-slides');

    if (!categoryGrid || !featuredGrid || !bestsellerSlides) return;

    categoryGrid.innerHTML = (NOVA.categories || []).map(category =>
      `<div class="col-6 col-md-4 col-lg"><a class="category-card" href="shop.html?cat=${encodeURIComponent(category.id)}"><img src="assets/images/${esc(category.image)}" width="600" height="750" loading="lazy" alt="${esc(category.name)} collection"><span class="category-card__label">${esc(category.name)}<i class="bi bi-arrow-right" aria-hidden="true"></i></span></a></div>`
    ).join('');

    const wishlist = new Set(NOVA.wish.ids());
    featuredGrid.innerHTML = renderProductGrid(
      getProducts().filter(product =>
        ['sahara-vase', 'luna-floor-lamp', 'nile-basket-set', 'aswan-side-table'].includes(product.id)
      ),
      wishlist
    );

    bestsellerSlides.innerHTML = getProducts()
      .filter(product => product.best)
      .map(product => `<div class="swiper-slide">${NOVA.ui.card(product, wishlist)}</div>`)
      .join('');

    NOVA.renderRecentlyViewed();

    if (typeof NOVA.ui.shopLook === 'function') {
      NOVA.ui.shopLook();
    }

    if (typeof window.Swiper !== 'function') return;

    new window.Swiper('#bestsellers', {
      slidesPerView: 1.6,
      spaceBetween: 16,
      navigation: {
        nextEl: '#best-next',
        prevEl: '#best-prev'
      },
      breakpoints: {
        576: { slidesPerView: 2.4 },
        992: { slidesPerView: 4, spaceBetween: 24 }
      }
    });
  }

  NOVA.pageControllers = NOVA.pageControllers || {};
  NOVA.pageControllers.home = renderHomePage;
})();
