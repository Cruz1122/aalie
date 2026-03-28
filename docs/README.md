# Documentación de AALIE

**Tipo:** descriptiva

## Propósito

Dar una única puerta de entrada para entender, cambiar, validar y operar AALIE sin depender de informes viejos, capturas o conocimiento oral del equipo.

## Alcance

Esta carpeta documenta cuatro capas de verdad:

- producto y arquitectura;
- contratos técnicos;
- calidad y operación;
- uso del sistema y contenido pedagógico.

No es un repositorio de informes académicos ni de historiales de sprint.

## Fuente de verdad

- código fuente en `apps/` y `packages/`;
- tests en `apps/api/tests/` y `apps/web/src/**/__tests__/`;
- configuración de infraestructura en `infra/` y `.github/workflows/`.

## Estructura

- `01-product/`: vision compartida, glosario, limitaciones y mapa actual de capacidades.
- `02-architecture/`: como esta organizado el sistema real hoy.
- `03-specs/`: contratos normativos del motor, snapshot, export y catálogos.
- `04-api/`: contratos FE/BE y BFF/LLM.
- `05-quality/`: estrategia de pruebas, oráculos, cobertura y rendimiento.
- `06-operations/`: desarrollo local, variables de entorno, despliegue y soporte.
- `07-user/`: guías operativas del usuario final.
- `08-content/`: contratos normativos para contenido y quizzes.
- `09-decisions/`: ADRs vigentes.

Entradas recomendadas por perfil:

- Dev backend: `02-architecture/backend-architecture.md` -> `03-specs/`.
- Dev frontend: `02-architecture/frontend-architecture.md` -> `04-api/`.
- QA y mantenimiento: `05-quality/testing-strategy.md` -> `05-quality/algorithm-oracles.md`.
- Operación: `06-operations/local-development.md` -> `06-operations/troubleshooting.md`.
- Usuario/docente: `07-user/user-guide.md`.
- Autor de contenido: `08-content/authoring-guide.md`.

## Ejemplos

- Quiero cambiar la gramática: empezar por `03-specs/pseudocode-grammar-spec.md`, luego `03-specs/ast-schema.md` y después `04-api/parse-api.md`.
- Quiero tocar export: empezar por `03-specs/report-snapshot-spec.md` y `03-specs/export-engine-spec.md`.
- Quiero entender trazas: leer `02-architecture/execution-trace-architecture.md` y `03-specs/execution-trace-spec.md`.

## Limites conocidos

- Algunas secciones de `08-content/` son contratos pre-implementación y no describen flujos ya disponibles en la app.
- La documentación de usuario no cubre features no expuestas hoy en UI.

## Archivos relacionados

- `index.md`
- `01-product/vision.md`
- `06-operations/local-development.md`
