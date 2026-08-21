#!/usr/bin/env bash
set -Eeuo pipefail

readonly APP_DIR="${APP_DIR:-/home/ubuntu/aalie}"
readonly RUNTIME_ENV_FILE="${RUNTIME_ENV_FILE:-${APP_DIR}/.env.runtime}"
readonly BACKUP_SCRIPT="${BACKUP_SCRIPT:-${APP_DIR}/scripts/postgres-backup.sh}"

umask 077

command -v oci >/dev/null || { echo "oci CLI is required" >&2; exit 1; }
command -v sha256sum >/dev/null || { echo "sha256sum is required" >&2; exit 1; }
[[ -f "$RUNTIME_ENV_FILE" ]] || { echo "Missing runtime env: $RUNTIME_ENV_FILE" >&2; exit 1; }

set -a
# shellcheck disable=SC1090
source "$RUNTIME_ENV_FILE"
set +a

: "${OCI_BACKUP_BUCKET:?OCI_BACKUP_BUCKET must be set}"
readonly namespace="${OCI_BACKUP_NAMESPACE:-$(oci os ns get --auth instance_principal --query data --raw-output)}"
readonly prefix="${OCI_BACKUP_PREFIX:-postgres}"
readonly stamp="$(date -u +%Y%m%dT%H%M%SZ)"
readonly object_name="${prefix}/aalie-postgres-${stamp}.dump"
readonly tmp_dir="$(mktemp -d)"
readonly dump_file="${tmp_dir}/backup.dump"
readonly verify_file="${tmp_dir}/verify.dump"
readonly checksum_file="${tmp_dir}/backup.sha256"
trap 'rm -rf -- "$tmp_dir"' EXIT

"$BACKUP_SCRIPT" "$dump_file"
readonly checksum="$(sha256sum "$dump_file" | awk '{print $1}')"
printf '%s  %s\n' "$checksum" "$(basename "$dump_file")" >"$checksum_file"

oci os object put \
  --auth instance_principal \
  --namespace-name "$namespace" \
  --bucket-name "$OCI_BACKUP_BUCKET" \
  --name "$object_name" \
  --file "$dump_file" \
  --metadata "{\"sha256\":\"${checksum}\"}" \
  --force >/dev/null

oci os object put \
  --auth instance_principal \
  --namespace-name "$namespace" \
  --bucket-name "$OCI_BACKUP_BUCKET" \
  --name "${object_name}.sha256" \
  --file "$checksum_file" \
  --force >/dev/null

oci os object get \
  --auth instance_principal \
  --namespace-name "$namespace" \
  --bucket-name "$OCI_BACKUP_BUCKET" \
  --name "$object_name" \
  --file "$verify_file" >/dev/null

readonly verified_checksum="$(sha256sum "$verify_file" | awk '{print $1}')"
[[ "$verified_checksum" == "$checksum" ]] || {
  echo "Uploaded backup verification failed" >&2
  exit 1
}

printf 'Off-VM PostgreSQL backup verified: %s/%s sha256=%s\n' \
  "$OCI_BACKUP_BUCKET" "$object_name" "$checksum"
