'use strict';

/* Зеркало: слева узор — повтори его справа от зеркальной линии. */

FX.register({
  id: 'symmetry',
  name: 'Зеркало',
  icon: '🪞',
  skill: 'Симметрия',
  rounds: 3,

  newRound(level, api) {
    const W = level === 3 ? 8 : 6;
    const H = level === 3 ? 6 : 5;
    const half = W / 2;
    const targetCount = level === 1 ? FX.rand(4, 5) : level === 2 ? FX.rand(6, 8) : FX.rand(8, 10);
    const palette = level === 3 ? FX.sampleN(FX.SHAPE_COLORS, 2) : [FX.pick(FX.SHAPE_COLORS)];

    /* случайное «пятно» на левой половине (блуждание от зеркала) */
    const leftCells = new Map(); // 'r,c' -> цвет
    let r = FX.rand(1, H - 2);
    let c = half - 1;
    leftCells.set(r + ',' + c, FX.pick(palette));
    let guard = 0;
    while (leftCells.size < targetCount && guard++ < 500) {
      const dir = FX.pick([[0, 1], [0, -1], [1, 0], [-1, 0]]);
      r = FX.clamp(r + dir[0], 0, H - 1);
      c = FX.clamp(c + dir[1], 0, half - 1);
      leftCells.set(r + ',' + c, leftCells.get(r + ',' + c) || FX.pick(palette));
    }

    /* зеркальные клетки справа */
    const mirror = new Map();
    leftCells.forEach((color, key) => {
      const [rr, cc] = key.split(',').map(Number);
      mirror.set(rr + ',' + (W - 1 - cc), color);
    });
    let remaining = mirror.size;

    api.prompt('Сделай так же справа!', 'Зеркало! Повтори узор с другой стороны линии.');

    const wrap = FX.el('div', 'sym-wrap');
    const grid = FX.el('div', 'sym-grid');
    grid.style.gridTemplateColumns = 'repeat(' + W + ', auto)';
    const small = W === 8;

    for (let rr = 0; rr < H; rr++) {
      for (let cc = 0; cc < W; cc++) {
        const key = rr + ',' + cc;
        const isLeft = cc < half;
        const cell = FX.el('button', 'sym-cell ' + (isLeft ? 'left' : 'right'));
        if (small) {
          cell.style.width = 'clamp(24px, 4.6vw, 42px)';
          cell.style.height = 'clamp(24px, 4.6vw, 42px)';
        }
        if (isLeft) {
          if (leftCells.has(key)) {
            cell.style.background = leftCells.get(key);
            cell.classList.add('filled');
          }
        } else {
          const need = mirror.has(key);
          if (need && level === 1) cell.classList.add('hint');
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

    const line = FX.el('div', 'sym-mirror-line');
    line.style.left = '50%';
    grid.appendChild(line);
    wrap.appendChild(grid);
    api.stage.appendChild(wrap);
  }
});
