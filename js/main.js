(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const I18N = window.WASB_I18N, PROJECTS = window.WASB_PROJECTS, SITES = window.WASB_SITES, TAGS = window.WASB_TAGS, CONTACT = window.WASB_CONTACT;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const arrow = '<svg aria-hidden="true"><use href="#i-arrow"/></svg>';
  const pad = n => String(n).padStart(2, '0');
  const html = document.documentElement;

  // which project tags each of the three services covers
  const FILTERS = { identity: ['identity', 'logo', 'merch', 'signage'], website: ['website'], profile: ['profile'] };

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
    html.lang = lang; html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = lang === 'ar' ? 'وثب استوديو | هوية بصرية، مواقع، وبروفايلات شركات' : 'WASB Studio | Brand identity, websites and company profiles';
    $$('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
      if (el.hasAttribute('data-split')) { split(el); if (!first) el.classList.add('in'); }
    });
    $$('[data-i18n-label]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nLabel)));
    const btn = $('#langToggle');
    btn.textContent = lang === 'ar' ? 'EN' : 'عربي';
    btn.setAttribute('aria-label', lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية');
    renderRows(); renderPano(); renderContact(); syncMenuLabel(); applyFilter(filter, true);
    if (!first) { onScroll(); if (currentCase) renderCase(currentCase); }
  }

  /* ---------- intro: the red square flashes the work, then becomes the slab ---------- */
  async function runIntro() {
    if (!html.classList.contains('intro-on')) return;
    const intro = $('#intro'), box = $('#introBox'), imgs = $$('img', box), slab = $('#slab');
    let skipped = false;
    const done = () => {
      if (!html.classList.contains('intro-on')) return;
      html.classList.remove('intro-on');
      setTimeout(() => intro.remove(), 600);
      onScroll();
    };
    const skip = () => { skipped = true; done(); };
    ['wheel', 'touchstart', 'keydown', 'click'].forEach(ev => window.addEventListener(ev, skip, { once: true, passive: true }));
    await Promise.race([Promise.all(imgs.map(i => i.decode().catch(() => {}))), sleep(1600)]);
    if (skipped) return;
    const s = Math.min(innerWidth, innerHeight) * (innerWidth < 820 ? .58 : .34);
    Object.assign(box.style, { width: s + 'px', height: s + 'px', left: (innerWidth - s) / 2 + 'px', top: (innerHeight - s) / 2 + 'px' });
    await sleep(60);
    box.classList.add('is-on');
    await sleep(650);
    for (let k = 0; k < imgs.length && !skipped; k++) {
      imgs.forEach((im, j) => im.classList.toggle('is-on', j === k));
      await sleep(190);
    }
    if (skipped) return;
    imgs.forEach(im => im.classList.remove('is-on'));
    const r = slab.getBoundingClientRect();
    box.style.borderRadius = getComputedStyle(slab).borderRadius;
    Object.assign(box.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    await sleep(1050);
    if (skipped) return;
    intro.classList.add('is-out');
    done();
  }

  /* ---------- hero: services inside the ب, with a preview window ---------- */
  const peek = $('#peek'), peekImg = $('img', peek), hero = $('#hero');
  let peekTimer = 0;
  $$('#bar a').forEach(a => {
    const show = () => {
      if (innerWidth <= 820) return;
      clearTimeout(peekTimer);
      peekImg.src = a.dataset.peek;
      const hr = hero.getBoundingClientRect(), ar = a.getBoundingClientRect();
      const w = peek.offsetWidth;
      peek.style.left = clamp(ar.left + ar.width / 2 - w / 2 - hr.left, 12, hr.width - w - 12) + 'px';
      peek.classList.add('is-on');
    };
    const hide = () => { peekTimer = setTimeout(() => peek.classList.remove('is-on'), 80); };
    a.addEventListener('mouseenter', show); a.addEventListener('focus', show);
    a.addEventListener('mouseleave', hide); a.addEventListener('blur', hide);
  });

  /* ---------- works: an index with a live preview ---------- */
  const rowsHost = $('#rows'), view = $('#view');
  const tagLine = p => p.tags.map(k => L(TAGS[k])).join(' / ');
  let current = 0;
  function renderRows() {
    rowsHost.innerHTML = PROJECTS.map((p, i) => `<li class="row" data-i="${i}"${p.focus ? ` style="--focus:${p.focus}"` : ''}>
        <a href="#/work/${p.id}">
          <span class="row__thumb"><img src="${p.cover}" alt="" loading="lazy"></span>
          <span class="row__name">${esc(L(p.name))}</span>
          <span class="row__tags">${esc(tagLine(p))}</span>
          ${arrow}
        </a>
      </li>`).join('');
    if (!view.childElementCount) {
      view.innerHTML = PROJECTS.map((p, i) => `<img src="${p.cover}" alt="" decoding="async"${p.focus ? ` style="--focus:${p.focus}"` : ''}${i === 0 ? ' class="is-on"' : ''}>`).join('');
    }
    $$('.row', rowsHost).forEach(row => {
      const a = $('a', row);
      const go = () => setView(Number(row.dataset.i));
      a.addEventListener('mouseenter', go); a.addEventListener('focus', go);
    });
    setView(current, true);
  }
  function setView(i, quiet) {
    $$('.row', rowsHost).forEach(r => r.classList.toggle('is-on', Number(r.dataset.i) === i));
    if (i === current && !quiet) return;
    $$('img', view).forEach((im, k) => {
      const was = im.classList.contains('is-on');
      im.classList.toggle('was-on', was && k !== i);
      im.classList.toggle('is-on', k === i);
      if (was && k !== i) setTimeout(() => im.classList.remove('was-on'), 850);
    });
    current = i;
  }

  let filter = 'all';
  function applyFilter(f, quiet) {
    filter = FILTERS[f] ? f : 'all';
    $$('#filters button').forEach(b => { const on = b.dataset.filter === filter; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
    const keys = FILTERS[filter];
    let first = -1;
    $$('.row', rowsHost).forEach(row => {
      const p = PROJECTS[Number(row.dataset.i)];
      row.hidden = !!keys && !p.tags.some(k => keys.includes(k));
      if (!row.hidden && first < 0) first = Number(row.dataset.i);
    });
    if (!quiet && first >= 0) setView(first);
  }
  $('#filters').addEventListener('click', e => { const b = e.target.closest('button'); if (b) applyFilter(b.dataset.filter); });
  document.addEventListener('click', e => { const a = e.target.closest('a[data-filter]'); if (a) applyFilter(a.dataset.filter); });

  /* ---------- sites: a panoramic hall ---------- */
  const pano = $('#pano'), stage = $('#panoStage');
  let at = 0, cards = [], panoTimer = 0, panoPaused = false, panoSeen = false;
  function renderPano() {
    stage.innerHTML = SITES.map((s, i) => `<div class="card" data-i="${i}" role="group" aria-roledescription="slide" aria-label="${esc(s.label)}">
        <div class="card__bar"><i></i><i></i><i></i><span>${esc(s.label)}</span></div>
        <div class="card__view"><img src="${s.src}" alt="${esc(s.label)}" loading="lazy"></div>
      </div>`).join('');
    cards = $$('.card', stage);
    cards.forEach(c => c.addEventListener('click', () => {
      const i = Number(c.dataset.i);
      if (i === at) window.open(SITES[i].url, '_blank', 'noopener');
      else goPano(i);
    }));
    sizePano(); goPano(at, true);
  }
  function sizePano() {}
  function goPano(i, quiet) {
    const n = SITES.length;
    at = (i + n) % n;
    cards.forEach((c, k) => {
      let off = k - at;
      if (off > n / 2) off -= n;
      if (off < -n / 2) off += n;
      c.style.setProperty('--off', off);
      c.classList.toggle('is-on', off === 0);
      c.classList.toggle('is-far', Math.abs(off) > 1);
      c.setAttribute('aria-hidden', off !== 0);
    });
    $('#panoCount').textContent = `${pad(at + 1)}/${pad(n)}`;
    $('#panoLabel').textContent = SITES[at].label;
    $('#panoLink').href = SITES[at].url;
    if (!quiet) restartPano();
  }
  function restartPano() {
    clearTimeout(panoTimer);
    if (reduce.matches || panoPaused || !panoSeen) return;
    panoTimer = setTimeout(() => goPano(at + 1), 9000);
  }
  $('#panoPrev').addEventListener('click', () => goPano(at - 1));
  $('#panoNext').addEventListener('click', () => goPano(at + 1));
  pano.addEventListener('mouseenter', () => { panoPaused = true; clearTimeout(panoTimer); });
  pano.addEventListener('mouseleave', () => { panoPaused = false; restartPano(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => es.forEach(e => { panoSeen = e.isIntersecting; if (panoSeen) restartPano(); else clearTimeout(panoTimer); }), { threshold: .3 }).observe(pano);
  }

  /* ---------- contact ---------- */
  function renderContact() {
    const c = CONTACT || {};
    const links = [];
    if (c.whatsapp) links.push(`<a class="wa" href="https://wa.me/${String(c.whatsapp).replace(/\D/g, '')}" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-wa"/></svg><span>${esc(t('contact.whatsapp'))}</span></a>`);
    if (c.email) links.push(`<a class="link" href="mailto:${esc(c.email)}"><span>${esc(t('contact.email'))}</span>${arrow}</a>`);
    ['instagram', 'behance', 'linkedin', 'x'].forEach(k => { if (c[k]) links.push(`<a class="link" href="${esc(c[k])}" target="_blank" rel="noopener"><span>${esc(t('contact.' + k))}</span>${arrow}</a>`); });
    $('#contactLinks').innerHTML = links.length ? links.join('') : `<p class="contact__empty">${esc(t('contact.empty'))}</p>`;
    const facts = [];
    if (c.phone) facts.push(`<dt>${esc(t('contact.phone'))}</dt><dd><a href="tel:+966${String(c.phone).replace(/\D/g, '').replace(/^0/, '')}">${esc(c.phone)}</a></dd>`);
    facts.push(`<dt>${esc(t('contact.addressLabel'))}</dt><dd>${esc(t('contact.address'))}</dd>`);
    $('#contactFacts').innerHTML = facts.join('');
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

  /* ---------- approach: pinned, the line draws with the scroll ---------- */
  const approach = $('#approach'), pin = $('.approach__pin'), arc = $('#arc'), steps = $$('.arc__step');
  function runArc() {
    let p;
    if (getComputedStyle(pin).position === 'sticky') {
      const r = approach.getBoundingClientRect();
      p = clamp(-r.top / Math.max(1, approach.offsetHeight - innerHeight) * 1.08);
    } else {
      const r = arc.getBoundingClientRect();
      p = clamp((innerHeight * .9 - r.top) / (r.height * .9));
    }
    arc.style.setProperty('--p', p.toFixed(3));
    steps.forEach(s => s.classList.toggle('is-on', p >= parseFloat(s.style.getPropertyValue('--t')) - .005));
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { runArc(); ticking = false; });
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
  window.addEventListener('resize', () => { sizePano(); onScroll(); });
  window.addEventListener('load', () => { sizePano(); onScroll(); });
  onScroll();
  route();
  runIntro();
})();
