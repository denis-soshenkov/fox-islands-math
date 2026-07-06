# 🦊 Лисьи острова — весёлая математика

Браузерная обучающая математическая игра для детей 3–7 лет в духе Funexpected Math:
карта островов, лисёнок-проводник с голосовыми заданиями, 12 мини-игр с тремя уровнями
сложности, звёзды и сохранение прогресса. Устанавливается на телефон как PWA и
работает без интернета.

> Это самостоятельная игра «по мотивам»: повторены механики и структура, вся графика,
> название и код — собственные (emoji/SVG/CSS). Не аффилировано с Funexpected Apps.

## Запуск

Без сборки и зависимостей:

```bash
cd Alice_game
python3 -m http.server 8899
# открыть http://localhost:8899
```

Можно и просто открыть `index.html` двойным кликом (но service worker и вход через
Google работают только по http(s) — localhost подходит).

## 📲 Установка на телефон (PWA)

1. Разместите папку на любом HTTPS-хостинге статики (GitHub Pages, Netlify, Vercel —
   достаточно просто загрузить файлы) или откройте с localhost.
2. **Android (Chrome):** откройте игру → на домашнем экране появится кнопка
   «📲 Установить на телефон» (или меню ⋮ → «Установить приложение»).
3. **iPhone/iPad (Safari):** «Поделиться» → «На экран “Домой”» — подсказка показана
   прямо в игре.

После установки игра запускается в полный экран без браузерных панелей и полностью
работает офлайн (все ресурсы кэширует service worker `sw.js`).

## 👤 Вход (Google / Яндекс) и единый прогресс аккаунта

Google и Яндекс — **только способы входа**: прогресс привязан к учётной записи,
хранится в Firestore (документ `progress/{uid}`) и одинаков на всех устройствах,
где выполнен вход этим аккаунтом.

- При первом запуске: «Войти через Google», «Войти с Яндекс ID» или «Играть без входа».
- Выбор запоминается **на устройстве**: при следующих запусках логиниться не
  нужно — игра открывается сразу, в том числе офлайн.
- Локально прогресс ведётся отдельно для каждого профиля и при появлении сети
  сливается с облаком «по максимуму звёзд».
- Сменить профиль / выйти: карта → удерживать ⚙️ 1,5 сек → «Сменить профиль».

### Google

1. [console.cloud.google.com](https://console.cloud.google.com) → Credentials →
   **OAuth client ID → Web application**; в Authorized JavaScript origins —
   `http://localhost:8899` и `https://game.eropulsars.com`.
2. Client ID → `googleClientId` в [js/config.js](js/config.js).
   (При настроенном Firebase вход идёт через Firebase Auth — облако сразу работает.)

### Яндекс

1. [oauth.yandex.ru](https://oauth.yandex.ru) → **Создать приложение** →
   платформа «Веб-сервисы»; **Redirect URI**: `https://game.eropulsars.com/`
   и `http://localhost:8899/`.
2. Доступы: «Доступ к логину, имени и фамилии», «Доступ к портрету»
   (по желанию — к адресу почты).
3. ClientID → `yandexClientId` в [js/config.js](js/config.js).

Вход сделан OAuth-редиректом (без попапов — надёжно в установленном PWA);
профиль (имя, аватар) берётся из `login.yandex.ru`.

### Единое облако для Яндекс-входа (сервис на VPS)

Firestore пускает только пользователей Firebase, поэтому Яндекс-токен меняется
на Firebase custom token (uid `yandex:<id>`) крошечным сервисом
[server/](server/index.js) — он уже включён в docker-стек (`/api/auth/yandex`
через Caddy). Сервису нужен **сервисный ключ Firebase**:

1. Firebase Console → ⚙️ Project settings → **Service accounts** →
   **Generate new private key** (скачается JSON).
2. На сервере положите его одной строкой в `/opt/fox-islands/.env`:

```bash
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"alice-a4d13",...}'
```

3. `docker compose -f deploy/docker-compose.prod.yml up -d` — готово.
   Проверка: `curl https://game.eropulsars.com/api/health` → `"configured": true`.

Пока ключа нет, Яндекс-вход всё равно работает (профиль на устройстве),
а облачная синхронизация включится автоматически после настройки.

## ☁️ Облачная синхронизация (Firebase)

Прогресс синхронизируется между устройствами через Firestore: документ
`progress/{uid}`, при конфликте берётся максимум звёзд по каждому уровню.
Работает офлайн-дружелюбно: без сети игра сохраняет локально и дольёт в облако
при следующем запуске/синке. Настройка (≈10 минут):

1. [console.firebase.google.com](https://console.firebase.google.com) →
   **Add project** → в проекте **Add app → Web (</>)** — получите `firebaseConfig`.
2. **Authentication → Sign-in method** → включите **Google**.
3. **Authentication → Settings → Authorized domains** → добавьте
   `game.eropulsars.com` (localhost там уже есть).
4. **Firestore Database → Create database** (production mode) → вкладка
   **Rules** → вставьте содержимое [firebase/firestore.rules](firebase/firestore.rules).
5. Скопируйте значения `apiKey`, `authDomain`, `projectId`, `appId` в
   [js/config.js](js/config.js) → `FX.CONFIG.firebase`.

Эти значения публичны по дизайну Firebase — данные защищают правила Firestore.
Когда Firebase настроен, кнопка «Войти через Google» автоматически использует
Firebase Auth (popup, на мобильных redirect), а в родительском разделе появляются
статус синка и кнопка «☁️ Синхронизировать».

## 🐳 Docker

```bash
docker compose up -d --build      # игра на http://localhost:8080
GAME_PORT=9000 docker compose up  # свой порт
```

Или готовый образ из GitHub Container Registry (собирается CI на каждый пуш):

```bash
docker run -d -p 8080:80 ghcr.io/<owner>/<repo>:latest
```

Внутри — nginx с gzip и правильными Cache-Control (sw.js и index.html не кэшируются).

## 🚀 CI/CD и домен game.eropulsars.com

Workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) на каждый пуш в `main`:

| Job | Что делает |
|---|---|
| `check` | `node --check` всех JS + валидация manifest.json |
| `pages` | Публикует игру на GitHub Pages с `CNAME game.eropulsars.com` |
| `docker` | Собирает и пушит образ в `ghcr.io/<owner>/<repo>` |
| `server` | Rsync на ваш сервер — включается, когда заданы Secrets |

**Вариант А (рекомендую): GitHub Pages + ваш домен.** Уже настроено с этой
стороны; остаётся одна запись у вашего DNS-провайдера:

```
game.eropulsars.com  CNAME  <owner>.github.io
```

GitHub сам выпустит HTTPS-сертификат (Settings → Pages → Enforce HTTPS).

**Вариант Б: свой сервер.** Добавьте в репозиторий Secrets
(`Settings → Secrets and variables → Actions`): `DEPLOY_HOST`, `DEPLOY_USER`,
`DEPLOY_PATH`, `DEPLOY_SSH_KEY` (приватный ключ целиком) — job `server`
начнёт выкатывать сам. Локально то же самое делает `./deploy.sh` (настройки
в `.env`, шаблон — [.env.example](.env.example)). На сервере можно поднять и
docker-вариант: `docker compose up -d` в папке проекта.

## Что внутри

| Остров | Мини-игры | Навыки |
|---|---|---|
| 🏝️ Остров Счёта | Весёлый счёт, Цифры | счёт предметов, узнавание цифр |
| 🐳 Остров Сравнений | Больше — меньше, Сортировка | сравнение количеств, классификация |
| 🏰 Остров Фигур | Найди фигуры, Зеркало | геометрия, симметрия |
| 🌸 Остров Узоров | Продолжи узор, Найди пару | закономерности, память |
| 🎈 Остров Арифметики | Сложение, Вычитание | наглядная арифметика до 10 |
| 🚀 Остров Приключений | Точки по порядку, Пропущенное число | числовой ряд, порядок |

- 3 уровня сложности в каждой игре, уровни открываются по очереди.
- Задания генерируются процедурно — каждый запуск новый.
- 1–3 ⭐ за прохождение (по числу ошибок).
- Голосовые задания (синтез речи ru-RU, если доступен) + синтезированные звуки WebAudio.
- Раздел «Для родителей»: удерживайте ⚙️ на карте ~1,5 секунды — прогресс, смена
  профиля, сброс.

## Технологии

Vanilla HTML/CSS/JS без зависимостей и сборки. PWA: `manifest.json` + `sw.js`
(stale-while-revalidate, офлайн-фолбэк). Авторизация: Google Identity Services.
Звук — WebAudio, речь — Web Speech API, графика — emoji и SVG (иконки приложения —
собственный векторный лисёнок в `icons/`).
