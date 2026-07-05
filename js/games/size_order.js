'use strict';

/* По росту: расставь предметы от маленького к большому (или наоборот).
   Перетаскивание в ячейки-подсказки подходящего размера. */

(function () {
  const POOL = ['🐻', '🌻', '🐟', '🚗', '🌳', '🎈', '⭐', '🦆', '🍄'];
  const SCALES = {
    normal: [1, 1.5, 2.05, 2.65, 3.3],
    fine:   [1, 1.28, 1.6, 1.95, 2.35]   // размеры ближе — сложнее
  };

  const CFG = {
    1: { k: 3, randDir: false },
    2: { k: 4, randDir: false },
    3: { k: 4, randDir: true },
    4: { k: 5, randDir: true },
    5: { k: 5, randDir: true, fine: true }
  };

  FX.register({
    id: 'size_order',
    name: 'По росту',
    icon: '📏',
    skill: 'Сериация: размер',
    rounds: 4,

    newRound(level, api) {
      const cfg = CFG[level] || CFG[5];
      const desc = cfg.randDir ? Math.random() < 0.5 : false;
      const scale = SCALES[cfg.fine ? 'fine' : 'normal'];
      const emoji = FX.pick(POOL);
      const base = 26;
      const sizeOf = rank => Math.round(base * scale[rank]);

      api.prompt(
        desc ? 'От большого к маленькому!' : 'От маленького к большому!',
        desc
          ? 'Расставь по росту: сначала самый большой, потом всё меньше и меньше!'
          : 'Расставь по росту: сначала самый маленький, потом всё больше и больше!'
      );

      api.stage.appendChild(FX.el('div', 'sort-progress',
        desc ? 'большой → маленький' : 'маленький → большой'));

      let placed = 0;
      const slotRow = FX.el('div', 'slot-row');
      for (let i = 0; i < cfg.k; i++) {
        const rank = desc ? cfg.k - 1 - i : i;
        const slot = FX.el('div', 'size-slot drop-zone');
        slot.dataset.rank = String(rank);
        const px = sizeOf(rank);
        slot.style.width = (px * 1.3 + 12) + 'px';
        slot.style.height = (px * 1.3 + 12) + 'px';
        slotRow.appendChild(slot);
      }
      api.stage.appendChild(slotRow);

      /* фишки в случайном порядке (не совпадающем с ответом) */
      let order = FX.shuffle(Array.from({ length: cfg.k }, (_, i) => i));
      let guard = 0;
      while (guard++ < 20 && order.every((r, i) => r === (desc ? cfg.k - 1 - i : i))) {
        order = FX.shuffle(order);
      }

      const tray = FX.el('div', 'size-tray');
      order.forEach(rank => {
        const piece = FX.el('span', 'size-piece', emoji);
        piece.dataset.rank = String(rank);
        piece.style.fontSize = sizeOf(rank) + 'px';
        FX.drag(piece, {
          onDrop(under) {
            const slot = under && under.closest ? under.closest('.size-slot') : null;
            if (!slot || slot.classList.contains('filled')) return false;
            if (slot.dataset.rank === piece.dataset.rank) {
              slot.classList.add('filled');
              slot.textContent = emoji;
              slot.style.fontSize = sizeOf(+piece.dataset.rank) + 'px';
              piece.remove();
              api.sfx('pop');
              placed++;
              if (placed >= cfg.k) api.complete(slot);
              return true;
            }
            api.wrong(slot);
            return false;
          }
        });
        tray.appendChild(piece);
      });
      api.stage.appendChild(tray);
    }
  });
})();
