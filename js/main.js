(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const I18N = window.WASB_I18N, PROJECTS = window.WASB_PROJECTS, SITES = window.WASB_SITES, TAGS = window.WASB_TAGS, CONTACT = window.WASB_CONTACT;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const arrow = '<svg aria-hidden="true"><use href="#i-arrow"/></svg>';
  const pad = n => String(n).padStart(2, '0');

  let lang = 'ar';
  try { lang = localStorage.getItem('wasb-lang') || 'ar'; } catch (e) {}
  const t = key => (I18N[lang] && I18N[lang][key]) || I18N.ar[key] || key;
  const L = obj => (obj && (obj[lang] || obj.ar)) || '';

  /* ---------- reveal ---------- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px', threshold: .1 }) : null;
  const watch = el => { if (io) io.observe(el); else el.classList.add('in'); };

  function split(el) {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(/\s+/).map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${esc(w)}</span></span>`).join(' ');
  }

  /* ---------- language ---------- */
  function applyLang(next, first) {
    lang = next === 'en' ? 'en' : 'ar';
    try { localStorage.setItem('wasb-lang', lang); } catch (e) {}
    const html = document.documentElement;
    html.lang = lang; html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = lang === 'ar' ? 'وثب استوديو | هوية بصرية، مواقع، وبروفايلات شركات' : 'WASB Studio | Brand identity, websites and company profiles';
    $$('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
      if (el.hasAttribute('data-split')) { split(el); if (!first) el.classList.add('in'); }
    });
    const btn = $('#langToggle');
    btn.textContent = lang === 'ar' ? 'EN' : 'عربي';
    btn.setAttribute('aria-label', lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية');
    renderSlides(); renderSites(); renderContact(); syncMenuLabel();
    if (!first) { onScroll(); if (currentCase) renderCase(currentCase); }
  }

  /* ---------- works: one project per screen ---------- */
  const tagLine = p => p.tags.map(k => L(TAGS[k])).join(' / ');
  const works = $('#works'), slidesHost = $('#slides'), indexHost = $('#index');
  let slides = [], marks = [];
  const STEP = .8; // scroll per project, in viewport heights
  function renderSlides() {
    const n = PROJECTS.length;
    works.style.setProperty('--n', n);
    slidesHost.innerHTML = PROJECTS.map((p, i) => `<a class="slide" href="#/work/${p.id}"${p.focus ? ` style="--focus:${p.focus}"` : ''} aria-label="${esc(L(p.name))}: ${esc(t('plate.open'))}">
        <span class="slide__img"><img src="${p.cover}" alt="" decoding="async"${i > 1 ? ' fetchpriority="low"' : ''}></span>
        <span class="slide__cap">
          <span class="slide__count">${pad(i + 1)}/${pad(n)}</span>
          <span class="slide__name">${esc(L(p.name))}</span>
          <span class="slide__tags">${esc(tagLine(p))}</span>
        </span>
      </a>`).join('');
    slides = $$('.slide', slidesHost);
    indexHost.setAttribute('aria-label', t('index.label'));
    indexHost.innerHTML = PROJECTS.map((p, i) => `<li><button type="button" data-i="${i}">${esc(L(p.name))}</button></li>`).join('');
    marks = $$('button', indexHost);
    runSlides();
  }
  function runSlides() {
    if (reduce.matches || !slides.length) return;
    const vh = window.innerHeight;
    const P = clamp((window.scrollY - works.offsetTop) / (vh * STEP), 0, slides.length - 1);
    const cur = Math.round(P);
    marks.forEach((m, i) => { m.classList.toggle('is-on', i === cur); if (i === cur) m.setAttribute('aria-current', 'true'); else m.removeAttribute('aria-current'); });
    slides.forEach((s, i) => {
      const k = i === 0 ? 1 : clamp(P - (i - 1));
      s.style.clipPath = k >= 1 ? 'none' : `inset(${(1 - k) * 100}% 0 0 0)`;
      s.style.visibility = k <= 0 || P >= i + 1 ? 'hidden' : 'visible';
      const img = s.firstElementChild.firstElementChild;
      const drift = i === 0 ? clamp(P) : k - 1 + clamp(P - i);
      img.style.transform = `translate3d(0, ${-6 + drift * -5}%, 0)`;
    });
  }

  indexHost.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const y = works.offsetTop + Number(b.dataset.i) * window.innerHeight * STEP + 2;
    window.scrollTo({ top: y, behavior: reduce.matches ? 'auto' : 'smooth' });
  });

  function renderSites() {
    const host = $('#sites');
    const seen = host.childElementCount > 0;
    host.innerHTML = SITES.map((s, i) => `<a class="site${s.tall ? ' is-tall' : ''}${seen ? ' in' : ''}" style="--i:${i}" href="${s.url}" target="_blank" rel="noopener" aria-label="${esc(s.label)}: ${esc(t('case.visit'))}">
      <div class="site__frame">
        <div class="site__bar"><i></i><i></i><i></i><span>${esc(s.label)}</span></div>
        <div class="site__view"><img src="${s.src}" alt="${esc(s.label)}" loading="lazy"></div>
      </div>
      <div class="site__cap"><span>${esc(s.label)}</span>${arrow}</div>
    </a>`).join('');
    if (!seen) $$('.site', host).forEach(watch);
  }

  function renderContact() {
    const host = $('#contactLinks');
    const c = CONTACT || {};
    const links = [];
    if (c.whatsapp) links.push(['contact.whatsapp', 'https://wa.me/' + String(c.whatsapp).replace(/\D/g, '')]);
    if (c.email) links.push(['contact.email', 'mailto:' + c.email]);
    ['instagram', 'behance', 'linkedin', 'x'].forEach(k => { if (c[k]) links.push(['contact.' + k, c[k]]); });
    host.innerHTML = links.length
      ? links.map(([k, href]) => `<a class="link" href="${esc(href)}" target="_blank" rel="noopener"><span>${esc(t(k))}</span>${arrow}</a>`).join('')
      : `<p class="contact__empty">${esc(t('contact.empty'))}</p>`;
  }

  /* ---------- menu ---------- */
  const burger = $('#burger'), menu = $('#menu');
  const menuOpen = () => burger.getAttribute('aria-expanded') === 'true';
  function syncMenuLabel() { burger.lastElementChild.textContent = t(menuOpen() ? 'nav.close' : 'nav.menu'); }
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open);
    syncMenuLabel();
    document.body.classList.toggle('is-locked', open || !!currentCase);
    if (open) { menu.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open'))); }
    else { menu.classList.remove('is-open'); setTimeout(() => { if (!menuOpen()) menu.hidden = true; }, reduce.matches ? 0 : 700); }
  }
  burger.addEventListener('click', () => setMenu(!menuOpen()));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });

  /* ---------- hero drift ---------- */
  const slab = $('.hero__slab'), word = $('.hero__word');
  function runHero() {
    if (reduce.matches) return;
    const y = window.scrollY, vh = window.innerHeight;
    if (y > vh * 1.2) return;
    slab.style.transform = `translate3d(0, ${y * .22}px, 0)`;
    word.style.transform = `translate3d(0, ${y * -.08}px, 0)`;
  }

  /* ---------- approach arc ---------- */
  const arc = $('#arc'), steps = $$('.arc__step');
  function runArc() {
    const r = arc.getBoundingClientRect(), vh = window.innerHeight;
    const p = clamp((vh * .9 - r.top) / (r.height * .9));
    arc.style.setProperty('--p', p.toFixed(3));
    steps.forEach(s => s.classList.toggle('is-on', p + .02 >= parseFloat(s.style.getPropertyValue('--t'))));
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { runHero(); runSlides(); runArc(); ticking = false; });
  }

  /* ---------- case study ---------- */
  const caseEl = $('#case'), caseBody = $('#caseBody'), caseScroll = $('#caseScroll'), caseCrumb = $('#caseCrumb');
  let currentCase = null, lastFocus = null;

  function block(b, p) {
    const title = b.title ? `<h2 class="blk__title wrap"><span>${esc(L(b.title))}</span>${b.type === 'strip' ? `<span class="blk__hint">${esc(t('case.drag'))}</span>` : ''}</h2>` : '';
    const alt = esc(L(p.name));
    if (b.type === 'full') return `<section class="blk blk--full">${title}<div class="wrap"><img src="${b.src}" alt="${alt}" loading="lazy"></div></section>`;
    if (b.type === 'grid') return `<section class="blk blk--grid${b.fit === 'contain' ? ' is-contain' : ''}" style="--cols:${b.cols || 2}">${title}<div class="wrap"><div class="blk__items">${b.items.map(s => `<img src="${s}" alt="${alt}" loading="lazy">`).join('')}</div></div></section>`;
    if (b.type === 'strip') return `<section class="blk blk--strip">${title}<div class="blk__rail" tabindex="0">${b.items.map(s => `<img src="${s}" alt="${alt}" loading="lazy" draggable="false">`).join('')}</div></section>`;
    if (b.type === 'browser') return `<section class="blk blk--browser">${title}<div class="wrap"><div class="browser"><div class="browser__bar"><i></i><i></i><i></i><span>${esc(b.label || '')}</span>${b.url ? `<a href="${b.url}" target="_blank" rel="noopener">${esc(t('case.visit'))}${arrow}</a>` : ''}</div><div class="browser__view" tabindex="0"><img src="${b.src}" alt="${alt}" loading="lazy"></div></div></div></section>`;
    return '';
  }

  function renderCase(id) {
    const idx = PROJECTS.findIndex(p => p.id === id);
    if (idx < 0) return false;
    const p = PROJECTS[idx], next = PROJECTS[(idx + 1) % PROJECTS.length];
    caseCrumb.textContent = `${pad(idx + 1)}/${pad(PROJECTS.length)}`;
    caseBody.innerHTML = `
      <header class="case__head">
        <div class="wrap">
          <div><h1 class="case__title" id="caseTitle">${esc(L(p.name))}</h1><p class="case__line">${esc(L(p.line))}</p></div>
          <div class="case__scope"><h2>${esc(t('case.scope'))}</h2><ul>${p.tags.map(k => `<li>${esc(L(TAGS[k]))}</li>`).join('')}</ul></div>
        </div>
      </header>
      <div class="case__blocks">${p.blocks.map(b => block(b, p)).join('')}</div>
      <a class="case__next" href="#/work/${next.id}"><span class="wrap" style="display:block"><small>${esc(t('case.next'))}</small><strong>${esc(L(next.name))}${arrow}</strong></span></a>`;
    $$('.blk__rail', caseBody).forEach(dragRail);
    return true;
  }

  function dragRail(rail) {
    let down = false, sx = 0, sl = 0;
    rail.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = rail.scrollLeft; rail.classList.add('is-drag'); rail.setPointerCapture(e.pointerId); });
    rail.addEventListener('pointermove', e => { if (down) rail.scrollLeft = sl - (e.clientX - sx); });
    const up = () => { down = false; rail.classList.remove('is-drag'); };
    rail.addEventListener('pointerup', up); rail.addEventListener('pointercancel', up);
  }

  function openCase(id) {
    if (!renderCase(id)) return;
    const wasOpen = !!currentCase;
    currentCase = id;
    caseScroll.scrollTop = 0;
    if (wasOpen) return;
    lastFocus = document.activeElement;
    caseEl.hidden = false;
    document.body.classList.add('is-locked');
    requestAnimationFrame(() => requestAnimationFrame(() => { caseEl.classList.add('is-open'); $('#caseClose').focus({ preventScroll: true }); }));
  }
  function closeCase() {
    if (!currentCase) return;
    currentCase = null;
    caseEl.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    setTimeout(() => { if (!currentCase) { caseEl.hidden = true; caseBody.innerHTML = ''; } }, reduce.matches ? 0 : 800);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function route() {
    const m = location.hash.match(/^#\/work\/([\w-]+)/);
    if (m) openCase(m[1]); else closeCase();
  }
  $('#caseClose').addEventListener('click', () => { history.pushState('', document.title, location.pathname + location.search); closeCase(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menuOpen()) { setMenu(false); burger.focus(); return; }
    if (!currentCase) return;
    if (e.key === 'Escape') { $('#caseClose').click(); }
    if (e.key === 'Tab') {
      const f = $$('a[href], button, [tabindex="0"]', caseEl).filter(el => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.addEventListener('hashchange', route);

  /* ---------- boot ---------- */
  $('#langToggle').addEventListener('click', () => applyLang(lang === 'ar' ? 'en' : 'ar'));
  $$('.year').forEach(el => { el.textContent = new Date().getFullYear(); });
  applyLang(lang, true);
  $$('[data-split]').forEach(watch);

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', onScroll);
  if (reduce.addEventListener) reduce.addEventListener('change', onScroll);
  onScroll();
  route();
})();
