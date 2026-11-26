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
