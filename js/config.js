'use strict';

/* ============================================================
   Настройки развёртывания.
   Эти значения НЕ секретны: web-конфиг Firebase и OAuth Client ID
   рассчитаны на публикацию в клиенте; данные защищают правила
   Firestore (firebase/firestore.rules) и список разрешённых доменов.
   Секреты деплоя (SSH и т.п.) живут в .env / GitHub Secrets — см. README.
   ============================================================ */

FX.CONFIG = {

  /* «Войти через Google» БЕЗ облака (если Firebase не настроен).
     Google Cloud Console → Credentials → OAuth client ID (Web) →
     Authorized JavaScript origins: http://localhost:8899, https://game.eropulsars.com */
  googleClientId: '720868305351-g8hhkcq0hd8prhgk2h88aenl3h08iop3.apps.googleusercontent.com',

  /* Облачная синхронизация прогресса.
     Firebase Console (https://console.firebase.google.com):
       1. Create project → Add app → Web (</>) — скопируйте firebaseConfig сюда.
       2. Authentication → Sign-in method → включите Google.
       3. Authentication → Settings → Authorized domains →
          добавьте game.eropulsars.com (localhost уже там).
       4. Firestore Database → Create (production mode) → Rules →
          вставьте содержимое firebase/firestore.rules.
     Пока поля пустые — облако выключено, игра работает локально. */
  firebase: {
    apiKey: 'AIzaSyBGsTCHVD67pMndLVGphn5CyriXrQrIdeA',
    authDomain: 'alice-a4d13.firebaseapp.com',
    projectId: 'alice-a4d13',
    appId: '1:163852944022:web:33258ee00155b2f56ff8b7'
  }
};
