# Modelo de progreso

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `packages/content-catalog/src/progress.ts`, `packages/content-catalog/catalog/`, `content-model.md`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Sección 4 — Progreso

## Propósito

Cerrar el contrato de progreso para módulos de guía y curso sin interpretaciones distintas entre frontend, contenido y analytics.

## Alcance

Aplica al cálculo de porcentaje por módulo y a la unidad oficial de lectura de v1.

## Fuente de verdad

- `packages/content-catalog/src/progress.ts`
- `packages/content-catalog/catalog/`
- `content-model.md`

## Estructura

### Unidad oficial

- La unidad oficial de progreso es **section**.
- `trackProgress: true` marca secciones que cuentan en el porcentaje.
- `trackProgress: false` permite secciones auxiliares o no evaluables (portadas, resúmenes, referencias).

### Fórmula oficial

```
percentage = (completedTrackableSections / totalTrackableSections) * 100
```

- El porcentaje se redondea al entero más cercano.
- Un módulo publicado con cero secciones trackeables es inválido (error `CONTENT_208`).

### Almacenamiento de progreso

El progreso se persiste en `localStorage` del navegador:

```
aalie.progress.v1 = {
  masteryBySkill: { "skill.asymptotic.big_o.interpretation": 0.6 },
  studiedContentRefs: [
    { courseId: "ada", moduleId: "mod-notacion-asintotica", chapterId: "cap-big-o" }
  ],
  recentQuestionIds: ["ada-asymptotic-notation-basic-001"]
}
```

No hay persistencia backend obligatoria. El progreso puede perderse si el usuario limpia datos del navegador.

### Mastery por skill (integración con quizzes)

El sistema de quizzes actualiza `masteryBySkill` después de cada evaluación:

- Por cada pregunta respondida, se calcula un delta de dominio por skill.
- `ratio >= 0.999`: `delta = +0.05`
- `ratio <= 0.001`: `delta = -0.03`
- Otherwise: `delta = 0.05*ratio + (-0.03)*(1-ratio)`
- Skills con promedio >= 0.75 en la sesión se marcan como fortalezas.
- Skills con promedio <= 0.5 se marcan como áreas a mejorar.

`weakSkillIds` se deriva de `masteryBySkill` seleccionando skills con dominio < 0.5.

### Eventos esperados de UI

- Marcar una sección como leída o completada al hacer scroll/visibilidad.
- Restaurar progreso desde `localStorage` al cargar el módulo.
- Recalcular el progreso al entrar o salir de una sección trackeable.
- Actualizar `masteryBySkill` después de cada sesión de quiz.
- Almacenar `recentQuestionIds` para evitar repetición en quizzes.

### Implementación

`computeModuleProgress()` en `packages/content-catalog/src/progress.ts`:

```typescript
function computeModuleProgress(module, completedSectionIds): ModuleProgress {
  const trackable = module.chapters.flatMap(c =>
    c.sections.filter(s => s.trackProgress)
  );
  const completed = trackable.filter(s =>
    completedSectionIds.includes(s.sectionId)
  );
  return {
    totalTrackableSections: trackable.length,
    completedTrackableSections: completed.length,
    ratio: completed.length / trackable.length,
    percentage: Math.round((completed.length / trackable.length) * 100)
  };
}
```

## Ejemplos

- Si un módulo tiene 4 secciones trackeables y 2 completadas, el progreso es `50%`.
- Una sección de portada con `trackProgress: false` no altera el denominador.
- Un módulo con 0 secciones trackeables lanza error `CONTENT_208` si está publicado.

## Limites conocidos

- v1 no define persistencia contractual entre dispositivos (no hay sync cross-device).
- No existe una entidad `page`; si una UI pagina una sección larga, el progreso sigue atado a la sección.
- La persistencia local puede perderse en cliente.

## Archivos relacionados

- `search-indexing.md`
- `content-validation.md`
- `authoring-guide.md`
- `adaptive-quizzes.md`
- `quiz-json-schema.md`
