'use strict';

/* Найди пару: карточка с цифрой + карточка с таким же числом предметов.
   Промахи памяти прощаются: ошибки считаются только сверх «естественных». */

(function () {
  const CFG = {
    1: { pairs: 3, cols: 3, maxN: 5 },
    2: { pairs: 4, cols: 4, maxN: 8 },
    3: { pairs: 6, cols: 4, maxN: 9 },
    4: { pairs: 6, cols: 4, maxN: 10 },
    5: { pairs: 8, cols: 4, maxN: 12 }
  };

  FX.register({
    id: 'memory',
    name: 'Найди пару',
    icon: '🃏',
    skill: 'Память и количество',
    rounds: 2,

    newRound(level, api) {
      const cfg = CFG[level] || CFG[5];
      const range = Array.from({ length: cfg.maxN }, (_, i) => i + 1);
      const nums = FX.sampleN(range, cfg.pairs);
      const ems = FX.sampleN(FX.COUNTABLES, cfg.pairs);

      api.prompt('Найди пары!', 'Найди пары! Цифра и столько же предметов.');

      const cards = FX.shuffle(nums.flatMap((v, i) => ([
        { v, kind: 'num' },
        { v, kind: 'obj', e: ems[i].e }
      ])));

      const grid = FX.el('div', 'mem-grid' + (cfg.pairs >= 8 ? ' dense' : ''));
      grid.style.gridTemplateColumns = 'repeat(' + cfg.cols + ', auto)';

      let open = [];
      let busy = false;
      let matched = 0;
      let mismatches = 0;

      cards.forEach(cardDef => {
        const btn = FX.el('button', 'mem-card');
        const inner = FX.el('div', 'mem-inner');
        inner.appendChild(FX.el('div', 'mem-face mem-back', '❓'));
        const front = FX.el('div', 'mem-face mem-front');
        if (cardDef.kind === 'num') {
          front.appendChild(FX.el('span', 'big-num', String(cardDef.v)));
        } else {
          if (cardDef.v > 9) front.style.fontSize = 'clamp(12px, 2.2vw, 17px)';
          else if (cardDef.v > 6) front.style.fontSize = 'clamp(14px, 2.6vw, 20px)';
          for (let i = 0; i < cardDef.v; i++) front.appendChild(FX.el('span', null, cardDef.e));
        }
        inner.appendChild(front);
        btn.appendChild(inner);

        btn.addEventListener('click', () => {
          if (busy || btn.classList.contains('flipped') || btn.classList.contains('matched')) return;
          api.sfx('flip');
          btn.classList.add('flipped');
          open.push({ v: cardDef.v, el: btn });

          if (open.length === 2) {
            busy = true;
            const [a, b] = open;
            if (a.v === b.v) {
              setTimeout(() => {
                a.el.classList.add('matched');
                b.el.classList.add('matched');
                api.sfx('correct');
                FX.confettiAt(b.el, 7);
                matched++;
                open = [];
                busy = false;
                if (matched >= cfg.pairs) {
                  api.reportMistakes(Math.max(0, mismatches - cfg.pairs));
                  api.complete(b.el);
                }
              }, 380);
            } else {
              mismatches++;
              setTimeout(() => {
                a.el.classList.remove('flipped');
                b.el.classList.remove('flipped');
                api.sfx('flip');
                open = [];
                busy = false;
              }, 950);
            }
          }
        });
        grid.appendChild(btn);
      });

      api.stage.appendChild(grid);
    }
  });
})();
