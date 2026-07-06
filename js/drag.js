'use strict';

/* ============================================================
   Перетаскивание пальцем/мышью (pointer events, без HTML5 DnD —
   надёжно работает на телефонах).

   FX.drag(el, {
     canDrag()            — можно ли сейчас тащить (по умолчанию да)
     onDrop(under, ev, moved) — палец отпущен; under — элемент под
        точкой отпускания. Вернуть true, если бросок принят
        (иначе элемент плавно вернётся на место).
     onEnd(consumed)      — после завершения
   });

   Пока идёт перетаскивание, на <body> висит класс .fx-dragging —
   зоны .drop-zone подсвечиваются, подсказывая куда бросать.
   ============================================================ */

FX.drag = (el, handlers = {}) => {
  el.classList.add('draggable');

  el.addEventListener('pointerdown', e => {
    if (handlers.canDrag && !handlers.canDrag()) return;
    if (el.dataset.dragDisabled) return;
    if (!e.isPrimary || el._fxDragging) return;  // мультитач и повторный вход
    el._fxDragging = true;
    e.preventDefault();
    try { el.setPointerCapture(e.pointerId); } catch (err) {}

    /* pop-in и другие анимации с fill-mode перекрывали бы transform */
    el.classList.remove('pop-in');
    el.classList.remove('drag-return');
    el.classList.add('dragging');
    document.body.classList.add('fx-dragging');

    const startX = e.clientX;
    const startY = e.clientY;
    let moved = false;

    const move = ev => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.18)';
    };

    const finish = ev => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', finish);
      el.removeEventListener('pointercancel', finish);
      try { el.releasePointerCapture(e.pointerId); } catch (err) {}
      el.classList.remove('dragging');
      document.body.classList.remove('fx-dragging');
      el._fxDragging = false;

      /* кто под пальцем? прячем сам элемент от hit-теста */
      const prevPE = el.style.pointerEvents;
      el.style.pointerEvents = 'none';
      const under = document.elementFromPoint(ev.clientX, ev.clientY);
      el.style.pointerEvents = prevPE;

      let consumed = false;
      try {
        consumed = handlers.onDrop ? !!handlers.onDrop(under, ev, moved) : false;
      } catch (err) {
        console.error('drag onDrop:', err);
      }
      if (!consumed) {
        el.classList.add('drag-return');
        el.style.transform = '';
        setTimeout(() => el.classList.remove('drag-return'), 320);
      }
      if (handlers.onEnd) handlers.onEnd(consumed);
    };

    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', finish);
    el.addEventListener('pointercancel', finish);
  });
};
