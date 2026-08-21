#!/usr/bin/env bash
set -Eeuo pipefail

readonly APP_DIR="${APP_DIR:-/home/ubuntu/aalie}"
readonly COMPOSE_FILE="${APP_DIR}/compose.yml"
readonly ENV_FILE="${APP_DIR}/.env"
readonly RUNTIME_ENV_FILE="${APP_DIR}/.env.runtime"
readonly PREVIOUS_FILE="${APP_DIR}/.previous-tag"

status=0

ok() {
  printf 'OK       %s\n' "$*"
}

warning() {
  printf 'WARNING  %s\n' "$*" >&2
  if (( status < 1 )); then
    status=1
  fi
}

critical() {
  printf 'CRITICAL %s\n' "$*" >&2
  status=2
}

read_current_tag() {
  if [[ -f "$ENV_FILE" ]]; then
    sed -nE 's/^AALIE_TAG=([0-9a-f]{40})$/\1/p' "$ENV_FILE" | head -n 1
  fi
}

printf 'AALIE host health (%s)\n' "$(date --iso-8601=seconds)"
printf 'Application directory: %s\n\n' "$APP_DIR"

root_usage="$(df -P / | awk 'NR == 2 {gsub(/%/, "", $5); print $5}')"
if [[ ! "$root_usage" =~ ^[0-9]+$ ]]; then
  critical "Could not determine root filesystem usage"
elif (( root_usage >= 85 )); then
  critical "Root filesystem usage is ${root_usage}% (threshold: 85%)"
elif (( root_usage >= 70 )); then
  warning "Root filesystem usage is ${root_usage}% (warning threshold: 70%)"
else
  ok "Root filesystem usage is ${root_usage}%"
fi
df -h /

printf '\nDocker disk usage:\n'
if docker system df; then
  ok "docker system df completed"
else
  critical "docker system df failed"
fi

printf '\nJournal disk usage:\n'
if journalctl --disk-usage; then
  ok "journal disk usage read successfully"
else
  warning "journal disk usage could not be read"
fi

printf '\nDocker service:\n'
if systemctl is-active --quiet docker; then
  ok "docker.service is active"
else
  critical "docker.service is not active"
fi

printf '\nCompose services:\n'
if [[ ! -f "$COMPOSE_FILE" || ! -f "$ENV_FILE" || ! -f "$RUNTIME_ENV_FILE" ]]; then
  critical "compose.yml, .env or .env.runtime is missing under ${APP_DIR}"
else
  if docker compose \
    --env-file "$ENV_FILE" \
    --env-file "$RUNTIME_ENV_FILE" \
    --file "$COMPOSE_FILE" ps; then
    for container in aalie-postgres aalie-api aalie-web; do
      health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' "$container" 2>/dev/null || true)"
      if [[ "$health" == "healthy" ]]; then
        ok "${container} is healthy"
      else
        critical "${container} health is ${health:-unavailable}"
      fi
    done

    caddy_running="$(docker inspect --format '{{.State.Running}}' aalie-caddy 2>/dev/null || true)"
    if [[ "$caddy_running" == "true" ]]; then
      ok "aalie-caddy is running"
    else
      critical "aalie-caddy is not running"
    fi

    if docker compose \
      --env-file "$ENV_FILE" \
      --env-file "$RUNTIME_ENV_FILE" \
      --file "$COMPOSE_FILE" exec --no-TTY api python -c \
      "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health/ready', timeout=30)"; then
      ok "aalie-api readiness passed"
    else
      critical "aalie-api readiness failed"
    fi
  else
    critical "docker compose ps failed"
  fi
fi

printf '\nImage state:\n'
current_tag="$(read_current_tag)"
if [[ "$current_tag" =~ ^[0-9a-f]{40}$ ]]; then
  ok "CURRENT_SHA=${current_tag}"
else
  critical "CURRENT_SHA is missing or invalid"
fi

if [[ -f "$PREVIOUS_FILE" ]]; then
  previous_tag="$(tr -d '\r\n' <"$PREVIOUS_FILE")"
  if [[ "$previous_tag" =~ ^[0-9a-f]{40}$ ]]; then
    ok "PREVIOUS_SHA=${previous_tag}"
  else
    warning "PREVIOUS_SHA exists but is invalid"
  fi
else
  warning "PREVIOUS_SHA is not recorded yet (expected before the first successful update)"
fi

printf '\nOverall status: '
case "$status" in
  0) printf 'OK\n' ;;
  1) printf 'WARNING\n' ;;
  *) printf 'CRITICAL\n' ;;
esac

exit "$status"
