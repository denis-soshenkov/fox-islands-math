'use strict';

/* ============================================================
   Движок: экраны (дом → карта → остров → игра), раннер раундов,
   прогресс и звёзды, конфетти, пузырь лисёнка, раздел родителей.
   ============================================================ */

(function () {
  const $app = document.getElementById('app');
  const SVGNS = 'http://www.w3.org/2000/svg';

  FX.SVGNS = SVGNS;
  FX.svg = (tag, attrs) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in (attrs || {})) n.setAttribute(k, attrs[k]);
    return n;
  };

  /* ================= прогресс ================= */

  /* прогресс хранится отдельно для каждого профиля (гость / Google-аккаунт) */
  const progressKey = () => 'fox_islands_progress_v1:' + FX.auth.profileId();

  /* миграция: старый общий прогресс переезжает в гостевой профиль */
  try {
    const legacy = FX.load('fox_islands_progress_v1', null);
    if (legacy && !FX.load('fox_islands_progress_v1:guest:local', null)) {
      FX.save('fox_islands_progress_v1:guest:local', legacy);
    }
  } catch (e) {}

  let progressData = {};
  function reloadProgress() {
    try { progressData = JSON.parse(FX.load(progressKey(), '{}')) || {}; }
    catch (e) { progressData = {}; }
  }
  reloadProgress();

  FX.progress = {
    reload: reloadProgress,
    /* для облачной синхронизации */
    raw() { return progressData; },
    replace(data) {
      progressData = data || {};
      FX.save(progressKey(), JSON.stringify(progressData));
    },
    getStars(actId, lv) { return (progressData[actId] && progressData[actId][lv]) || 0; },
    setStars(actId, lv, stars) {
      if (!progressData[actId]) progressData[actId] = {};
      progressData[actId][lv] = Math.max(this.getStars(actId, lv), stars);
      FX.save(progressKey(), JSON.stringify(progressData));
      if (window.FX.cloud) FX.cloud.queueSave();
    },
    isUnlocked(actId, lv) { return lv === 1 || this.getStars(actId, lv - 1) >= 1; },
    activityStars(actId) {
      let s = 0;
      for (let lv = 1; lv <= FX.MAX_LEVEL; lv++) s += this.getStars(actId, lv);
      return s;
    },
    islandStars(isl) { return isl.acts.reduce((s, a) => s + this.activityStars(a), 0); },
    totalStars() { return FX.ISLANDS.reduce((s, i) => s + this.islandStars(i), 0); },
    reset() { progressData = {}; FX.save(progressKey(), '{}'); }
  };

  /* ================= конфетти ================= */

  const CONF_COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#B39DDB', '#FF8FAB', '#4ECDC4'];

  FX.confetti = (x, y, n = 14) => {
    for (let i = 0; i < n; i++) {
      const b = FX.el('div', 'confetti-bit');
      b.style.background = FX.pick(CONF_COLORS);
      b.style.left = x + 'px';
      b.style.top = y + 'px';
      b.style.setProperty('--cx', FX.rand(-130, 130) + 'px');
      b.style.setProperty('--cy', FX.rand(-170, 40) + 'px');
      b.style.setProperty('--cr', FX.rand(-360, 360) + 'deg');
      if (Math.random() < 0.4) b.style.borderRadius = '50%';
      document.body.appendChild(b);
      setTimeout(() => b.remove(), 1000);
    }
  };
  FX.confettiAt = (node, n) => {
    const r = node.getBoundingClientRect();
    FX.confetti(r.left + r.width / 2, r.top + r.height / 2, n);
  };

  /* ================= экраны ================= */

  const screens = {};
  ['login', 'home', 'map', 'island', 'game'].forEach(id => {
    const s = FX.el('section', 'screen');
    s.id = 'screen-' + id;
    $app.appendChild(s);
    screens[id] = s;
  });

  function switchScreen(id) {
    Object.entries(screens).forEach(([k, s]) => s.classList.toggle('active', k === id));
  }

  let navToken = 0;   // растёт при каждой навигации: убивает отложенные таймеры
  let session = null;

  function soundBtn() {
    const b = FX.el('button', 'btn-icon');
    b.textContent = FX.audio.muted ? '🔇' : '🔊';
    b.addEventListener('click', () => {
      FX.audio.setMuted(!FX.audio.muted);
      b.textContent = FX.audio.muted ? '🔇' : '🔊';
      if (!FX.audio.muted) FX.audio.play('click');
    });
    return b;
  }

  /* ---------- экран входа (показывается один раз на устройство) ---------- */

  function showLogin() {
    navToken++;
    FX.stopSpeech();
    const s = screens.login;
    s.innerHTML = '';

    const clouds = FX.el('div', 'home-clouds');
    for (let i = 0; i < 4; i++) {
      const c = FX.el('span', 'cloud', '☁️');
      c.style.top = FX.rand(4, 70) + '%';
      c.style.fontSize = FX.rand(34, 64) + 'px';
      c.style.animationDuration = FX.rand(26, 60) + 's';
      c.style.animationDelay = -FX.rand(0, 40) + 's';
      clouds.appendChild(c);
    }
    s.appendChild(clouds);

    s.appendChild(FX.el('div', 'home-fox', '🦊'));
    s.appendChild(FX.el('h1', 'home-title', 'Лисьи острова'));
    s.appendChild(FX.el('div', 'home-sub', 'Кто будет играть?'));

    const card = FX.el('div', 'login-card');
    const gwrap = FX.el('div', 'g-btn-wrap');
    const ywrap = FX.el('div', 'g-btn-wrap');
    const note = FX.el('div', 'login-note');
    card.appendChild(gwrap);
    card.appendChild(ywrap);
    card.appendChild(note);
    card.appendChild(FX.el('div', 'login-divider', 'или'));

    const guest = FX.el('button', 'btn sun', '🙂 Играть без входа');
    guest.addEventListener('click', () => {
      FX.audio.init();
      FX.auth.signInGuest();
      FX.progress.reload();
      FX.audio.play('complete');
      showHome();
    });
    card.appendChild(guest);

    card.appendChild(FX.el('p', 'login-hint',
      'Google и Яндекс — просто способы входа: прогресс привязан к учётной записи, ' +
      'хранится в облаке и одинаков на всех устройствах. Выбор запоминается — ' +
      'входить каждый раз не нужно.'));
    s.appendChild(card);

    FX.auth.renderGoogleButton(gwrap, {
      onSignIn: () => {
        FX.audio.init();
        FX.progress.reload();
        showHome();
      },
      onError: code => {
        const msgs = {
          not_configured: 'Google-вход не настроен: добавьте Client ID в js/config.js (инструкция в README).',
          load_failed: 'Не удалось связаться с Google — нет интернета? Играй пока как гость.',
          init_failed: 'Google-вход не запустился. Играй как гость.',
          bad_token: 'Не получилось войти. Попробуй ещё раз или играй как гость.'
        };
        note.textContent = msgs[code] || 'Google-вход недоступен.';
      }
    });

    FX.auth.renderYandexButton(ywrap, {
      onError: () => { note.textContent = 'Яндекс-вход недоступен. Попробуй ещё раз.'; }
    });

    if (FX.auth.yandexPending) {
      note.textContent = '⏳ Входим через Яндекс…';
    } else if (FX.auth.yandexError) {
      note.textContent = 'Не получилось войти через Яндекс. Попробуй ещё раз или играй как гость.';
      FX.auth.yandexError = false;
    }

    switchScreen('login');
  }

  /* ---------- домашний экран ---------- */

  function showHome() {
    navToken++;
    FX.stopSpeech();
    const s = screens.home;
    s.innerHTML = '';

    const clouds = FX.el('div', 'home-clouds');
    for (let i = 0; i < 5; i++) {
      const c = FX.el('span', 'cloud', '☁️');
      c.style.top = FX.rand(4, 72) + '%';
      c.style.fontSize = FX.rand(34, 72) + 'px';
      c.style.animationDuration = FX.rand(26, 60) + 's';
      c.style.animationDelay = -FX.rand(0, 40) + 's';
      clouds.appendChild(c);
    }
    s.appendChild(clouds);

    s.appendChild(FX.el('div', 'home-fox', '🦊'));
    s.appendChild(FX.el('h1', 'home-title', 'Лисьи острова'));
    s.appendChild(FX.el('div', 'home-sub', '✨ весёлая математика ✨'));

    const play = FX.el('button', 'btn coral big', '▶ Играть');
    play.addEventListener('click', () => {
      FX.audio.init();
      FX.audio.play('complete');
      FX.speak('Привет! Я лисёнок Фокси! Выбирай остров, и поиграем!');
      showMap();
    });
    s.appendChild(play);

    const ts = FX.progress.totalStars();
    if (ts > 0) s.appendChild(FX.el('div', 'home-stars', '⭐ Собрано звёзд: ' + ts));
    s.appendChild(FX.el('div', 'home-age', 'для детей 3–7 лет · работает без интернета'));

    /* чип профиля (кто играет на этом устройстве) */
    const p = FX.auth.current;
    const chip = FX.el('div', 'profile-chip');
    if (p && p.avatar) {
      const img = document.createElement('img');
      img.src = p.avatar;
      img.alt = '';
      img.referrerPolicy = 'no-referrer';
      chip.appendChild(img);
    } else {
      chip.appendChild(FX.el('span', 'pc-emoji', '🙂'));
    }
    chip.appendChild(FX.el('span', 'pc-name', p ? p.name : 'Гость'));
    s.appendChild(chip);

    /* установка на телефон */
    if (!FX.pwa.isStandalone()) {
      if (FX.pwa.deferred) {
        const inst = FX.el('button', 'btn grass small', '📲 Установить на телефон');
        inst.addEventListener('click', () => { FX.audio.play('click'); FX.pwa.install(); });
        s.appendChild(inst);
      } else if (FX.pwa.isIos()) {
        s.appendChild(FX.el('div', 'install-hint',
          '📲 Установить: «Поделиться» → «На экран “Домой”»'));
      }
    }
    FX.pwa.onAvailable = () => {
      if (screens.home.classList.contains('active')) showHome();
    };

    switchScreen('home');
  }

  /* ---------- карта ---------- */

  function showMap() {
    navToken++;
    const s = screens.map;
    s.innerHTML = '';

    const top = FX.el('div', 'topbar');
    const home = FX.el('button', 'btn-icon', '🏠');
    home.addEventListener('click', () => { FX.audio.play('click'); showHome(); });
    top.appendChild(home);
    top.appendChild(FX.el('div', 'title', 'Карта островов'));
    top.appendChild(parentsBtn());
    top.appendChild(soundBtn());
    top.appendChild(FX.el('div', 'star-chip', '⭐ ' + FX.progress.totalStars()));
    s.appendChild(top);

    const sea = FX.el('div', 'map-sea');

    /* пунктирный маршрут между островами */
    const svg = FX.svg('svg', { class: 'map-path', viewBox: '0 0 100 100', preserveAspectRatio: 'none' });
    svg.appendChild(FX.svg('polyline', {
      points: FX.ISLANDS.map(i => i.x + ',' + i.y).join(' '),
      fill: 'none', stroke: '#ffffff77', 'stroke-width': '1.1',
      'stroke-dasharray': '2.5 3', 'stroke-linecap': 'round'
    }));
    sea.appendChild(svg);

    const waves = FX.el('div', 'map-waves');
    const deco = ['🌊', '🌊', '🌊', '🌊', '🐬', '⛵', '🐢', '🐡'];
    deco.forEach(d => {
      const w = FX.el('span', 'wave', d);
      w.style.left = FX.rand(3, 92) + '%';
      w.style.top = FX.rand(6, 90) + '%';
      w.style.animationDelay = -FX.rand(0, 30) / 10 + 's';
      waves.appendChild(w);
    });
    sea.appendChild(waves);

    FX.ISLANDS.forEach(isl => {
      const b = FX.el('button', 'island');
      b.style.left = isl.x + '%';
      b.style.top = isl.y + '%';
      const bub = FX.el('div', 'island-bubble', isl.emoji);
      bub.style.background = 'linear-gradient(160deg, #ffffff 0%, ' + isl.color + ' 85%)';
      b.appendChild(bub);
      b.appendChild(FX.el('div', 'island-name', isl.name));
      b.appendChild(FX.el('div', 'island-stars',
        '⭐ ' + FX.progress.islandStars(isl) + '/' + (isl.acts.length * FX.MAX_LEVEL * 3)));
      b.addEventListener('click', () => { FX.audio.play('pop'); showIsland(isl.id); });
      sea.appendChild(b);
    });

    s.appendChild(sea);
    switchScreen('map');
  }

  /* ---------- экран острова ---------- */

  function showIsland(islandId) {
    navToken++;
    FX.stopSpeech();
    const isl = FX.ISLANDS.find(i => i.id === islandId);
    const s = screens.island;
    s.innerHTML = '';

    const top = FX.el('div', 'topbar');
    const back = FX.el('button', 'btn-icon', '⬅️');
    back.addEventListener('click', () => { FX.audio.play('click'); showMap(); });
    top.appendChild(back);
    top.appendChild(FX.el('div', 'title', isl.emoji + ' ' + isl.name));
    top.appendChild(soundBtn());
    s.appendChild(top);
    s.appendChild(FX.el('div', 'island-hero', isl.blurb));

    const list = FX.el('div', 'activity-list');
    isl.acts.forEach(actId => {
      const g = FX.games[actId];
      if (!g) return;
      const card = FX.el('div', 'activity-card');
      card.style.borderTopColor = isl.color;
      card.appendChild(FX.el('div', 'activity-icon', g.icon));
      card.appendChild(FX.el('div', 'activity-name', g.name));
      card.appendChild(FX.el('div', 'activity-skill', g.skill));

      const row = FX.el('div', 'level-row');
      for (let lv = 1; lv <= FX.MAX_LEVEL; lv++) {
        const unlocked = FX.progress.isUnlocked(actId, lv);
        const stars = FX.progress.getStars(actId, lv);
        const btn = FX.el('button', 'level-btn' + (unlocked ? '' : ' locked'));
        btn.appendChild(FX.el('span', 'lv', unlocked ? 'Ур.' + lv : '🔒'));
        const st = FX.el('span', 'st');
        st.innerHTML = '<span style="color:#FFB703">' + '★'.repeat(stars) + '</span>' +
                       '<span style="opacity:.22">' + '★'.repeat(3 - stars) + '</span>';
        btn.appendChild(st);
        btn.addEventListener('click', () => {
          if (!unlocked) {
            FX.audio.play('wrong');
            FX.replay(btn, 'shake');
            FX.speak('Сначала пройди предыдущий уровень!');
            return;
          }
          FX.audio.play('click');
          startGame(actId, lv);
        });
        row.appendChild(btn);
      }
      card.appendChild(row);
      list.appendChild(card);
    });
    s.appendChild(list);
    switchScreen('island');
  }

  /* ---------- игровая сессия ---------- */

  function startGame(actId, level) {
    const game = FX.games[actId];
    const isl = FX.ISLANDS.find(i => i.acts.includes(actId));
    navToken++;
    FX.stopSpeech();

    const s = screens.game;
    s.innerHTML = '';

    const top = FX.el('div', 'topbar');
    const back = FX.el('button', 'btn-icon', '⬅️');
    back.addEventListener('click', () => { FX.audio.play('click'); showIsland(isl.id); });
    top.appendChild(back);
    top.appendChild(FX.el('div', 'title', game.icon + ' ' + game.name + ' · ур. ' + level));
    top.appendChild(soundBtn());
    s.appendChild(top);

    const dots = FX.el('div', 'round-dots');
    s.appendChild(dots);

    const foxBar = FX.el('div', 'fox-bar');
    foxBar.appendChild(FX.el('div', 'fox-face', '🦊'));
    const bubble = FX.el('div', 'bubble', '…');
    foxBar.appendChild(bubble);
    s.appendChild(foxBar);

    const stage = FX.el('div', 'stage');
    s.appendChild(stage);

    const total = game.rounds || 5;
    for (let i = 0; i < total; i++) dots.appendChild(FX.el('div', 'rdot'));

    session = {
      actId, level, game, island: isl,
      round: 0, total, mistakes: 0,
      completing: false,
      token: navToken,
      stage, bubble, dots,
      lastEncourageSpeak: 0
    };

    switchScreen('game');
    nextRound();
  }

  function setBubble(text) {
    if (!session) return;
    session.bubble.innerHTML = text;
    FX.replay(session.bubble, 'pop');
  }

  function updateDots() {
    [...session.dots.children].forEach((d, i) => {
      d.className = 'rdot' + (i < session.round - 1 ? ' done' : i === session.round - 1 ? ' now' : '');
    });
  }

  function nextRound() {
    if (!session || session.token !== navToken) return;
    session.round++;
    session.completing = false;
    if (session.round > session.total) return showResults();
    updateDots();
    session.stage.innerHTML = '';
    session.stage.classList.remove('locked');
    const api = makeApi(session);
    try {
      session.game.newRound(session.level, api);
    } catch (err) {
      console.error('Ошибка в мини-игре ' + session.actId + ':', err);
      setBubble('Ой! Что-то пошло не так. Идём дальше!');
      const token = navToken;
      setTimeout(() => { if (session && token === navToken) nextRound(); }, 1200);
    }
  }

  function makeApi(sess) {
    const alive = () => session === sess && sess.token === navToken;
    return {
      stage: sess.stage,
      level: sess.level,
      round: sess.round,
      total: sess.total,

      prompt(text, spoken) {
        if (!alive()) return;
        setBubble(text);
        FX.speak(spoken === undefined ? text : spoken);
      },
      say(text) { if (alive()) FX.speak(text); },
      sfx(name) { FX.audio.play(name); },

      /* маленькая победа внутри раунда (найдена фигура, пара и т.п.) */
      correct(node) {
        if (!alive() || sess.completing) return;
        FX.audio.play('correct');
        if (node) FX.confettiAt(node, 8);
      },

      wrong(node) {
        if (!alive() || sess.completing) return;
        sess.mistakes++;
        FX.audio.play('wrong');
        if (node) FX.replay(node, 'shake');
        const msg = FX.pick(FX.ENCOURAGE);
        setBubble(msg);
        const nowT = Date.now();
        if (nowT - sess.lastEncourageSpeak > 3000) {
          sess.lastEncourageSpeak = nowT;
          FX.speak(msg);
        }
      },

      /* для игр со «свободными» промахами (память): добавить N ошибок скопом */
      reportMistakes(n) { if (alive()) sess.mistakes += Math.max(0, n | 0); },

      /* раунд решён */
      complete(node) {
        if (!alive() || sess.completing) return;
        sess.completing = true;
        sess.stage.classList.add('locked');
        FX.audio.play(sess.round >= sess.total ? 'complete' : 'correct');
        const praise = FX.pick(FX.PRAISES);
        setBubble(praise);
        FX.speak(praise);
        if (node) FX.confettiAt(node, 14);
        else {
          const r = sess.stage.getBoundingClientRect();
          FX.confetti(r.left + r.width / 2, r.top + r.height / 3, 14);
        }
        setTimeout(() => { if (alive()) nextRound(); }, 1400);
      }
    };
  }

  /* ---------- результаты ---------- */

  function showResults() {
    const sess = session;
    const stars = sess.mistakes === 0 ? 3 : sess.mistakes <= 2 ? 2 : 1;
    const hadNext = sess.level < FX.MAX_LEVEL && FX.progress.isUnlocked(sess.actId, sess.level + 1);
    FX.progress.setStars(sess.actId, sess.level, stars);
    const hasNextNow = sess.level < FX.MAX_LEVEL && FX.progress.isUnlocked(sess.actId, sess.level + 1);
    const newlyUnlocked = !hadNext && hasNextNow;

    const overlay = FX.el('div', 'results-overlay');
    const card = FX.el('div', 'results-card');
    card.appendChild(FX.el('div', 'results-fox', stars === 3 ? '🎉🦊🎉' : '🦊'));
    card.appendChild(FX.el('div', 'results-title', 'Готово!'));
    const msg = FX.pick(FX.RESULT_PHRASES[stars]);
    card.appendChild(FX.el('div', 'results-msg', msg));

    const row = FX.el('div', 'star-row');
    const slots = [];
    for (let i = 0; i < 3; i++) {
      const sl = FX.el('span', 'star-slot', '⭐');
      row.appendChild(sl);
      slots.push(sl);
    }
    card.appendChild(row);

    if (newlyUnlocked) {
      card.appendChild(FX.el('div', 'unlock-note', '🔓 Открыт уровень ' + (sess.level + 1) + '!'));
    }

    const btns = FX.el('div', 'results-btns');
    const again = FX.el('button', 'btn sun', '🔁 Ещё раз');
    again.addEventListener('click', () => { FX.audio.play('click'); startGame(sess.actId, sess.level); });
    btns.appendChild(again);
    if (hasNextNow && sess.level < FX.MAX_LEVEL) {
      const nxt = FX.el('button', 'btn grass', 'Уровень ' + (sess.level + 1) + ' ▶');
      nxt.addEventListener('click', () => { FX.audio.play('click'); startGame(sess.actId, sess.level + 1); });
      btns.appendChild(nxt);
    }
    const toMap = FX.el('button', 'btn', '🗺️ На карту');
    toMap.addEventListener('click', () => { FX.audio.play('click'); showMap(); });
    btns.appendChild(toMap);
    card.appendChild(btns);

    overlay.appendChild(card);
    screens.game.appendChild(overlay);

    FX.speak(msg);
    const token = sess.token;
    for (let i = 0; i < stars; i++) {
      setTimeout(() => {
        if (token !== navToken) return;
        slots[i].classList.add('earned');
        FX.audio.play('star');
        FX.confettiAt(slots[i], 10);
      }, 500 + i * 550);
    }
  }

  /* ---------- раздел для родителей ---------- */

  function parentsBtn() {
    const b = FX.el('button', 'btn-icon', '⚙️');
    let timer = null;
    const start = e => {
      e.preventDefault();
      b.classList.add('holding');
      timer = setTimeout(() => {
        b.classList.remove('holding');
        timer = null;
        openParents();
      }, 1400);
    };
    const cancel = () => {
      b.classList.remove('holding');
      if (timer) { clearTimeout(timer); timer = null; }
    };
    b.addEventListener('pointerdown', start);
    b.addEventListener('pointerup', cancel);
    b.addEventListener('pointerleave', cancel);
    b.addEventListener('contextmenu', e => e.preventDefault());
    b.title = 'Для родителей: удерживайте 1,5 секунды';
    return b;
  }

  function openParents() {
    FX.audio.play('flip');
    const overlay = FX.el('div', 'parents-overlay');
    const card = FX.el('div', 'parents-card');
    card.appendChild(FX.el('h2', null, '👨‍👩‍👧 Для родителей'));
    card.appendChild(FX.el('p', null,
      'Игра развивает ранние математические навыки и логику: счёт, цифры, сравнение, ' +
      'геометрию, симметрию, закономерности, память, наглядную арифметику, сериацию ' +
      'по размеру и классификацию, а также моторику (перетаскивание). ' +
      'В каждой игре пять уровней — следующий открывается после прохождения предыдущего. ' +
      'Звёзды за сессию: без ошибок — 3, одна-две ошибки — 2, больше — 1. ' +
      'Прогресс хранится в этом браузере (и в облаке, если включён вход через Google).'));

    const table = FX.el('table', 'progress-table');
    let head = '<tr><th>Игра</th>';
    for (let lv = 1; lv <= FX.MAX_LEVEL; lv++) head += '<th>Ур. ' + lv + '</th>';
    table.innerHTML = head + '</tr>';
    FX.ISLANDS.forEach(isl => isl.acts.forEach(actId => {
      const g = FX.games[actId];
      if (!g) return;
      const tr = FX.el('tr');
      const cells = [g.icon + ' ' + g.name];
      for (let lv = 1; lv <= FX.MAX_LEVEL; lv++) {
        const st = FX.progress.getStars(actId, lv);
        cells.push(st ? '⭐'.repeat(st) : (FX.progress.isUnlocked(actId, lv) ? '—' : '🔒'));
      }
      tr.innerHTML = cells.map(c => '<td>' + c + '</td>').join('');
      table.appendChild(tr);
    }));
    card.appendChild(table);
    const maxStars = FX.ISLANDS.reduce((s, i) => s + i.acts.length, 0) * FX.MAX_LEVEL * 3;
    card.appendChild(FX.el('p', null, 'Всего звёзд: ' + FX.progress.totalStars() + ' из ' + maxStars + '.'));

    /* текущий профиль устройства */
    const p = FX.auth.current;
    const acc = FX.el('div', 'account-row');
    if (p && p.avatar) {
      const img = document.createElement('img');
      img.src = p.avatar;
      img.alt = '';
      img.referrerPolicy = 'no-referrer';
      acc.appendChild(img);
    } else {
      acc.appendChild(FX.el('span', null, '🙂'));
    }
    const accText = p
      ? (p.provider === 'google'
          ? '<b>' + (p.fullName || p.name) + '</b> · вход через Google' + (p.email ? ' (' + p.email + ')' : '')
          : p.provider === 'yandex'
            ? '<b>' + (p.fullName || p.name) + '</b> · вход через Яндекс' + (p.email ? ' (' + p.email + ')' : '')
            : '<b>Гость</b> · без входа')
      : 'Профиль не выбран';
    acc.appendChild(FX.el('span', null, accText));
    const switchBtn = FX.el('button', 'btn small lilac', 'Сменить профиль');
    switchBtn.addEventListener('click', () => {
      if (window.FX.cloud) FX.cloud.signOut();
      FX.auth.signOut();
      FX.progress.reload();
      overlay.remove();
      showLogin();
    });
    acc.appendChild(switchBtn);
    card.appendChild(acc);

    /* состояние облачной синхронизации (единая для Google и Яндекса) */
    if (FX.cloud.enabled() && p && (p.provider === 'google' || p.provider === 'yandex')) {
      const cloudRow = FX.el('div', 'account-row');
      const status = FX.el('span', null, FX.cloud.lastSync
        ? '☁️ Синхронизировано: ' + FX.cloud.lastSync.toLocaleTimeString('ru-RU')
        : '☁️ Облако подключено, ждёт первой синхронизации');
      cloudRow.appendChild(status);
      const syncBtn = FX.el('button', 'btn small', '☁️ Синхронизировать');
      syncBtn.addEventListener('click', async () => {
        syncBtn.disabled = true;
        const ok = await FX.cloud.syncNow();
        status.textContent = ok
          ? '☁️ Синхронизировано: ' + FX.cloud.lastSync.toLocaleTimeString('ru-RU')
          : '⚠️ Не удалось (нет сети?)';
        syncBtn.disabled = false;
      });
      cloudRow.appendChild(syncBtn);
      card.appendChild(cloudRow);
    } else if (!FX.cloud.enabled()) {
      card.appendChild(FX.el('p', null,
        'Облачная синхронизация между устройствами выключена: заполните FX.CONFIG.firebase в js/config.js (см. README).'));
    }

    const actions = FX.el('div', 'parents-actions');
    const reset = FX.el('button', 'btn small danger', 'Сбросить прогресс');
    let armed = false, disarmT = null;
    reset.addEventListener('click', () => {
      if (!armed) {
        armed = true;
        reset.classList.add('armed');
        reset.textContent = 'Точно сбросить? Нажмите ещё раз';
        disarmT = setTimeout(() => {
          armed = false;
          reset.classList.remove('armed');
          reset.textContent = 'Сбросить прогресс';
        }, 3500);
      } else {
        clearTimeout(disarmT);
        FX.progress.reset();
        overlay.remove();
        showMap();
      }
    });
    const close = FX.el('button', 'btn small grass', 'Закрыть');
    close.addEventListener('click', () => overlay.remove());
    actions.appendChild(reset);
    actions.appendChild(close);
    card.appendChild(actions);

    overlay.appendChild(card);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    screens.map.appendChild(overlay);
  }

  /* ---------- запуск ----------
     Сессия устройства: если профиль уже выбирали на этом устройстве,
     экран входа не показывается. */

  /* облако: после redirect-входа или восстановления сессии Firebase
     уходим с экрана входа; после слияния прогресса обновляем счётчики */
  FX.cloud.onAuthRestored = () => {
    if (screens.login.classList.contains('active')) {
      FX.progress.reload();
      showHome();
    }
  };
  FX.cloud.onSynced = () => {
    if (screens.home.classList.contains('active')) showHome();
    else if (screens.map.classList.contains('active')) showMap();
  };
  FX.cloud.init();

  if (FX.auth.yandexPending) {
    /* вернулись с oauth.yandex.ru — ждём профиль */
    showLogin();
    FX.auth.yandexPending.then(ok => {
      FX.auth.yandexPending = null;
      if (ok) {
        FX.progress.reload();
        showHome();
      } else {
        FX.auth.yandexError = true;
        if (screens.login.classList.contains('active')) showLogin();
      }
    });
  } else if (FX.auth.current) {
    showHome();
  } else {
    showLogin();
  }
})();
