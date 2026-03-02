# Convenciones de Desarrollo - AALIE (Algorithmic Analysis)

## Propósito

Guía rápida para mantener consistencia en el monorepo: patrones, estructura, componentes, documentación y changelog. Aplicar estas convenciones en backend (FastAPI), frontend (Next.js), packages compartidos y documentación.

---

## Estructura del Monorepo

```
algorithmic-analysis/
├── apps/
│   ├── api/                    # Backend FastAPI
│   │   └── app/
│   │       ├── core/           # Configuración, constantes transversales
│   │       ├── modules/        # Módulos por dominio
│   │       │   ├── parsing/    # Parsing de pseudocódigo
│   │       │   ├── analysis/   # Análisis de complejidad
│   │       │   ├── classification/
│   │       │   └── execution/
│   │       └── main.py
│   └── web/                    # Frontend Next.js (App Router)
│       └── src/
│           ├── app/            # Páginas y API routes (BFF)
│           ├── components/     # Componentes React
│           ├── hooks/          # Hooks personalizados
│           ├── contexts/       # Contextos React
│           ├── lib/            # Utilidades, helpers
│           ├── services/       # Clientes API
│           ├── types/          # Tipos TypeScript locales
│           ├── styles/         # Estilos globales
│           └── workers/        # Web Workers
├── packages/
│   ├── types/                  # Tipos compartidos (@aa/types)
│   ├── grammar/                # Gramática ANTLR (@aa/grammar)
└── docs/                       # Documentación
```

### Reglas de capas

- **Backend**: Routers en `modules/<feature>/router.py`, lógica en `service.py`, adaptadores en `adapter.py`, modelos en `models/`, utilidades en `utils/`.
- **Frontend**: Páginas en `app/`, componentes en `components/`, lógica reutilizable en `hooks/` y `lib/`, llamadas API en `services/`.
- **Packages**: Tipos compartidos en `@aa/types`; no duplicar interfaces entre apps.
- No mezclar responsabilidades entre capas ni poner lógica de negocio en componentes de presentación.

---

## Patrones de diseño

- **Factory/Strategy**: Para ramificaciones por tipo (ej. `IterativeAnalyzer`, `RecursiveAnalyzer`); usar registry cuando aplique.
- **Adapter**: Para integraciones externas (gramática TS/Python, LLM).
- **Visitor**: Se usa para establecer reglas específicas para bloques.
- **DTOs/modelos**: Tipos compartidos en `packages/types`; schemas Pydantic en backend por módulo.
- Extrae lógica repetida a servicios/helpers antes de crear nuevos componentes o duplicar código.

---

## Labels y literales (i18n)

### Frontend

- **Prohibido** usar literales de texto directamente en JSX o UI.
- Sistema: **next-intl** con archivos JSON en `apps/web/messages/`.
- Idiomas: `es.json` (español), `en.json` (inglés).
- Namespaces por dominio: `common`, `nav`, `footer`, `analyzer`, `metadata`, `documentation`, etc.
- Uso en componentes: `useTranslations("namespace")` → `t("key")`.
- Rutas con prefijo de idioma: `/es/analyzer`, `/en/analyzer`, `/es/examples`, etc.
- Navegación: usar `Link`, `useRouter`, `usePathname` de `@/i18n/navigation` para preservar el locale.
- Selector de idioma: componente `LocaleSwitcher` en el Header.
- **Flujo de locale en requests**: Obtener `useLocale()` y enviar `locale: "es" | "en"` en el body de peticiones a `/analyze/open`, `/api/llm`, `/analyze/trace`.

### Backend

- **Labels de procedimiento y trace**: `apps/api/app/modules/analysis/translations.py`.
  - `PROCEDURE_LABELS`, `NOTES_LABELS`, `TRACE_STEP_LABELS` (en/es).
  - Funciones: `get_labels(locale)`, `get_note_labels(locale)`, `get_trace_step_labels(locale)`.
  - Usados en analizadores, SummationCloser, Executor. Fallback a `"en"` si locale no existe.
- Mensajes y constantes por dominio en `apps/api/app/modules/<feature>/constants.py`.
- Constantes transversales en `apps/api/app/core/constants.py`.

### Prompts LLM

- Prompts parametrizados por locale en `apps/web/src/app/api/llm/prompts/`.
- `getPrompt(job, locale)` selecciona el prompt según idioma.
- Jobs con prompts localizados: `parser_assist`, `general`, `simplifier`, `repair`, `compare`.
- Documentación detallada: [i18n-labels-prompts.md](../app/i18n-labels-prompts.md).

---

## Componentes UI (Frontend)

- Antes de crear un componente, verifica si existe en `components/` o en subcarpetas (`components/trace/`, etc.).
- Si creas uno nuevo reutilizable, usa prefijo **AA** (ej. `AAButton`, `AAModal`) y ubícalo en la carpeta correcta.
- Componentes de feature específicos pueden vivir en subcarpetas (ej. `components/trace/`).
- Mantén componentes sin lógica de negocio; extrae hooks/helpers cuando aplique.

---

## Comentarios y docstrings

Documenta cada clase/función pública con docstring o comentario de bloque que incluya **autor** y **versión** vigente (según `CHANGELOG.md`). No reemplaces autores existentes.

Evita comentarios triviales; solo explica decisiones no obvias.

### Plantillas

**Python:**

```python
"""Servicio para parsing de pseudocódigo.

Author: @Cruz1122
Version: 0.1.0
"""
```

**TypeScript/JavaScript:**

```typescript
/**
 * Servicio para llamadas al API de gramática.
 * Author: Juan Camilo Cruz Parra (@Cruz1122)
 * Version: 0.1.0
 */
```

Actualiza la versión cuando cambie en `CHANGELOG.md`.

---

## Changelog

- Cada cambio que vaya a commit debe añadir entrada en `CHANGELOG.md` bajo `[Unreleased]`.
- Usa secciones: `Added`, `Changed`, `Fixed`, `Removed` según corresponda.
- Formato recomendado:

  ```markdown
  ## [Unreleased]

  ### Added
  - Soporte para análisis recursivo con teorema maestro

  ### Fixed
  - Corrección de parsing de bucles anidados
  ```

---

## Buenas prácticas adicionales

### Tipado

- **TypeScript**: Props y helpers tipados; evita `any`.
- **Python**: Anotaciones en interfaces públicas; usa `typing` para tipos complejos.

### Manejo de errores

- **Backend**: Captura excepciones y traduce a respuestas controladas (códigos HTTP, mensajes estructurados).
- **Frontend**: Muestra mensajes provenientes de labels; evita exponer errores técnicos crudos al usuario.

### Rutas y endpoints

- Centraliza rutas de API en archivos dedicados (ej. `apps/web/src/lib/api-routes.ts` o similar).
- Backend: prefijos de routers coherentes (`/grammar`, `/classify`, `/analyze`).

### Tests

- Tests al añadir lógica no trivial.
- Estructura: `tests/unit/`, `tests/component/`, `tests/contract/`, `tests/system/` en `apps/api/tests/`.
- Backend: pytest en `apps/api/tests/`.
- **Atajos (desde raíz)**: `pnpm test:api` (todos), `pnpm test:api:gate` (daily: unit/component/system), `pnpm test:api:contract` (nightly), `pnpm test:api:cov` (con cobertura), `pnpm test:api:unit`, `pnpm test:api:stress` (Prueba1–Prueba7). Ver MCP `test_suite_commands`.
- **Ejecución directa**: desde `apps/api`, usar `python -m pytest` (no `pytest` directo):
  ```bash
  cd apps/api && python -m pytest tests/ -v
  python -m pytest tests/unit/ -v
  python -m pytest tests/contract/test_stress_algorithms.py -v
  ```
- Frontend: tests por componente o feature cuando se implementen.

### Accesibilidad

- Añade `aria-*` y `role` cuando aplique en componentes UI.
- Labels descriptivos en formularios e iconos.

---

## Packages compartidos

### `@aa/types`

- Tipos compartidos entre frontend y backend (cuando se consuman desde TS).
- Mantener interfaces alineadas con schemas Pydantic del backend.

### `@aa/grammar`

- Gramática ANTLR y generación TS/Python.
- Código generado en `out/` o `generated/`; no editar manualmente.
- Scripts de generación documentados en `packages/grammar/README.md`.

---

## API Routes (Next.js BFF)

- Rutas en `apps/web/src/app/api/`.
- Proxy hacia backend cuando sea necesario (ej. `/api/llm/*`).
- Mantener rutas delgadas; lógica en servicios o en backend.

---

## Checklist rápido antes de commit/PR

- [ ] Sin literales de texto en UI: usar `useTranslations` y claves de `messages/`.
- [ ] Reutilicé componentes existentes o creé uno AA* si faltaba.
- [ ] Docstrings de clases/funciones públicas con autor y versión actual.
- [ ] Changelog actualizado en `[Unreleased]`.
- [ ] Estructura de carpetas y capas respetada.
- [ ] Lint y format ejecutados (`pnpm lint:web`, `pnpm format:web`, `ruff check`, `black`).

---

## Referencias

- [request-flow.md](./request-flow.md): Flujo de peticiones backend desde frontend.
- [i18n-labels-prompts.md](../app/i18n-labels-prompts.md): Internacionalización, labels y prompts por idioma.
- [docs/app/architecture.md](../app/architecture.md): Arquitectura del frontend.
- [docs/api/endpoints.md](../api/endpoints.md): Endpoints de la API.
