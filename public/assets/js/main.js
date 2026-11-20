/* PrimePure Cleaning Solutions — site behaviour */
(function () {
  // Mobile menu
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Pre-select a service on the quote form when linked with ?service=
  var preset = new URLSearchParams(window.location.search).get('service');
  if (preset) {
    document.querySelectorAll('select[name="Service"]').forEach(function (sel) {
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].text.toLowerCase() === preset.toLowerCase()) {
          sel.selectedIndex = i;
          break;
        }
      }
    });
  }

  // Quote and contact forms are emailed through FormSubmit (formsubmit.co).
  // The FIRST submission triggers an activation email to the inbox below —
  // until someone clicks that link, nothing is delivered. Send a test and
  // check the inbox (and spam) before relying on it.
  document.querySelectorAll('form[data-lead-form]').forEach(function (form) {
    var status = form.querySelector('.form-status');
    var button = form.querySelector('button[type="submit"]');
    var email = form.getAttribute('data-email');
    var phone = form.getAttribute('data-phone');
    var endpoint = 'https://formsubmit.co/ajax/' + (form.getAttribute('data-formsubmit') || email);

    function show(type, msg) {
      status.className = 'form-status is-' + type;
      status.textContent = msg;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      var data = new FormData(form);
      if (data.get('botcheck')) return; // spam honeypot
      data.delete('botcheck');

      var payload = {};
      data.forEach(function (v, k) { payload[k] = v; });
      payload.Page = window.location.pathname;
      payload._subject =
        (form.getAttribute('data-subject') || 'Website enquiry') +
        ' — ' + (payload.Name || 'no name') +
        (payload.Service ? ' (' + payload.Service + ')' : '');
      payload._replyto = payload.Email;
      payload._template = 'table';
      payload._captcha = 'false';

      var label = button.innerHTML;
      button.disabled = true;
      button.textContent = 'Sending…';

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          var msg = String(res.message || '');
          if (/activat/i.test(msg)) {
            // Owner-facing: the FormSubmit address has never been confirmed.
            // Submit this form once, then click the activation link sent to
            // the address above. Until then nothing is delivered.
            if (window.console && console.warn) {
              console.warn('PrimePure: form not activated. Click the FormSubmit activation link sent to ' + email + '.');
            }
            show('error', 'Sorry, that did not send. Please ring ' + phone + ' or email ' + email + ' and we will get straight back to you.');
            return;
          }
          if (String(res.success) !== 'true') throw new Error(msg || 'Failed');
          form.reset();
          show('success', 'Thank you — we have got it, and we aim to reply within the hour.');
        })
        .catch(function () {
          show('error', 'Sorry, that did not send. Please ring ' + phone + ' or email ' + email + '.');
        })
        .finally(function () {
          button.disabled = false;
          button.innerHTML = label;
        });
    });
  });
})();
