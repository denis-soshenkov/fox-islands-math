'use strict';

/* Пропущенное число: числовой ряд с пропуском.
   Уровень 3 — обратный счёт и счёт двойками. */

FX.register({
  id: 'missing',
  name: 'Пропущенное число',
  icon: '❓',
  skill: 'Числовой ряд',

  newRound(level, api) {
    let start, step, gapIdx;
    let spokenHint = 'Какое число пропущено? Посмотри на ряд!';

    if (level === 1) {
      start = FX.rand(1, 4); step = 1; gapIdx = FX.rand(1, 4);
    } else if (level === 2) {
      start = FX.rand(1, 8); step = 1; gapIdx = FX.rand(0, 4);
    } else {
      if (Math.random() < 0.5) {
        start = FX.rand(7, 12); step = -1;
        spokenHint = 'Считаем обратно! Какое число пропущено?';
      } else {
        start = FX.pick([1, 2, 3]); step = 2;
        spokenHint = 'Считаем через одно! Какое число пропущено?';
      }
      gapIdx = FX.rand(0, 4);
    }

    const seq = Array.from({ length: 5 }, (_, i) => start + i * step);
    const answer = seq[gapIdx];

    api.prompt('Какое число пропущено?', spokenHint);

    const line = FX.el('div', 'numline');
    let gapEl = null;
    seq.forEach((v, i) => {
      const bub = FX.el('div', 'nl-bubble pop-in', i === gapIdx ? '?' : String(v));
      bub.style.animationDelay = (i * 0.07) + 's';
      if (i === gapIdx) {
        bub.classList.add('gap');
        gapEl = bub;
      }
      line.appendChild(bub);
    });
    api.stage.appendChild(line);

    const lo = Math.max(step === 2 ? 1 : 0, answer - 3);
    const opts = FX.makeOptions(answer, level === 3 ? 4 : 3, Math.max(1, lo - 1), Math.max(answer + 3, 14));
    const optRow = FX.el('div', 'opt-row');
    opts.forEach((v, i) => {
      const btn = FX.el('button', 'num-btn v' + ((i % 4) + 1), String(v));
      btn.addEventListener('click', () => {
        if (v === answer) {
          gapEl.textContent = String(answer);
          gapEl.classList.add('solved');
          FX.replay(btn, 'correct-glow');
          api.complete(gapEl);
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
