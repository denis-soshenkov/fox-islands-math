'use strict';

/* По домикам: перетащи каждый предмет в его домик.
   Категории про жизнь: кто где живёт, зима и лето, цвета, еда и транспорт. */

(function () {
  const CATS = {
    1: [
      {
        title: 'Кто где живёт?', spoken: 'Кто живёт в воде, а кто на дереве? Развези всех по домам!',
        houses: [
          { icon: '🌊', label: 'Вода',   items: ['🐟', '🐬', '🐙', '🦀'] },
          { icon: '🌳', label: 'Дерево', items: ['🐦', '🦉', '🐿️', '🦅'] }
        ]
      },
      {
        title: 'Цветные домики', spoken: 'Красное — в красный домик, зелёное — в зелёный!',
        houses: [
          { icon: '🔴', label: 'Красный', items: ['🍎', '🍓', '🌹', '🍒'] },
          { icon: '🟢', label: 'Зелёный', items: ['🥦', '🍀', '🐸', '🥒'] }
        ]
      }
    ],
    2: [
      {
        title: 'Еда и игрушки', spoken: 'Еду — на кухню, игрушки — в детскую!',
        houses: [
          { icon: '🍽️', label: 'Кухня',   items: ['🍕', '🍞', '🧀', '🍰'] },
          { icon: '🧸', label: 'Игрушки', items: ['⚽', '🎲', '🪀', '🎈'] }
        ]
      },
      {
        title: 'Фрукты и зверята', spoken: 'Фрукты — в корзинку, зверят — в домик!',
        houses: [
          { icon: '🍎', label: 'Фрукты',  items: ['🍎', '🍌', '🍇', '🍐'] },
          { icon: '🐾', label: 'Зверята', items: ['🐱', '🐶', '🐰', '🦁'] }
        ]
      }
    ],
    3: [
      {
        title: 'Небо и вода', spoken: 'Что летает — в небо, что плавает — в воду!',
        houses: [
          { icon: '☁️', label: 'Небо', items: ['🦅', '🦋', '🚁', '🐝'] },
          { icon: '🌊', label: 'Вода', items: ['🐟', '⛵', '🐬', '🐳'] }
        ]
      },
      {
        title: 'Зима и лето', spoken: 'Что бывает зимой, а что летом? Разложи!',
        houses: [
          { icon: '❄️', label: 'Зима', items: ['⛄', '🧣', '🎿', '🧊'] },
          { icon: '☀️', label: 'Лето', items: ['🏖️', '🍉', '🩳', '🍦'] }
        ]
      }
    ],
    4: [
      {
        title: 'Вода, небо, земля', spoken: 'У каждого свой дом: вода, небо или земля!',
        houses: [
          { icon: '🌊', label: 'Вода',  items: ['🐟', '🐬', '🦀'] },
          { icon: '☁️', label: 'Небо',  items: ['🦅', '🦋', '🐝'] },
          { icon: '🌱', label: 'Земля', items: ['🐰', '🐴', '🐮'] }
        ]
      },
      {
        title: 'Три цветных домика', spoken: 'Красный, жёлтый и зелёный домики ждут гостей!',
        houses: [
          { icon: '🔴', label: 'Красный', items: ['🍎', '🍓', '🍒'] },
          { icon: '🟡', label: 'Жёлтый',  items: ['🍋', '⭐', '🐤'] },
          { icon: '🟢', label: 'Зелёный', items: ['🥦', '🍀', '🥒'] }
        ]
      }
    ],
    5: [
      {
        title: 'Еда, одежда, транспорт', spoken: 'Еда, одежда и транспорт — всё по своим местам!',
        houses: [
          { icon: '🍽️', label: 'Еда',       items: ['🍕', '🧀', '🍞'] },
          { icon: '👕', label: 'Одежда',    items: ['🧦', '🧢', '👗'] },
          { icon: '🚗', label: 'Транспорт', items: ['🚌', '🚲', '✈️'] }
        ]
      },
      {
        title: 'Ферма, лес, море', spoken: 'Кто живёт на ферме, кто в лесу, а кто в море?',
        houses: [
          { icon: '🚜', label: 'Ферма', items: ['🐮', '🐔', '🐷'] },
          { icon: '🌲', label: 'Лес',   items: ['🦊', '🦉', '🐿️'] },
          { icon: '🌊', label: 'Море',  items: ['🐬', '🦀', '🐙'] }
        ]
      }
    ]
  };

  let lastTitle = null;

  FX.register({
    id: 'houses',
    name: 'По домикам',
    icon: '🏠',
    skill: 'Логика и перетаскивание',
    rounds: 4,

    newRound(level, api) {
      const pool = CATS[level] || CATS[5];
      let cat = FX.pick(pool);
      if (pool.length > 1 && cat.title === lastTitle) cat = pool.find(p => p !== cat) || cat;
      lastTitle = cat.title;

      api.prompt(cat.title, cat.spoken);

      const perHouse = cat.houses.length > 2 ? 2 : 3;
      const queue = FX.shuffle(cat.houses.flatMap((h, hi) =>
        FX.sampleN(h.items, perHouse).map(e => ({ e, hi }))
      ));
      let idx = 0;

      const progress = FX.el('div', 'sort-progress', 'Осталось: ' + queue.length);
      api.stage.appendChild(progress);

      const itemZone = FX.el('div', 'house-item-zone');
      api.stage.appendChild(itemZone);

      const row = FX.el('div', 'house-row' + (cat.houses.length > 2 ? ' three' : ''));
      const houseEls = cat.houses.map((h, hi) => {
        const el = FX.el('div', 'house drop-zone');
        el.dataset.hi = String(hi);
        el.appendChild(FX.el('div', 'h-roof', '🏠'));
        el.appendChild(FX.el('div', 'h-icon', h.icon));
        el.appendChild(FX.el('div', 'b-label', h.label));
        const got = FX.el('div', 'b-got');
        el.appendChild(got);
        row.appendChild(el);
        return { el, got };
      });
      api.stage.appendChild(row);

      function showCurrent() {
        itemZone.innerHTML = '';
        if (idx >= queue.length) return;
        const cur = queue[idx];
        const item = FX.el('span', 'house-item pop-in', cur.e);
        FX.drag(item, {
          onDrop(under) {
            const house = under && under.closest ? under.closest('.house') : null;
            if (!house) return false;
            if (+house.dataset.hi === cur.hi) {
              api.sfx('pop');
              FX.replay(house, 'bounce');
              houseEls[cur.hi].got.appendChild(FX.el('span', null, cur.e));
              item.remove();
              idx++;
              progress.textContent = 'Осталось: ' + (queue.length - idx);
              if (idx >= queue.length) {
                progress.textContent = 'Все дома!';
                api.complete(house);
              } else {
                showCurrent();
              }
              return true;
            }
            FX.replay(house, 'shake');
            api.wrong(house);
            return false;
          }
        });
        itemZone.appendChild(item);
      }

      showCurrent();
    }
  });
})();
