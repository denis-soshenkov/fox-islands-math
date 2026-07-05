'use strict';

/* Цифры: показана большая цифра — найди тарелку, где столько же предметов. */

FX.register({
  id: 'digits',
  name: 'Цифры',
  icon: '5️⃣',
  skill: 'Узнавание цифр',

  newRound(level, api) {
    const d = level === 1 ? FX.rand(1, 5) : level === 2 ? FX.rand(2, 9) : FX.rand(4, 9);

    api.prompt(
      'Найди ' + d + '!',
      'Вот цифра ' + d + '! Найди тарелку, где ровно ' + d + ' предметов.'
    );

    const dcard = FX.el('div', 'digit-card pop-in', String(d));
    if (level === 1) dcard.appendChild(FX.el('div', 'digit-hint', '•'.repeat(d)));
    api.stage.appendChild(dcard);

    const counts = FX.makeOptions(d, 3, 1, 10);
    const emojis = FX.sampleN(FX.COUNTABLES, 3);

    const row = FX.el('div', 'plate-row');
    counts.forEach((cnt, i) => {
      const plate = FX.el('button', 'plate');
      for (let k = 0; k < cnt; k++) plate.appendChild(FX.el('span', null, emojis[i].e));
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
