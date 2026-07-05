'use strict';

/* Найди фигуры: тапни все фигуры нужного вида среди других. */

(function () {
  const DEFS = {
    circle:   { find: 'все круги',          spoken: 'Найди все круги!' },
    square:   { find: 'все квадраты',       spoken: 'Найди все квадраты!' },
    triangle: { find: 'все треугольники',   spoken: 'Найди все треугольники!' },
    rect:     { find: 'все прямоугольники', spoken: 'Найди все прямоугольники!' },
    star:     { find: 'все звёзды',         spoken: 'Найди все звёзды!' },
    oval:     { find: 'все овалы',          spoken: 'Найди все овалы!' }
  };

  function starPoints(cx, cy, R, r) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const ang = (-90 + i * 36) * Math.PI / 180;
      const rad = i % 2 === 0 ? R : r;
      pts.push((cx + rad * Math.cos(ang)).toFixed(1) + ',' + (cy + rad * Math.sin(ang)).toFixed(1));
    }
    return pts.join(' ');
  }

  function makeShape(type, rotated) {
    const color = FX.pick(FX.SHAPE_COLORS);
    const svg = FX.svg('svg', { viewBox: '0 0 100 100' });
    let node;
    switch (type) {
      case 'circle':
        node = FX.svg('circle', { cx: 50, cy: 50, r: FX.rand(30, 42), fill: color });
        break;
      case 'square': {
        const s = FX.rand(54, 70);
        node = FX.svg('rect', { x: 50 - s / 2, y: 50 - s / 2, width: s, height: s, rx: 7, fill: color });
        break;
      }
      case 'rect': {
        const w = FX.rand(68, 84), h = FX.rand(28, 42);
        node = FX.svg('rect', { x: 50 - w / 2, y: 50 - h / 2, width: w, height: h, rx: 7, fill: color });
        break;
      }
      case 'triangle': {
        const spread = FX.rand(30, 40);
        node = FX.svg('polygon', { points: '50,' + FX.rand(8, 16) + ' ' + (50 + spread) + ',84 ' + (50 - spread) + ',84', fill: color });
        break;
      }
      case 'star':
        node = FX.svg('polygon', { points: starPoints(50, 53, 42, 17), fill: color });
        break;
      case 'oval': {
        const rx = FX.rand(36, 45), ry = FX.rand(19, 26);
        node = FX.svg('ellipse', { cx: 50, cy: 50, rx: rx, ry: ry, fill: color });
        break;
      }
    }
    if (rotated) {
      const maxA = type === 'square' ? 16 : 40;
      node.setAttribute('transform', 'rotate(' + FX.rand(-maxA, maxA) + ' 50 50)');
    }
    svg.appendChild(node);
    return svg;
  }

  FX.register({
    id: 'shapes',
    name: 'Найди фигуры',
    icon: '🔷',
    skill: 'Геометрические фигуры',
    rounds: 4,

    newRound(level, api) {
      const pool = level === 1
        ? ['circle', 'square', 'triangle']
        : level === 2
          ? ['circle', 'square', 'triangle', 'rect', 'star']
          : ['circle', 'square', 'triangle', 'rect', 'star', 'oval'];
      const gridSize = level === 1 ? 6 : level === 2 ? 8 : 12;
      const cols = level === 1 ? 3 : 4;
      const targets = level === 1 ? FX.rand(2, 3) : level === 2 ? 3 : FX.rand(3, 4);
      const rotated = level >= 2;

      const target = FX.pick(pool);
      const others = pool.filter(t => t !== target);

      const types = [];
      for (let i = 0; i < targets; i++) types.push(target);
      while (types.length < gridSize) types.push(FX.pick(others));
      const cells = FX.shuffle(types);

      api.prompt('Найди ' + DEFS[target].find + '!', DEFS[target].spoken);

      const caption = FX.el('div', 'sort-progress', 'Найдено: 0 из ' + targets);
      api.stage.appendChild(caption);

      let found = 0;
      const grid = FX.el('div', 'shape-grid');
      grid.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';

      cells.forEach(type => {
        const cell = FX.el('button', 'shape-cell');
        cell.appendChild(makeShape(type, rotated));
        cell.addEventListener('click', () => {
          if (cell.classList.contains('found')) return;
          if (type === target) {
            cell.classList.add('found');
            api.sfx('pop');
            FX.confettiAt(cell, 5);
            found++;
            caption.textContent = 'Найдено: ' + found + ' из ' + targets;
            if (found >= targets) api.complete(cell);
          } else {
            api.wrong(cell);
          }
        });
        grid.appendChild(cell);
      });

      api.stage.appendChild(grid);
    }
  });
})();
