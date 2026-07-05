'use strict';

/* Продолжи узор: последовательность повторяется — что идёт дальше?
   Ур. 5 — пропуск прячется В СЕРЕДИНЕ узора. */

(function () {
  const MOTIFS = {
    1: [[0, 1]],
    2: [[0, 0, 1], [0, 1, 1], [0, 1, 2]],
    3: [[0, 0, 1, 1], [0, 1, 2], [0, 1, 1, 0], [0, 1, 2, 2]],
    4: [[0, 1, 2, 3], [0, 0, 1, 2], [0, 1, 0, 2], [0, 1, 2, 2]],
    5: [[0, 1], [0, 0, 1], [0, 1, 2], [0, 1, 1, 0]]
  };

  FX.register({
    id: 'patterns',
    name: 'Продолжи узор',
    icon: '🌈',
    skill: 'Закономерности',

    newRound(level, api) {
      const motifs = MOTIFS[level] || MOTIFS[5];
      const motif = FX.pick(motifs);
      const m = motif.length;
      const theme = FX.pick(FX.PATTERN_THEMES);
      const nSyms = Math.max.apply(null, motif) + 1;
      const syms = FX.sampleN(theme, Math.min(theme.length, nSyms + 1));
      const seqSym = i => syms[motif[i % m]];

      /* сколько плиток показываем и где пропуск */
      let total, slotIdx;
      if (level === 5) {
        total = Math.min(2 * m + FX.rand(1, m), 8);
        slotIdx = FX.rand(1, total - 2);   // в середине!
      } else {
        const k = level === 1 ? 2 * m : Math.min(FX.rand(2 * m, 2 * m + m - 1), 8);
        total = k + 1;
        slotIdx = k;                       // в конце
      }
      const answer = seqSym(slotIdx);

      api.prompt(
        level === 5 ? 'Что спряталось?' : 'Что дальше?',
        level === 5
          ? 'Хитрый узор! Какая картинка спряталась в серединке?'
          : 'Посмотри на узор! Что идёт дальше? Выбери!'
      );

      const row = FX.el('div', 'pattern-row');
      let slot = null;
      for (let i = 0; i < total; i++) {
        if (i === slotIdx) {
          slot = FX.el('span', 'pat-slot', '?');
          row.appendChild(slot);
        } else {
          row.appendChild(FX.el('span', 'pat-tile pop-in', seqSym(i)));
        }
      }
      api.stage.appendChild(row);

      /* варианты: символы узора + запасные из темы */
      const optCount = level >= 4 ? 4 : 3;
      const used = [...new Set(motif.map(ix => syms[ix]))];
      const opts = used.slice();
      for (const s of syms) {
        if (opts.length >= optCount) break;
        if (!opts.includes(s)) opts.push(s);
      }
      for (const s of theme) {
        if (opts.length >= optCount) break;
        if (!opts.includes(s)) opts.push(s);
      }

      const optRow = FX.el('div', 'opt-row');
      FX.shuffle(opts).forEach(sym => {
        const btn = FX.el('button', 'num-btn emoji-opt', sym);
        btn.addEventListener('click', () => {
          if (sym === answer) {
            slot.textContent = answer;
            slot.classList.add('solved');
            optRow.querySelectorAll('button').forEach(b => b.classList.add('dim'));
            api.complete(slot);
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
