/* 4TECH Control Lab: ambiente em destaque, minimapa e efeitos. Luz e clima simulados; playlist real no navegador. */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const panel = byId('home-control');
  if (!panel) return;
  const stage = byId('lab-stage');
  const stageRoom = byId('stage-room');
  const toast = byId('scene-toast');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
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
    imersao: { light: 10, temperature: 21, climate: true, volume: 55, play: true, mode: 'FILME' }
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
  const roomButtons = Array.from(document.querySelectorAll('[data-room-select]'));
  const glows = Array.from(document.querySelectorAll('[data-glow]'));
  const announce = message => { byId('lab-status').textContent = message; };
  const track = (name, props) => { if (window.fourtechTrack) window.fourtechTrack(name, props); };
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
    byId('light-state').textContent = state.light > 0 ? 'Acesa' : 'Apagada';
    byId('climate-state').textContent = state.climate ? 'Ligado' : 'Desligado';
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
    playButton.setAttribute('aria-label', playing || loading ? 'Pausar música' : 'Tocar música');
    playButton.setAttribute('aria-busy', String(loading));
    byId('audio-play-icon').querySelector('use').setAttribute('href', playing || loading ? '#i-pause' : '#i-play');
    panel.querySelector('.audio-widget').classList.toggle('is-muted', !playing);
    byId('telemetry-light').textContent = `${state.light}%`;
    byId('telemetry-temperature').textContent = state.climate ? `${state.temperature}°C` : '—';
    byId('telemetry-audio').textContent = playing ? state.volume === 0 ? 'Mudo' : 'Tocando' : 'Pausado';
    byId('mode-label').textContent = `${room.name.toUpperCase()} / ${state.mode}`;
    stageRoom.textContent = room.name;
    stage.dataset.room = selectedRoom;
    stage.style.setProperty('--light', String(state.light / 100));
    stage.style.setProperty('--cool', String(Math.max(0, Math.min(1, (28 - state.temperature) / 10))));
    stage.style.setProperty('--vol', String(state.volume / 100));
    stage.dataset.climate = state.climate ? 'on' : 'off';
    stage.dataset.audio = playing ? 'on' : 'off';
    roomButtons.forEach(button => {
      const key = button.dataset.roomSelect;
      button.setAttribute('aria-pressed', String(key === selectedRoom));
      button.classList.toggle('has-light', states[key].light > 0);
      button.classList.toggle('has-climate', states[key].climate);
      button.classList.toggle('has-audio', isPlaying(key));
    });
    glows.forEach(glow => { glow.style.opacity = String(states[glow.dataset.glow].light / 100); });
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
    render(`Carregando ${playlist[current().track].title}…`);
    try {
      await media.play();
      if (request !== playRequest || key !== selectedRoom) return;
      loading = false;
      states[key].audio = true;
      render(`Tocando ${playlist[current().track].title} em ${rooms[key].name}.`);
      track('lab_audio_play', { room: key, track: playlist[current().track].title });
    } catch (error) {
      if (request !== playRequest || key !== selectedRoom) return;
      loading = false;
      states[key].audio = false;
      const message = error.name === 'NotAllowedError' ? 'O navegador bloqueou o som. Toque no play para liberar.' : 'Esta faixa não carregou. Tente outra.';
      render(message);
    }
  }
  function toggleAudio() {
    current().mode = 'PERSONALIZADO';
    if (isPlaying(selectedRoom) || loading) pauseAudio(`Música pausada em ${rooms[selectedRoom].name}.`);
    else startAudio();
  }
  let wallpaperSequence = 0;
  function transitionWallpaper(src) {
    const host = byId('stage-photos');
    const sequence = ++wallpaperSequence;
    const incoming = document.createElement('img');
    incoming.className = 'stage-photo';
    incoming.alt = '';
    incoming.decoding = 'async';
    const swap = () => {
      if (sequence !== wallpaperSequence) { incoming.remove(); return; }
      const old = Array.from(host.querySelectorAll('.stage-photo')).filter(image => image !== incoming);
      if (reduced.matches) { old.forEach(image => image.remove()); incoming.id = 'room-wallpaper'; return; }
      incoming.classList.add('is-entering');
      incoming.addEventListener('animationend', () => {
        incoming.classList.remove('is-entering');
        if (sequence === wallpaperSequence) old.forEach(image => image.remove());
      }, { once: true });
      old.forEach(image => image.removeAttribute('id'));
      incoming.id = 'room-wallpaper';
    };
    incoming.onload = swap;
    incoming.onerror = () => incoming.remove();
    incoming.src = src;
    host.appendChild(incoming);
    if (!reduced.matches) {
      stageRoom.classList.remove('is-changing');
      void stageRoom.offsetWidth;
      stageRoom.classList.add('is-changing');
    }
  }
  function showToast(text) {
    if (!toast || reduced.matches) return;
    toast.textContent = text;
    toast.classList.remove('is-visible');
    void toast.offsetWidth;
    toast.classList.add('is-visible');
  }
  let burstTimer = 0;
  function lightBurst() {
    if (reduced.matches) return;
    stage.classList.remove('light-burst');
    void stage.offsetWidth;
    stage.classList.add('light-burst');
    clearTimeout(burstTimer);
    burstTimer = setTimeout(() => stage.classList.remove('light-burst'), 950);
  }
  function selectRoom(key, announceChange = true) {
    if (!rooms[key]) return;
    if (key !== selectedRoom) {
      pauseAudio();
      selectedRoom = key;
      transitionWallpaper(rooms[key].image);
      loadTrack();
    }
    render(announceChange ? `${rooms[key].name}: ajuste a luz, o ar e o som.` : undefined);
    track('lab_room_select', { room: key });
  }
  function toggleLight(key = selectedRoom) {
    const state = states[key];
    if (state.light > 0) { state.lastLight = state.light; state.light = 0; }
    else { state.light = state.lastLight || rooms[key].light; lightBurst(); }
    state.mode = 'PERSONALIZADO';
    render(`Luz ${state.light > 0 ? 'acesa' : 'apagada'} em ${rooms[key].name}.`);
    track('lab_light_toggle', { room: key, on: state.light > 0 });
  }
  function toggleClimate(key = selectedRoom) {
    states[key].climate = !states[key].climate;
    states[key].mode = 'PERSONALIZADO';
    render(`Ar ${states[key].climate ? 'ligado' : 'desligado'} em ${rooms[key].name}.`);
    track('lab_climate_toggle', { room: key, on: states[key].climate });
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

  roomButtons.forEach(button => button.addEventListener('click', () => selectRoom(button.dataset.roomSelect)));
  let lightTrackTimer = 0;
  lightRange.addEventListener('input', () => {
    const before = current().light;
    current().light = Number(lightRange.value);
    if (before === 0 && current().light > 0) lightBurst();
    clearTimeout(lightTrackTimer);
    lightTrackTimer = setTimeout(() => track('lab_light_change', { room: selectedRoom, level: current().light }), 800);
    if (current().light > 0) current().lastLight = current().light;
    current().mode = 'PERSONALIZADO';
    render(`Luz em ${current().light}%.`);
  });
  byId('light-toggle').addEventListener('click', () => toggleLight());
  byId('climate-toggle').addEventListener('click', () => toggleClimate());
  function setTemperature(value) {
    if (!current().climate) return;
    current().temperature = Math.min(28, Math.max(18, value));
    current().mode = 'PERSONALIZADO';
    render(`Ar em ${current().temperature}°C.`);
  }
  temperatureRange.addEventListener('input', () => setTemperature(Number(temperatureRange.value)));
  byId('temperature-down').addEventListener('click', () => setTemperature(current().temperature - 1));
  byId('temperature-up').addEventListener('click', () => setTemperature(current().temperature + 1));
  playButton.addEventListener('click', toggleAudio);
  volumeRange.addEventListener('input', () => {
    current().volume = Number(volumeRange.value);
    applyVolume();
    render(`Volume em ${current().volume}%.`);
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
        state.mode = 'APAGAR TUDO';
      });
      render('Luz apagada nos quatro ambientes. O ar e a música continuam como estavam.');
      showToast('Apagar tudo');
      track('lab_scene', { scene: 'apagar', room: selectedRoom });
      return;
    }
    const preset = presets[button.dataset.preset];
    if (current().light === 0 && preset.light > 0) lightBurst();
    Object.assign(current(), { light: preset.light, lastLight: preset.light, temperature: preset.temperature, climate: preset.climate, volume: preset.volume, mode: preset.mode });
    applyVolume();
    if (preset.play) startAudio();
    else pauseAudio();
    const label = button.querySelector('span').textContent.trim();
    render(`Cena ${label} em ${rooms[selectedRoom].name}.`);
    showToast(`Cena ${label}`);
    track('lab_scene', { scene: button.dataset.preset, room: selectedRoom });
  }));
  byId('lab-reset').addEventListener('click', () => {
    pauseAudio();
    states = defaults();
    loadedTrack = '';
    loadTrack();
    render('Tudo voltou ao estado inicial. A música está pausada.');
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
    render('Esta faixa não carregou. Tente outra.');
  });
  loadTrack();
  render('Escolha um ambiente no mapa e toque numa cena.');
})();
