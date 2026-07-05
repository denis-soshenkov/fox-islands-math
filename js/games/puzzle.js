'use strict';

/* Заплатки: перетащи каждую фигуру в её отверстие (шейп-сортер).
   С уровнями появляются похожие пары: квадрат/прямоугольник, круг/овал. */

(function () {
  const starPts = (() => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const ang = (-90 + i * 36) * Math.PI / 180;
      const rad = i % 2 === 0 ? 42 : 17;
      pts.push((50 + rad * Math.cos(ang)).toFixed(1) + ',' + (53 + rad * Math.sin(ang)).toFixed(1));
    }
    return pts.join(' ');
  })();

  /* фиксированная геометрия: дырка и заплатка совпадают точь-в-точь */
  function shapeSvg(type, color) {
    const svg = FX.svg('svg', { viewBox: '0 0 100 100' });
    let node;
    switch (type) {
      case 'circle':   node = FX.svg('circle', { cx: 50, cy: 50, r: 38, fill: color }); break;
      case 'square':   node = FX.svg('rect', { x: 16, y: 16, width: 68, height: 68, rx: 8, fill: color }); break;
      case 'rect':     node = FX.svg('rect', { x: 10, y: 31, width: 80, height: 38, rx: 8, fill: color }); break;
      case 'triangle': node = FX.svg('polygon', { points: '50,12 88,84 12,84', fill: color }); break;
      case 'star':     node = FX.svg('polygon', { points: starPts, fill: color }); break;
      case 'oval':     node = FX.svg('ellipse', { cx: 50, cy: 50, rx: 42, ry: 24, fill: color }); break;
    }
    svg.appendChild(node);
    return svg;
  }

  function typesFor(level) {
    if (level === 1) return FX.sampleN(['circle', 'square', 'triangle', 'star'], 2);
    if (level === 2) return FX.sampleN(['circle', 'square', 'triangle', 'star'], 3);
    if (level === 3) return ['square', 'rect'].concat(FX.sampleN(['circle', 'triangle', 'star'], 1));
    if (level === 4) return ['circle', 'oval'].concat(FX.sampleN(['square', 'rect', 'triangle', 'star'], 2));
    return FX.sampleN(['circle', 'oval', 'square', 'rect', 'triangle', 'star'], 5);
  }

  FX.register({
    id: 'puzzle',
    name: 'Заплатки',
    icon: '🧩',
    skill: 'Форма и моторика',
    rounds: 4,

    newRound(level, api) {
      const types = FX.shuffle(typesFor(level));
      const colors = FX.sampleN(FX.SHAPE_COLORS, types.length);
      let filled = 0;

      api.prompt('Почини коврик!', 'На коврике дырки! Перетащи каждую заплатку на своё место.');

      const board = FX.el('div', 'puzzle-board');
      const holes = {};
      types.forEach(t => {
        const hole = FX.el('div', 'hole');
        hole.dataset.type = t;
        hole.appendChild(shapeSvg(t, '#c9d2e3'));
        holes[t] = hole;
        board.appendChild(hole);
      });
      api.stage.appendChild(board);

      const tray = FX.el('div', 'puzzle-tray');
      FX.shuffle(types).forEach((t, i) => {
        const piece = FX.el('div', 'piece');
        piece.appendChild(shapeSvg(t, colors[i]));
        FX.drag(piece, {
          onDrop(under) {
            const hole = under && under.closest ? under.closest('.hole') : null;
            if (!hole || hole.classList.contains('filled')) return false;
            if (hole.dataset.type === t) {
              hole.classList.add('filled');
              hole.innerHTML = '';
              hole.appendChild(shapeSvg(t, colors[i]));
              piece.remove();
              api.sfx('pop');
              FX.confettiAt(hole, 6);
              filled++;
              if (filled >= types.length) api.complete(hole);
              return true;
            }
            FX.replay(hole, 'shake');
            api.wrong(hole);
            return false;
          }
        });
        tray.appendChild(piece);
      });
      api.stage.appendChild(tray);
    }
  });
})();
