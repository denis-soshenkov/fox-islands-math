'use strict';

/* Найди фигуры: тапни все фигуры нужного вида среди других.
   Ур. 4 — все фигуры одного цвета (важна только форма).
   Ур. 5 — найди все МАЛЕНЬКИЕ фигуры нужного вида. */

(function () {
  const DEFS = {
    circle:   { find: 'все круги',          spoken: 'Найди все круги!' },
    square:   { find: 'все квадраты',       spoken: 'Найди все квадраты!' },
    triangle: { find: 'все треугольники',   spoken: 'Найди все треугольники!' },
    rect:     { find: 'все прямоугольники', spoken: 'Найди все прямоугольники!' },
    star:     { find: 'все звёзды',         spoken: 'Найди все звёзды!' },
    oval:     { find: 'все овалы',          spoken: 'Найди все овалы!' }
  };

  const CFG = {
    1: { pool: ['circle', 'square', 'triangle'], grid: 6,  cols: 3, targets: [2, 3] },
    2: { pool: ['circle', 'square', 'triangle', 'rect', 'star'], grid: 8, cols: 4, targets: [3, 3], rot: true },
    3: { pool: ['circle', 'square', 'triangle', 'rect', 'star', 'oval'], grid: 12, cols: 4, targets: [3, 4], rot: true },
    4: { pool: ['circle', 'square', 'triangle', 'rect', 'star', 'oval'], grid: 12, cols: 4, targets: [4, 5], rot: true, mono: true },
    5: { pool: ['circle', 'square', 'triangle', 'rect', 'star', 'oval'], grid: 12, cols: 4, targets: [3, 4], rot: true, small: true }
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

  function makeShape(type, opts) {
    const color = opts.color || FX.pick(FX.SHAPE_COLORS);
    const svg = FX.svg('svg', { viewBox: '0 0 100 100' });
    let node;
    switch (type) {
      case 'circle':
        node = FX.svg('circle', { cx: 50, cy: 50, r: FX.rand(32, 42), fill: color });
        break;
      case 'square': {
        const s = FX.rand(56, 70);
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
        const rx = FX.rand(38, 45), ry = FX.rand(19, 25);
        node = FX.svg('ellipse', { cx: 50, cy: 50, rx: rx, ry: ry, fill: color });
        break;
      }
    }
    let tf = '';
    if (opts.rot) {
      const maxA = type === 'square' ? 16 : 40;
      tf += 'rotate(' + FX.rand(-maxA, maxA) + ' 50 50)';
    }
    if (opts.small) {
      tf += ' translate(50 50) scale(0.52) translate(-50 -50)';
    }
    if (tf) node.setAttribute('transform', tf.trim());
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
      const cfg = CFG[level] || CFG[5];
      const target = FX.pick(cfg.pool);
      const others = cfg.pool.filter(t => t !== target);
      const targets = FX.rand(cfg.targets[0], cfg.targets[1]);
      const mono = cfg.mono ? FX.pick(FX.SHAPE_COLORS) : null;

      /* клетки: {type, small, isTarget} */
      const cells = [];
      for (let i = 0; i < targets; i++) {
        cells.push({ type: target, small: !!cfg.small, isTarget: true });
      }
      if (cfg.small) {
        const bigSame = FX.rand(2, 3); // большие фигуры того же вида — не считаются!
        for (let i = 0; i < bigSame; i++) cells.push({ type: target, small: false, isTarget: false });
      }
      while (cells.length < cfg.grid) {
        cells.push({ type: FX.pick(others), small: cfg.small ? Math.random() < 0.4 : false, isTarget: false });
      }
      const board = FX.shuffle(cells);

      const findText = cfg.small
        ? DEFS[target].find.replace('все ', 'все маленькие ')
        : DEFS[target].find;
      api.prompt('Найди ' + findText + '!',
        cfg.small
          ? 'Найди только маленькие! ' + DEFS[target].spoken.replace('Найди все', 'Маленькие')
          : DEFS[target].spoken);

      const caption = FX.el('div', 'sort-progress', 'Найдено: 0 из ' + targets);
      api.stage.appendChild(caption);

      let found = 0;
      const grid = FX.el('div', 'shape-grid');
      grid.style.gridTemplateColumns = 'repeat(' + cfg.cols + ', 1fr)';

      board.forEach(cellDef => {
        const cell = FX.el('button', 'shape-cell');
        cell.appendChild(makeShape(cellDef.type, { rot: cfg.rot, small: cellDef.small, color: mono }));
        cell.addEventListener('click', () => {
          if (cell.classList.contains('found')) return;
          if (cellDef.isTarget) {
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
