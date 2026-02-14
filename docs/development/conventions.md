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
- Namespaces por dominio: `common`, `nav`, `footer`, `analyzer`, `metadata`, etc.
- Uso en componentes: `useTranslations("namespace")` → `t("key")`.
- Rutas con prefijo de idioma: `/es/analyzer`, `/en/analyzer`.
- Navegación: usar `Link`, `useRouter`, `usePathname` de `@/i18n/navigation`.
- Selector de idioma: componente `LocaleSwitcher` en el Header.

### Backend

- Mensajes y constantes por dominio en `apps/api/app/modules/<feature>/constants.py`.
- Constantes transversales en `apps/api/app/core/constants.py`.

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
- Estructura: `tests/unit/`, `tests/integration/`, `tests/system/` por capa.
- Backend: pytest en `apps/api/tests/`.
- Frontend: tests por componente o feature cuando se implementen.

### Accesibilidad

- Añade `aria-*` y `role` cuando aplique en componentes UI.
- Labels descriptivos en formularios e iconos.

---

## Sistema de feedback al usuario (recomendación)

Cuando se implemente un sistema de notificaciones toast:

- Usar para feedback inmediato en operaciones asíncronas (éxito, error de servidor).
- **No** usar para errores de validación de formularios (usar mensajes de error del campo).
- Centralizar mensajes de error técnicos en un helper que los traduzca a lenguaje natural.

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

- [ ] Sin literales de texto en UI: labels usados (cuando exista el sistema).
- [ ] Reutilicé componentes existentes o creé uno AA* si faltaba.
- [ ] Docstrings de clases/funciones públicas con autor y versión actual.
- [ ] Changelog actualizado en `[Unreleased]`.
- [ ] Estructura de carpetas y capas respetada.
- [ ] Lint y format ejecutados (`pnpm lint:web`, `pnpm format:web`, `ruff check`, `black`).

---

## Referencias

- [request-flow.md](./request-flow.md): Flujo de peticiones backend desde frontend.
- [docs/app/architecture.md](../app/architecture.md): Arquitectura del frontend.
- [docs/api/endpoints.md](../api/endpoints.md): Endpoints de la API.
