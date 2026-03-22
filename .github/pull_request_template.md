## Checklist de este PR

- [ ] **Cobertura**: He ejecutado `pnpm test:api:cov` (o el subset relevante) y la cobertura global del backend `apps/api` se mantiene **≥ 70%**.
- [ ] **Tests nuevos/actualizados**: Toda nueva funcionalidad o cambio de comportamiento viene acompañada de:
  - [ ] Tests unitarios (`apps/api/tests/unit/`) cuando aplica.
  - [ ] Tests `component`/`contract`/`system` si el cambio afecta análisis de algoritmos o endpoints HTTP.
- [ ] **Sin bajar umbrales**: No he reducido el umbral de cobertura en `.github/workflows/ci.yaml` ni he deshabilitado `--cov-fail-under`.
- [ ] **Documentación**: He actualizado la documentación relevante (si aplica) para reflejar cambios de comportamiento.
- [ ] **Changelog**: He añadido entrada en `CHANGELOG.md` bajo `[Unreleased]` describiendo el cambio (Added/Changed/Fixed/Removed).

## Notas adicionales

Describe aquí cualquier decisión relevante sobre tests o cobertura (p. ej. casos que se excluyen explícitamente y por qué).

