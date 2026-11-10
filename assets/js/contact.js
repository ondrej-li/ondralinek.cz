(() => {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  const email = form.dataset.contactEmail;
  const subject = form.querySelector('#contact-subject');
  const body = form.querySelector('#contact-body');
  if (!email || !subject || !body) return;

  form.addEventListener('submit', (event) => {
    if (!form.reportValidity()) return;
    event.preventDefault();

    const subjectValue = encodeURIComponent(subject.value.trim());
    const bodyValue = encodeURIComponent(body.value);
    const mailto = `mailto:${email}?subject=${subjectValue}&body=${bodyValue}`;
    form.action = mailto;
    window.location.href = mailto;
  });
})();
