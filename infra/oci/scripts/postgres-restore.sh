#!/usr/bin/env bash
set -Eeuo pipefail

readonly APP_DIR="${APP_DIR:-/home/ubuntu/aalie}"
readonly COMPOSE_FILE="${COMPOSE_FILE:-${APP_DIR}/compose.yml}"
readonly ENV_FILE="${ENV_FILE:-${APP_DIR}/.env}"
readonly RUNTIME_ENV_FILE="${RUNTIME_ENV_FILE:-${APP_DIR}/.env.runtime}"
readonly POSTGRES_SERVICE="${POSTGRES_SERVICE:-postgres}"

umask 077

compose() {
  local args=(docker compose)
  [[ -f "$ENV_FILE" ]] && args+=(--env-file "$ENV_FILE")
  [[ -f "$RUNTIME_ENV_FILE" ]] && args+=(--env-file "$RUNTIME_ENV_FILE")
  args+=(--file "$COMPOSE_FILE")
  "${args[@]}" "$@"
}

[[ $# -ge 1 && $# -le 2 ]] || {
  printf 'Usage: %s INPUT_FILE [TARGET_DATABASE]\n' "$0" >&2
  exit 64
}

readonly input_file="$1"
readonly target_database="${2:-${TARGET_DATABASE:-}}"
[[ -f "$input_file" && -s "$input_file" ]] || {
  printf 'Backup file does not exist or is empty: %s\n' "$input_file" >&2
  exit 1
}

[[ -n "$target_database" && "$target_database" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || {
  printf 'Target database must be a simple PostgreSQL identifier\n' >&2
  exit 64
}

readonly container_file="/tmp/aalie-restore-${BASHPID}.dump"
cleanup() {
  compose exec --no-TTY "$POSTGRES_SERVICE" rm -f -- "$container_file" >/dev/null 2>&1 || true
}
trap cleanup EXIT

compose cp "$input_file" "${POSTGRES_SERVICE}:${container_file}"
compose exec --no-TTY "$POSTGRES_SERVICE" pg_restore --list "$container_file" >/dev/null

table_count="$(compose exec --no-TTY \
  -e TARGET_DATABASE="$target_database" \
  "$POSTGRES_SERVICE" sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" psql --host=127.0.0.1 --username="$POSTGRES_USER" --dbname="$TARGET_DATABASE" --tuples-only --no-align --command="SELECT count(*) FROM pg_class AS c JOIN pg_namespace AS n ON n.oid = c.relnamespace WHERE n.nspname NOT IN ('"'"'pg_catalog'"'"', '"'"'information_schema'"'"') AND c.relkind IN ('"'"'r'"'"', '"'"'p'"'"', '"'"'v'"'"', '"'"'m'"'"', '"'"'f'"'"', '"'"'S'"'"')"' \
  | tr -d '[:space:]')"

[[ "$table_count" == "0" ]] || {
  printf 'Refusing to restore into non-empty database %s (tables: %s)\n' "$target_database" "$table_count" >&2
  exit 1
}

compose exec --no-TTY \
  -e TARGET_DATABASE="$target_database" \
  "$POSTGRES_SERVICE" sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" pg_restore --exit-on-error --no-owner --no-privileges --username="$POSTGRES_USER" --host=127.0.0.1 --dbname="$TARGET_DATABASE" "$1"' \
  sh "$container_file"

printf 'PostgreSQL backup restored: %s -> %s\n' "$input_file" "$target_database"
