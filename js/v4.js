/* 4TECH V4 — navegação, vídeos, galeria e formulário. */
(() => {
  'use strict';
  const byId = (id) => document.getElementById(id);
  const trackEvent = (name, props) => { if (window.fourtechTrack) window.fourtechTrack(name, props); };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const header = byId('topo');
  const menu = document.querySelector('.menu-button');
  const nav = byId('navegacao');
  const desktop = window.matchMedia('(min-width: 951px)');
  function setMenu(open) {
    header.classList.toggle('menu-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.querySelector('span').textContent = open ? 'Fechar' : 'Menu';
  }
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (event) => { if (event.target.closest('a')) setMenu(false); });
  desktop.addEventListener('change', () => setMenu(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.classList.contains('menu-open')) {
      setMenu(false);
      menu.focus();
    }
  });
  const syncHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 45);
  window.addEventListener('scroll', syncHeader, { passive: true });
  syncHeader();
  byId('current-year').textContent = String(new Date().getFullYear());

  // A demonstração do laboratório está encapsulada em control-lab.js.

  // Os universos substituem a lista de acordeões das versões anteriores.
  const worldTabs = Array.from(document.querySelectorAll('[role="tab"]'));
  function showWorld(index, focus = false) {
    worldTabs.forEach((tab, position) => {
      const selected = position === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      byId(tab.getAttribute('aria-controls')).hidden = !selected;
    });
    if (focus) worldTabs[index].focus();
  }
  worldTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => { showWorld(index); trackEvent('solution_tab', { tab: tab.querySelector('span').textContent }); });
    tab.addEventListener('keydown', (event) => {
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % worldTabs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + worldTabs.length) % worldTabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = worldTabs.length - 1;
      else return;
      event.preventDefault();
      showWorld(next, true);
    });
  });

  const projectData = {
    alphaville: {
      title: 'Alphaville 2', category: 'PALMAS / TO', image: 'img/poster-obra-alphaville.webp',
      description: 'Residência em Palmas com som, iluminação, ar-condicionado e cinema no mesmo sistema. Uma cena ajusta vários ambientes de uma vez, pelo celular ou pelo teclado na parede.'
    },
    bahia: {
      title: 'Condomínio familiar', category: 'BAHIA / INTEGRAÇÃO RESIDENCIAL', image: 'img/casa-bahia.webp',
      description: 'Cinco casas, um escritório e áreas de lazer no mesmo projeto. Cada casa controla o que é seu, e as áreas comuns funcionam juntas.'
    },
    brastemp: {
      title: 'Casa Brastemp', category: 'ARQUITETURA / SONORIZAÇÃO', image: 'img/casa-brastemp-teto.webp',
      description: 'Som planejado junto com a arquitetura: caixas embutidas no forro e distribuídas para o som chegar por igual em todo o ambiente, sem aparecer no projeto.'
    }
  };

  const projectDialog = byId('project-dialog');
  const videoDialog = byId('video-dialog');
  const galleryDialog = byId('gallery-dialog');
  const showroomVideo = byId('showroom-video');
  const dialogs = [projectDialog, videoDialog, galleryDialog];
  const syncDialogLock = () => document.body.classList.toggle('dialog-open', dialogs.some((dialog) => dialog.open));

  document.querySelectorAll('[data-project]').forEach((button) => {
    button.addEventListener('click', () => {
      const project = projectData[button.dataset.project];
      byId('dialog-title').textContent = project.title;
      byId('dialog-category').textContent = project.category;
      byId('dialog-description').textContent = project.description;
      byId('dialog-image').src = project.image;
      byId('dialog-image').alt = project.title;
      projectDialog.showModal();
      trackEvent('project_open', { project: button.dataset.project });
      syncDialogLock();
    });
  });
  document.querySelector('.dialog-close').addEventListener('click', () => projectDialog.close());
  byId('dialog-contact').addEventListener('click', () => projectDialog.close());

  const track = byId('gallery-track');
  const previousPhoto = byId('gallery-prev');
  const nextPhoto = byId('gallery-next');
  function updateGalleryNavigation() {
    previousPhoto.disabled = track.scrollLeft < 2;
    nextPhoto.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  }
  function moveGallery(direction) {
    const card = track.querySelector('.gallery-card');
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 20;
    track.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  }
  previousPhoto.addEventListener('click', () => moveGallery(-1));
  nextPhoto.addEventListener('click', () => moveGallery(1));
  track.addEventListener('scroll', updateGalleryNavigation, { passive: true });
  window.addEventListener('resize', updateGalleryNavigation);
  updateGalleryNavigation();
  document.querySelectorAll('[data-gallery]').forEach((button) => {
    button.addEventListener('click', () => {
      const image = button.querySelector('img');
      byId('gallery-title').textContent = button.querySelector('b').textContent;
      byId('gallery-image').src = image.getAttribute('src');
      byId('gallery-image').alt = image.alt;
      galleryDialog.showModal();
      trackEvent('gallery_open', { photo: button.querySelector('b').textContent });
      syncDialogLock();
    });
  });
  byId('gallery-close').addEventListener('click', () => galleryDialog.close());

  // Vídeo de fundo: sempre tocando enquanto o topo estiver na tela.
  const film = byId('hero-film');
  const hero = byId('inicio');
  const filmAllowed = !reducedMotion.matches && !(navigator.connection && navigator.connection.saveData);
  let heroVisible = true;
  async function playFilm() {
    if (!filmAllowed || !heroVisible || document.hidden || document.body.classList.contains('dialog-open')) return;
    if (!film.getAttribute('src')) film.src = film.dataset.src;
    film.muted = true;
    try { await film.play(); hero.classList.add('film-playing'); } catch (_) {}
  }
  const pauseFilm = () => film.pause();
  film.addEventListener('playing', () => hero.classList.add('film-playing'));
  film.addEventListener('error', () => hero.classList.remove('film-playing'));
  playFilm();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      if (heroVisible) playFilm(); else pauseFilm();
    }, { threshold: 0.05 }).observe(hero);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseFilm(); else playFilm(); });

  // Vídeo do showroom: abre em tela cheia, com som quando o arquivo tiver áudio.
  const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;
  function enterFullscreen(video) {
    try {
      if (video.requestFullscreen) return video.requestFullscreen().catch(() => {});
      if (video.webkitRequestFullscreen) return video.webkitRequestFullscreen();
      if (video.webkitEnterFullscreen) return video.webkitEnterFullscreen();
    } catch (_) {}
  }
  document.querySelectorAll('[data-open-video]').forEach((button) => {
    button.addEventListener('click', () => {
      pauseFilm();
      videoDialog.showModal();
      syncDialogLock();
      showroomVideo.muted = false;
      showroomVideo.currentTime = 0;
      const playback = showroomVideo.play();
      if (playback) playback.catch(() => { showroomVideo.muted = true; showroomVideo.play().catch(() => {}); });
      enterFullscreen(showroomVideo);
      trackEvent('video_open', { from: button.closest('section') ? button.closest('section').id : '' });
    });
  });
  const leaveFullscreen = () => { if (!fullscreenElement() && videoDialog.open) videoDialog.close(); };
  document.addEventListener('fullscreenchange', leaveFullscreen);
  document.addEventListener('webkitfullscreenchange', leaveFullscreen);
  showroomVideo.addEventListener('webkitendfullscreen', () => { if (videoDialog.open) videoDialog.close(); });
  document.querySelector('.video-close').addEventListener('click', () => videoDialog.close());
  videoDialog.addEventListener('close', () => {
    showroomVideo.pause();
    if (showroomVideo.readyState > 0) showroomVideo.currentTime = 0;
    if (fullscreenElement() && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    playFilm();
  });
  dialogs.forEach((dialog) => {
    dialog.addEventListener('close', syncDialogLock);
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  });

  // A mensagem só é enviada quando a pessoa confirma no próprio WhatsApp.
  byId('contact-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const type = byId('project-type').value;
    const stage = byId('project-stage').value;
    const message = `Olá, 4TECH! É para ${type}, que está ${stage}. Quero conversar sobre automação e som.`;
    trackEvent('whatsapp_form_submit', { tipo: type, etapa: stage });
    const url = new URL('https://wa.me/5563999393959');
    url.searchParams.set('text', message);
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  });
})();
