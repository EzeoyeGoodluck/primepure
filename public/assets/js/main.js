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

  // "Request Quote for This" buttons pre-select the service on the quote form
  var params = new URLSearchParams(window.location.search);
  var preset = params.get('service');
  if (preset) {
    document.querySelectorAll('select[name="Service"]').forEach(function (sel) {
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].text === preset) { sel.selectedIndex = i; break; }
      }
    });
  }

  // Quote & contact forms → emailed via FormSubmit (formsubmit.co).
  // Field names are used as the labels in the email.
  // The very first submission sends an activation email to the inbox; after it's
  // confirmed, every enquiry arrives as an email.
  document.querySelectorAll('form[data-lead-form]').forEach(function (form) {
    var status = form.querySelector('.form-status');
    var button = form.querySelector('button[type="submit"]');
    var email = form.getAttribute('data-email');
    var phone = form.getAttribute('data-phone');
    var endpoint = 'https://formsubmit.co/ajax/' + (form.getAttribute('data-formsubmit') || email);

    function show(type, msg) { status.className = 'form-status is-' + type; status.textContent = msg; }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var data = new FormData(form);
      if (data.get('botcheck')) return; // spam honeypot
      data.delete('botcheck');

      var payload = {};
      data.forEach(function (v, k) { payload[k] = v; });
      var who = payload['Full Name'] || ((payload['First Name'] || '') + ' ' + (payload['Last Name'] || '')).trim();
      payload['Page'] = window.location.pathname;
      payload._subject = (form.getAttribute('data-subject') || 'New website enquiry') + ' — ' + who +
        (payload['Service'] ? ' (' + payload['Service'] + ')' : '');
      payload._replyto = payload['Email Address'];
      payload._template = 'table';
      payload._captcha = 'false';

      button.disabled = true;
      var label = button.innerHTML;
      button.textContent = 'Sending…';

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          var msg = String(res.message || '');
          if (/activat/i.test(msg)) {
            show('success', 'Form not activated yet — check ' + email + ' for the FormSubmit activation email and click the link.');
            return;
          }
          if (String(res.success) !== 'true') throw new Error(msg || 'Failed');
          form.reset();
          show('success', 'Thank you! Your request has been received — we aim to respond within 1 hour.');
        })
        .catch(function () {
          show('error', 'Sorry, that didn’t send. Please call ' + phone + ' or email ' + email + '.');
        })
        .finally(function () { button.disabled = false; button.innerHTML = label; });
    });
  });
})();
