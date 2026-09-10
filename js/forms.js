// Shared enquiry handling. The two endpoint payloads retain their original fields.
document.querySelectorAll('.lead__form').forEach(form => {
  const audit = form.classList.contains('audit__form');
  const status = form.querySelector('.lead__status');
  const submit = form.querySelector('[type="submit"]');
  const endpoint = typeof SITE_CONFIG === 'undefined' ? '' :
    (audit ? SITE_CONFIG.auditEndpoint : SITE_CONFIG.leadEndpoint);
  let sending = false;

  const say = (kind, message, fallback = false) => {
    status.className = 'lead__status ' + kind;
    status.replaceChildren(document.createTextNode(message));
    if (fallback) {
      const link = document.createElement('a');
      link.href = typeof SITE_CONFIG === 'undefined' ? 'https://t.me/studiosrb' : SITE_CONFIG.telegramUrl;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'Написать в Telegram';
      status.append(document.createTextNode(' '), link);
    }
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    // Whitespace is not a meaningful answer to a required question.
    form.querySelectorAll('input[type="text"], textarea').forEach(field => {
      field.value = field.value.trim();
    });
    if (!form.reportValidity()) return;
    if (!endpoint || /REPLACE_WITH/.test(endpoint)) {
      say('is-err', 'Форма сейчас недоступна. Свяжитесь с нами напрямую.', true);
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    delete data.agree;
    const label = submit.textContent;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    sending = true;
    submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    submit.textContent = 'Отправляем…';
    say('', '');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, page: location.pathname }),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error('Unconfirmed submission');
      form.reset();
      say('is-ok', audit
        ? 'Анкету получили. Изучим ответы и свяжемся с вами в течение рабочего дня.'
        : 'Заявку получили. Посмотрим ваши площадки и ответим в течение рабочего дня.');
    } catch {
      say('is-err', 'Не удалось подтвердить отправку. Ваши ответы сохранены в форме.', true);
    } finally {
      clearTimeout(timeout);
      sending = false;
      submit.disabled = false;
      submit.textContent = label;
      form.removeAttribute('aria-busy');
    }
  });
});
