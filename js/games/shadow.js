'use strict';

/* Найди тень: перетащи предмет на его силуэт.
   С уровнями теней больше и они всё более похожи друг на друга. */

(function () {
  const DISTINCT = ['🍎', '🚗', '🦒', '⭐', '🐟', '☂️', '🎈', '🐘', '🍌', '🏠', '🦋', '🍄', '✈️', '🐢', '🌻'];
  const SIMILAR = [
    ['⚽', '🍎', '🏀', '🎈', '🌕'],      // всё круглое
    ['🥕', '🍌', '✏️', '🥒', '🪥'],      // всё длинное
    ['🐱', '🐶', '🦊', '🐰', '🐻'],      // мордочки
    ['🚗', '🚌', '🚕', '🚓', '🚜'],      // машинки
    ['⭐', '✨', '🌟', '❄️', '🌸']       // звёздочки
  ];

  const CFG = {
    1: { opts: 3, similar: false },
    2: { opts: 4, similar: false },
    3: { opts: 4, similar: true },
    4: { opts: 5, similar: true },
    5: { opts: 5, similar: true, flip: true }  // некоторые тени отражены
  };

  FX.register({
    id: 'shadow',
    name: 'Найди тень',
    icon: '🌗',
    skill: 'Внимание и форма',
    rounds: 4,

    newRound(level, api) {
      const cfg = CFG[level] || CFG[5];
      let options;
      if (cfg.similar) {
        const group = FX.pick(SIMILAR).slice();
        options = FX.sampleN(group, Math.min(cfg.opts, group.length));
        while (options.length < cfg.opts) {
          const extra = FX.pick(DISTINCT);
          if (!options.includes(extra)) options.push(extra);
        }
      } else {
        options = FX.sampleN(DISTINCT, cfg.opts);
      }
      const target = FX.pick(options);
      let done = false;

      api.prompt('Чья это тень?', 'Возьми картинку пальчиком и перетащи её на её тень!');

      const obj = FX.el('div', 'shadow-target', target);
      api.stage.appendChild(obj);

      const row = FX.el('div', 'shadow-row');
      FX.shuffle(options).forEach(e => {
        const card = FX.el('button', 'shadow-card');
        card.dataset.e = e;
        const sil = FX.el('span', 'shadow-sil', e);
        if (cfg.flip && Math.random() < 0.5) sil.style.transform = 'scaleX(-1)';
        card.appendChild(sil);
        row.appendChild(card);
      });
      api.stage.appendChild(row);

      FX.drag(obj, {
        canDrag: () => !done,
        onDrop(under) {
          const card = under && under.closest ? under.closest('.shadow-card') : null;
          if (!card) return false;
          if (card.dataset.e === target) {
            done = true;
            card.classList.add('sfound');
            card.querySelector('.shadow-sil').style.filter = 'none';
            card.querySelector('.shadow-sil').style.opacity = '1';
            obj.style.visibility = 'hidden';
            api.complete(card);
            return true;
          }
          api.wrong(card);
          return false;
        }
      });
    }
  });
})();
