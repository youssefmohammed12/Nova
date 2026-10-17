<?php
declare(strict_types=1);
/**
 * NOVA Home - shared footer partial (Backend Phase 1).
 * Mirrors js/ui.js footer(). Static contact details now; Phase 2 will read
 * them from the settings table via nova_setting(). Not yet included by pages.
 */
$nova_base = function_exists('nova_base_url') ? nova_base_url() : '/';
$B = $nova_base;
$cats = $nova_categories ?? [
    ['slug' => 'decor', 'name' => 'Decor'],
    ['slug' => 'lighting', 'name' => 'Lighting'],
    ['slug' => 'kitchen', 'name' => 'Kitchen'],
    ['slug' => 'storage', 'name' => 'Storage'],
    ['slug' => 'furniture', 'name' => 'Furniture'],
];
$esc = function_exists('e') ? 'e' : 'htmlspecialchars';
?>
<footer class="site-footer" id="contact"><div class="container"><div class="row g-4 g-lg-5">
  <div class="col-lg-4"><a class="brand" href="<?= $esc($B) ?>index.html" aria-label="NOVA Home, homepage">NOVA <span>Home</span></a><p class="mt-3 pe-lg-4" style="line-height: 1.6;">Modern home and lifestyle pieces, chosen for quality and made to be lived with. Based in Cairo, delivering across Egypt.</p>
    <div class="footer-social" aria-label="Social media (coming soon)"><span class="footer-social__soon" title="Instagram (coming soon)"><i class="bi bi-instagram" aria-hidden="true"></i></span><span class="footer-social__soon" title="Facebook (coming soon)"><i class="bi bi-facebook" aria-hidden="true"></i></span><span class="footer-social__soon" title="TikTok (coming soon)"><i class="bi bi-tiktok" aria-hidden="true"></i></span><span class="footer-social__soon" title="WhatsApp (coming soon)"><i class="bi bi-whatsapp" aria-hidden="true"></i></span></div><p class="footer-note">Social profiles coming soon.</p></div>
  <div class="col-6 col-md-3 col-lg-2"><h2>Shop</h2><ul data-footer-shop><?php foreach ($cats as $c): ?><li><a href="<?= $esc($B) ?>shop.html?cat=<?= $esc($c['slug']) ?>"><?= $esc($c['name']) ?></a></li><?php endforeach; ?><li><a href="<?= $esc($B) ?>shop.html?sort=new">New Arrivals</a></li></ul></div>
  <div class="col-6 col-md-3 col-lg-2"><h2>Customer care</h2><ul><li><a href="<?= $esc($B) ?>shop.html">Shop all products</a></li><li><a href="<?= $esc($B) ?>cart.html">View your cart</a></li><li><a href="<?= $esc($B) ?>checkout.html">Checkout</a></li><li><a href="<?= $esc($B) ?>index.html#why-nova">Why NOVA</a></li><li><a href="<?= $esc($B) ?>account/index.php">My account</a></li></ul></div>
  <div class="col-12 col-md-6 col-lg-4"><h2>Contact</h2><ul class="footer-contact-list"><li class="footer-contact-item"><span class="footer-contact-icon"><i class="bi bi-telephone" aria-hidden="true"></i></span><span class="footer-contact-text"><a href="tel:+201001234567" data-nova-tel>+20 100 123 4567</a></span></li><li class="footer-contact-item"><span class="footer-contact-icon"><i class="bi bi-envelope" aria-hidden="true"></i></span><span class="footer-contact-text"><a href="mailto:hello@novahome.eg" data-nova-email>hello@novahome.eg</a></span></li><li class="footer-contact-item"><span class="footer-contact-icon"><i class="bi bi-geo-alt" aria-hidden="true"></i></span><span class="footer-contact-text" data-nova-address>Cairo, Egypt</span></li><li class="footer-contact-item"><span class="footer-contact-icon"><i class="bi bi-clock" aria-hidden="true"></i></span><span class="footer-contact-text">Daily, 10 AM to 9 PM</span></li></ul></div>
</div><div class="footer-bottom"><div class="footer-bottom__inner"><div>&copy; <?= date('Y') ?> <span data-nova-business>NOVA Home</span>. All rights reserved.</div><div class="footer-badges"><span class="footer-badge"><i class="bi bi-shield-check" aria-hidden="true"></i> Cash on Delivery</span><span class="footer-badge"><i class="bi bi-truck" aria-hidden="true"></i> Cairo & Giza Express</span></div></div></div></div></footer>
