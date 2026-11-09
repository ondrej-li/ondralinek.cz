(() => {
  const root = document.documentElement;
  const reveal = Array.from(document.querySelectorAll('[data-reveal]'));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const showAll = () => reveal.forEach((el) => el.classList.add('is-visible'));

  if (reduced || reveal.length === 0) {
    showAll();
  } else {
    // Hide only after this script runs, so a failed script never leaves the
    // page blank. Position checks instead of IntersectionObserver keep the
    // reveal in step with the scroll position in every engine.
    root.classList.add('reveal-ready');
    let queued = false;
    const check = () => {
      queued = false;
      const viewport = window.innerHeight;
      for (const el of reveal) {
        if (el.classList.contains('is-visible')) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top < viewport * 0.94 && rect.bottom > 0) {
          el.classList.add('is-visible');
        }
      }
    };
    const queue = () => {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(check);
    };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
    window.addEventListener('load', queue);
    queue();
    // Safety net for exotic engines and for printing.
    window.setTimeout(showAll, 6000);
  }

  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('#site-menu');
  if (toggle && menu) {
    const close = () => {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) close();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') close();
    });
    window.matchMedia('(min-width: 761px)').addEventListener('change', (event) => {
      if (event.matches) close();
    });
  }

  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
})();
