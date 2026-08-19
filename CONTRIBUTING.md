# Contribuir a AALIE

Gracias por contribuir a AALIE. El repositorio prioriza exactitud matemática, reproducibilidad, claridad pedagógica y cambios pequeños que puedan revisarse con evidencia.

## Flujo de trabajo

1. Parte de `develop` actualizado.
2. Crea una rama corta y descriptiva (`feat/...`, `fix/...`, `docs/...`, `test/...`, `chore/...`).
3. Mantén cada cambio enfocado en un objetivo concreto.
4. Añade o ajusta pruebas cuando el comportamiento cambie.
5. Abre una solicitud de cambios hacia `develop`.
6. `main` representa la línea estable y productiva; no debe usarse como rama normal de trabajo.

## Commits

Usa Conventional Commits cuando sea razonable:

- `feat(scope): ...`
- `fix(scope): ...`
- `test(scope): ...`
- `docs(scope): ...`
- `refactor(scope): ...`
- `chore(scope): ...`

Los mensajes deben describir el cambio real y no incluir atribuciones automáticas a herramientas de generación de código.

## Validación mínima

Antes de abrir una solicitud de cambios, ejecuta las comprobaciones que correspondan al cambio. Comandos disponibles en el monorepo:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm test
pnpm lint:web
pnpm lint:api:local
pnpm test:api:gate
pnpm test:docs-contracts
```

No todos los comandos son necesarios para cada modificación, pero la solicitud debe indicar qué se ejecutó y qué no aplica.

## Cambios al motor de análisis

Los cambios de análisis deben preferir resultados defendibles a inferencias agresivas. Cuando se modifica una regla, heurística o clasificación:

- incluye entradas representativas;
- define el resultado esperado de forma explícita;
- evita pruebas que solo comprueben que "no falla";
- documenta supuestos o límites cuando el resultado no sea universal;
- preserva la terminología matemática usada por el producto.

## Cambios de interfaz

Las mejoras visuales no deben ocultar advertencias, evidencia matemática, trazas, costos o métodos disponibles. Mantén accesibilidad básica, comportamiento adaptable y consistencia con los componentes existentes.

## Dependencias y secretos

- No subas claves, tokens, credenciales, archivos `.env` reales ni material de producción sensible.
- Evita nuevas dependencias si la plataforma ya resuelve el problema con la tecnología existente.
- No uses etiquetas de imagen no fijadas para contratos productivos que requieran reproducibilidad.

## Solicitudes de cambios

La solicitud debe explicar:

- problema u objetivo;
- solución implementada;
- cómo se validó;
- impacto en análisis, interfaz, API, documentación o producción;
- riesgos o limitaciones pendientes.

Para vulnerabilidades de seguridad, no abras un issue público. Consulta `SECURITY.md`.
