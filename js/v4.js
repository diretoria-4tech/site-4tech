/* 4TECH V4 — nova composição, sem backend ou rastreamento. */
(() => {
  'use strict';
  const byId = (id) => document.getElementById(id);
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
    tab.addEventListener('click', () => showWorld(index));
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
      description: 'Um projeto residencial em que áudio, iluminação, climatização e cinema compartilham a mesma lógica de controle. A integração permite pensar a experiência do espaço como um conjunto.'
    },
    bahia: {
      title: 'Condomínio familiar', category: 'BAHIA / INTEGRAÇÃO RESIDENCIAL', image: 'img/casa-bahia.webp',
      description: 'Cinco casas, escritório e áreas de lazer dentro de um mesmo projeto de integração. A proposta combina a autonomia de cada residência com as possibilidades de um sistema conectado.'
    },
    brastemp: {
      title: 'Casa Brastemp', category: 'ARQUITETURA / SONORIZAÇÃO', image: 'img/casa-brastemp-teto.webp',
      description: 'A sonorização participa do projeto arquitetônico desde a escolha dos equipamentos até a distribuição no ambiente. Um trabalho em que escutar bem e preservar o desenho do espaço caminham juntos.'
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
      syncDialogLock();
    });
  });
  byId('gallery-close').addEventListener('click', () => galleryDialog.close());

  const film = byId('hero-film');
  const filmControl = byId('film-control');
  const hero = byId('inicio');
  function updateFilmControl(playing) {
    filmControl.setAttribute('aria-pressed', String(playing));
    filmControl.setAttribute('aria-label', playing ? 'Pausar vídeo de fundo' : 'Reproduzir vídeo de fundo');
    filmControl.querySelector('span').textContent = playing ? 'Ⅱ' : '▷';
    filmControl.querySelector('b').textContent = playing ? 'Pausar vídeo' : 'Reproduzir vídeo';
  }
  function pauseFilm() {
    film.pause();
    updateFilmControl(false);
  }
  async function playFilm() {
    if (!film.getAttribute('src')) film.src = film.dataset.src;
    film.muted = true;
    try {
      await film.play();
      hero.classList.add('film-playing');
      updateFilmControl(true);
    } catch (_) {
      updateFilmControl(false);
    }
  }
  filmControl.addEventListener('click', () => film.paused ? playFilm() : pauseFilm());
  film.addEventListener('pause', () => updateFilmControl(false));
  film.addEventListener('playing', () => { hero.classList.add('film-playing'); updateFilmControl(true); });
  film.addEventListener('error', () => { hero.classList.remove('film-playing'); updateFilmControl(false); });
  if (!reducedMotion.matches && !(navigator.connection && navigator.connection.saveData)) playFilm();
  if ('IntersectionObserver' in window) {
    const filmObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) pauseFilm();
    }, { threshold: 0.05 });
    filmObserver.observe(hero);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseFilm(); });

  document.querySelectorAll('[data-open-video]').forEach((button) => {
    button.addEventListener('click', () => {
      pauseFilm();
      videoDialog.showModal();
      syncDialogLock();
      showroomVideo.muted = true;
      const playback = showroomVideo.play();
      if (playback) playback.catch(() => {});
    });
  });
  document.querySelector('.video-close').addEventListener('click', () => videoDialog.close());
  videoDialog.addEventListener('close', () => {
    showroomVideo.pause();
    if (showroomVideo.readyState > 0) showroomVideo.currentTime = 0;
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
    const message = `Olá, 4TECH! Quero conversar sobre a integração de tecnologia para ${type}. O projeto está na fase de ${stage}. Podemos falar sobre as possibilidades?`;
    const url = new URL('https://wa.me/5563999393959');
    url.searchParams.set('text', message);
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  });
})();
