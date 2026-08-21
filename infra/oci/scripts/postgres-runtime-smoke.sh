#!/usr/bin/env bash
set -Eeuo pipefail

readonly APP_DIR="${APP_DIR:-$(pwd)}"
readonly COMPOSE_FILE="${COMPOSE_FILE:-${APP_DIR}/compose.yml}"
readonly ENV_FILE="${ENV_FILE:-${APP_DIR}/.env}"
readonly RUNTIME_ENV_FILE="${RUNTIME_ENV_FILE:-${APP_DIR}/.env.runtime}"
readonly POSTGRES_SERVICE="${POSTGRES_SERVICE:-postgres}"
readonly BACKUP_FILE="${1:?backup output path is required}"
readonly RESTORE_DB="${2:-aalie_restore_check}"
readonly MF3_STUDY_ID="00000000-0000-4000-8000-000000000301"
readonly MF3_PARTICIPANT_ID="00000000-0000-4000-8000-000000000302"
readonly MF3_ATTEMPT_ID="00000000-0000-4000-8000-000000000306"
readonly MF3_EXPECTED_SIGNATURE="1:1:1:1:1:1:1:1"

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

psql_in_db() {
  local database="$1"
  shift
  compose exec --no-TTY -e TARGET_DATABASE="$database" "$POSTGRES_SERVICE" sh -c \
    'PGPASSWORD="$POSTGRES_PASSWORD" psql --host=127.0.0.1 --username="$POSTGRES_USER" --dbname="$TARGET_DATABASE" "$@"' \
    sh "$@"
}

mf3_signature() {
  local database="${1:-}"
  local query
  query="SELECT concat_ws(':',
    (SELECT count(*) FROM studies WHERE id = '${MF3_STUDY_ID}'),
    (SELECT count(*) FROM study_participants WHERE id = '${MF3_PARTICIPANT_ID}'),
    (SELECT count(*) FROM study_consents WHERE participant_id = '${MF3_PARTICIPANT_ID}'),
    (SELECT count(*) FROM study_measurements WHERE participant_id = '${MF3_PARTICIPANT_ID}'),
    (SELECT count(*) FROM study_events WHERE participant_id = '${MF3_PARTICIPANT_ID}'),
    (SELECT count(*) FROM study_quiz_progress WHERE participant_id = '${MF3_PARTICIPANT_ID}'),
    (SELECT count(*) FROM study_quiz_attempts WHERE id = '${MF3_ATTEMPT_ID}'),
    (SELECT count(*) FROM study_quiz_attempt_items WHERE attempt_id = '${MF3_ATTEMPT_ID}')
  );"

  if [[ -n "$database" ]]; then
    psql_in_db "$database" --tuples-only --no-align --command "$query" | tr -d '\r\n'
  else
    psql_as_app --tuples-only --no-align --command "$query" | tr -d '\r\n'
  fi
}

mkdir -p "$(dirname "$BACKUP_FILE")"
rm -f "$BACKUP_FILE"

psql_as_app --command "CREATE TABLE IF NOT EXISTS persistence_probe (id integer PRIMARY KEY, value text NOT NULL); TRUNCATE persistence_probe; INSERT INTO persistence_probe VALUES (1, 'survives-down-up');"

psql_as_app <<'SQL'
DELETE FROM studies WHERE slug = 'mf3-backup-smoke';

INSERT INTO studies (
  id, slug, title, protocol_version, consent_version, consent_sha256,
  status, telemetry_enabled, starts_at, ends_at, retention_until, created_at, updated_at
) VALUES (
  '00000000-0000-4000-8000-000000000301',
  'mf3-backup-smoke',
  'MF3 backup smoke study',
  'smoke-v1',
  'smoke-consent-v1',
  repeat('a', 64),
  'ACTIVE',
  false,
  now(),
  NULL,
  NULL,
  now(),
  now()
);

INSERT INTO study_participants (
  id, study_id, participant_code, condition, enrolled_at,
  condition_assigned_at, withdrawn_at, excluded_at, exclusion_reason_code, created_at
) VALUES (
  '00000000-0000-4000-8000-000000000302',
  '00000000-0000-4000-8000-000000000301',
  'P-MF3SMOKE',
  'AALIE',
  now(),
  now(),
  NULL,
  NULL,
  NULL,
  now()
);

INSERT INTO study_consents (
  id, participant_id, consent_version, consent_sha256, action, recorded_at
) VALUES (
  '00000000-0000-4000-8000-000000000303',
  '00000000-0000-4000-8000-000000000302',
  'smoke-consent-v1',
  repeat('a', 64),
  'CONSENTED',
  now()
);

INSERT INTO study_measurements (
  id, participant_id, metric_key, metric_version, phase, numeric_value, unit, measured_at
) VALUES (
  '00000000-0000-4000-8000-000000000304',
  '00000000-0000-4000-8000-000000000302',
  'pretest_score',
  '1',
  'pre',
  42.0,
  'points',
  now()
);

INSERT INTO study_events (
  id, participant_id, event_name, event_version, source, request_id, occurred_at,
  success, duration_ms, error_code, algorithm_kind, analysis_method,
  export_format, llm_job, llm_provider, llm_model, app_build_sha
) VALUES (
  '00000000-0000-4000-8000-000000000305',
  '00000000-0000-4000-8000-000000000302',
  'analysis_run',
  '1',
  'SERVER',
  'mf3-backup-smoke',
  now(),
  true,
  1,
  NULL,
  'iterative',
  'summation',
  NULL,
  NULL,
  NULL,
  NULL,
  'mf3-backup-smoke'
);

INSERT INTO study_quiz_progress (
  participant_id, revision, mastery_by_skill, recent_question_ids,
  weak_skill_ids, last_failed_skill_ids, last_failed_topic_ids, updated_at
) VALUES (
  '00000000-0000-4000-8000-000000000302',
  1,
  '{"complexity":0.75}'::json,
  '["mf3-q1"]'::json,
  '[]'::json,
  '[]'::json,
  '[]'::json,
  now()
);

INSERT INTO study_quiz_attempts (
  id, participant_id, session_id, dataset_id, dataset_schema_version,
  taxonomy_version, dataset_sha256, app_build_sha, selector_version,
  grading_version, progress_version, progress_revision_before, course_id,
  module_id, locale, status, started_at, submitted_at, question_count,
  score, max_score, accuracy, result_json
) VALUES (
  '00000000-0000-4000-8000-000000000306',
  '00000000-0000-4000-8000-000000000302',
  'mf3-backup-session',
  'mf3-smoke-dataset',
  '1',
  '1',
  repeat('b', 64),
  'mf3-backup-smoke',
  'adaptive-selector-v2',
  'grading-v1',
  'mastery-v1',
  0,
  'mf3-smoke-course',
  'mf3-smoke-module',
  'es',
  'SUBMITTED',
  now(),
  now(),
  1,
  1.0,
  1.0,
  1.0,
  '{"sessionId":"mf3-backup-session","score":1.0,"maxScore":1.0}'::json
);

INSERT INTO study_quiz_attempt_items (
  attempt_id, position, question_id, question_version,
  question_fingerprint_sha256, topic, difficulty, question_type,
  cognitive_level, skill_ids, selection_reason_code, option_order,
  left_item_order, right_item_order, score, max_score, is_correct
) VALUES (
  '00000000-0000-4000-8000-000000000306',
  0,
  'mf3-q1',
  1,
  repeat('c', 64),
  'complexity',
  'basic',
  'single_choice',
  'remember',
  '["complexity"]'::json,
  'initial_question',
  '["a","b"]'::json,
  '[]'::json,
  '[]'::json,
  1.0,
  1.0,
  true
);
SQL

source_signature="$(mf3_signature)"
[[ "$source_signature" == "$MF3_EXPECTED_SIGNATURE" ]] || {
  printf 'MF3 source seed check failed: %s\n' "$source_signature" >&2
  exit 1
}

env APP_DIR="$APP_DIR" COMPOSE_FILE="$COMPOSE_FILE" ENV_FILE="$ENV_FILE" RUNTIME_ENV_FILE="$RUNTIME_ENV_FILE" \
  bash "$(dirname "$0")/postgres-backup.sh" "$BACKUP_FILE"

compose down --remove-orphans
compose up -d --wait

value="$(psql_as_app --tuples-only --no-align --command "SELECT value FROM persistence_probe WHERE id = 1" | tr -d '\r\n')"
[[ "$value" == "survives-down-up" ]] || {
  printf 'persistence check failed: %s\n' "$value" >&2
  exit 1
}

persisted_signature="$(mf3_signature)"
[[ "$persisted_signature" == "$MF3_EXPECTED_SIGNATURE" ]] || {
  printf 'MF3 down/up persistence check failed: %s\n' "$persisted_signature" >&2
  exit 1
}

psql_as_app --command "DROP DATABASE IF EXISTS \"${RESTORE_DB}\";"
psql_as_app --command "CREATE DATABASE \"${RESTORE_DB}\";"
env APP_DIR="$APP_DIR" COMPOSE_FILE="$COMPOSE_FILE" ENV_FILE="$ENV_FILE" RUNTIME_ENV_FILE="$RUNTIME_ENV_FILE" \
  bash "$(dirname "$0")/postgres-restore.sh" "$BACKUP_FILE" "$RESTORE_DB"

restored="$(psql_in_db "$RESTORE_DB" --tuples-only --no-align --command "SELECT value FROM persistence_probe WHERE id = 1" | tr -d '\r\n')"
[[ "$restored" == "survives-down-up" ]] || {
  printf 'restore check failed: %s\n' "$restored" >&2
  exit 1
}

restored_signature="$(mf3_signature "$RESTORE_DB")"
[[ "$restored_signature" == "$MF3_EXPECTED_SIGNATURE" ]] || {
  printf 'MF3 restore integrity check failed: %s\n' "$restored_signature" >&2
  exit 1
}

printf 'postgres runtime smoke: PASS (generic + MF3 data)\n'
