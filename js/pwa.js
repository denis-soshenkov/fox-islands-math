'use strict';

/* PWA: регистрация service worker и кнопка «Установить». */

FX.pwa = {
  deferred: null,       // отложенное beforeinstallprompt (Android/Chrome)
  onAvailable: null,    // хук: домашний экран перерисует кнопку установки

  isIos: () => /iphone|ipad|ipod/i.test(navigator.userAgent),
  isStandalone: () =>
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    window.navigator.standalone === true,

  install() {
    if (!this.deferred) return;
    const d = this.deferred;
    this.deferred = null;
    d.prompt();
  }
};

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  FX.pwa.deferred = e;
  if (FX.pwa.onAvailable) FX.pwa.onAvailable();
});

window.addEventListener('appinstalled', () => {
  FX.pwa.deferred = null;
  if (FX.pwa.onAvailable) FX.pwa.onAvailable();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* file:// или старый браузер */ });
  });
}
