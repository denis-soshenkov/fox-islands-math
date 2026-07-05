'use strict';

/* Пропущенное число: числовой ряд с пропуском.
   Ур. 3 — обратный счёт и счёт двойками, ур. 4–5 — ДВА пропуска. */

(function () {
  const CFG = {
    1: { len: 5, gaps: 1, variants: ['asc'],            startMax: 4, gapNotFirst: true, opts: 3 },
    2: { len: 5, gaps: 1, variants: ['asc'],            startMax: 8, opts: 3 },
    3: { len: 5, gaps: 1, variants: ['desc', 'step2'],  opts: 4 },
    4: { len: 6, gaps: 2, variants: ['asc'],            startMax: 7, opts: 4 },
    5: { len: 6, gaps: 2, variants: ['step2', 'desc'],  opts: 4 }
  };

  FX.register({
    id: 'missing',
    name: 'Пропущенное число',
    icon: '❓',
    skill: 'Числовой ряд',

    newRound(level, api) {
      const cfg = CFG[level] || CFG[5];
      const variant = FX.pick(cfg.variants);

      let start, step, spokenHint;
      if (variant === 'asc') {
        start = FX.rand(1, cfg.startMax || 6);
        step = 1;
        spokenHint = 'Какое число пропущено? Посмотри на ряд!';
      } else if (variant === 'desc') {
        start = FX.rand(cfg.len + 2, 12 + (cfg.len - 5) * 2);
        step = -1;
        spokenHint = 'Считаем обратно! Какие числа пропущены?';
      } else {
        start = FX.pick([1, 2, 3]);
        step = 2;
        spokenHint = 'Считаем через одно! Что пропущено?';
      }

      const seq = Array.from({ length: cfg.len }, (_, i) => start + i * step);

      /* индексы пропусков (не соседние, чтобы было честно угадать) */
      let gapIdxs = [];
      let guard = 0;
      while (guard++ < 100) {
        const lo = cfg.gapNotFirst ? 1 : 0;
        gapIdxs = FX.sampleN(Array.from({ length: cfg.len - lo }, (_, i) => i + lo), cfg.gaps).sort((a, b) => a - b);
        if (cfg.gaps === 1 || Math.abs(gapIdxs[0] - gapIdxs[1]) > 1) break;
      }
      const answers = gapIdxs.map(i => seq[i]);

      api.prompt(cfg.gaps > 1 ? 'Какие числа пропущены?' : 'Какое число пропущено?', spokenHint);

      const line = FX.el('div', 'numline');
      const gapEls = {};
      seq.forEach((v, i) => {
        const isGap = gapIdxs.includes(i);
        const bub = FX.el('div', 'nl-bubble pop-in', isGap ? '?' : String(v));
        bub.style.animationDelay = (i * 0.07) + 's';
        if (isGap) {
          bub.classList.add('gap');
          gapEls[v] = bub;
        }
        line.appendChild(bub);
      });
      api.stage.appendChild(line);

      /* варианты: все ответы + близкие числа, которых нет в ряду */
      const optSet = new Set(answers);
      guard = 0;
      while (optSet.size < cfg.opts && guard++ < 300) {
        const base = FX.pick(answers);
        const v = base + FX.rand(1, 3) * (Math.random() < 0.5 ? -1 : 1);
        if (v >= 1 && v <= 20 && !seq.includes(v)) optSet.add(v);
      }

      let remaining = answers.slice();
      const optRow = FX.el('div', 'opt-row');
      FX.shuffle([...optSet]).forEach((v, i) => {
        const btn = FX.el('button', 'num-btn v' + ((i % 4) + 1), String(v));
        btn.addEventListener('click', () => {
          const pos = remaining.indexOf(v);
          if (pos !== -1) {
            remaining.splice(pos, 1);
            const bub = gapEls[v];
            bub.textContent = String(v);
            bub.classList.add('solved');
            btn.classList.add('dim');
            if (remaining.length === 0) {
              FX.replay(btn, 'correct-glow');
              api.complete(bub);
            } else {
              api.sfx('pop');
              FX.confettiAt(bub, 6);
            }
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
