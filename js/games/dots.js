'use strict';

/* Точки по порядку: нажимай числа 1, 2, 3… — линия нарисует картинку. */

(function () {
  function starPts() {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const ang = (-90 + i * 36) * Math.PI / 180;
      const rad = i % 2 === 0 ? 42 : 18;
      pts.push([+(50 + rad * Math.cos(ang)).toFixed(1), +(54 + rad * Math.sin(ang)).toFixed(1)]);
    }
    return pts;
  }

  const SHAPES = [
    { name: 'ромбик',   emoji: '💎', lv: 1, color: '#4ECDC4', pts: [[50, 8], [82, 50], [50, 92], [18, 50]] },
    { name: 'домик',    emoji: '🏠', lv: 1, color: '#FFB703', pts: [[50, 10], [86, 44], [86, 88], [14, 88], [14, 44]] },
    { name: 'ёлочка',   emoji: '🎄', lv: 2, color: '#6BCB77', pts: [[50, 6], [80, 48], [63, 48], [88, 86], [12, 86], [37, 48], [20, 48]] },
    { name: 'рыбка',    emoji: '🐟', lv: 2, color: '#4D96FF', pts: [[14, 50], [45, 22], [75, 40], [92, 22], [92, 78], [75, 60], [45, 78]] },
    { name: 'звезда',   emoji: '⭐', lv: 3, color: '#FFD93D', pts: starPts() },
    { name: 'сердечко', emoji: '❤️', lv: 3, color: '#FF6B6B', pts: [[50, 32], [61, 18], [75, 15], [87, 25], [89, 42], [79, 58], [50, 88], [21, 58], [11, 42], [13, 25], [25, 15], [39, 18]] }
  ];

  let lastName = null;

  FX.register({
    id: 'dots',
    name: 'Точки по порядку',
    icon: '✨',
    skill: 'Порядок чисел',
    rounds: 3,

    newRound(level, api) {
      const pool = SHAPES.filter(s => s.lv === level);
      let shape = FX.pick(pool);
      if (pool.length > 1 && shape.name === lastName) shape = pool.find(s => s !== shape) || shape;
      lastName = shape.name;
      const pts = shape.pts;
      const N = pts.length;

      api.prompt(
        'Соедини точки 1–' + N + '!',
        'Соединяй точки по порядку: один, два, три… Что за картинка получится?'
      );

      const svg = FX.svg('svg', { viewBox: '0 0 100 100', class: 'dots-svg' });
      const poly = FX.svg('polyline', {
        points: '', fill: 'none', stroke: shape.color,
        'stroke-width': '2.4', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      });
      svg.appendChild(poly);

      let next = 0;
      const donePts = [];
      const groups = [];

      pts.forEach(([x, y], i) => {
        const g = FX.svg('g', { class: 'dot-circle' + (i === 0 ? ' next' : '') });
        g.appendChild(FX.svg('circle', { cx: x, cy: y, r: 5.8 }));
        const t = FX.svg('text', { x: x, y: y });
        t.textContent = String(i + 1);
        t.style.fontSize = (i + 1 < 10 ? 6.5 : 5.2) + 'px';
        g.appendChild(t);
        g.addEventListener('click', () => {
          if (i === next) {
            g.classList.remove('next');
            g.classList.add('done');
            api.sfx('pop');
            donePts.push(x + ',' + y);
            poly.setAttribute('points', donePts.join(' '));
            next++;
            if (next < N) {
              groups[next].classList.add('next');
            } else {
              /* замыкаем контур и показываем картинку */
              donePts.push(pts[0][0] + ',' + pts[0][1]);
              poly.setAttribute('points', donePts.join(' '));
              const fill = FX.svg('polygon', {
                points: pts.map(p => p.join(',')).join(' '),
                fill: shape.color, opacity: '0.3'
              });
              svg.insertBefore(fill, poly);
              const cx = pts.reduce((s, p) => s + p[0], 0) / N;
              const cy = pts.reduce((s, p) => s + p[1], 0) / N;
              const em = FX.svg('text', { x: cx, y: cy + 2, 'text-anchor': 'middle', 'dominant-baseline': 'central' });
              em.textContent = shape.emoji;
              em.style.fontSize = '20px';
              svg.appendChild(em);
              api.say('Это ' + shape.name + '!');
              api.complete(svg);
            }
          } else if (i > next) {
            api.wrong(g);
          }
        });
        groups.push(g);
        svg.appendChild(g);
      });

      api.stage.appendChild(svg);
    }
  });
})();
