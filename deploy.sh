#!/usr/bin/env bash
# Деплой игры на свой сервер по rsync. Настройки берутся из .env.
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "Нет файла .env — скопируйте .env.example в .env и заполните DEPLOY_*"
  exit 1
fi
set -a; source .env; set +a

: "${DEPLOY_HOST:?Заполните DEPLOY_HOST в .env}"
: "${DEPLOY_USER:?Заполните DEPLOY_USER в .env}"
: "${DEPLOY_PATH:?Заполните DEPLOY_PATH в .env}"
KEY="${DEPLOY_KEY_FILE:-$HOME/.ssh/id_ed25519}"

echo "→ Деплой на $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH"
rsync -avz --delete \
  --exclude '.git' --exclude '.github' --exclude '.claude' \
  --exclude 'docs' --exclude '.env*' --exclude 'deploy.sh' \
  --exclude '.DS_Store' \
  -e "ssh -i ${KEY/#\~/$HOME}" \
  ./ "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"

echo "→ Перезапуск контейнеров (game + auth + caddy)"
ssh -i "${KEY/#\~/$HOME}" "$DEPLOY_USER@$DEPLOY_HOST" \
  "cd '$DEPLOY_PATH' && docker compose -f deploy/docker-compose.prod.yml up -d --build && docker compose -f deploy/docker-compose.prod.yml restart caddy && docker image prune -f >/dev/null"
echo "✓ Готово: https://$DEPLOY_HOST"
