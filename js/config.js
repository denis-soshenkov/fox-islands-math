'use strict';

/* Настройки развёртывания.

   googleClientId — OAuth Client ID для «Войти через Google».
   Как получить (5 минут):
     1. https://console.cloud.google.com → APIs & Services → Credentials
     2. Create Credentials → OAuth client ID → Web application
     3. В «Authorized JavaScript origins» добавьте адреса, где живёт игра,
        например: http://localhost:8899 и https://ваш-домен
     4. Скопируйте Client ID (вида 1234…apps.googleusercontent.com) сюда.

   Пока поле пустое, кнопка Google скрыта — работает гостевой профиль. */

FX.CONFIG = {
  googleClientId: ''
};
