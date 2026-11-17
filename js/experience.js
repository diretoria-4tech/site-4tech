(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Skeleton nas imagens ---------- */
  const isPhoto = (img) => !/\.svg(\?|$)/i.test(img.getAttribute('src') || '') && img.id !== 'room-wallpaper';
  const done = (img) => {
    if (!img.classList.contains('is-loading')) return;
    img.classList.remove('is-loading');
    if (reduced) return;
    img.classList.add('is-loaded');
    img.addEventListener('animationend', () => img.classList.remove('is-loaded'), { once: true });
  };
  const watch = (img) => {
    if (!isPhoto(img)) return;
    if (img.complete && img.naturalWidth > 0) { img.classList.remove('is-loading'); return; }
    img.classList.add('is-loading');
  };
  document.addEventListener('load', (e) => { if (e.target.tagName === 'IMG') done(e.target); }, true);
  document.addEventListener('error', (e) => { if (e.target.tagName === 'IMG') e.target.classList.remove('is-loading'); }, true);
  document.querySelectorAll('img').forEach(watch);
  /* imagens trocadas depois (fotos ampliadas e detalhes de projeto) */
  if ('MutationObserver' in window) {
    const swap = new MutationObserver((list) => list.forEach((m) => watch(m.target)));
    ['dialog-image', 'gallery-image'].forEach((id) => {
      const img = document.getElementById(id);
      if (img) swap.observe(img, { attributes: true, attributeFilter: ['src'] });
    });
  }

  /* ---------- Revelação ao rolar ---------- */
  if (reduced || !('IntersectionObserver' in window)) return;
  const groups = [
    '#laboratorio > .lab-heading', '#laboratorio > .control-console',
    '#solucoes .section-heading', '#solucoes .world-tabs', '#solucoes .world-panel:not([hidden])',
    '#showroom > .showroom-heading', '#showroom > .gallery-track', '#showroom > .showroom-bottom',
    '#projetos > .section-heading', '#projetos .project-feature', '#projetos .project-pair > article',
    '#conversa > .container > *'
  ];
  const items = Array.from(document.querySelectorAll(groups.join(',')));
  const release = (el) => { el.classList.remove('reveal', 'reveal-in'); el.style.removeProperty('--reveal-delay'); };
  const observer = new IntersectionObserver((entries) => {
    let order = 0;
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = order++ * 90;
      el.style.setProperty('--reveal-delay', delay + 'ms');
      el.classList.add('reveal-in');
      observer.unobserve(el);
      /* devolve o elemento ao estado original depois da animação */
      setTimeout(() => release(el), 800 + delay);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  const viewport = window.innerHeight || document.documentElement.clientHeight;
  items.forEach((el) => {
    /* o que já está visível ao abrir a página não some e reaparece */
    if (el.getBoundingClientRect().top < viewport) return;
    el.classList.add('reveal');
    observer.observe(el);
  });
})();
