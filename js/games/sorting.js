'use strict';

/* Сортировка: предметы появляются по одному — отправь каждый в свою корзину. */

(function () {
  const POOLS = {
    1: [
      {
        title: 'Разложи по цветам!',
        spoken: 'Красное — в одну корзину, жёлтое — в другую!',
        a: { label: 'Красное', icon: '🔴', items: ['🍎', '🍓', '🌹', '🍒', '🍅'] },
        b: { label: 'Жёлтое', icon: '🟡', items: ['🍋', '🌻', '⭐', '🧀', '🐤'] }
      },
      {
        title: 'Разложи по цветам!',
        spoken: 'Зелёное — в одну корзину, оранжевое — в другую!',
        a: { label: 'Зелёное', icon: '🟢', items: ['🥦', '🐸', '🍀', '🥒', '🌵'] },
        b: { label: 'Оранжевое', icon: '🟠', items: ['🍊', '🥕', '🎃', '🦊', '🏀'] }
      }
    ],
    2: [
      {
        title: 'Фрукты и животные',
        spoken: 'Фрукты — в одну корзину, животные — в другую!',
        a: { label: 'Фрукты', icon: '🍎', items: ['🍎', '🍌', '🍇', '🍐', '🍊', '🍓'] },
        b: { label: 'Животные', icon: '🐾', items: ['🐱', '🐶', '🐰', '🦁', '🐮', '🐷'] }
      },
      {
        title: 'Еда и транспорт',
        spoken: 'Еду — в одну корзину, транспорт — в другую!',
        a: { label: 'Еда', icon: '🍽️', items: ['🍕', '🍰', '🍞', '🧀', '🥨', '🍩'] },
        b: { label: 'Транспорт', icon: '🚗', items: ['🚗', '🚌', '🚲', '✈️', '🚂', '🚜'] }
      }
    ],
    3: [
      {
        title: 'Кто летает, кто плавает?',
        spoken: 'Кто летает — в одну корзину, кто плавает — в другую!',
        a: { label: 'Летает', icon: '🕊️', items: ['🦅', '🦋', '🐝', '🦇', '🐦', '🪁'] },
        b: { label: 'Плавает', icon: '🌊', items: ['🐟', '🐬', '🦈', '🐳', '🐙', '⛵'] }
      },
      {
        title: 'Большое и маленькое',
        spoken: 'Большое — в одну корзину, маленькое — в другую!',
        a: { label: 'Большое', icon: '🐘', items: ['🐘', '🦒', '🐋', '🚌', '🦖', '🏰'] },
        b: { label: 'Маленькое', icon: '🐜', items: ['🐜', '🐞', '🐭', '🌰', '🔑', '🍒'] }
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
      const pool = POOLS[level];
      let cat = FX.pick(pool);
      if (pool.length > 1 && cat.title === lastTitle) {
        cat = pool.find(p => p !== cat) || cat;
      }
      lastTitle = cat.title;

      api.prompt(cat.title, cat.spoken);

      const queue = FX.shuffle(
        FX.sampleN(cat.a.items, 3).map(e => ({ e, side: 'a' }))
          .concat(FX.sampleN(cat.b.items, 3).map(e => ({ e, side: 'b' })))
      );
      let idx = 0;

      const progress = FX.el('div', 'sort-progress', 'Осталось: ' + queue.length);
      const item = FX.el('div', 'sort-item');
      const row = FX.el('div', 'basket-row');

      const sides = FX.shuffle(['a', 'b']);
      const baskets = sides.map(sideKey => {
        const def = cat[sideKey];
        const bk = FX.el('button', 'basket');
        bk.appendChild(FX.el('div', 'b-icon', def.icon + ' 🧺'));
        bk.appendChild(FX.el('div', 'b-label', def.label));
        const got = FX.el('div', 'b-got');
        bk.appendChild(got);
        bk.addEventListener('click', () => {
          if (idx >= queue.length) return;
          const cur = queue[idx];
          if (cur.side === sideKey) {
            api.sfx('pop');
            FX.replay(bk, 'bounce');
            got.appendChild(FX.el('span', null, cur.e));
            idx++;
            if (idx >= queue.length) {
              progress.textContent = 'Всё разложено!';
              item.textContent = '🎉';
              api.complete(bk);
            } else {
              showCurrent();
            }
          } else {
            api.wrong(bk);
          }
        });
        return bk;
      });
      baskets.forEach(bk => row.appendChild(bk));

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
