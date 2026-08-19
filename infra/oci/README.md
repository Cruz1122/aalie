# Runtime OCI de AALIE

Esta carpeta versiona la instalación mínima que reproduce la producción de `aalie.dev`. La VM no construye AALIE: GitHub Actions publica imágenes ARM64 en GHCR y el host descarga el SHA exacto indicado por `AALIE_TAG`.

| Archivo del repositorio | Destino en OCI | Owner / modo esperado |
|---|---|---|
| `compose.yml` | `/home/ubuntu/aalie/compose.yml` | `ubuntu:ubuntu` / `0644` |
| `Caddyfile` | `/home/ubuntu/aalie/Caddyfile` | `ubuntu:ubuntu` / `0644` |
| `.env` (creado en el host) | `/home/ubuntu/aalie/.env` | `ubuntu:ubuntu` / `0600` |
| `deploy/aalie-deploy` | `/usr/local/bin/aalie-deploy` | `root:root` / `0755` |
| `ssh/99-aalie-hardening.conf` | `/etc/ssh/sshd_config.d/99-aalie-hardening.conf` | `root:root` / `0644` |
| `scripts/host-health.sh` | `/home/ubuntu/aalie/host-health.sh` | `ubuntu:ubuntu` / `0755` |

`.env` contiene `AALIE_TAG=<40-char-git-sha>` y no se versiona. `.previous-tag`, gestionado atómicamente por el deploy, conserva el SHA anterior; `latest-arm64` no es fuente de verdad ni mecanismo de rollback.

Validación local sin desplegar:

```bash
AALIE_TAG=0000000000000000000000000000000000000000 \
  docker compose -f infra/oci/compose.yml config --quiet
bash -n infra/oci/deploy/aalie-deploy
bash -n infra/oci/scripts/host-health.sh
docker run --rm \
  -v "$PWD/infra/oci/Caddyfile:/etc/caddy/Caddyfile:ro" \
  caddy:2.11.4-alpine caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
```

La fuente de verdad operacional, incluidos bootstrap, seguridad, rotación, patching, rollback y recuperación, es [`docs/06-operations/production-oci.md`](../../docs/06-operations/production-oci.md).
