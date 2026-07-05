'use strict';

/* Сортировка: предметы появляются по одному — отправь каждый в свою корзину.
   С 4-го уровня корзин становится три. */

(function () {
  const POOLS = {
    1: [
      {
        title: 'Разложи по цветам!', spoken: 'Красное — в одну корзину, жёлтое — в другую!',
        baskets: [
          { label: 'Красное', icon: '🔴', items: ['🍎', '🍓', '🌹', '🍒', '🍅'] },
          { label: 'Жёлтое', icon: '🟡', items: ['🍋', '🌻', '⭐', '🧀', '🐤'] }
        ]
      },
      {
        title: 'Разложи по цветам!', spoken: 'Зелёное — в одну корзину, оранжевое — в другую!',
        baskets: [
          { label: 'Зелёное', icon: '🟢', items: ['🥦', '🐸', '🍀', '🥒', '🌵'] },
          { label: 'Оранжевое', icon: '🟠', items: ['🍊', '🥕', '🎃', '🦊', '🏀'] }
        ]
      }
    ],
    2: [
      {
        title: 'Фрукты и животные', spoken: 'Фрукты — в одну корзину, животные — в другую!',
        baskets: [
          { label: 'Фрукты', icon: '🍎', items: ['🍎', '🍌', '🍇', '🍐', '🍊', '🍓'] },
          { label: 'Животные', icon: '🐾', items: ['🐱', '🐶', '🐰', '🦁', '🐮', '🐷'] }
        ]
      },
      {
        title: 'Еда и транспорт', spoken: 'Еду — в одну корзину, транспорт — в другую!',
        baskets: [
          { label: 'Еда', icon: '🍽️', items: ['🍕', '🍰', '🍞', '🧀', '🥨', '🍩'] },
          { label: 'Транспорт', icon: '🚗', items: ['🚗', '🚌', '🚲', '✈️', '🚂', '🚜'] }
        ]
      }
    ],
    3: [
      {
        title: 'Кто летает, кто плавает?', spoken: 'Кто летает — в одну корзину, кто плавает — в другую!',
        baskets: [
          { label: 'Летает', icon: '🕊️', items: ['🦅', '🦋', '🐝', '🦇', '🐦', '🪁'] },
          { label: 'Плавает', icon: '🌊', items: ['🐟', '🐬', '🦈', '🐳', '🐙', '⛵'] }
        ]
      },
      {
        title: 'Большое и маленькое', spoken: 'Большое — в одну корзину, маленькое — в другую!',
        baskets: [
          { label: 'Большое', icon: '🐘', items: ['🐘', '🦒', '🐋', '🚌', '🦖', '🏰'] },
          { label: 'Маленькое', icon: '🐜', items: ['🐜', '🐞', '🐭', '🌰', '🔑', '🍒'] }
        ]
      }
    ],
    4: [
      {
        title: 'Три цвета!', spoken: 'Красное, жёлтое и зелёное — каждое в свою корзину!',
        baskets: [
          { label: 'Красное', icon: '🔴', items: ['🍎', '🍓', '🌹', '🍒'] },
          { label: 'Жёлтое', icon: '🟡', items: ['🍋', '🌻', '⭐', '🐤'] },
          { label: 'Зелёное', icon: '🟢', items: ['🥦', '🐸', '🍀', '🥒'] }
        ]
      },
      {
        title: 'Еда, звери, транспорт', spoken: 'Еда, животные и транспорт — каждому своя корзина!',
        baskets: [
          { label: 'Еда', icon: '🍽️', items: ['🍕', '🍰', '🍞', '🧀'] },
          { label: 'Животные', icon: '🐾', items: ['🐱', '🐶', '🐰', '🦁'] },
          { label: 'Транспорт', icon: '🚗', items: ['🚗', '🚌', '🚲', '✈️'] }
        ]
      }
    ],
    5: [
      {
        title: 'Летает, плавает, ездит', spoken: 'Кто летает, кто плавает, а кто ездит? Разложи!',
        baskets: [
          { label: 'Летает', icon: '☁️', items: ['🦅', '🦋', '🐝', '🚁'] },
          { label: 'Плавает', icon: '🌊', items: ['🐟', '🐬', '🐳', '⛵'] },
          { label: 'Ездит', icon: '🛣️', items: ['🚗', '🚌', '🚲', '🚜'] }
        ]
      },
      {
        title: 'Фрукты, овощи, сладости', spoken: 'Фрукты, овощи и сладости — каждое в свою корзину!',
        baskets: [
          { label: 'Фрукты', icon: '🍎', items: ['🍎', '🍌', '🍇', '🍐'] },
          { label: 'Овощи', icon: '🥕', items: ['🥕', '🥦', '🥒', '🌽'] },
          { label: 'Сладости', icon: '🍭', items: ['🍰', '🍩', '🍭', '🍫'] }
        ]
      }
    ]
  };

  let lastTitle = null;

  FX.register({
    id: 'sorting',
    name: 'Сортировка',
    icon: '🧺',
    skill: 'Группировка и классификация',
    rounds: 4,

    newRound(level, api) {
      const pool = POOLS[level] || POOLS[5];
      let cat = FX.pick(pool);
      if (pool.length > 1 && cat.title === lastTitle) {
        cat = pool.find(p => p !== cat) || cat;
      }
      lastTitle = cat.title;

      api.prompt(cat.title, cat.spoken);

      const perBasket = cat.baskets.length > 2 ? 2 : 3;
      const queue = FX.shuffle(cat.baskets.flatMap((bk, bi) =>
        FX.sampleN(bk.items, perBasket).map(e => ({ e, bi }))
      ));
      let idx = 0;

      const progress = FX.el('div', 'sort-progress', 'Осталось: ' + queue.length);
      const item = FX.el('div', 'sort-item');
      const row = FX.el('div', 'basket-row' + (cat.baskets.length > 2 ? ' three' : ''));

      FX.shuffle(cat.baskets.map((bk, bi) => ({ bk, bi }))).forEach(({ bk, bi }) => {
        const el = FX.el('button', 'basket');
        el.appendChild(FX.el('div', 'b-icon', bk.icon + ' 🧺'));
        el.appendChild(FX.el('div', 'b-label', bk.label));
        const got = FX.el('div', 'b-got');
        el.appendChild(got);
        el.addEventListener('click', () => {
          if (idx >= queue.length) return;
          const cur = queue[idx];
          if (cur.bi === bi) {
            api.sfx('pop');
            FX.replay(el, 'bounce');
            got.appendChild(FX.el('span', null, cur.e));
            idx++;
            if (idx >= queue.length) {
              progress.textContent = 'Всё разложено!';
              item.textContent = '🎉';
              api.complete(el);
            } else {
              showCurrent();
            }
          } else {
            api.wrong(el);
          }
        });
        row.appendChild(el);
      });

      function showCurrent() {
        item.textContent = queue[idx].e;
        FX.replay(item, 'pop-in');
        progress.textContent = 'Осталось: ' + (queue.length - idx);
      }

      api.stage.appendChild(progress);
      api.stage.appendChild(item);
      api.stage.appendChild(row);
      showCurrent();
    }
  });
})();
