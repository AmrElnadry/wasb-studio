/* وثب | WASB — inner pages: the header menu, and the project bar (share, start a project) */
(function () {
  'use strict';
  // header menu: the same full-screen menu as the home page
  const burger = document.getElementById('burger'), nav = document.getElementById('menu');
  if (burger && nav) {
    const roll = burger.querySelector('.menu-btn__roll');
    const back = '<svg class="back" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4.5 20 9l-5 4.5M19.5 9H8.5a5.5 5.5 0 0 0 0 11H16"/></svg>';
    const set = on => {
      burger.setAttribute('aria-expanded', on);
      burger.classList.toggle('is-icon', on);
      roll.innerHTML = on ? back : burger.dataset.open;
      if (on) burger.setAttribute('aria-label', burger.dataset.close); else burger.removeAttribute('aria-label');
      document.body.style.overflow = on ? 'hidden' : '';
      if (on) { nav.hidden = false; requestAnimationFrame(() => requestAnimationFrame(() => nav.classList.add('is-open'))); }
      else { nav.classList.remove('is-open'); setTimeout(() => { if (burger.getAttribute('aria-expanded') !== 'true') nav.hidden = true; }, 700); }
    };
    burger.addEventListener('click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { set(false); burger.focus(); } });
  }

  // back: to the place the visitor came from (the home page or all work), at the same scroll;
  // anyone who arrived from elsewhere goes to all work
  const back = document.querySelector('[data-back]');
  if (back) back.addEventListener('click', e => {
    try {
      const r = new URL(document.referrer);
      if (r.origin === location.origin && /^\/(en\/)?(work\/)?$/.test(r.pathname) && history.length > 1) { e.preventDefault(); history.back(); }
    } catch (x) {}
  });

  /* ---------- page to page: the card's image grows into the project's first image, and back ---------- */
  // the two images share one view-transition name for the length of the move; browsers without
  // cross-page transitions simply open the page
  (function moveBetweenPages() {
    if (!('onpagereveal' in window)) return;
    const named = [];
    const name = img => { if (img) { img.style.viewTransitionName = 'lead'; named.push(img); } };
    const clear = () => { named.splice(0).forEach(x => { x.style.viewTransitionName = ''; }); };
    const inView = el => { const r = el.getBoundingClientRect(); return r.bottom > 40 && r.top < innerHeight - 40; };
    const lead = () => document.querySelector('.gal__it.is-lead img');
    const tileFor = path => [...document.querySelectorAll('a.tile[href]')].find(a => !a.hidden && new URL(a.href, location.href).pathname === path && inView(a));
    let clicked = null;
    document.addEventListener('click', e => { const a = e.target.closest('a.tile'); clicked = a && !e.defaultPrevented ? a : null; }, true);
    addEventListener('pageswap', e => {
      clear();
      if (!e.viewTransition) return;
      e.viewTransition.ready.catch(() => {});
      try { sessionStorage.setItem('wasb-from', location.pathname); } catch (x) {}
      if (clicked && inView(clicked)) name(clicked.querySelector('img'));
      else { const l = lead(); if (l && inView(l)) name(l); }
      clicked = null;
    });
    addEventListener('pagereveal', e => {
      clear();
      if (!e.viewTransition) return;
      let from = '';
      try { from = sessionStorage.getItem('wasb-from') || ''; } catch (x) {}
      const l = lead();
      if (l) name(l);
      else { const a = from && tileFor(from); if (a) name(a.querySelector('img')); }
      e.viewTransition.ready.catch(() => {}); e.viewTransition.finished.then(clear, clear);
    });
  })();

  // all-work page: filter the projects by service
  const wall = document.querySelector('.wall');
  if (wall) {
    const F = JSON.parse(wall.dataset.filters || '{}');
    wall.addEventListener('click', e => {
      const b = e.target.closest('[data-filter]'); if (!b) return;
      const keys = F[b.dataset.filter];
      wall.querySelectorAll('[data-filter]').forEach(x => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
      wall.querySelectorAll('.tile').forEach(tile => { tile.hidden = !!keys && !tile.dataset.tags.split(' ').some(k => keys.includes(k)); });
      fill();
      // the address keeps the filter, so the menu, a shared link and the back button land on it
      try { const u = new URL(location.href); if (keys) u.searchParams.set('type', b.dataset.filter); else u.searchParams.delete('type'); history.replaceState(history.state, '', u); } catch (x) {}
    });
    // a card left alone on the last row takes the whole row, at the same height as the others
    const grid = wall.querySelector('.wall__grid');
    const fill = () => {
      const shown = [...grid.querySelectorAll('.tile')].filter(x => !x.hidden);
      shown.forEach(x => { x.classList.remove('is-wide'); x.style.height = ''; });
      const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      if (cols < 2 || shown.length % cols !== 1) return;
      const last = shown[shown.length - 1], h = shown[0].offsetHeight;
      last.classList.add('is-wide'); last.style.height = h + 'px';
    };
    fill();
    addEventListener('resize', fill);
    const want = new URLSearchParams(location.search).get('type');
    const pick = want && [...wall.querySelectorAll('[data-filter]')].find(x => x.dataset.filter === want);
    if (pick) pick.click();
  }

  const bar = document.getElementById('pbar');
  if (!bar) return;
  const btn = document.getElementById('shareBtn'), menu = document.getElementById('shareMenu');
  const url = bar.dataset.url, title = bar.dataset.title;

  const open = on => { menu.hidden = !on; btn.setAttribute('aria-expanded', on); };

  // the bar comes in once the reader is into the work, and steps aside at the end of the page
  let atEnd = false;
  const sync = () => { const on = scrollY > (matchMedia('(max-width: 820px)').matches ? 80 : innerHeight * .5) && !atEnd; /* phones: as soon as the reader starts scrolling */ bar.classList.toggle('is-on', on); if (!on && menu && !menu.hidden) open(false); };
  const end = document.querySelector('.similar') || document.querySelector('.foot');
  if (end && 'IntersectionObserver' in window) new IntersectionObserver(es => { atEnd = es[0].isIntersecting; sync(); }).observe(end);
  addEventListener('scroll', sync, { passive: true });
  sync();

  // phones get their own share sheet; computers get the small menu
  btn.addEventListener('click', async () => {
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      try { await navigator.share({ title, url }); } catch (e) {}
      return;
    }
    open(menu.hidden);
  });
  document.addEventListener('click', e => { if (!menu.hidden && !e.target.closest('.pbar__share')) open(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { open(false); btn.focus(); } });
  menu.addEventListener('click', async e => {
    if (e.target.closest('a')) { open(false); return; }
    if (!e.target.closest('[data-copy]')) return;
    try { await navigator.clipboard.writeText(url); } catch (x) {
      const ta = document.createElement('textarea'); ta.value = url; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (y) {} ta.remove();
    }
    open(false);
    const n = document.createElement('span');
    n.className = 'pbar__toast'; n.setAttribute('role', 'status'); n.textContent = bar.dataset.copied;
    btn.parentElement.appendChild(n); setTimeout(() => n.remove(), 1800);
  });
})();
