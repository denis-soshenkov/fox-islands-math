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
