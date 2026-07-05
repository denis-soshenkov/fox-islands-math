'use strict';

/* Цифры: показана большая цифра — найди тарелку, где столько же предметов. */

(function () {
  const CFG = {
    1: { d: [1, 5],  plates: 3, hint: true },
    2: { d: [2, 9],  plates: 3 },
    3: { d: [4, 9],  plates: 3 },
    4: { d: [5, 9],  plates: 4 },
    5: { d: [6, 10], plates: 4, near: true }   // варианты совсем близкие
  };

  FX.register({
    id: 'digits',
    name: 'Цифры',
    icon: '5️⃣',
    skill: 'Узнавание цифр',

    newRound(level, api) {
      const cfg = CFG[level] || CFG[5];
      const d = FX.rand(cfg.d[0], cfg.d[1]);

      api.prompt(
        'Найди ' + d + '!',
        'Вот число ' + d + '! Найди тарелку, где ровно ' + d + ' предметов.'
      );

      const dcard = FX.el('div', 'digit-card pop-in', String(d));
      if (cfg.hint) dcard.appendChild(FX.el('div', 'digit-hint', '•'.repeat(d)));
      api.stage.appendChild(dcard);

      const counts = cfg.near
        ? FX.makeOptions(d, cfg.plates, Math.max(1, d - 2), Math.min(12, d + 2))
        : FX.makeOptions(d, cfg.plates, 1, 12);
      const emojis = FX.sampleN(FX.COUNTABLES, counts.length);

      const row = FX.el('div', 'plate-row');
      counts.forEach((cnt, i) => {
        const plate = FX.el('button', 'plate');
        const fs = cnt <= 4 ? 'clamp(28px, 6.5vw, 44px)'
                 : cnt <= 7 ? 'clamp(22px, 5vw, 36px)'
                 : 'clamp(18px, 4vw, 30px)';
        for (let k = 0; k < cnt; k++) {
          const it = FX.el('span', null, emojis[i].e);
          it.style.fontSize = fs;
          plate.appendChild(it);
        }
        plate.addEventListener('click', () => {
          if (cnt === d) {
            api.complete(plate);
          } else {
            api.wrong(plate);
            plate.classList.add('dim');
          }
        });
        row.appendChild(plate);
      });
      api.stage.appendChild(row);
    }
  });
})();
