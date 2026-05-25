# ADR-011: Progreso y quizzes en LocalStorage

**Tipo:** decisión
**Estado:** aceptada
**Fecha:** 2026-05-18
**Fuente de verdad:** `packages/progress-storage/`, `packages/quiz-engine/`, `apps/web/src/hooks/useProgress.ts`, `apps/web/src/hooks/useQuizAttempts.ts`

## Contexto

El frontend necesita persistir progreso de usuario (módulos completados, secciones visitadas) y respuestas de quizzes (intentos, puntajes, respuestas correctas) entre sesiones. Se evaluaron tres estrategias de persistencia: backend con base de datos, backend con sesión server-side, y almacenamiento local del navegador. El proyecto no tiene un backend de usuarios ni sistema de autenticación en su alcance actual. La persistencia no debe requerir infraestructura servidor adicional.

## Decisión

El progreso de contenido y los intentos de quizzes se almacenan exclusivamente en `localStorage` del navegador, con un schema versionado para permitir migraciones futuras.

- `packages/progress-storage/` define el schema, validación, y API de lectura/escritura para progreso.
- `packages/quiz-engine/` gestiona la lógica de quizzes; las respuestas se persisten via `quizAttempts` en localStorage.
- El hook `useProgress` expone `{ completeModule, getModuleProgress, resetProgress }` y sincroniza con localStorage.
- El hook `useQuizAttempts` expone `{ submitAttempt, getAttempts, getScore }` con cache local.
- No hay sync con backend; no hay cuenta de usuario; no hay base de datos.
- El schema incluye `schemaVersion` para migraciones forward-compatibles.

## Alternativas consideradas

- **Backend con base de datos (PostgreSQL/SQLite)**: Requiere autenticación, registro de usuarios, y mantenimiento de sesiones. Fuera del alcance actual del proyecto. Introduciría latencia de red para operaciones de progreso.
- **SessionStorage**: Se limpia al cerrar la pestaña/ventana. No sirve para persistencia entre sesiones.
- **IndexedDB**: Mayor capacidad y soporte para consultas estructuradas, pero API más compleja y overkill para la carga actual (progreso plano + intentos de quiz). Se deja como alternativa futura si el volumen de datos crece.
- **Cookies**: Limitadas a 4KB, enviadas en cada request HTTP, inapropiadas para datos de progreso.

## Consecuencias positivas

- Sin infraestructura server-side para persistencia; funciona completamente offline.
- Lectura/escritura síncrona y sin latencia de red.
- Fácil de resetear (clear localStorage) sin operaciones de backend.
- Schema versionado permite migraciones sin pérdida de datos.

## Consecuencias negativas

- Los datos están limitados al navegador y dispositivo del usuario. No hay roaming entre dispositivos ni sesiones.
- Sin respaldo: si el usuario limpia localStorage o cambia de navegador, el progreso se pierde.
- Capacidad limitada (~5-10 MB por dominio). Para una cantidad muy grande de quizzes o módulos, podría ser necesario migrar a IndexedDB.
- No hay analytics ni visibilidad de progreso para el equipo del producto.

## Impacto en mantenimiento

- Los hooks `useProgress` y `useQuizAttempts` son la única interfaz de acceso; el storage subyacente puede cambiarse a IndexedDB o backend sin modificar consumidores.
- El `schemaVersion` en localStorage debe incrementarse si cambia la estructura de datos; la migración se maneja en `packages/progress-storage/`.
- No hay migraciones automáticas entre schema versions; se implementan a demanda.

## Evidencia

- `packages/progress-storage/`: define `ProgressSchema`, `QuizAttemptSchema`, funciones `loadProgress()`, `saveProgress()`, `loadAttempts()`, `saveAttempts()`.
- `apps/web/src/hooks/useProgress.ts`: implementa `useProgress` con lectura inicial de localStorage y escritura en cada `completeModule`.
- `apps/web/src/hooks/useQuizAttempts.ts`: implementa `useQuizAttempts` con cache local y persistencia diferida (debounced write).
- No existe tabla de progreso en ningún schema de backend; no hay endpoint `/api/progress`.

## Archivos relacionados

- `../03-specs/quizzes-spec.md`
- `../03-specs/content-modules-spec.md`
- `adr-008-unified-content-spaces.md`
