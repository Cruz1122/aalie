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

output_file="${1:-${APP_DIR}/backups/aalie-postgres-$(date -u +%Y%m%dT%H%M%SZ).dump}"
output_dir="$(dirname -- "$output_file")"
mkdir -p "$output_dir"
chmod 700 "$output_dir"
[[ ! -e "$output_file" ]] || {
  printf 'Refusing to overwrite existing backup: %s\n' "$output_file" >&2
  exit 1
}

cleanup_failed_backup() {
  rm -f -- "$output_file"
}
trap cleanup_failed_backup ERR

compose exec --no-TTY "$POSTGRES_SERVICE" sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" exec pg_dump --format=custom --no-owner --no-privileges --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --host=127.0.0.1' \
  >"$output_file"

[[ -s "$output_file" ]] || {
  printf 'Backup file is empty: %s\n' "$output_file" >&2
  exit 1
}

trap - ERR
printf 'PostgreSQL backup created: %s\n' "$(realpath -- "$output_file")"
