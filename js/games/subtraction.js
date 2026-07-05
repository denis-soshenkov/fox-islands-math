'use strict';

/* Вычитание: часть предметов «улетает» — сколько осталось? */

FX.register({
  id: 'subtraction',
  name: 'Вычитание',
  icon: '➖',
  skill: 'Вычитание до 10',

  newRound(level, api) {
    const flyer = FX.pick(['🎈', '🦋', '🐦', '🐝', '🍃', '🕊️']);
    let n, m;
    if (level === 1) { n = FX.rand(2, 5); m = FX.rand(1, n - 1); }
    else if (level === 2) { n = FX.rand(4, 10); m = FX.rand(1, n - 1); }
    else { n = FX.rand(6, 10); m = FX.rand(3, n - 1); }
    const answer = n - m;

    api.prompt(
      n + ' − ' + m + ' = ?',
      'Было ' + n + '. Смотри, ' + m + ' улетают! Сколько осталось?'
    );

    const row = FX.el('div', 'eq-row');
    const group = FX.el('div', 'eq-group pop-in');
    group.style.maxWidth = '340px';
    const items = [];
    for (let i = 0; i < n; i++) {
      const it = FX.el('span', 'eq-item', flyer);
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

    const opts = FX.makeOptions(answer, level === 1 ? 3 : 4, 0, 10);
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
