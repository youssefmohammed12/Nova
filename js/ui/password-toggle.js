/* Accessible reveal controls for customer password fields. */
(function () {
  document.addEventListener('click', event => {
    const button = event.target.closest && event.target.closest('[data-password-toggle]');
    if (!button) return;

    const inputId = button.getAttribute('aria-controls');
    const input = inputId ? document.getElementById(inputId) : null;
    if (!input || !/^(password|text)$/.test(input.type)) return;

    const reveal = input.type === 'password';
    input.type = reveal ? 'text' : 'password';
    const label = reveal ? 'Hide password' : 'Show password';
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    button.setAttribute('aria-pressed', String(reveal));

    const icon = button.querySelector('i');
    if (icon) icon.className = reveal ? 'bi bi-eye-slash' : 'bi bi-eye';
  });
})();
