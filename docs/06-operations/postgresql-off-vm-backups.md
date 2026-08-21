# PostgreSQL off-VM backups for OCI

**Status:** software-ready; external OCI bootstrap and a real restore drill must be verified before research telemetry is enabled.

MF3 treats a dump stored on the same OCI boot volume as insufficient. Production backups use PostgreSQL custom format (`pg_dump -Fc`) and a private OCI Object Storage bucket. The VM authenticates with an Instance Principal; no OCI user API key is stored in the repository or runtime environment.

## External OCI bootstrap

Create a private Object Storage bucket dedicated to AALIE backups. Create a Dynamic Group matching only the production compute instance, then grant the minimum Object Storage permission required to manage objects in that one bucket/compartment. Configure a lifecycle rule that matches the approved research retention period. Do not make the bucket public.

The exact tenancy/compartment OCIDs and bucket cannot be created or verified from repository CI. They are the only external bootstrap items for this gate.

## Host prerequisites

Install the OCI CLI from Oracle's supported distribution and verify `oci os ns get --auth instance_principal` works on the production VM. Set these server-only values in `/home/ubuntu/aalie/.env.runtime`:

```text
OCI_BACKUP_BUCKET=<private bucket>
OCI_BACKUP_PREFIX=postgres
# OCI_BACKUP_NAMESPACE=<optional override>
```

## Daily backup

Run:

```bash
/home/ubuntu/aalie/scripts/postgres-backup-object-storage.sh
```

The script calls the existing `postgres-backup.sh`, computes SHA-256, uploads the dump plus checksum, downloads the object again, recomputes SHA-256, and fails if the uploaded object does not match. Schedule it daily with systemd timer or cron only after the Instance Principal path is verified.

Before any critical schema migration, run the same command and record the resulting object name in the change log.

## Restore drill

Never drill against the live database. Create an empty drill database, then run:

```bash
/home/ubuntu/aalie/scripts/postgres-restore-object-storage.sh \
  postgres/aalie-postgres-YYYYMMDDTHHMMSSZ.dump \
  aalie_restore_drill
```

The off-VM restore script downloads both dump and checksum, verifies SHA-256, then delegates to `postgres-restore.sh`. That existing restore command refuses a non-empty target database.

After restore, validate Alembic revision and representative MF3 row counts (`studies`, `study_participants`, `study_quiz_attempts`, `study_events`, `study_measurements`, `study_export_audits`) against the source snapshot used for the drill. Record date, object, SHA-256 and counts.

## Hard gate

Keep `AALIE_STUDY_TELEMETRY_ENABLED=false` until all of the following are evidenced on OCI: private bucket, Instance Principal authorization, one verified upload, one restore into an empty drill database, and data-integrity comparison. Repository/CI can validate scripts and configuration, but cannot truthfully replace that external restore drill.
