/* 4TECH — métricas do site (PostHog).
   Projeto PostHog da 4TECH (servidor dos EUA). Sem chave, nada é carregado. */
(() => {
  'use strict';
  const POSTHOG_KEY = 'phc_mtJPR3NMoYcGWjPoYztU93epRi3T8KrWzTs5WBPMwRk7';
  const POSTHOG_HOST = 'https://us.i.posthog.com';

  const queue = [];
  window.fourtechTrack = (name, props) => {
    if (window.posthog && window.posthog.__loaded) window.posthog.capture(name, props || {});
    else queue.push([name, props || {}]);
  };
  if (!POSTHOG_KEY) return;

  /* Snippet oficial do PostHog (carrega a biblioteca de forma assíncrona). */
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog && window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}p||((p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",p.onerror=function(){p=null},(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r));var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],Object.defineProperty(u,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e}}),Object.defineProperty(u.people,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(){return u.toString(1)+".people (stub)"}}),o="Eh Rh Ph Oh Dh qh init yd bd dd fd Sd wc md xd ad Ed Ad Rd Pd Od Fd capture getExtension gr pd gd calculateEventProperties Dd register register_once register_for_session unregister unregister_for_session zd hd jd getFeatureFlag getFeatureFlagPayload getFeatureFlagResult getAllFeatureFlags isFeatureEnabled reloadFeatureFlags updateFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys onActiveMatchingSurveysChanged renderSurvey displaySurvey cancelPendingSurvey canRenderSurvey canRenderSurveyAsync Hd identify setPersonProperties unsetPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset Ud shutdown setIdentity clearIdentity get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException addExceptionStep captureLog startExceptionAutocapture stopExceptionAutocapture loadToolbar get_property getSessionProperty qd Td createPersonProfile setInternalOrTestUser Bd Uh zh opt_in_capturing opt_out_capturing Hh has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing $d debug kc Ds getPageViewId captureTraceFeedback captureTraceMetric rd".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  window.posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    defaults: '2026-05-30',
    person_profiles: 'identified_only',
    loaded: (posthog) => {
      posthog.__loaded = true;
      queue.splice(0).forEach(([name, props]) => posthog.capture(name, props));
    }
  });

  /* Cliques que viram contato */
  const where = (el) => { const section = el.closest('section, header, footer'); return section ? (section.id || section.className.split(' ')[0]) : ''; };
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (href.startsWith('https://wa.me')) window.fourtechTrack('whatsapp_click', { where: where(link), label: link.textContent.trim() });
    else if (href.startsWith('tel:')) window.fourtechTrack('phone_click', { where: where(link) });
    else if (href.includes('instagram.com')) window.fourtechTrack('instagram_click', { where: where(link) });
    else if (href.includes('share.google') || href.includes('maps')) window.fourtechTrack('route_click', { where: where(link) });
    else if (href.startsWith('#')) window.fourtechTrack('nav_click', { to: href.slice(1), where: where(link) });
  }, true);

  /* Até onde a pessoa rolou: cada seção vista conta uma vez */
  if ('IntersectionObserver' in window) {
    const seen = new Set();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || seen.has(entry.target.id)) return;
        seen.add(entry.target.id);
        window.fourtechTrack('section_view', { section: entry.target.id });
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.25 });
    document.querySelectorAll('main section[id]').forEach((section) => observer.observe(section));
  }
})();
