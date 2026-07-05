'use strict';

/* Накорми зверят: перетащи на тарелку ровно столько угощений,
   сколько просит зверёк. Лишние угощения и чужая еда — ловушки. */

(function () {
  const ANIMALS = [
    { e: '🐻', name: 'Мишка',     food: '🍯', fname: 'баночек мёда' },
    { e: '🐰', name: 'Зайка',     food: '🥕', fname: 'морковок' },
    { e: '🐵', name: 'Обезьянка', food: '🍌', fname: 'бананов' },
    { e: '🐱', name: 'Котик',     food: '🐟', fname: 'рыбок' },
    { e: '🐶', name: 'Пёсик',     food: '🦴', fname: 'косточек' },
    { e: '🦔', name: 'Ёжик',      food: '🍄', fname: 'грибочков' },
    { e: '🐹', name: 'Хомячок',   food: '🥜', fname: 'орешков' }
  ];

  const CFG = {
    1: { n: [1, 3], extra: 0, dTypes: 0 },
    2: { n: [2, 4], extra: 1, dTypes: 0 },
    3: { n: [3, 5], extra: 1, dTypes: 1 },
    4: { n: [4, 7], extra: 2, dTypes: 1 },
    5: { n: [5, 9], extra: 2, dTypes: 2 }
  };

  FX.register({
    id: 'feed',
    name: 'Накорми зверят',
    icon: '🐻',
    skill: 'Счёт и перетаскивание',
    rounds: 4,

    newRound(level, api) {
      const cfg = CFG[level] || CFG[5];
      const a = FX.pick(ANIMALS);
      const n = FX.rand(cfg.n[0], cfg.n[1]);
      const others = FX.sampleN(ANIMALS.filter(x => x !== a), cfg.dTypes);

      api.prompt(
        'Дай ' + a.e + ' — ' + n + ' ' + a.food,
        a.name + ' хочет кушать! Положи на тарелку ' + n + ' ' + a.fname + '!'
      );

      const zone = FX.el('div', 'feed-zone drop-zone');
      const animal = FX.el('div', 'feed-animal', a.e);
      zone.appendChild(animal);
      const plate = FX.el('div', 'feed-plate');
      zone.appendChild(plate);
      const counter = FX.el('div', 'feed-count', '0 из ' + n);
      zone.appendChild(counter);
      api.stage.appendChild(zone);

      /* еда: нужное количество + лишние правильные + чужая еда */
      const foods = [];
      for (let i = 0; i < n + cfg.extra; i++) foods.push(a.food);
      others.forEach(o => { for (let i = 0; i < 2; i++) foods.push(o.food); });

      const pool = FX.el('div', 'feed-pool');
      const size = FX.itemSize(foods.length + 2);
      let fed = 0;

      FX.shuffle(foods).forEach(f => {
        const item = FX.el('span', 'feed-item', f);
        item.style.fontSize = size;
        FX.drag(item, {
          canDrag: () => fed < n,
          onDrop(under) {
            const hit = under && under.closest ? under.closest('.feed-zone') : null;
            if (!hit) return false;
            if (f !== a.food) {
              api.wrong(animal);
              api.say(a.name + ' это не ест!');
              return false;
            }
            fed++;
            item.remove();
            const mini = FX.el('span', 'pop-in', f);
            plate.appendChild(mini);
            api.sfx('pop');
            counter.textContent = fed + ' из ' + n;
            if (fed >= n) {
              FX.replay(animal, 'bounce');
              counter.textContent = 'Ням-ням! 😋';
              api.complete(animal);
            }
            return true;
          }
        });
        pool.appendChild(item);
      });
      api.stage.appendChild(pool);
    }
  });
})();
