/* 4TECH: planta V6 restaurada; luz e clima simulados; playlist real reproduzida localmente no navegador. */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const panel = byId('home-control');
  if (!panel) return;
  const roomSelect = byId('room-select');
  const lightRange = byId('light-range');
  const temperatureRange = byId('temperature-range');
  const volumeRange = byId('volume-range');
  const progress = byId('track-progress');
  const media = byId('ambient-player');
  const trackSelect = byId('track-select');
  const playButton = byId('audio-toggle');
  const rooms = {
    estar: { name: 'Estar', image: 'img/cena-sala.webp', light: 70, temperature: 23, volume: 35 },
    cinema: { name: 'Cinema', image: 'img/cena-cinema.webp', light: 20, temperature: 22, volume: 45 },
    trabalho: { name: 'Trabalho', image: 'img/reuniao.webp', light: 90, temperature: 23, volume: 25 },
    jantar: { name: 'Jantar', image: 'img/cena-jantar.webp', light: 55, temperature: 22, volume: 30 }
  };
  const playlist = [
    { title: 'Lobby Time', src: 'audio/lobby-time.mp3', duration: 193 },
    { title: 'Dream Culture', src: 'audio/dream-culture.mp3', duration: 214 },
    { title: 'Easy Lemon', src: 'audio/easy-lemon.mp3', duration: 126 }
  ];
  const presets = {
    foco: { light: 90, temperature: 23, climate: true, volume: 25, play: false, mode: 'FOCO' },
    receber: { light: 55, temperature: 22, climate: true, volume: 40, play: true, mode: 'RECEBER' },
    imersao: { light: 10, temperature: 21, climate: true, volume: 55, play: true, mode: 'IMERSÃO' }
  };
  const defaults = () => Object.fromEntries(Object.entries(rooms).map(([key, room]) => [key, { light: room.light, temperature: room.temperature, volume: room.volume, lastLight: room.light, climate: true, audio: false, track: 0, position: 0, mode: 'PERSONALIZADO' }]));
  let states = defaults();
  let selectedRoom = 'estar';
  let mediaRoom = 'estar';
  let loadedTrack = '';
  let seekOnLoad = 0;
  let playRequest = 0;
  let loading = false;
  let volumeSupported = true;
  const current = () => states[selectedRoom];
  const presetButtons = Array.from(panel.querySelectorAll('[data-preset]'));
  const categories = Array.from(panel.querySelectorAll('.home-categories [data-category]'));
  const widgets = Array.from(panel.querySelectorAll('[data-widget]'));
  const roomButtons = Array.from(document.querySelectorAll('[data-room-select]'));
  const deviceButtons = Array.from(document.querySelectorAll('.plan-device'));
  const glows = Array.from(document.querySelectorAll('[data-glow]'));
  const shades = Array.from(document.querySelectorAll('[data-shade]'));
  const announce = message => { byId('lab-status').textContent = message; };
  const fillRange = input => {
    const minimum = Number(input.min), maximum = Number(input.max);
    const percent = maximum > minimum ? (Number(input.value) - minimum) / (maximum - minimum) * 100 : 0;
    input.style.setProperty('--range-fill', `${Math.max(0, Math.min(100, percent))}%`);
  };
  const clock = seconds => { const value = Math.max(0, Math.floor(Number(seconds) || 0)); return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`; };
  const isPlaying = key => mediaRoom === key && !media.paused && !media.ended && states[key].audio;

  function updateProgress() {
    const state = current();
    const duration = mediaRoom === selectedRoom && Number.isFinite(media.duration) ? media.duration : playlist[state.track].duration;
    const elapsed = mediaRoom === selectedRoom && media.readyState > 0 ? media.currentTime : state.position;
    progress.max = '100';
    progress.value = String(duration > 0 ? Math.min(100, elapsed / duration * 100) : 0);
    progress.setAttribute('aria-valuetext', `${clock(elapsed)} de ${clock(duration)}`);
    progress.disabled = media.readyState < 1 || mediaRoom !== selectedRoom;
    byId('track-elapsed').textContent = clock(elapsed);
    byId('track-duration').textContent = clock(duration);
    fillRange(progress);
  }

  function render(message) {
    const state = current(), room = rooms[selectedRoom], playing = isPlaying(selectedRoom);
    lightRange.value = String(state.light);
    temperatureRange.value = String(state.temperature);
    volumeRange.value = String(state.volume);
    byId('light-value').value = `${state.light}%`;
    byId('temperature-value').value = state.climate ? `${state.temperature}°C` : '—';
    byId('volume-value').value = `${state.volume}%`;
    byId('light-state').textContent = state.light > 0 ? 'Luzes acesas' : 'Luzes apagadas';
    byId('climate-state').textContent = state.climate ? 'Ar ligado' : 'Ar desligado';
    byId('light-toggle').setAttribute('aria-checked', String(state.light > 0));
    byId('climate-toggle').setAttribute('aria-checked', String(state.climate));
    byId('temperature-down').disabled = !state.climate || state.temperature <= 18;
    byId('temperature-up').disabled = !state.climate || state.temperature >= 28;
    temperatureRange.disabled = !state.climate;
    volumeRange.disabled = !volumeSupported;
    byId('volume-note').hidden = volumeSupported;
    trackSelect.value = String(state.track);
    byId('audio-track-title').textContent = playlist[state.track].title;
    byId('audio-session-room').textContent = `${room.name} · ${loading ? 'carregando…' : playing ? state.volume === 0 ? 'tocando · volume zero' : 'em reprodução' : 'pausado'}`;
    playButton.setAttribute('aria-pressed', String(playing));
    playButton.setAttribute('aria-label', playing || loading ? 'Pausar playlist' : 'Reproduzir playlist');
    playButton.setAttribute('aria-busy', String(loading));
    byId('audio-play-icon').querySelector('use').setAttribute('href', playing || loading ? '#i-pause' : '#i-play');
    panel.querySelector('.audio-widget').classList.toggle('is-muted', !playing);
    byId('telemetry-light').textContent = `${state.light}%`;
    byId('telemetry-temperature').textContent = state.climate ? `${state.temperature}°C` : '—';
    byId('telemetry-audio').textContent = playing ? state.volume === 0 ? 'Mudo' : 'Tocando' : 'Pausado';
    byId('mode-label').textContent = `${room.name.toUpperCase()} / ${state.mode}`;
    byId('telemetry-room-label').textContent = `AMBIENTE SELECIONADO / ${room.name.toUpperCase()}`;
    roomSelect.value = selectedRoom;
    roomButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.roomSelect === selectedRoom)));
    glows.forEach(glow => { glow.style.opacity = String(states[glow.dataset.glow].light / 100); });
    shades.forEach(shade => { shade.style.opacity = String(.24 * (1 - states[shade.dataset.shade].light / 100)); });
    deviceButtons.forEach(button => {
      const key = button.dataset.room, device = button.dataset.device;
      const enabled = device === 'light' ? states[key].light > 0 : device === 'climate' ? states[key].climate : isPlaying(key);
      button.setAttribute('aria-checked', String(enabled));
    });
    const allOff = Object.values(states).every(item => item.light === 0);
    presetButtons.forEach(button => {
      const pressed = button.dataset.preset === 'apagar' ? allOff : presets[button.dataset.preset].mode === state.mode;
      button.setAttribute('aria-pressed', String(pressed));
    });
    [lightRange, temperatureRange, volumeRange].forEach(fillRange);
    updateProgress();
    if (message) announce(message);
  }

  function savePosition() {
    if (states[mediaRoom] && Number.isFinite(media.currentTime)) states[mediaRoom].position = media.currentTime;
  }
  function pauseAudio(message) {
    savePosition();
    playRequest += 1;
    loading = false;
    media.pause();
    Object.values(states).forEach(state => { state.audio = false; });
    render(message);
  }
  function applyVolume() {
    const desired = current().volume / 100;
    try {
      media.volume = desired;
      if (Math.abs(media.volume - desired) > .01) volumeSupported = false;
    } catch (_) { volumeSupported = false; }
    volumeRange.disabled = !volumeSupported;
    byId('volume-note').hidden = volumeSupported;
  }
  function loadTrack() {
    const state = current();
    const key = `${selectedRoom}:${state.track}`;
    mediaRoom = selectedRoom;
    if (loadedTrack !== key) {
      loadedTrack = key;
      seekOnLoad = state.position;
      media.src = playlist[state.track].src;
      media.load();
    }
    applyVolume();
  }
  async function startAudio() {
    const key = selectedRoom;
    const request = ++playRequest;
    loading = true;
    loadTrack();
    render(`Preparando ${playlist[current().track].title} em ${rooms[key].name}…`);
    try {
      await media.play();
      if (request !== playRequest || key !== selectedRoom) return;
      loading = false;
      states[key].audio = true;
      render(`Tocando ${playlist[current().track].title} em ${rooms[key].name}.`);
    } catch (error) {
      if (request !== playRequest || key !== selectedRoom) return;
      loading = false;
      states[key].audio = false;
      const message = error.name === 'NotAllowedError' ? 'O navegador bloqueou o áudio. Toque em Play para autorizar a reprodução.' : 'Não foi possível reproduzir esta faixa. Confira os arquivos de áudio ou tente outra faixa.';
      render(message);
    }
  }
  function toggleAudio() {
    current().mode = 'PERSONALIZADO';
    if (isPlaying(selectedRoom) || loading) pauseAudio(`Playlist pausada em ${rooms[selectedRoom].name}.`);
    else startAudio();
  }
  function centerPlanOnRoom(key) {
    const rail = byId('mezz-map-rail'), canvas = byId('plan-canvas');
    if (!rail || !canvas) return;
    const target = canvas.clientWidth * rooms[key].focus - rail.clientWidth / 2;
    rail.scrollTo({ left: Math.max(0, Math.min(canvas.clientWidth - rail.clientWidth, target)), behavior: 'auto' });
  }
  let wallpaperSequence = 0;
  function transitionWallpaper(src) {
    const wallpaper = byId('room-wallpaper'), host = wallpaper.parentElement;
    const sequence = ++wallpaperSequence;
    wallpaper.getAnimations().forEach(animation => animation.cancel());
    host.querySelectorAll('.room-wallpaper-incoming').forEach(image => {
      image.getAnimations().forEach(animation => animation.cancel());
      image.remove();
    });
    const incoming = document.createElement('img');
    incoming.className = 'room-wallpaper-incoming';
    incoming.alt = '';
    incoming.onload = () => {
      if (sequence !== wallpaperSequence) { incoming.remove(); return; }
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !wallpaper.animate) {
        wallpaper.src = src;
        incoming.remove();
        return;
      }
      const timing = { duration: 320, easing: 'ease-in-out', fill: 'forwards' };
      const outgoing = wallpaper.animate([{ opacity: .6 }, { opacity: 0 }], timing);
      const arriving = incoming.animate([{ opacity: 0 }, { opacity: .6 }], timing);
      arriving.onfinish = () => {
        if (sequence !== wallpaperSequence) return;
        wallpaper.src = src;
        outgoing.cancel();
        arriving.cancel();
        incoming.remove();
      };
    };
    incoming.onerror = () => incoming.remove();
    incoming.src = src;
    host.appendChild(incoming);
  }
  function selectRoom(key, announceChange = true) {
    if (!rooms[key]) return;
    if (key !== selectedRoom) {
      pauseAudio();
      selectedRoom = key;
      transitionWallpaper(rooms[key].image);
      centerPlanOnRoom(key);
      loadTrack();
    }
    render(announceChange ? `${rooms[key].name} selecionado. Toque nos símbolos para controlar este ambiente.` : undefined);
  }
  function toggleLight(key = selectedRoom) {
    const state = states[key];
    if (state.light > 0) { state.lastLight = state.light; state.light = 0; }
    else state.light = state.lastLight || rooms[key].light;
    state.mode = 'PERSONALIZADO';
    render(`Luzes de ${rooms[key].name} ${state.light > 0 ? 'acesas' : 'apagadas'} na simulação.`);
  }
  function toggleClimate(key = selectedRoom) {
    states[key].climate = !states[key].climate;
    states[key].mode = 'PERSONALIZADO';
    render(`Ar de ${rooms[key].name} ${states[key].climate ? 'ligado' : 'desligado'} na simulação.`);
  }
  function chooseTrack(index) {
    if (!Number.isInteger(index) || !playlist[index]) return;
    const wasPlaying = isPlaying(selectedRoom) || loading;
    pauseAudio();
    current().track = index;
    current().position = 0;
    loadTrack();
    render(`${playlist[index].title} selecionada.`);
    if (wasPlaying) startAudio();
  }

  roomSelect.addEventListener('change', () => selectRoom(roomSelect.value));
  roomButtons.forEach(button => button.addEventListener('click', () => selectRoom(button.dataset.roomSelect)));
  deviceButtons.forEach(button => button.addEventListener('click', () => {
    selectRoom(button.dataset.room, false);
    if (button.dataset.device === 'light') toggleLight();
    else if (button.dataset.device === 'climate') toggleClimate();
    else toggleAudio();
  }));
  lightRange.addEventListener('input', () => {
    current().light = Number(lightRange.value);
    if (current().light > 0) current().lastLight = current().light;
    current().mode = 'PERSONALIZADO';
    render(`Luz de ${rooms[selectedRoom].name}: ${current().light}%.`);
  });
  byId('light-toggle').addEventListener('click', () => toggleLight());
  byId('climate-toggle').addEventListener('click', () => toggleClimate());
  function setTemperature(value) {
    if (!current().climate) return;
    current().temperature = Math.min(28, Math.max(18, value));
    current().mode = 'PERSONALIZADO';
    render(`Temperatura desejada de ${rooms[selectedRoom].name}: ${current().temperature}°C.`);
  }
  temperatureRange.addEventListener('input', () => setTemperature(Number(temperatureRange.value)));
  byId('temperature-down').addEventListener('click', () => setTemperature(current().temperature - 1));
  byId('temperature-up').addEventListener('click', () => setTemperature(current().temperature + 1));
  playButton.addEventListener('click', toggleAudio);
  volumeRange.addEventListener('input', () => {
    current().volume = Number(volumeRange.value);
    applyVolume();
    render(`Volume da playlist: ${current().volume}%.`);
  });
  trackSelect.addEventListener('change', () => chooseTrack(Number(trackSelect.value)));
  byId('track-next').addEventListener('click', () => chooseTrack((current().track + 1) % playlist.length));
  byId('track-previous').addEventListener('click', () => chooseTrack((current().track + playlist.length - 1) % playlist.length));
  progress.addEventListener('input', () => {
    if (media.readyState < 1 || mediaRoom !== selectedRoom) return;
    const duration = Number.isFinite(media.duration) ? media.duration : playlist[current().track].duration;
    const position = Math.min(100, Math.max(0, Number(progress.value))) / 100 * duration;
    media.currentTime = position;
    current().position = position;
    updateProgress();
  });
  presetButtons.forEach(button => button.addEventListener('click', () => {
    if (button.dataset.preset === 'apagar') {
      Object.values(states).forEach(state => {
        if (state.light > 0) state.lastLight = state.light;
        state.light = 0;
        state.mode = 'APAGAR TODAS';
      });
      render('Cena Apagar todas aplicada às quatro zonas do mezanino. Ar e música foram mantidos.');
      return;
    }
    const preset = presets[button.dataset.preset];
    Object.assign(current(), { light: preset.light, lastLight: preset.light, temperature: preset.temperature, climate: preset.climate, volume: preset.volume, mode: preset.mode });
    applyVolume();
    if (preset.play) startAudio();
    else pauseAudio();
    render(`Cena ${preset.mode.toLowerCase()} aplicada a ${rooms[selectedRoom].name}.`);
  }));
  categories.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.category;
    panel.dataset.category = category;
    categories.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    widgets.forEach(widget => { widget.hidden = category !== 'overview' && widget.dataset.widget !== category; });
    announce(`${button.textContent.trim()} de ${rooms[selectedRoom].name} selecionado.`);
  }));
  byId('lab-reset').addEventListener('click', () => {
    pauseAudio();
    states = defaults();
    loadedTrack = '';
    loadTrack();
    render('Padrões das quatro zonas do mezanino restaurados. A playlist está pausada.');
  });

  media.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(media.duration)) {
      media.currentTime = Math.min(seekOnLoad, Math.max(0, media.duration - .1));
      seekOnLoad = 0;
    }
    updateProgress();
  });
  media.addEventListener('timeupdate', () => { savePosition(); updateProgress(); });
  media.addEventListener('playing', () => {
    if (mediaRoom !== selectedRoom) return;
    loading = false;
    Object.entries(states).forEach(([key, state]) => { state.audio = key === mediaRoom; });
    render();
  });
  media.addEventListener('pause', () => {
    if (states[mediaRoom]) states[mediaRoom].audio = false;
    render();
  });
  media.addEventListener('ended', () => {
    current().audio = false;
    current().track = (current().track + 1) % playlist.length;
    current().position = 0;
    loadTrack();
    startAudio();
  });
  media.addEventListener('error', () => {
    loading = false;
    if (states[mediaRoom]) states[mediaRoom].audio = false;
    render('A faixa não pôde ser carregada. Confira a pasta audio ou selecione outra faixa.');
  });
  loadTrack();
  render('Explore o mezanino. A playlist só começa quando você toca em Play ou em uma cena com som.');
  centerPlanOnRoom(selectedRoom);
})();
