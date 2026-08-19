# Release checklist

**Tipo:** guía
**Estado:** final
**Audiencia:** dev | operador
**Fuente de verdad:** `.github/workflows/ci.yaml`, `.github/workflows/arm64-validation.yml`, `infra/oci/`, `package.json`, `apps/api/pyproject.toml`, `apps/web/package.json`, `scripts/check_docs_contracts.py`
**Última revisión:** 2026-08-19
**Relacionado con informe técnico:** local-development, environment-variables, deployment, troubleshooting

## Propósito

Checklist mínimo antes de liberar cambios que afectan contratos técnicos, APIs, export, contenido académico o producción. CI valida integración; un push aceptado a `main` activa build ARM64, GHCR y deploy OCI automatizado.

## Checklist

### Compilación

- [ ] `pnpm -r build` — todos los paquetes compilan sin error (types, grammar, content-catalog, web)
- [ ] `cd infra && docker compose build` — imágenes Docker construyen correctamente (API + web)

### Tests

- [ ] `cd apps/api && python -m pytest tests/ -m "fast or oracle" -q` — PR gate pasa (tests rápidos + oráculos)
- [ ] `pnpm test:api:cov` — cobertura de la API ≥ 70%
- [ ] `pnpm test:docs-contracts` — estructura de docs válida según contratos
- [ ] `pnpm lint:web` — ESLint + Prettier en web pasan
- [ ] `pnpm lint:api:local` — Ruff lint en API pasa

### Contenido y quizzes

- [ ] `pnpm validate:content-catalog` — catálogo de contenido válido (nota: script pendiente de implementación como comando npm; la validación se hace mediante `test:docs-contracts` y scripts Python de quizzes)
- [ ] `python apps/api/scripts/validate_quiz_bank.py` — banco de quizzes válido (schema + reglas de negocio + referencias)
- [ ] `python apps/api/scripts/report_quiz_bank_coverage.py --fail-on-critical` — cobertura del banco cumple gates críticos (active ≥ 5, total ≤ 500, advanced ≥ 15%, max tema ≤ 35%, sin broken contentRefs)

### Smoke manual

- [ ] Export: `POST /export/report` con formato `pdf` retorna PDF válido (o al menos Markdown/LaTeX si no hay pdflatex)
- [ ] Demo: frontend carga en `http://localhost:3000`, analyzer responde, quizzes cargan
- [ ] Healthcheck: `GET /health` y `GET /api/health` responden `{"status": "ok"}`

### Producción OCI

- [ ] `AALIE_TAG=0000000000000000000000000000000000000000 docker compose -f infra/oci/compose.yml config --quiet` pasa
- [ ] `bash -n infra/oci/deploy/aalie-deploy` y `bash -n infra/oci/scripts/host-health.sh` pasan
- [ ] Caddyfile pasa validación con `caddy:2.11.4-alpine`
- [ ] La configuración renderizada no publica 3000/8000 y Caddy publica solo 80/443
- [ ] El workflow ARM64 publica ambos artefactos con `${{ github.sha }}` antes de desplegar
- [ ] El deploy conserva CURRENT/PREVIOUS SHA y no usa `latest-arm64` para rollback
- [ ] Readiness API pasa dentro del contenedor y el smoke público completo termina en PASS

### Documentación

- [ ] README.md revisado y alineado con cambios del release
- [ ] Mapa de cobertura de docs (`docs/README.md` o `docs/index.md`) revisado por gaps
- [ ] Si se cambió `SNAPSHOT_SCHEMA_VERSION` o schema de contenido: código, spec, checks y nota de compatibilidad actualizados
- [ ] Si se modificó el endpoint o payload de API: spec de API y proxies BFF actualizados
- [ ] ADR registrado si la decisión cambia un principio arquitectónico establecido

## Notas

- El orden sugerido es secuencial: compilación → tests → contenido/smoke → documentación. No avanzar si un paso anterior falla.
- Los checks de OCI estáticos, build, publish, deploy y smoke están automatizados; rotaciones, patching, reboot y recuperación siguen procedimientos operativos controlados.
- La validación del catálogo de contenido se verifica indirectamente mediante `test:docs-contracts` y la suite de tests de `@aa/content-catalog` hasta que exista un script npm dedicado.
- Este checklist reemplaza el flujo descrito en `release-process.md`. Consultar ese documento para el contexto original de decisiones de release.

## Archivos relacionados

- `local-development.md`
- `environment-variables.md`
- `deployment.md`
- `troubleshooting.md`
- `production-oci.md`
- `../../05-quality/ci-cd.md`
- `../../09-decisions/`
