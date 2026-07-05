'use strict';

/* Зеркало: с одной стороны узор — повтори его с другой стороны линии.
   Ур. 5 — зеркало горизонтальное (узор сверху, повторяй снизу). */

(function () {
  const CFG = {
    1: { W: 6, H: 5, cells: [4, 5],   colors: 1, hints: true, axis: 'v' },
    2: { W: 6, H: 5, cells: [6, 8],   colors: 1, axis: 'v' },
    3: { W: 8, H: 6, cells: [8, 10],  colors: 2, axis: 'v' },
    4: { W: 8, H: 6, cells: [10, 12], colors: 2, axis: 'v' },
    5: { W: 6, H: 6, cells: [8, 10],  colors: 2, axis: 'h' }
  };

  FX.register({
    id: 'symmetry',
    name: 'Зеркало',
    icon: '🪞',
    skill: 'Симметрия',
    rounds: 3,

    newRound(level, api) {
      const cfg = CFG[level] || CFG[5];
      const { W, H, axis } = cfg;
      const halfW = W / 2, halfH = H / 2;
      const targetCount = FX.rand(cfg.cells[0], cfg.cells[1]);
      const palette = cfg.colors === 2 ? FX.sampleN(FX.SHAPE_COLORS, 2) : [FX.pick(FX.SHAPE_COLORS)];

      const inSource = (r, c) => axis === 'v' ? c < halfW : r < halfH;
      const mirrorKey = (r, c) => axis === 'v'
        ? r + ',' + (W - 1 - c)
        : (H - 1 - r) + ',' + c;

      /* случайное «пятно» на исходной половине (блуждание от зеркала) */
      const src = new Map();
      let r = axis === 'v' ? FX.rand(1, H - 2) : halfH - 1;
      let c = axis === 'v' ? halfW - 1 : FX.rand(1, W - 2);
      src.set(r + ',' + c, FX.pick(palette));
      let guard = 0;
      while (src.size < targetCount && guard++ < 500) {
        const dir = FX.pick([[0, 1], [0, -1], [1, 0], [-1, 0]]);
        r = FX.clamp(r + dir[0], 0, (axis === 'h' ? halfH : H) - 1);
        c = FX.clamp(c + dir[1], 0, (axis === 'v' ? halfW : W) - 1);
        src.set(r + ',' + c, src.get(r + ',' + c) || FX.pick(palette));
      }

      const mirror = new Map();
      src.forEach((color, key) => {
        const [rr, cc] = key.split(',').map(Number);
        mirror.set(mirrorKey(rr, cc), color);
      });
      let remaining = mirror.size;

      api.prompt(
        axis === 'v' ? 'Сделай так же справа!' : 'Сделай так же снизу!',
        axis === 'v'
          ? 'Зеркало! Повтори узор с другой стороны линии.'
          : 'Зеркало легло на бочок! Повтори узор снизу.'
      );

      const wrap = FX.el('div', 'sym-wrap');
      const grid = FX.el('div', 'sym-grid');
      grid.style.gridTemplateColumns = 'repeat(' + W + ', auto)';
      const smallCells = W === 8;

      for (let rr = 0; rr < H; rr++) {
        for (let cc = 0; cc < W; cc++) {
          const key = rr + ',' + cc;
          const isSrc = inSource(rr, cc);
          const cell = FX.el('button', 'sym-cell ' + (isSrc ? 'left' : 'right'));
          if (smallCells) {
            cell.style.width = 'clamp(26px, 5vw, 44px)';
            cell.style.height = 'clamp(26px, 5vw, 44px)';
          }
          if (isSrc) {
            if (src.has(key)) {
              cell.style.background = src.get(key);
              cell.classList.add('filled');
            }
          } else {
            const need = mirror.has(key);
            if (need && cfg.hints) cell.classList.add('hint');
            cell.addEventListener('click', () => {
              if (cell.dataset.done) return;
              if (need) {
                cell.dataset.done = '1';
                cell.style.background = mirror.get(key);
                cell.classList.add('filled');
                api.sfx('pop');
                remaining--;
                if (remaining <= 0) api.complete(cell);
              } else {
                FX.replay(cell, 'flash-bad');
                api.wrong(cell);
              }
            });
          }
          grid.appendChild(cell);
        }
      }

      const line = FX.el('div', 'sym-mirror-line' + (axis === 'h' ? ' h' : ''));
      if (axis === 'v') line.style.left = '50%';
      grid.appendChild(line);
      wrap.appendChild(grid);
      api.stage.appendChild(wrap);
    }
  });
})();
