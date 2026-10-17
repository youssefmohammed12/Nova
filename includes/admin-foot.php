<?php
/**
 * NOVA Home — shared admin page shell BOTTOM (Phase 6/8).
 * Closes .admin-main-col / .admin-shell / container / main, then loads Bootstrap and
 * the shared server-side logout handler.
 */
declare(strict_types=1);
?>
      </div><!-- /.admin-main-col -->
    </div><!-- /.admin-shell -->
  </div><!-- /.container-fluid -->
</main>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
<script>
/* Server-side logout: POST the CSRF token to logout.php, let PHP isolate and
   clear only admin session keys without touching customer state, then redirect to login.php. */
(function () {
  var btns = document.querySelectorAll('.admin-logout-btn, #admin-logout');
  btns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var token = btn.dataset.csrf || '';
      btn.style.pointerEvents = 'none';
      btn.style.opacity = '0.6';
      fetch('logout.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csrf_token: token })
      }).then(function () {
        location.href = 'login.php';
      }).catch(function () {
        location.href = 'login.php';
      });
    });
  });
})();
</script>
</body>
</html>
