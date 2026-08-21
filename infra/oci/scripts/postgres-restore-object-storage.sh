#!/usr/bin/env bash
set -Eeuo pipefail

readonly APP_DIR="${APP_DIR:-/home/ubuntu/aalie}"
readonly RUNTIME_ENV_FILE="${RUNTIME_ENV_FILE:-${APP_DIR}/.env.runtime}"
readonly RESTORE_SCRIPT="${RESTORE_SCRIPT:-${APP_DIR}/scripts/postgres-restore.sh}"

umask 077

[[ $# -eq 2 ]] || {
  printf 'Usage: %s OBJECT_NAME TARGET_DATABASE\n' "$0" >&2
  exit 64
}
readonly object_name="$1"
readonly target_database="$2"

command -v oci >/dev/null || { echo "oci CLI is required" >&2; exit 1; }
command -v sha256sum >/dev/null || { echo "sha256sum is required" >&2; exit 1; }
[[ -f "$RUNTIME_ENV_FILE" ]] || { echo "Missing runtime env: $RUNTIME_ENV_FILE" >&2; exit 1; }

set -a
# shellcheck disable=SC1090
source "$RUNTIME_ENV_FILE"
set +a

: "${OCI_BACKUP_BUCKET:?OCI_BACKUP_BUCKET must be set}"
readonly namespace="${OCI_BACKUP_NAMESPACE:-$(oci os ns get --auth instance_principal --query data --raw-output)}"
readonly tmp_dir="$(mktemp -d)"
readonly dump_file="${tmp_dir}/backup.dump"
readonly checksum_file="${tmp_dir}/backup.sha256"
trap 'rm -rf -- "$tmp_dir"' EXIT

oci os object get \
  --auth instance_principal \
  --namespace-name "$namespace" \
  --bucket-name "$OCI_BACKUP_BUCKET" \
  --name "$object_name" \
  --file "$dump_file" >/dev/null
oci os object get \
  --auth instance_principal \
  --namespace-name "$namespace" \
  --bucket-name "$OCI_BACKUP_BUCKET" \
  --name "${object_name}.sha256" \
  --file "$checksum_file" >/dev/null

readonly expected="$(awk '{print $1}' "$checksum_file")"
readonly actual="$(sha256sum "$dump_file" | awk '{print $1}')"
[[ "$actual" == "$expected" ]] || {
  echo "Downloaded backup checksum mismatch" >&2
  exit 1
}

"$RESTORE_SCRIPT" "$dump_file" "$target_database"
printf 'Off-VM restore completed from %s sha256=%s\n' "$object_name" "$actual"
