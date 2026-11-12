(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const I18N = window.WASB_I18N, PROJECTS = window.WASB_PROJECTS, SITES = window.WASB_SITES, TAGS = window.WASB_TAGS, CONTACT = window.WASB_CONTACT;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const arrow = '<svg aria-hidden="true"><use href="#i-arrow"/></svg>';

  let lang = 'ar';
  try { lang = localStorage.getItem('wasb-lang') || 'ar'; } catch (e) {}
  const t = key => (I18N[lang] && I18N[lang][key]) || I18N.ar[key] || key;
  const L = obj => (obj && (obj[lang] || obj.ar)) || '';

  /* ---------- reveal ---------- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px', threshold: .12 }) : null;
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
    renderPlates(); renderSites(); renderContact();
    if (!first) { measureGate(); onScroll(); if (currentCase) renderCase(currentCase); }
  }

  /* ---------- plates ---------- */
  function tagLine(p) { return p.tags.map(k => L(TAGS[k])).join(' · '); }
  function renderPlates() {
    const host = $('#plates');
    const seen = host.childElementCount > 0;
    host.innerHTML = PROJECTS.map(p => {
      const pl = p.plate || {};
      return `<a class="plate plate--${p.shape} plate--${p.id}${seen ? ' in' : ''}" href="#/work/${p.id}" style="--span:${p.span};--ground:${p.ground}" aria-label="${esc(L(p.name))}: ${esc(t('plate.open'))}">
        <div class="plate__stage">
          <span class="plate__frame">
            ${pl.art ? `<span class="plate__art" style="background-image:url(${pl.art});opacity:${pl.artOpacity || 1}"></span>` : ''}
            ${pl.logo && !pl.logoHide ? `<img class="plate__logo" src="${pl.logo}" alt="" loading="lazy">` : ''}
          </span>
          ${pl.fig ? `<img class="plate__fig ${pl.figClass || ''}" src="${pl.fig}" alt="" loading="lazy">` : ''}
        </div>
        <div class="plate__cap">
          <h3 class="plate__name">${esc(L(p.name))}</h3>
          <p class="plate__tags">${esc(tagLine(p))}</p>
          <span class="plate__go">${arrow}</span>
        </div>
      </a>`;
    }).join('');
    if (!seen) $$('.plate', host).forEach(watch);
  }

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
      ? links.map(([k, href]) => `<a class="btn btn--paper" href="${esc(href)}" target="_blank" rel="noopener">${esc(t(k))}${arrow}</a>`).join('')
      : `<p class="contact__empty">${esc(t('contact.empty'))}</p>`;
  }

  /* ---------- nav tone ---------- */
  const nav = $('.nav');
  const sections = $$('main > section');
  let gateProgress = 0;
  function navTone() {
    const y = 36;
    let tone = 'paper', here = '';
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (r.top <= y && r.bottom > y) { tone = s.dataset.tone || 'paper'; here = s.id; break; }
    }
    if (here === 'hero' && gateProgress > .62) tone = 'ink';
    if (nav.dataset.tone !== tone) nav.dataset.tone = tone;
    $$('.nav__links a').forEach(a => a.classList.toggle('is-here', a.getAttribute('href') === '#' + here));
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = tone === 'ink' ? '#111111' : tone === 'red' ? '#C43B2B' : '#F5F3EF';
  }

  /* ---------- the gate ---------- */
  const hero = $('#hero'), pin = $('.hero__pin'), gate = $('#gate'), gateSym = $('#gateSymbol'), heroSym = $('#heroSymbol'), gateLine = $('.gate__line');
  let G = null;
  function measureGate() {
    if (reduce.matches) { G = null; return; }
    const pr = pin.getBoundingClientRect(), r = heroSym.getBoundingClientRect();
    if (!r.width) { G = null; return; }
    const x = r.left - pr.left, y = r.top - pr.top;
    // inner window of the mark, in viewBox fractions (152 52 263 358)
    const l = x + r.width * .053, rt = x + r.width * .9363, tp = y + r.height * .0439, bt = y + r.height * .9613;
    G = { W: pr.width, H: pr.height, x, y, w: r.width, h: r.height, l, r: pr.width - rt, t: tp, b: pr.height - bt, rad: (rt - l) / 2 };
    gateSym.style.width = r.width + 'px'; gateSym.style.height = r.height + 'px';
    gateSym.style.left = x + 'px'; gateSym.style.top = y + 'px';
  }
  function runGate() {
    if (!G) { gateProgress = 0; return; }
    const total = hero.offsetHeight - window.innerHeight;
    const p = clamp((window.scrollY - hero.offsetTop) / Math.max(1, total));
    gateProgress = p;
    const on = clamp(p / .05);
    const e = easeInOut(clamp((p - .03) / .62));
    const k = 1 - e;
    gate.style.opacity = on;
    gate.style.clipPath = `inset(${G.t * k}px ${G.r * k}px ${G.b * k}px ${G.l * k}px round ${G.rad * k}px ${G.rad * k}px 0 0)`;
    const q = clamp((p - .3) / .5), leap = q * q * q;
    gateSym.style.opacity = on;
    gateSym.style.transform = `translate3d(0, ${-leap * (G.y + G.h + 60)}px, 0) scale(${1 + .12 * q})`;
    const s = clamp((p - .5) / .26);
    gateLine.style.opacity = s;
    gateLine.style.transform = `translate3d(0, ${(1 - easeInOut(s)) * 60}px, 0)`;
  }

  /* ---------- approach arc ---------- */
  const arc = $('#arc'), steps = $$('.arc__step');
  function runArc() {
    const r = arc.getBoundingClientRect(), vh = window.innerHeight;
    const p = clamp((vh * .82 - r.top) / (r.height + vh * .2));
    arc.style.setProperty('--p', p.toFixed(3));
    steps.forEach(s => s.classList.toggle('is-on', p + .02 >= parseFloat(s.style.getPropertyValue('--t'))));
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { runGate(); runArc(); navTone(); ticking = false; });
  }

  /* ---------- services ---------- */
  const svcItems = $$('.svc__item'), svcImgs = $$('.window__img');
  function setSvc(i) {
    svcItems.forEach((el, n) => el.classList.toggle('is-active', n === i));
    svcImgs.forEach((img, n) => {
      const was = img.classList.contains('is-on');
      img.classList.toggle('was-on', was && n !== i);
      img.classList.toggle('is-on', n === i);
      if (was && n !== i) setTimeout(() => img.classList.remove('was-on'), 950);
    });
  }
  svcItems.forEach((el, i) => {
    el.addEventListener('mouseenter', () => setSvc(i));
    el.addEventListener('focus', () => setSvc(i));
    el.addEventListener('click', () => setSvc(i));
  });

  /* ---------- case study ---------- */
  const caseEl = $('#case'), caseBody = $('#caseBody'), caseScroll = $('#caseScroll'), caseCrumb = $('#caseCrumb');
  let currentCase = null, lastFocus = null;

  function block(b, p) {
    const title = b.title ? `<h2 class="blk__title wrap"><span>${esc(L(b.title))}</span>${b.type === 'strip' ? `<span class="blk__hint">${esc(t('case.drag'))}</span>` : ''}</h2>` : '';
    const alt = esc(L(p.name));
    if (b.type === 'full') return `<section class="blk blk--full">${title}<div class="wrap"><img src="${b.src}" alt="${alt}" loading="lazy"></div></section>`;
    if (b.type === 'grid') return `<section class="blk blk--grid${b.fit === 'contain' ? ' is-contain' : ''}" style="--cols:${b.cols || 2}">${title}<div class="wrap"><div class="blk__items">${b.items.map(s => `<img src="${s}" alt="${alt}" loading="lazy">`).join('')}</div></div></section>`;
    if (b.type === 'strip') return `<section class="blk blk--strip">${title}<div class="blk__rail" tabindex="0">${b.items.map(s => `<img src="${s}" alt="${alt}" loading="lazy" draggable="false">`).join('')}</div></section>`;
    if (b.type === 'stage') return `<section class="blk blk--stage"><div class="wrap"><div class="blk__stage" style="--ground:${p.ground}">${b.art ? `<span class="blk__art" style="background-image:url(${b.art})"></span>` : ''}${b.items.map(it => `<img src="${it.src}" alt="${alt}" style="--w:${it.w}%" loading="lazy">`).join('')}</div></div></section>`;
    if (b.type === 'browser') return `<section class="blk blk--browser">${title}<div class="wrap"><div class="browser"><div class="browser__bar"><i></i><i></i><i></i><span>${esc(b.label || '')}</span>${b.url ? `<a href="${b.url}" target="_blank" rel="noopener">${esc(t('case.visit'))}${arrow}</a>` : ''}</div><div class="browser__view" tabindex="0"><img src="${b.src}" alt="${alt}" loading="lazy"></div></div></div></section>`;
    return '';
  }

  function renderCase(id) {
    const idx = PROJECTS.findIndex(p => p.id === id);
    if (idx < 0) return false;
    const p = PROJECTS[idx], next = PROJECTS[(idx + 1) % PROJECTS.length];
    caseCrumb.textContent = L(p.name);
    caseBody.innerHTML = `
      <header class="case__head" style="--ground:${p.ground};--on:${p.ink}">
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
    let down = false, sx = 0, sl = 0, moved = 0;
    rail.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = rail.scrollLeft; moved = 0; rail.classList.add('is-drag'); rail.setPointerCapture(e.pointerId); });
    rail.addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; moved = Math.abs(dx); rail.scrollLeft = sl - dx; });
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
    setTimeout(() => { if (!currentCase) { caseEl.hidden = true; caseBody.innerHTML = ''; } }, reduce.matches ? 0 : 900);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function route() {
    const m = location.hash.match(/^#\/work\/([\w-]+)/);
    if (m) openCase(m[1]); else closeCase();
  }
  $('#caseClose').addEventListener('click', () => { history.pushState('', document.title, location.pathname + location.search); closeCase(); });
  document.addEventListener('keydown', e => {
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
  $('#year').textContent = new Date().getFullYear();
  applyLang(lang, true);
  $$('[data-split]').forEach(el => { if (el.closest('.hero')) requestAnimationFrame(() => el.classList.add('in')); else watch(el); });

  const settle = () => { measureGate(); onScroll(); };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', settle);
  window.addEventListener('load', settle);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(settle);
  reduce.addEventListener && reduce.addEventListener('change', settle);
  settle();
  route();
})();
