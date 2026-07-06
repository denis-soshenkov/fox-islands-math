'use strict';

/* ============================================================
   Авторизация и сессия устройства.

   - «Войти через Google» — Google Identity Services, только клиент:
     из ID-токена берём имя/аватар/идентификатор для профиля.
   - Сессия сохраняется в localStorage: на этом же устройстве
     повторный вход не нужен (в том числе офлайн).
   - Прогресс игры хранится отдельно для каждого профиля.
   ============================================================ */

FX.auth = {
  SKEY: 'fox_session_v1',
  current: null,

  load() {
    try { this.current = JSON.parse(FX.load(this.SKEY, 'null')); }
    catch (e) { this.current = null; }
  },

  set(session) {
    this.current = session;
    FX.save(this.SKEY, JSON.stringify(session));
  },

  /* ключ профиля для раздельного прогресса */
  profileId() {
    return this.current ? this.current.provider + ':' + this.current.id : 'anon';
  },

  signInGuest() {
    this.set({ provider: 'guest', id: 'local', name: 'Гость', avatar: '' });
  },

  signOut() {
    this.current = null;
    FX.save(this.SKEY, 'null');
    try {
      if (window.google && google.accounts && google.accounts.id) {
        google.accounts.id.disableAutoSelect();
      }
    } catch (e) {}
  },

  /* ---------- Google Identity Services ---------- */

  _gisLoading: null,

  loadGis() {
    if (window.google && google.accounts && google.accounts.id) return Promise.resolve();
    if (this._gisLoading) return this._gisLoading;
    this._gisLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => { FX.auth._gisLoading = null; reject(new Error('gis_load_failed')); };
      document.head.appendChild(s);
    });
    return this._gisLoading;
  },

  /* Отрисовать кнопку Google в контейнер.
     handlers: { onSignIn(), onError(code) }
     Если настроен Firebase — входим через него (даёт облачную
     синхронизацию). Иначе — Google Identity Services (только профиль). */
  renderGoogleButton(container, handlers) {
    if (window.FX.cloud && FX.cloud.enabled()) {
      const btn = FX.el('button', 'btn google', '<span class="gmark">G</span> Войти через Google');
      btn.addEventListener('click', () => {
        btn.disabled = true;
        FX.cloud.signInWithGoogle()
          .then(() => handlers.onSignIn())
          .catch(e => {
            btn.disabled = false;
            const code = e && e.code;
            handlers.onError(
              code === 'auth/network-request-failed' || (e && e.message === 'cloud_unavailable')
                ? 'load_failed'
                : code === 'auth/popup-closed-by-user' ? 'cancelled' : 'init_failed'
            );
          });
      });
      container.appendChild(btn);
      return;
    }

    const cid = (FX.CONFIG && FX.CONFIG.googleClientId || '').trim();
    if (!cid) { handlers.onError('not_configured'); return; }

    this.loadGis().then(() => {
      try {
        google.accounts.id.initialize({
          client_id: cid,
          callback: resp => {
            const p = FX.auth.decodeJwt(resp.credential);
            if (!p || !p.sub) { handlers.onError('bad_token'); return; }
            FX.auth.set({
              provider: 'google',
              id: p.sub,
              name: p.given_name || p.name || 'Игрок',
              fullName: p.name || '',
              avatar: p.picture || '',
              email: p.email || ''
            });
            handlers.onSignIn();
          }
        });
        google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'filled_blue',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          locale: 'ru',
          width: 270
        });
      } catch (e) {
        handlers.onError('init_failed');
      }
    }).catch(() => handlers.onError('load_failed'));
  },

  /* ---------- Яндекс ID (OAuth implicit flow, редирект) ----------
     Без бэкенда: уходим на oauth.yandex.ru, возвращаемся с
     #access_token=…, меняем его на профиль через login.yandex.ru. */

  yandexEnabled() {
    return !!((FX.CONFIG && FX.CONFIG.yandexClientId) || '').trim();
  },

  yandexRedirectUri() {
    return location.origin + location.pathname;
  },

  signInYandex() {
    const cid = ((FX.CONFIG && FX.CONFIG.yandexClientId) || '').trim();
    if (!cid) return;
    location.href = 'https://oauth.yandex.ru/authorize' +
      '?response_type=token' +
      '&client_id=' + encodeURIComponent(cid) +
      '&redirect_uri=' + encodeURIComponent(this.yandexRedirectUri());
  },

  _parseYandexHash(hash) {
    if (!hash || hash.indexOf('access_token=') === -1) return null;
    return new URLSearchParams(hash.replace(/^#/, '')).get('access_token');
  },

  /* профиль по токену; если CORS не пустит — резерв через JSONP */
  _yandexInfo(token) {
    return fetch('https://login.yandex.ru/info?format=json', {
      headers: { Authorization: 'OAuth ' + token }
    }).then(r => {
      if (!r.ok) throw new Error('info ' + r.status);
      return r.json();
    }).catch(() => new Promise((resolve, reject) => {
      const cb = '__yaInfo' + Date.now();
      const s = document.createElement('script');
      window[cb] = data => { delete window[cb]; s.remove(); resolve(data); };
      s.onerror = () => { delete window[cb]; s.remove(); reject(new Error('jsonp')); };
      s.src = 'https://login.yandex.ru/info?format=jsonp&callback=' + cb +
              '&oauth_token=' + encodeURIComponent(token);
      document.head.appendChild(s);
    }));
  },

  _finishYandex(token) {
    return this._yandexInfo(token).then(info => {
      if (!info || !info.id) throw new Error('нет профиля');
      FX.auth.set({
        provider: 'yandex',
        id: String(info.id),
        name: info.first_name || info.display_name || info.login || 'Игрок',
        fullName: info.real_name || info.display_name || '',
        avatar: (info.default_avatar_id && !info.is_avatar_empty)
          ? 'https://avatars.yandex.net/get-yapic/' + info.default_avatar_id + '/islands-200'
          : '',
        email: info.default_email || '',
        yaToken: token /* для связки с облаком (Firebase custom token) */
      });
      /* единый облачный прогресс аккаунта: связываем с Firebase */
      if (window.FX.cloud && FX.cloud.enabled()) FX.cloud.exchangeYandex(token);
      return true;
    });
  },

  renderYandexButton(container, handlers) {
    if (!this.yandexEnabled()) return;
    const btn = FX.el('button', 'btn yandex', '<span class="ymark">Я</span> Войти с Яндекс ID');
    btn.addEventListener('click', () => {
      btn.disabled = true;
      try {
        FX.auth.signInYandex();
      } catch (e) {
        btn.disabled = false;
        if (handlers && handlers.onError) handlers.onError('yandex_failed');
      }
    });
    container.appendChild(btn);
  },

  /* payload ID-токена (base64url → JSON, с поддержкой кириллицы) */
  decodeJwt(token) {
    try {
      const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
      const bytes = Uint8Array.from(atob(padded), ch => ch.charCodeAt(0));
      return JSON.parse(new TextDecoder('utf-8').decode(bytes));
    } catch (e) { return null; }
  }
};

FX.auth.load();

/* Возврат с oauth.yandex.ru (#access_token=…): токен вычищается из
   адреса сразу, профиль подтягивается асинхронно — движок покажет
   экран входа с заметкой и сам перейдёт домой после завершения. */
FX.auth.yandexPending = (() => {
  const token = FX.auth._parseYandexHash(location.hash);
  if (!token) return null;
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  return FX.auth._finishYandex(token).catch(e => {
    console.warn('Яндекс-вход не удался:', e && e.message);
    return false;
  });
})();
