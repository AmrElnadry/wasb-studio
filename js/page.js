/* وثب | WASB — project pages: the page strips can be dragged with the mouse */
(function () {
  'use strict';
  document.querySelectorAll('.blk__rail').forEach(rail => {
    let down = false, sx = 0, sl = 0;
    rail.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = rail.scrollLeft; rail.classList.add('is-drag'); rail.setPointerCapture(e.pointerId); });
    rail.addEventListener('pointermove', e => { if (down) rail.scrollLeft = sl - (e.clientX - sx); });
    const up = () => { down = false; rail.classList.remove('is-drag'); };
    rail.addEventListener('pointerup', up); rail.addEventListener('pointercancel', up);
  });
})();
