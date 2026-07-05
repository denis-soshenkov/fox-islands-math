'use strict';

/* ============================================================
   Облачная синхронизация через Firebase (Auth + Firestore).

   - Включается, когда в js/config.js заполнен FX.CONFIG.firebase.
   - SDK (compat-сборки) подгружается с CDN только при необходимости;
     без сети или без конфига игра работает как раньше — локально.
   - Вход: Firebase Auth c Google-провайдером (popup, на мобильных
     фолбэк в redirect). Сессия Firebase живёт на устройстве.
   - Прогресс: документ progress/{uid}; конфликтующие сохранения
     сливаются «по максимуму звёзд» — безопасно для нескольких устройств.
   ============================================================ */

FX.cloud = {
  auth: null,
  db: null,
  ready: false,
  lastSync: null,
  onSynced: null,        // движок перерисует экран после слияния
  onAuthRestored: null,  // движок уйдёт с экрана входа после redirect/восстановления
  _initing: null,
  _t: null,

  enabled() {
    const c = (FX.CONFIG && FX.CONFIG.firebase) || {};
    return !!(c.apiKey && c.projectId && c.authDomain);
  },

  _script(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error('не загрузился ' + src));
      document.head.appendChild(s);
    });
  },

  init() {
    if (!this.enabled() || this.ready) return this._initing || Promise.resolve();
    if (this._initing) return this._initing;
    const V = '10.12.2';
    const base = 'https://www.gstatic.com/firebasejs/' + V + '/';
    this._initing = (async () => {
      await this._script(base + 'firebase-app-compat.js');
      await Promise.all([
        this._script(base + 'firebase-auth-compat.js'),
        this._script(base + 'firebase-firestore-compat.js')
      ]);
      firebase.initializeApp(FX.CONFIG.firebase);
      this.auth = firebase.auth();
      this.db = firebase.firestore();
      await this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});
      try { await this.auth.getRedirectResult(); } catch (e) { /* redirect мог не быть */ }
      this.ready = true;
      this.auth.onAuthStateChanged(u => this._onUser(u));
    })().catch(e => {
      console.warn('Firebase недоступен (офлайн?):', e && e.message);
      this._initing = null;
    });
    return this._initing;
  },

  /* Firebase сообщил о пользователе: чиним сессию устройства и синкаем */
  _onUser(u) {
    if (!u) return;
    const s = FX.auth.current;
    const wasLoggedOut = !s || s.provider !== 'google' || s.id !== u.uid;
    if (wasLoggedOut) {
      FX.auth.set({
        provider: 'google',
        id: u.uid,
        name: (u.displayName || 'Игрок').split(' ')[0],
        fullName: u.displayName || '',
        avatar: u.photoURL || '',
        email: u.email || ''
      });
      FX.progress.reload();
      if (this.onAuthRestored) this.onAuthRestored();
    }
    this.syncNow();
  },

  async signInWithGoogle() {
    await this.init();
    if (!this.ready) throw new Error('cloud_unavailable');
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await this.auth.signInWithPopup(provider);
    } catch (e) {
      const code = e && e.code;
      if (code === 'auth/popup-blocked' ||
          code === 'auth/operation-not-supported-in-this-environment' ||
          code === 'auth/cancelled-popup-request') {
        await this.auth.signInWithRedirect(provider); // мобильные/standalone PWA
        return;
      }
      throw e;
    }
    const u = this.auth.currentUser;
    if (u) this._onUser(u);
  },

  async signOut() {
    try { if (this.auth) await this.auth.signOut(); } catch (e) {}
  },

  _docRef() {
    const u = this.auth && this.auth.currentUser;
    return u ? this.db.collection('progress').doc(u.uid) : null;
  },

  /* слияние прогрессов: по каждому уровню берём максимум звёзд */
  merge(a, b) {
    const out = JSON.parse(JSON.stringify(a || {}));
    Object.keys(b || {}).forEach(act => {
      out[act] = out[act] || {};
      Object.keys(b[act] || {}).forEach(lv => {
        out[act][lv] = Math.max(out[act][lv] || 0, b[act][lv] || 0);
      });
    });
    return out;
  },

  async syncNow() {
    try {
      const ref = this._docRef();
      if (!ref) return false;
      const snap = await ref.get();
      const remote = snap.exists ? (snap.data().data || {}) : {};
      const merged = this.merge(FX.progress.raw(), remote);
      FX.progress.replace(merged);
      await ref.set({
        data: merged,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      this.lastSync = new Date();
      if (this.onSynced) this.onSynced();
      return true;
    } catch (e) {
      console.warn('Синхронизация не удалась:', e && e.message);
      return false;
    }
  },

  /* отложенное сохранение после каждой новой звезды */
  queueSave() {
    if (!this.ready || !this._docRef()) return;
    clearTimeout(this._t);
    this._t = setTimeout(() => this.syncNow(), 1500);
  }
};
