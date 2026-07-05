'use strict';

/* Весёлый счёт: посчитай предметы на поляне и нажми нужную цифру.
   Тап по предмету вешает на него номер — помогает считать пальчиком.
   Размер предметов подстраивается под их количество (крупно на телефоне). */

(function () {
  const CFG = {
    1: { n: [2, 5],  opts: 3, dTypes: 0, d: [0, 0] },
    2: { n: [4, 9],  opts: 4, dTypes: 0, d: [0, 0] },
    3: { n: [5, 10], opts: 4, dTypes: 1, d: [2, 4] },
    4: { n: [7, 12], opts: 4, dTypes: 1, d: [3, 5] },
    5: { n: [8, 13], opts: 4, dTypes: 2, d: [4, 6] }
  };

  FX.register({
    id: 'counting',
    name: 'Весёлый счёт',
    icon: '🦋',
    skill: 'Счёт предметов',

    newRound(level, api) {
      const cfg = CFG[level] || CFG[5];
      const c = FX.pick(FX.COUNTABLES);
      const n = FX.rand(cfg.n[0], cfg.n[1]);
      const dCount = cfg.dTypes ? FX.rand(cfg.d[0], cfg.d[1]) : 0;
      const distractors = cfg.dTypes
        ? FX.sampleN(FX.COUNTABLES.filter(x => x.e !== c.e), cfg.dTypes)
        : [];

      api.prompt(
        'Сколько ' + c.e + '?',
        cfg.dTypes
          ? 'Будь внимателен! Посчитай только ' + c.plural + '. Сколько их?'
          : 'Посчитай, сколько ' + c.plural + ', и нажми цифру!'
      );

      const field = FX.el('div', 'count-field');
      const total = n + dCount;
      const rows = total > 15 ? 4 : 3;
      const rowH = 100 / rows;
      const size = FX.itemSize(total);

      const cells = [];
      for (let r = 0; r < rows; r++) for (let col = 0; col < 5; col++) cells.push([col, r]);
      const spots = FX.shuffle(cells).slice(0, total);

      let counted = 0;
      spots.forEach(([col, r], idx) => {
        const isTarget = idx < n;
        const emoji = isTarget ? c.e : distractors[idx % cfg.dTypes].e;
        const item = FX.el('span', 'float-item', emoji);
        item.style.fontSize = size;
        item.style.left = (col * 20 + 10 + FX.rand(-3, 3)) + '%';
        item.style.top = (r * rowH + rowH / 2 + FX.rand(-5, 5)) + '%';
        item.style.animationDelay = -(FX.rand(0, 25) / 10) + 's';
        item.addEventListener('click', () => {
          if (isTarget) {
            if (item.dataset.counted) return;
            item.dataset.counted = '1';
            counted++;
            item.appendChild(FX.el('span', 'count-badge pop-in', String(counted)));
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
      FX.makeOptions(n, cfg.opts, 1, 15).forEach((v, i) => {
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
})();
