'use strict';

/* Больше — меньше: две группы предметов, нажми где больше (или меньше).
   На 3-м уровне ловушка: меньшее количество нарисовано крупнее. */

FX.register({
  id: 'compare',
  name: 'Больше — меньше',
  icon: '🐘',
  skill: 'Сравнение количеств',

  newRound(level, api) {
    let a, b, minDiff, maxDiff, lo, hi;
    if (level === 1) { lo = 1; hi = 6; minDiff = 2; maxDiff = 5; }
    else if (level === 2) { lo = 2; hi = 9; minDiff = 1; maxDiff = 4; }
    else { lo = 4; hi = 10; minDiff = 1; maxDiff = 2; }

    let guard = 0;
    do {
      a = FX.rand(lo, hi);
      b = FX.rand(lo, hi);
    } while ((Math.abs(a - b) < minDiff || Math.abs(a - b) > maxDiff || a === b) && guard++ < 200);
    if (a === b) b = a + minDiff <= hi ? a + minDiff : a - minDiff;

    const q = level === 1 ? 'больше' : FX.pick(['больше', 'меньше']);
    const answer = q === 'больше' ? Math.max(a, b) : Math.min(a, b);

    api.prompt('Где ' + q + '?', 'Посмотри внимательно! Нажми на карточку, где ' + q + ' предметов.');

    const pair = FX.sampleN(FX.COUNTABLES, 2);
    const wrap = FX.el('div', 'halves');

    [a, b].forEach((cnt, side) => {
      const half = FX.el('button', 'half');
      /* ловушка 3-го уровня: чем меньше предметов, тем они крупнее */
      let fs = 'clamp(22px, 4vw, 34px)';
      if (level === 3) {
        const isSmaller = cnt === Math.min(a, b);
        fs = isSmaller ? 'clamp(34px, 6.5vw, 54px)' : 'clamp(15px, 2.8vw, 24px)';
      }
      for (let k = 0; k < cnt; k++) {
        const it = FX.el('span', null, pair[side].e);
        it.style.fontSize = fs;
        half.appendChild(it);
      }
      const badge = FX.el('span', 'cnt', String(cnt));
      half.appendChild(badge);

      half.addEventListener('click', () => {
        wrap.querySelectorAll('.half').forEach(h => h.classList.add('revealed'));
        if (cnt === answer) {
          api.complete(half);
        } else {
          api.wrong(half);
        }
      });
      wrap.appendChild(half);
    });

    api.stage.appendChild(wrap);
  }
});
