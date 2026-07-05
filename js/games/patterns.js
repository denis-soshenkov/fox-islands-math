'use strict';

/* Продолжи узор: последовательность повторяется — что идёт дальше? */

(function () {
  const MOTIFS = {
    1: [[0, 1]],
    2: [[0, 0, 1], [0, 1, 1], [0, 1, 2]],
    3: [[0, 0, 1, 1], [0, 1, 2], [0, 1, 1, 0], [0, 1, 2, 2]]
  };

  FX.register({
    id: 'patterns',
    name: 'Продолжи узор',
    icon: '🌈',
    skill: 'Закономерности',

    newRound(level, api) {
      const motif = FX.pick(MOTIFS[level]);
      const m = motif.length;
      const theme = FX.pick(FX.PATTERN_THEMES);
      const nSyms = Math.max.apply(null, motif) + 1;
      const syms = FX.sampleN(theme, Math.min(theme.length, nSyms + 1));

      const seqSym = i => syms[motif[i % m]];
      let k = level === 1 ? 2 * m : FX.rand(2 * m, 2 * m + m - 1);
      if (k > 8) k = 8;
      const answer = seqSym(k);

      api.prompt('Что дальше?', 'Посмотри на узор! Что идёт дальше? Выбери!');

      const row = FX.el('div', 'pattern-row');
      for (let i = 0; i < k; i++) row.appendChild(FX.el('span', 'pat-tile pop-in', seqSym(i)));
      const slot = FX.el('span', 'pat-slot', '?');
      row.appendChild(slot);
      api.stage.appendChild(row);

      /* варианты: символы узора + один запасной из темы */
      const used = [...new Set(motif.map(ix => syms[ix]))];
      const opts = used.slice();
      for (const s of syms) {
        if (opts.length >= 3) break;
        if (!opts.includes(s)) opts.push(s);
      }
      for (const s of theme) {
        if (opts.length >= 3) break;
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
