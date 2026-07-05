'use strict';

/* Что лишнее? Классическая логика для малышей: найди предмет
   не из той группы. С уровнями категории сближаются
   (фрукты и овощи различить сложнее, чем фрукты и машинки). */

(function () {
  const CATS = {
    fruits:    ['🍎', '🍌', '🍇', '🍐', '🍊', '🍓', '🍋'],
    veggies:   ['🥕', '🥦', '🥒', '🍅', '🌽', '🧅'],
    animals:   ['🐱', '🐶', '🐰', '🦁', '🐮', '🐷', '🐭'],
    birds:     ['🦅', '🐦', '🦆', '🦉', '🐔'],
    transport: ['🚗', '🚌', '🚲', '✈️', '🚂', '🚁'],
    clothes:   ['👕', '👗', '🧦', '🧢', '👖', '🧥'],
    dishes:    ['🍽️', '🥄', '🍴', '☕', '🥣'],
    toys:      ['🧸', '⚽', '🪀', '🎲', '🎈'],
    insects:   ['🐝', '🦋', '🐞', '🐜', '🦗'],
    flowers:   ['🌹', '🌻', '🌷', '🌸', '🌼']
  };

  /* пары категорий по «похожести» */
  const PAIRS = {
    1: [['fruits', 'transport'], ['animals', 'transport'], ['clothes', 'fruits'], ['toys', 'animals']],
    2: [['dishes', 'toys'], ['flowers', 'transport'], ['fruits', 'animals'], ['clothes', 'dishes']],
    3: [['insects', 'flowers'], ['animals', 'toys'], ['transport', 'dishes'], ['fruits', 'flowers']],
    4: [['fruits', 'veggies'], ['animals', 'birds'], ['insects', 'birds'], ['veggies', 'fruits']],
    5: [['fruits', 'veggies'], ['animals', 'birds'], ['birds', 'insects'], ['veggies', 'flowers']]
  };

  const COUNT = { 1: 3, 2: 3, 3: 4, 4: 4, 5: 5 };

  FX.register({
    id: 'odd_one',
    name: 'Что лишнее?',
    icon: '🤔',
    skill: 'Логика: обобщение',

    newRound(level, api) {
      const pair = FX.shuffle(FX.pick(PAIRS[level] || PAIRS[5]));
      const majority = FX.sampleN(CATS[pair[0]], COUNT[level] || 4);
      const odd = FX.pick(CATS[pair[1]]);
      const cards = FX.shuffle(majority.concat([odd]));

      api.prompt('Что лишнее?', 'Посмотри внимательно! Один предмет сюда не подходит. Что лишнее? Нажми!');

      const row = FX.el('div', 'opt-row odd-row');
      cards.forEach(e => {
        const btn = FX.el('button', 'num-btn emoji-opt huge', e);
        btn.addEventListener('click', () => {
          if (e === odd) {
            FX.replay(btn, 'correct-glow');
            api.complete(btn);
          } else {
            api.wrong(btn);
            btn.classList.add('dim');
          }
        });
        row.appendChild(btn);
      });
      api.stage.appendChild(row);
    }
  });
})();
