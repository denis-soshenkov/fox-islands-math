'use strict';

/* Сложение: наглядные суммы предметами.
   Уровень 3 — пропущенное слагаемое: a + ? = s. */

FX.register({
  id: 'addition',
  name: 'Сложение',
  icon: '➕',
  skill: 'Сложение до 10',

  newRound(level, api) {
    const c = FX.pick(FX.COUNTABLES);
    let a, b, s, answer, mysteryMiddle = false;

    if (level === 1) {
      a = FX.rand(1, 4); b = FX.rand(1, 5 - a);
      s = a + b; answer = s;
    } else if (level === 2) {
      a = FX.rand(2, 8); b = FX.rand(1, Math.min(8, 10 - a));
      s = a + b; answer = s;
    } else {
      s = FX.rand(4, 10); a = FX.rand(1, s - 1); b = s - a;
      answer = b; mysteryMiddle = true;
    }

    if (mysteryMiddle) {
      api.prompt(a + ' + ? = ' + s, a + ' плюс сколько будет ' + s + '?');
    } else {
      api.prompt(a + ' + ' + b + ' = ?', a + ' плюс ' + b + '. Сколько всего?');
    }

    const row = FX.el('div', 'eq-row');

    const groupA = FX.el('div', 'eq-group pop-in');
    for (let i = 0; i < a; i++) groupA.appendChild(FX.el('span', 'eq-item', c.e));
    row.appendChild(groupA);
    row.appendChild(FX.el('div', 'eq-sign', '+'));

    let mystery;
    if (mysteryMiddle) {
      mystery = FX.el('div', 'eq-group mystery pop-in', '<span style="font-size:1.4em">?</span>');
      row.appendChild(mystery);
      row.appendChild(FX.el('div', 'eq-sign', '='));
      const sumCard = FX.el('div', 'eq-group pop-in');
      const bigNum = FX.el('b', null, String(s));
      bigNum.style.fontSize = '1.7em';
      bigNum.style.color = '#4D96FF';
      sumCard.appendChild(bigNum);
      row.appendChild(sumCard);
    } else {
      const groupB = FX.el('div', 'eq-group pop-in');
      for (let i = 0; i < b; i++) groupB.appendChild(FX.el('span', 'eq-item', c.e));
      row.appendChild(groupB);
      row.appendChild(FX.el('div', 'eq-sign', '='));
      mystery = FX.el('div', 'eq-group mystery pop-in', '<span style="font-size:1.4em">?</span>');
      row.appendChild(mystery);
    }
    api.stage.appendChild(row);

    const opts = FX.makeOptions(answer, level === 1 ? 3 : 4, 1, 12);
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
