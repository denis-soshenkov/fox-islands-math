'use strict';

/* Сложение: наглядные суммы предметами.
   Ур. 3 — пропущенное второе слагаемое, ур. 5 — пропуск где угодно. */

(function () {
  const CFG = {
    1: { mode: 'sum',     sMin: 2, sMax: 5,  opts: 3 },
    2: { mode: 'sum',     sMin: 3, sMax: 10, opts: 4 },
    3: { mode: 'missB',   sMin: 4, sMax: 10, opts: 4 },
    4: { mode: 'sum',     sMin: 6, sMax: 12, opts: 4 },
    5: { mode: 'missAny', sMin: 4, sMax: 12, opts: 4 }
  };

  const fsFor = cnt =>
    cnt <= 4 ? 'clamp(32px, 7vw, 50px)' :
    cnt <= 7 ? 'clamp(26px, 6vw, 42px)' :
    'clamp(22px, 5vw, 34px)';

  function group(count, emoji) {
    const g = FX.el('div', 'eq-group pop-in');
    const fs = fsFor(count);
    for (let i = 0; i < count; i++) {
      const it = FX.el('span', 'eq-item', emoji);
      it.style.fontSize = fs;
      g.appendChild(it);
    }
    return g;
  }

  function mysteryBox() {
    return FX.el('div', 'eq-group mystery pop-in', '<span style="font-size:1.4em">?</span>');
  }

  function numberCard(v) {
    const g = FX.el('div', 'eq-group pop-in');
    const b = FX.el('b', null, String(v));
    b.style.fontSize = '1.7em';
    b.style.color = '#4D96FF';
    g.appendChild(b);
    return g;
  }

  FX.register({
    id: 'addition',
    name: 'Сложение',
    icon: '➕',
    skill: 'Сложение до 12',

    newRound(level, api) {
      const cfg = CFG[level] || CFG[5];
      const c = FX.pick(FX.COUNTABLES);
      const s = FX.rand(cfg.sMin, cfg.sMax);
      const a = FX.rand(1, s - 1);
      const b = s - a;

      let mystery, answer, caption, spoken;
      const row = FX.el('div', 'eq-row');

      if (cfg.mode === 'sum') {
        answer = s;
        caption = a + ' + ' + b + ' = ?';
        spoken = a + ' плюс ' + b + '. Сколько всего?';
        row.appendChild(group(a, c.e));
        row.appendChild(FX.el('div', 'eq-sign', '+'));
        row.appendChild(group(b, c.e));
        row.appendChild(FX.el('div', 'eq-sign', '='));
        mystery = mysteryBox();
        row.appendChild(mystery);
      } else {
        const missFirst = cfg.mode === 'missAny' && Math.random() < 0.5;
        if (missFirst) {
          answer = a;
          caption = '? + ' + b + ' = ' + s;
          spoken = 'Сколько плюс ' + b + ' будет ' + s + '?';
          mystery = mysteryBox();
          row.appendChild(mystery);
          row.appendChild(FX.el('div', 'eq-sign', '+'));
          row.appendChild(group(b, c.e));
        } else {
          answer = b;
          caption = a + ' + ? = ' + s;
          spoken = a + ' плюс сколько будет ' + s + '?';
          row.appendChild(group(a, c.e));
          row.appendChild(FX.el('div', 'eq-sign', '+'));
          mystery = mysteryBox();
          row.appendChild(mystery);
        }
        row.appendChild(FX.el('div', 'eq-sign', '='));
        row.appendChild(numberCard(s));
      }

      api.prompt(caption, spoken);
      api.stage.appendChild(row);

      const opts = FX.makeOptions(answer, cfg.opts, 1, 14);
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
