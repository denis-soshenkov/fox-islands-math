'use strict';

/* Вычитание: часть предметов «улетает» — сколько осталось?
   Ур. 5 — наоборот: видно, сколько осталось. Сколько улетело? */

(function () {
  const CFG = {
    1: { n: [2, 5],  mMin: 1, opts: 3, mode: 'result' },
    2: { n: [4, 10], mMin: 1, opts: 4, mode: 'result' },
    3: { n: [6, 10], mMin: 3, opts: 4, mode: 'result' },
    4: { n: [7, 12], mMin: 2, opts: 4, mode: 'result' },
    5: { n: [6, 12], mMin: 2, opts: 4, mode: 'missM' }
  };

  FX.register({
    id: 'subtraction',
    name: 'Вычитание',
    icon: '➖',
    skill: 'Вычитание до 12',

    newRound(level, api) {
      const cfg = CFG[level] || CFG[5];
      const flyer = FX.pick(['🎈', '🦋', '🐦', '🐝', '🍃', '🕊️']);
      const n = FX.rand(cfg.n[0], cfg.n[1]);
      const m = FX.rand(cfg.mMin, Math.max(cfg.mMin, n - 1));
      const r = n - m;
      const missM = cfg.mode === 'missM';
      const answer = missM ? m : r;

      api.prompt(
        missM ? n + ' − ? = ' + r : n + ' − ' + m + ' = ?',
        missM
          ? 'Было ' + n + ', осталось ' + r + '. Сколько улетело? Посчитай зачёркнутые!'
          : 'Было ' + n + '. Смотри, ' + m + ' улетают! Сколько осталось?'
      );

      const row = FX.el('div', 'eq-row');
      const group = FX.el('div', 'eq-group pop-in');
      group.style.maxWidth = '360px';
      const fs = n <= 5 ? 'clamp(38px, 9vw, 60px)' : n <= 9 ? 'clamp(30px, 7vw, 50px)' : 'clamp(25px, 5.5vw, 40px)';
      const items = [];
      for (let i = 0; i < n; i++) {
        const it = FX.el('span', 'eq-item', flyer);
        it.style.fontSize = fs;
        items.push(it);
        group.appendChild(it);
      }
      row.appendChild(group);

      row.appendChild(FX.el('div', 'eq-sign', '='));
      const mystery = FX.el('div', 'eq-group mystery', '<span style="font-size:1.4em">?</span>');
      row.appendChild(mystery);
      api.stage.appendChild(row);

      /* через секунду m предметов улетают (остаются полупрозрачными с ✖) */
      const flyIdx = FX.sampleN(items.map((_, i) => i), m);
      setTimeout(() => {
        if (!group.isConnected) return;
        api.sfx('flip');
        flyIdx.forEach(i => items[i].classList.add('gone'));
      }, 900);

      const opts = FX.makeOptions(answer, cfg.opts, missM ? 1 : 0, 12);
      const optRow = FX.el('div', 'opt-row');
      opts.forEach((v, i) => {
        const btn = FX.el('button', 'num-btn v' + ((i % 4) + 1), String(v));
        btn.addEventListener('click', () => {
          if (v === answer) {
            mystery.innerHTML = '<span style="font-size:1.4em;color:#4CA958">' + answer + '</span>';
            mystery.style.borderStyle = 'solid';
            mystery.style.borderColor = '#6BCB77';
            mystery.style.background = '#E8F9EC';
            FX.replay(btn, 'correct-glow');
            api.complete(mystery);
          } else {
            api.wrong(btn);
            btn.classList.add('dim');
          }
        });
        optRow.appendChild(btn);
      });
      api.stage.appendChild(optRow);
    }
  });
})();
