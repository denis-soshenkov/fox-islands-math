'use strict';

/* Весёлый счёт: посчитай предметы на поляне и нажми нужную цифру.
   Тап по предмету вешает на него номер — помогает считать пальчиком. */

FX.register({
  id: 'counting',
  name: 'Весёлый счёт',
  icon: '🦋',
  skill: 'Счёт предметов до 10',

  newRound(level, api) {
    const c = FX.pick(FX.COUNTABLES);
    let n, optCount, distractor = null, dCount = 0;
    if (level === 1) { n = FX.rand(2, 5); optCount = 3; }
    else if (level === 2) { n = FX.rand(4, 9); optCount = 4; }
    else {
      n = FX.rand(5, 10);
      optCount = 4;
      distractor = FX.pick(FX.COUNTABLES.filter(x => x.e !== c.e));
      dCount = FX.rand(2, 4);
    }

    api.prompt(
      'Сколько ' + c.e + '?',
      level === 3
        ? 'Будь внимателен! Посчитай только ' + c.plural + '. Сколько их?'
        : 'Посчитай, сколько ' + c.plural + ', и нажми цифру!'
    );

    const field = FX.el('div', 'count-field');

    /* решётка 5×3 с дрожанием, чтобы предметы не слипались */
    const cells = [];
    for (let r = 0; r < 3; r++) for (let col = 0; col < 5; col++) cells.push([col, r]);
    const spots = FX.shuffle(cells).slice(0, n + dCount);

    let counted = 0;
    spots.forEach(([col, r], idx) => {
      const isTarget = idx < n;
      const item = FX.el('span', 'float-item', isTarget ? c.e : distractor.e);
      item.style.left = (col * 20 + 10 + FX.rand(-4, 4)) + '%';
      item.style.top = (r * 33.3 + 16.6 + FX.rand(-7, 7)) + '%';
      item.style.animationDelay = -(FX.rand(0, 25) / 10) + 's';
      item.addEventListener('click', () => {
        if (isTarget) {
          if (item.dataset.counted) return;
          item.dataset.counted = '1';
          counted++;
          const badge = FX.el('span', 'count-badge pop-in', String(counted));
          item.appendChild(badge);
          api.sfx('pop');
        } else {
          FX.replay(item, 'shake');
          api.sfx('flip');
        }
      });
      field.appendChild(item);
    });
    api.stage.appendChild(field);

    const row = FX.el('div', 'opt-row');
    FX.makeOptions(n, optCount, 1, 12).forEach((v, i) => {
      const btn = FX.el('button', 'num-btn v' + ((i % 4) + 1), String(v));
      btn.addEventListener('click', () => {
        if (v === n) {
          FX.replay(btn, 'correct-glow');
          api.complete(btn);
        } else {
          api.wrong(btn);
          btn.classList.add('dim');
        }
      });
      row.appendChild(btn);
    });
    api.stage.appendChild(row);
  }
});
