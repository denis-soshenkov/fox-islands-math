'use strict';

/* Глобальное пространство имён игры + реестр мини-игр */
window.FX = {
  games: {},
  order: [],
  register(game) {
    this.games[game.id] = game;
    this.order.push(game.id);
  }
};

/* Уровней в каждой активности */
FX.MAX_LEVEL = 5;

/* Размер предметов на игровом поле: чем меньше предметов,
   тем крупнее они рисуются (важно для телефона) */
FX.itemSize = total =>
  total <= 4 ? 'clamp(58px, 16vw, 108px)' :
  total <= 6 ? 'clamp(50px, 13vw, 92px)' :
  total <= 9 ? 'clamp(44px, 10.5vw, 74px)' :
  total <= 12 ? 'clamp(36px, 9vw, 62px)' :
  'clamp(30px, 7.5vw, 52px)';

/* ---------- случайности ---------- */

FX.rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
FX.pick = arr => arr[Math.floor(Math.random() * arr.length)];
FX.shuffle = arr => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
FX.sampleN = (arr, n) => FX.shuffle(arr).slice(0, n);
FX.clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* Набор из `count` уникальных вариантов ответа вокруг правильного */
FX.makeOptions = (correct, count, min, max) => {
  const set = new Set([correct]);
  let guard = 0;
  while (set.size < count && guard++ < 300) {
    const d = FX.rand(1, 3) * (Math.random() < 0.5 ? -1 : 1);
    const v = FX.clamp(correct + d, min, max);
    set.add(v);
  }
  for (let v = min; set.size < count && v <= max; v++) set.add(v);
  return FX.shuffle([...set]);
};

/* ---------- DOM ---------- */

FX.el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
};
FX.delay = ms => new Promise(r => setTimeout(r, ms));

/* Повторный запуск CSS-анимации через класс */
FX.replay = (node, cls) => {
  node.classList.remove(cls);
  void node.offsetWidth;
  node.classList.add(cls);
};

/* ---------- хранилище (устойчиво к приватному режиму) ---------- */

FX._mem = {};
FX.save = (k, v) => {
  FX._mem[k] = v;
  try { localStorage.setItem(k, v); } catch (e) { /* приватный режим */ }
};
FX.load = (k, def) => {
  try {
    const v = localStorage.getItem(k);
    if (v !== null) return v;
  } catch (e) { /* приватный режим */ }
  return (k in FX._mem) ? FX._mem[k] : def;
};

/* ---------- текст ---------- */

/* Убрать emoji перед озвучкой */
FX.noEmoji = t => String(t)
  .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '')
  .replace(/\s+/g, ' ')
  .trim();
