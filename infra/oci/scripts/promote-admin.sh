#!/usr/bin/env bash
set -Eeuo pipefail

readonly APP_DIR="${APP_DIR:-/home/ubuntu/aalie}"
readonly COMPOSE_FILE="${APP_DIR}/compose.yml"
readonly ENV_FILE="${APP_DIR}/.env"
readonly RUNTIME_ENV_FILE="${APP_DIR}/.env.runtime"
readonly USER_ID="${1:?usage: promote-admin.sh <better-auth-user-id>}"

compose() {
  docker compose \
    --env-file "$ENV_FILE" \
    --env-file "$RUNTIME_ENV_FILE" \
    --file "$COMPOSE_FILE" \
    "$@"
}

updated="$(compose exec --no-TTY postgres sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" psql --host=127.0.0.1 --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --set=user_id="$1" --tuples-only --no-align --command="UPDATE auth.\"user\" SET \"role\" = '\''ADMIN'\'' WHERE \"id\" = :'\''user_id'\'' RETURNING \"id\""' \
  sh "$USER_ID" | tr -d '\r\n')"

[[ "$updated" == "$USER_ID" ]] || {
  printf 'No unique Better Auth user was promoted: %s\n' "$USER_ID" >&2
  exit 1
}

printf 'Promoted Better Auth user to ADMIN: %s\n' "$USER_ID"
