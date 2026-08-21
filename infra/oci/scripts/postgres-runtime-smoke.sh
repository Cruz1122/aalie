#!/usr/bin/env bash
set -Eeuo pipefail

readonly APP_DIR="${APP_DIR:-$(pwd)}"
readonly COMPOSE_FILE="${COMPOSE_FILE:-${APP_DIR}/compose.yml}"
readonly ENV_FILE="${ENV_FILE:-${APP_DIR}/.env}"
readonly RUNTIME_ENV_FILE="${RUNTIME_ENV_FILE:-${APP_DIR}/.env.runtime}"
readonly POSTGRES_SERVICE="${POSTGRES_SERVICE:-postgres}"
readonly BACKUP_FILE="${1:?backup output path is required}"
readonly RESTORE_DB="${2:-aalie_restore_check}"

compose() {
  docker compose \
    --env-file "$ENV_FILE" \
    --env-file "$RUNTIME_ENV_FILE" \
    --file "$COMPOSE_FILE" \
    "$@"
}

psql_as_app() {
  compose exec --no-TTY "$POSTGRES_SERVICE" sh -c \
    'PGPASSWORD="$POSTGRES_PASSWORD" psql --host=127.0.0.1 --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" "$@"' \
    sh "$@"
}

mkdir -p "$(dirname "$BACKUP_FILE")"
rm -f "$BACKUP_FILE"

psql_as_app --command "CREATE TABLE IF NOT EXISTS persistence_probe (id integer PRIMARY KEY, value text NOT NULL); TRUNCATE persistence_probe; INSERT INTO persistence_probe VALUES (1, 'survives-down-up');"
env APP_DIR="$APP_DIR" COMPOSE_FILE="$COMPOSE_FILE" ENV_FILE="$ENV_FILE" RUNTIME_ENV_FILE="$RUNTIME_ENV_FILE" \
  bash "$(dirname "$0")/postgres-backup.sh" "$BACKUP_FILE"

compose down --remove-orphans
compose up -d --wait

value="$(psql_as_app --tuples-only --no-align --command "SELECT value FROM persistence_probe WHERE id = 1" | tr -d '\r\n')"
[[ "$value" == "survives-down-up" ]] || { printf 'persistence check failed: %s\n' "$value" >&2; exit 1; }

psql_as_app --command "DROP DATABASE IF EXISTS \"${RESTORE_DB}\";"
psql_as_app --command "CREATE DATABASE \"${RESTORE_DB}\";"
env APP_DIR="$APP_DIR" COMPOSE_FILE="$COMPOSE_FILE" ENV_FILE="$ENV_FILE" RUNTIME_ENV_FILE="$RUNTIME_ENV_FILE" \
  bash "$(dirname "$0")/postgres-restore.sh" "$BACKUP_FILE" "$RESTORE_DB"

restored="$(compose exec --no-TTY "$POSTGRES_SERVICE" sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" psql --host=127.0.0.1 --username="$POSTGRES_USER" --dbname="$1" --tuples-only --no-align --command="SELECT value FROM persistence_probe WHERE id = 1"' \
  sh "$RESTORE_DB" | tr -d '\r\n')"
[[ "$restored" == "survives-down-up" ]] || { printf 'restore check failed: %s\n' "$restored" >&2; exit 1; }

printf 'postgres runtime smoke: PASS\n'
