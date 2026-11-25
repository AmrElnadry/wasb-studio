(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const I18N = window.WASB_I18N, PROJECTS = window.WASB_PROJECTS, SITES = (window.WASB_SITES || []).filter(s => s.featured !== false), TAGS = window.WASB_TAGS, CONTACT = window.WASB_CONTACT;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const arrow = '<svg aria-hidden="true"><use href="#i-arrow"/></svg>';
  const pad = n => String(n).padStart(2, '0');
  const html = document.documentElement;

  // which project tags each of the three services covers
  const FILTERS = { identity: ['identity', 'logo', 'merch', 'signage'], website: ['website'], profile: ['profile'] };

  // the address decides the language: / is Arabic, /en/ is English
  let lang = html.lang === 'en' ? 'en' : 'ar';
  const BASE = () => lang === 'en' ? '/en/' : '/';
  const workUrl = id => `${BASE()}work/${id}/`;
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
    if (!first) { try { history.replaceState(null, '', BASE() + location.search + location.hash); } catch (e) {} }
    html.lang = lang; html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = lang === 'ar' ? 'وثب استوديو | تصميم شعار وهوية بصرية، مواقع إلكترونية وبروفايل شركات في السعودية' : 'WASB Studio | Logo and brand identity design, websites and company profiles in Saudi Arabia';
    $$('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
      if (el.hasAttribute('data-split')) { split(el); if (!first) el.classList.add('in'); }
    });
    $$('[data-i18n-label]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nLabel)));
    const btn = $('#langToggle');
    btn.textContent = lang === 'ar' ? 'EN' : 'عربي';
    btn.setAttribute('aria-label', lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية');
    $('#worksAll').href = BASE() + 'work/';
    renderRows(); renderPano(); renderContact(); syncMenuLabel(); applyFilter(filter); fitTrio(); buildGhost(); alignHero(); if (window.WASB_HAND) window.WASB_HAND(); syncGame();
    if (!first) onScroll();
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
    const target = slab.getBoundingClientRect();
    const s = Math.min(target.width, innerHeight * .8);
    Object.assign(box.style, { width: target.width + 'px', height: s + 'px', left: target.left + 'px', top: (innerHeight - s) / 2 + 'px' });
    await sleep(60);
    box.classList.add('is-on');
    await sleep(380);
    for (let k = 0; k < imgs.length && !skipped; k++) {
      imgs.forEach((im, j) => im.classList.toggle('is-on', j === k));
      await sleep(92);   // 10 images in about the same second as before
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

  /* ---------- hero: three services under the mark, set to one length ---------- */
  // Arabic lines are lengthened with kashida (ـ) between joining letters; Latin lines with letter-spacing.
  const JOIN = 'بتثجحخسشصضطظعغفقكلمنهيئ';
  const ARABIC = /[ء-ي]/;
  function kashidaSlots(word) {
    const slots = [];
    for (let i = 0; i < word.length - 1; i++) {
      const c = word[i], n = word[i + 1];
      if (!JOIN.includes(c) || !ARABIC.test(n)) continue;
      if (c === 'ل' && 'اأإآ'.includes(n)) continue;
      if (i === 0 && c === 'ا') continue;
      slots.push(i + 1);
    }
    return slots;
  }
  // desktop: the slogan sits level with the three services (their middles on one line)
  function alignHero() {
    const pitch = $('.hero__pitch'), trio = $('#trio'), hero = $('#hero');
    if (!pitch || !trio || !hero) return;
    if (matchMedia('(max-width: 820px)').matches) { pitch.style.top = ''; pitch.style.height = ''; return; }
    const hr = hero.getBoundingClientRect(), tr = trio.getBoundingClientRect();
    pitch.style.height = 'auto';
    pitch.style.top = (tr.top + tr.height / 2 - hr.top - pitch.offsetHeight / 2).toFixed(1) + 'px';
  }


  // small marks in staggered rows; a soft wave of light travels across them
  // one hand points at each service in turn: two turns, then down to the next, and back up
  (function handTrio() {
    const hand = $('#trioHand');
    if (!hand) return;
    const spin = $('.trio__spin', hand);
    let k = 0, hold = -1, timer = 0;
    const items = () => $$('#trio .trio__t');
    const place = i => {
      const list = items(); if (!list[i]) return;
      // layout offsets, not screen boxes: the services' fade-in lift must not throw the hand off
      const t = list[i], box = hand.parentElement;
      let left = 0, top = 0;
      for (let el = t; el && el !== box; el = el.offsetParent) { left += el.offsetLeft; top += el.offsetTop; }
      const gap = parseFloat(getComputedStyle(hand).fontSize) * 1.05;
      const x = lang === 'ar' ? left + t.offsetWidth + gap : left - gap;
      hand.style.setProperty('--hx', x.toFixed(1) + 'px');
      hand.style.setProperty('--hy', (top + t.offsetHeight * .5).toFixed(1) + 'px');
    };
    const turn = () => { spin.classList.toggle('is-spin', false); void spin.getBoundingClientRect(); spin.classList.add('is-spin'); };
    const step = () => {
      clearTimeout(timer);
      const n = items().length;
      if (!n || html.classList.contains('intro-on') || document.hidden || hold >= 0) { timer = setTimeout(step, 400); return; }
      if (!hand.classList.contains('is-ready')) {
        // the hand comes last: only once every service has finished coming in
        const pending = $$('#trio li').flatMap(li => li.getAnimations()).filter(an => an.playState !== 'finished');
        if (pending.length) { Promise.all(pending.map(an => an.finished.catch(() => {}))).then(() => { timer = setTimeout(step, 150); }); return; }
        hand.classList.add('no-move'); place(k); void hand.getBoundingClientRect(); hand.classList.toggle('no-move', false); hand.classList.add('is-ready');
      } else place(k);
      timer = setTimeout(() => {
        if (!reduce.matches) turn();
        timer = setTimeout(() => { k = (k + 1) % n; step(); }, 1650);
      }, 800);
    };
    $$('#trio a').forEach((a, i) => {
      a.addEventListener('mouseenter', () => { hold = i; place(i); });
      a.addEventListener('mouseleave', () => { hold = -1; k = i; });
    });
    window.WASB_HAND = () => place(hold >= 0 ? hold : k);
    timer = setTimeout(step, 1600);
  })();

  function buildGhost() {
    const svg = $('#ghostGrid');
    if (!svg) return;
    const w = svg.clientWidth, hgt = svg.clientHeight;
    if (!w || !hgt) { svg.innerHTML = ''; return; }
    const dx = 32, dy = 42, iw = 16, ih = 21.8;
    const cols = Math.ceil(w / dx) + 1, rows = Math.ceil(hgt / dy) + 1;
    const ox = (w - (cols - 1) * dx) / 2 - iw / 2, oy = (hgt - (rows - 1) * dy) / 2 - ih / 2;
    let out = '';
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = ox + c * dx + (r % 2 ? dx / 2 : 0), y = oy + r * dy;
      const cc = lang === 'ar' ? cols - 1 - c : c;
      out += `<use href="#wasb-symbol" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${iw}" height="${ih}" style="--d:${(-(cc * .16 + r * .22)).toFixed(2)}s"/>`;
    }
    svg.innerHTML = out;
  }

  function fitTrio() {
    const els = $$('#trio .trio__t');
    if (!els.length) return;
    els.forEach(el => { el.textContent = t(el.dataset.i18n); el.style.letterSpacing = ''; });
    const widths = els.map(el => el.getBoundingClientRect().width);
    const target = Math.max(...widths);
    els.forEach((el, k) => {
      if (target - widths[k] < 2) return;
      if (lang !== 'ar') return;
      const words = el.textContent.split(' ');
      // slots spread from the middle of each word outward, round robin across words
      const order = [];
      words.forEach((w, wi) => {
        const s = kashidaSlots(w);
        const mid = s.length / 2;
        s.sort((a, b) => Math.abs(a - mid * 1.0 - 0.5) - Math.abs(b - mid * 1.0 - 0.5)).forEach((pos, r) => order.push({ wi, pos, r }));
      });
      order.sort((a, b) => a.r - b.r || a.wi - b.wi);
      if (!order.length) return;
      const extra = words.map(() => ({}));
      for (let step = 0; step < 60; step++) {
        const o = order[step % order.length];
        extra[o.wi][o.pos] = (extra[o.wi][o.pos] || 0) + 1;
        const text = words.map((w, wi) => w.split('').map((ch, ci) => 'ـ'.repeat(extra[wi][ci] || 0) + ch).join('')).join(' ');
        const prev = el.textContent;
        el.textContent = text;
        const now = el.getBoundingClientRect().width;
        if (now >= target - 1) {
          if (now - target > (target - (step ? measure(prev, el) : widths[k]))) el.textContent = prev;
          break;
        }
      }
    });
  }
  function measure(text, el) { const keep = el.textContent; el.textContent = text; const w = el.getBoundingClientRect().width; el.textContent = keep; return w; }

  /* ---------- works: a grid, the name on the work ---------- */
  const grid = $('#grid');
  const tagLine = p => p.tags.map(k => L(TAGS[k])).join(' / ');
  function renderRows() {
    const seen = !!grid.querySelector('.tile[data-i]');   // the plain list written by scripts/seo.mjs does not count
    grid.innerHTML = PROJECTS.map((p, i) => `<a class="tile${seen ? ' in' : ''}" href="${workUrl(p.id)}" data-i="${i}" style="--i:${i % 3};${p.focus ? `--focus:${p.focus}` : ''}" aria-label="${esc(L(p.name))}: ${esc(t('plate.open'))}">
        <img src="${p.cover}" alt="${esc(L(p.line))}" loading="lazy" decoding="async">
        <span class="tile__cap"><span class="tile__name">${esc(L(p.name)).replace(/ · /g, '&nbsp;· ')}</span><span class="tile__tags">${esc(tagLine(p))}</span></span>
        <span class="tile__go" aria-hidden="true">${arrow}</span>
      </a>`).join('');
    if (!seen) $$('.tile', grid).forEach(watch);
  }

  let filter = 'all';
  function applyFilter(f) {
    filter = FILTERS[f] ? f : 'all';
    $$('#filters button').forEach(b => { const on = b.dataset.filter === filter; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
    const keys = FILTERS[filter];
    grid.classList.toggle('is-filtered', !!keys);
    $$('.tile', grid).forEach(tile => {
      const p = PROJECTS[Number(tile.dataset.i)];
      tile.hidden = !!keys && !p.tags.some(k => keys.includes(k));
    });
  }
  $('#filters').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    // websites live in their own showcase further down: go there instead of filtering the grid
    if (b.dataset.filter === 'website') { $('#sites').scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth' }); return; }
    applyFilter(b.dataset.filter);
  });
  document.addEventListener('click', e => { const a = e.target.closest('a[data-filter]'); if (a) applyFilter(a.dataset.filter); });

  /* ---------- sites: a panoramic hall ---------- */
  const pano = $('#pano'), stage = $('#panoStage');
  let at = 0, cards = [], panoTimer = 0, panoSeen = false;
  const panoPos = [];
  function renderPano() {
    stage.innerHTML = SITES.map((s, i) => `<div class="card" data-i="${i}" role="group" aria-roledescription="slide" aria-label="${esc(s.label)}">
        <div class="card__bar"><i></i><i></i><i></i><span>${esc(s.label)}</span></div>
        <div class="card__view"><img src="${s.src}" alt="${esc(t('nav.sites') + ' · ' + s.label)}" loading="lazy"></div>
      </div>`).join('');
    cards = $$('.card', stage);
    panoPos.length = 0;
    cards.forEach(c => c.addEventListener('click', () => window.open(SITES[Number(c.dataset.i)].url, '_blank', 'noopener')));
    sizePano(); goPano(at, true);
  }
  function sizePano() {}
  function goPano(i, quiet) {
    const n = SITES.length;
    const prev = at;
    at = (i + n) % n;
    // put a card straight onto its latest place, without animating
    const snap = (c, k) => {
      c.classList.add('no-anim');
      c.style.setProperty('--off', panoPos[k]);
      void c.offsetWidth;
      c.classList.remove('no-anim');
      c.classList.toggle('is-far', Math.abs(panoPos[k]) > 1);
    };
    cards.forEach((c, k) => {
      // a teleport still waiting from the last move would land on a stale place: finish it now
      if (c._wrap) { clearTimeout(c._wrap); c._wrap = 0; snap(c, k); }
      let off = ((k - at) % n + n) % n;     // 0, 1, 2 … n-1
      if (off === n - 1) off = -1;           // the one just passed sits on the near side
      const was = panoPos[k];
      const wrap = was !== undefined && Math.abs(off - was) > 1;
      if (wrap) {
        // move it out of sight first, then teleport while hidden
        c.classList.add('is-far');
        c.style.setProperty('--off', was < off ? was - 1 : was + 1);
        c._wrap = setTimeout(() => { c._wrap = 0; snap(c, k); }, 1650);
      } else {
        c.style.setProperty('--off', off);
        c.classList.toggle('is-far', Math.abs(off) > 1);
      }
      panoPos[k] = off;
      // the page inside keeps the spot it scrolled to while it slides away; it rewinds only once out of sight
      const im = c.querySelector('.card__view img');
      if (im) {
        clearTimeout(c._rst);
        if (off === 0) { im.style.transition = ''; im.style.translate = ''; }
        else {
          if (was === 0) { const t = getComputedStyle(im).translate; im.style.transition = 'none'; im.style.translate = t === 'none' ? '0px 0px' : t; }
          if (Math.abs(off) > 1 || wrap) c._rst = setTimeout(() => { im.style.transition = 'none'; im.style.translate = '0px 0px'; }, 1000);
        }
      }
      c.classList.toggle('is-on', off === 0);
      c.classList.toggle('is-play', off === 0 && panoSeen);
      c.setAttribute('aria-hidden', off !== 0);
    });
    $('#panoCount').textContent = `${pad(at + 1)}/${pad(n)}`;
    $('#panoLabel').textContent = SITES[at].label;
    $('#panoLink').href = SITES[at].url;
    if (!quiet) restartPano();
  }
  // each site holds for 4s after it settles, then the next one comes forward
  function restartPano() {
    clearTimeout(panoTimer);
    if (reduce.matches || !panoSeen) return;
    panoTimer = setTimeout(() => goPano(at + 1), 5600);
  }
  $('#panoPrev').addEventListener('click', () => goPano(at - 1));
  $('#panoNext').addEventListener('click', () => goPano(at + 1));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => es.forEach(e => {
      panoSeen = e.isIntersecting;
      const cur = cards[at];
      if (panoSeen) { if (cur) { cur.classList.remove('is-play'); void cur.offsetWidth; cur.classList.add('is-play'); } restartPano(); }
      else { clearTimeout(panoTimer); cards.forEach(c => c.classList.remove('is-play')); }
    }), { threshold: .15 }).observe(pano);
  }

  /* ---------- contact ---------- */
  function renderContact() {
    const c = CONTACT || {};
    const links = [];
    ['instagram', 'behance', 'linkedin', 'x'].forEach(k => { if (c[k]) links.push(`<a class="link" href="${esc(c[k])}" target="_blank" rel="noopener"><span>${esc(t('contact.' + k))}</span>${arrow}</a>`); });
    const phones = (c.phones || []).map(p => String(p).replace(/\D/g, '').replace(/^(966|0)/, ''));
    const wa = c.whatsapp ? `<a class="wa" aria-label="${esc(t('contact.whatsapp'))}" href="https://wa.me/${String(c.whatsapp).replace(/\D/g, '')}" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-wa"/></svg></a>` : '';
    $('#contactLinks').innerHTML = links.join('') || (wa || phones.length ? '' : `<p class="contact__empty">${esc(t('contact.empty'))}</p>`);
    $('#contactLinks').hidden = !$('#contactLinks').innerHTML;
    // the WhatsApp mark sits in the numbers' own column, so it centres over them
    // labels share one column; the WhatsApp mark floats over the numbers and centres on them
    $('#contactFacts').innerHTML =
      (phones.length || wa ? `<dt>${phones.length ? esc(t('contact.phone')) : ''}</dt><dd class="nums">${wa}${phones.map(d => `<a href="tel:+966${d}">+966 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}</a>`).join('')}</dd>` : '') +
      (c.email ? `<dt>${esc(t('contact.email'))}</dt><dd class="mail"><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></dd>` : '') +
      `<dt>${esc(t('contact.addressLabel'))}</dt><dd class="addr">${esc(t('contact.address'))}</dd>`;
    $('#contactAddr').hidden = true;
  }

  /* ---------- menu ---------- */
  const burger = $('#burger'), menu = $('#menu');
  const menuOpen = () => burger.getAttribute('aria-expanded') === 'true';
  function syncMenuLabel() {
    const open = menuOpen();
    $('.menu-btn__roll', burger).innerHTML = open ? `<svg class="back" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4.5 20 9l-5 4.5M19.5 9H8.5a5.5 5.5 0 0 0 0 11H16"/></svg>` : esc(t('nav.menu'));
    if (open) burger.setAttribute('aria-label', t('nav.close')); else burger.removeAttribute('aria-label');
    burger.classList.toggle('is-icon', open);
  }
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open);
    syncMenuLabel();
    document.body.classList.toggle('is-locked', open);
    if (open) { menu.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open'))); }
    else { menu.classList.remove('is-open'); setTimeout(() => { if (!menuOpen()) menu.hidden = true; }, reduce.matches ? 0 : 700); }
  }
  burger.addEventListener('click', () => setMenu(!menuOpen()));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });

  /* ---------- approach: build the identity ---------- */
  // Each leap sends a red diamond (a dot of the letter ث) along the arc to the next stage,
  // reveals that stage, and builds one more layer of the WASB mark in the centre.
  const arc = $('#arc'), spark = $('#spark'), start = $('#arcStart'), leapBtn = $('#leapBtn'), leapLabel = $('#leapLabel'), hint = $('#gameHint'), emblem = $('#emblem');
  const steps = $$('.arc__step');
  const T = [0, ...steps.map(s => parseFloat(s.style.getPropertyValue('--t')))];
  let reached = 0, leaping = false, done = false, finishTimer = 0, holdAt = null;
  const onArc = () => getComputedStyle($('.arc__svg')).display !== 'none';
  function arcPoint(tt) {
    const w = arc.clientWidth, hgt = arc.clientHeight;
    const fromStart = (.5 - .48 * Math.cos(Math.PI * tt)) * w;
    return { x: lang === 'ar' ? w - fromStart : fromStart, y: (1 - .96 * Math.sin(Math.PI * tt)) * hgt };
  }
  function dotPoint(i) {
    const ar = arc.getBoundingClientRect(), r = $('.arc__dot', steps[i]).getBoundingClientRect();
    return { x: r.left + r.width / 2 - ar.left, y: r.top + r.height / 2 - ar.top };
  }
  function place(p) { spark.style.left = p.x + 'px'; spark.style.top = p.y + 'px'; }
  function syncGame() {
    if (onArc()) place(arcPoint(done ? 1 : T[reached]));
    steps.forEach((s, i) => s.classList.toggle('is-on', i < reached));
    for (let k = 1; k <= 4; k++) emblem.classList.toggle('s' + k, reached >= k);
    arc.style.setProperty('--p', done ? 1 : T[reached]);
    arc.classList.toggle('is-done', done);
    const playing = reached > 0 && !done;
    leapLabel.textContent = playing ? `${reached}/${steps.length}` : t('game.leap');
    leapLabel.classList.toggle('is-count', playing);
    leapBtn.setAttribute('aria-label', playing ? `${t('game.leap')} ${reached}/${steps.length}` : t('game.leap'));
    // phones: the current stage stands where the title was, with four dots under it
    arc.classList.toggle('is-step', playing);
    $$('.arc__dots i').forEach((d, k) => d.classList.toggle('is-on', done || k < reached));
    const now = $('#arcNow');
    if (now && playing && now.dataset.k !== String(reached) + lang) {
      const s = steps[reached - 1];
      now.dataset.k = String(reached) + lang;
      now.innerHTML = `<span class="arc__num">${pad(reached)} / ${pad(steps.length)}</span><h3>${esc($('h3', s).textContent)}</h3><p>${esc($('p', s).textContent)}</p>`;
      now.classList.add('re'); void now.offsetWidth; now.classList.remove('re');
    }
    hint.innerHTML = done ? `${esc(t('game.done'))} <a href="#contact">${esc(t('game.cta'))}</a>` : esc(t('game.hint'));
  }
  function land() {
    reached++;
    leaping = false;
    const dot = $('.arc__dot', steps[reached - 1]);
    dot.classList.remove('ping'); void dot.offsetWidth; dot.classList.add('ping');
    syncGame();
    if (reached >= steps.length) {
      // phones: the last stage stays until the visitor scrolls on (or presses again), then it starts over
      if (!onArc()) { holdAt = scrollY; return; }
      // 4/4 stays while the mark turns red, then the line runs on to its end point
      leaping = true;
      finishTimer = setTimeout(finish, reduce.matches ? 300 : 3800);   // the last stage stays in view a little longer
    }
  }
  function finish() {
    const t0 = T[reached], dur = reduce.matches ? 0 : 1100, began = performance.now();
    arc.style.setProperty('--p', 1);
    const ease = u => 1 - Math.pow(1 - u, 3);
    const end = () => { done = true; leaping = false; syncGame(); };
    if (!onArc() || !dur) return end();
    const frame = now => {
      const u = clamp((now - began) / dur);
      place(arcPoint(t0 + (1 - t0) * ease(u)));
      if (u < 1) return requestAnimationFrame(frame);
      end();
    };
    requestAnimationFrame(frame);
  }
  function restart() { holdAt = null; clearTimeout(finishTimer); done = false; reached = 0; syncGame(); }
  addEventListener('scroll', () => { if (holdAt !== null && Math.abs(scrollY - holdAt) > 80) restart(); }, { passive: true });
  function leap() {
    if (leaping) return;
    if (holdAt !== null) { restart(); return; }
    leapBtn.classList.add('is-used');
    leapBtn.classList.remove('is-charge'); void leapBtn.offsetWidth; leapBtn.classList.add('is-charge');
    if (done) { clearTimeout(finishTimer); done = false; reached = 0; syncGame(); }
    leaping = true;
    const t0 = T[reached], t1 = T[reached + 1];
    arc.style.setProperty('--p', t1);
    const dur = reduce.matches ? 0 : 900, began = performance.now();
    const ease = u => 1 - Math.pow(1 - u, 3);
    if (!onArc()) { setTimeout(land, dur ? 450 : 0); return; }
    const frame = now => {
      const u = dur ? clamp((now - began) / dur) : 1;
      place(arcPoint(t0 + (t1 - t0) * ease(u)));
      if (u < 1) return requestAnimationFrame(frame);
      land();
    };
    requestAnimationFrame(frame);
  }
  leapBtn.addEventListener('click', leap);
  function onScroll() {}

  /* ---------- old links: #/work/<id> now has its own page ---------- */
  function route() {
    const m = location.hash.match(/^#\/work\/([\w-]+)/);
    if (m && PROJECTS.some(p => p.id === m[1])) location.replace(workUrl(m[1]));
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen()) { setMenu(false); burger.focus(); } });
  window.addEventListener('hashchange', route);

  /* ---------- phones: each scroll settles on the nearest section, slowly and smoothly ---------- */
  // (CSS scroll snapping is quick and stiff on phones, and fights links that jump to a section)
  (function settleScroll() {
    const phone = matchMedia('(max-width: 820px)');
    const STOPS = [['hero', 0], ['about', 0], ['works', 28], ['sites', 28], ['approach', 0], ['contact', 28]];
    let anim = 0, timer = 0, lastY = scrollY, dir = 1, busy = false, until = 0;
    const points = () => STOPS.map(([id, m]) => { const el = document.getElementById(id); return el ? Math.max(0, Math.round(el.getBoundingClientRect().top + scrollY - m)) : null; }).filter(v => v !== null);
    const ease = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    const stop = () => { if (!busy) return; cancelAnimationFrame(anim); busy = false; html.style.scrollBehavior = ''; };
    function go(to) {
      stop();
      const from = scrollY, d = to - from;
      if (Math.abs(d) < 3) return;
      const dur = Math.min(1100, 650 + Math.abs(d) * .35), t0 = performance.now();
      busy = true; html.style.scrollBehavior = 'auto';
      const frame = now => {
        const u = Math.min(1, (now - t0) / dur);
        scrollTo(0, from + d * ease(u));
        if (u < 1) anim = requestAnimationFrame(frame);
        else { busy = false; html.style.scrollBehavior = ''; lastY = scrollY; until = performance.now() + 250; }
      };
      anim = requestAnimationFrame(frame);
    }
    function settle() {
      if (!phone.matches || reduce.matches || busy || performance.now() < until || html.classList.contains('intro-on') || menuOpen()) return;
      const y = scrollY, H = innerHeight, ps = points();
      let prev = 0, next = null;
      for (const p of ps) { if (p <= y + 1) prev = p; else { next = p; break; } }
      if (next === null) return;
      if (next - prev > H * 1.08) {
        // a section taller than the screen: read freely inside it; near either end, settle on that end
        if (dir > 0 && next - y < H * .4) go(next);
        else if (dir < 0 && y - prev < H * .4) go(prev);
        return;
      }
      // a screen-sized slide: a small push is enough to move on, a smaller one falls back
      go(dir > 0 ? (y - prev > H * .1 ? next : prev) : (next - y > H * .1 ? prev : next));
    }
    addEventListener('scroll', () => {
      if (busy) return;
      const y = scrollY;
      if (y !== lastY) dir = y > lastY ? 1 : -1;
      lastY = y;
      clearTimeout(timer); timer = setTimeout(settle, 160);
    }, { passive: true });
    addEventListener('touchstart', stop, { passive: true });
    addEventListener('wheel', stop, { passive: true });
    // links to a section (the hero's services, the menu) glide there the same way
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || !phone.matches || reduce.matches) return;
      const id = a.getAttribute('href').slice(1), stopFor = STOPS.find(([k]) => k === id);
      const el = id && document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      if (a.dataset.filter) applyFilter(a.dataset.filter);
      requestAnimationFrame(() => go(Math.max(0, Math.round(el.getBoundingClientRect().top + scrollY - (stopFor ? stopFor[1] : 0)))));
    });
  })();

  /* ---------- boot ---------- */
  $('#langToggle').addEventListener('click', () => applyLang(lang === 'ar' ? 'en' : 'ar'));
  $$('.year').forEach(el => { el.textContent = new Date().getFullYear(); });
  applyLang(lang, true);
  $$('[data-split]').forEach(watch);
  watch($('#filters'));
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { fitTrio(); buildGhost(); alignHero(); if (window.WASB_HAND) window.WASB_HAND(); syncGame(); });
  window.addEventListener('load', () => { fitTrio(); buildGhost(); alignHero(); if (window.WASB_HAND) window.WASB_HAND(); syncGame(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fitTrio(); buildGhost(); alignHero(); if (window.WASB_HAND) window.WASB_HAND(); syncGame(); });
  onScroll();
  route();
  runIntro();
})();
