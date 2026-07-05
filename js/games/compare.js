'use strict';

/* Больше — меньше: группы предметов, нажми где больше (или меньше).
   Ур. 3–4 — ловушка: меньшее количество нарисовано крупнее.
   Ур. 5 — три карточки: где больше/меньше ВСЕХ. */

(function () {
  const CFG = {
    1: { lo: 1, hi: 6,  dmin: 2, dmax: 5, both: false, cards: 2 },
    2: { lo: 2, hi: 9,  dmin: 1, dmax: 4, both: true,  cards: 2 },
    3: { lo: 4, hi: 10, dmin: 1, dmax: 2, both: true,  cards: 2, trick: true },
    4: { lo: 6, hi: 12, dmin: 1, dmax: 2, both: true,  cards: 2, trick: true },
    5: { lo: 2, hi: 9,  both: true, cards: 3 }
  };

  const fsFor = cnt =>
    cnt <= 4 ? 'clamp(32px, 7.5vw, 54px)' :
    cnt <= 7 ? 'clamp(26px, 6vw, 44px)' :
    'clamp(20px, 4.5vw, 34px)';

  FX.register({
    id: 'compare',
    name: 'Больше — меньше',
    icon: '🐘',
    skill: 'Сравнение количеств',

    newRound(level, api) {
      const cfg = CFG[level] || CFG[5];

      let counts;
      if (cfg.cards === 3) {
        const range = [];
        for (let v = cfg.lo; v <= cfg.hi; v++) range.push(v);
        counts = FX.sampleN(range, 3);
      } else {
        let a, b, guard = 0;
        do {
          a = FX.rand(cfg.lo, cfg.hi);
          b = FX.rand(cfg.lo, cfg.hi);
        } while ((Math.abs(a - b) < cfg.dmin || Math.abs(a - b) > cfg.dmax || a === b) && guard++ < 200);
        if (a === b) b = a + cfg.dmin <= cfg.hi ? a + cfg.dmin : a - cfg.dmin;
        counts = [a, b];
      }

      const q = cfg.both ? FX.pick(['больше', 'меньше']) : 'больше';
      const answer = q === 'больше' ? Math.max(...counts) : Math.min(...counts);
      const qText = cfg.cards === 3 ? 'Где ' + q + ' всех?' : 'Где ' + q + '?';

      api.prompt(qText, 'Посмотри внимательно! Нажми на карточку, где ' + q +
        (cfg.cards === 3 ? ' всего предметов!' : ' предметов.'));

      const pair = FX.sampleN(FX.COUNTABLES, counts.length);
      const wrap = FX.el('div', 'halves' + (cfg.cards === 3 ? ' three' : ''));

      counts.forEach((cnt, side) => {
        const half = FX.el('button', 'half');
        let fs = fsFor(cnt);
        if (cfg.trick) {
          const isSmaller = cnt === Math.min(...counts);
          fs = isSmaller ? 'clamp(44px, 11vw, 72px)' : 'clamp(18px, 4vw, 28px)';
        }
        for (let k = 0; k < cnt; k++) {
          const it = FX.el('span', null, pair[side].e);
          it.style.fontSize = fs;
          half.appendChild(it);
        }
        half.appendChild(FX.el('span', 'cnt', String(cnt)));

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
})();
