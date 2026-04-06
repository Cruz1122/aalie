# Limitaciones conocidas

**Tipo:** descriptiva

## Propósito

Centralizar límites reales del sistema para evitar promesas incorrectas y para orientar soporte, pruebas y mantenimiento.

## Alcance

Incluye límites del parser, análisis, recurrencias, trace, export y LLM.

## Fuente de verdad

- tests contract y system;
- `apps/api/app/modules/analysis/`;
- `apps/api/app/modules/export/`;
- `apps/web/src/app/api/llm/`.

## Estructura

### Parser y AST

- La gramática soportada es la definida por `Language.g4`; todo lo que quede fuera debe fallar de forma explícita.
- La notación aceptada idealmente es más amplia que la cobertura efectiva del motor posterior.

### Análisis iterativo

- WHILE usa heurística conservadora y no adivina conteos cuando no hay señal suficiente.
- SymPy es el cuello de botella más probable en simplificaciones y cierres de sumatorias complejas.

### Análisis recursivo

- Los métodos cubren solo familias concretas de recurrencias.
- Hay salidas parciales o `unsupported` cuando la forma detectada sale de cobertura.

### Trace

- La generación de inputs por defecto para trace es heurística y puede no representar todos los casos pedagógicos deseados.
- El trace puede truncarse por profundidad o por seguridad operativa.

### Export

- El PDF depende de `pdflatex` y del toolchain TeX instalado.
- El export no debe recalcular nada fuera del snapshot; si falta información, debe declararlo como no disponible.

### LLM

- La integración LLM es opcional.
- Sus respuestas no sustituyen el contrato determinista del motor.
- Disponibilidad, cuotas y formato dependen del proveedor configurado.

## Ejemplos

- Un WHILE con varias variables de control no monotónicamente relacionadas puede terminar en resultado no concluyente.
- Una recurrencia fuera de forma estándar puede quedar documentada y mostrada sin una conclusión matemática fuerte.

## Limites conocidos

- Esta lista debe mantenerse alineada con los ADRs y con las advertencias presentes en snapshot/export.

## Archivos relacionados

- `glossary.md`
- `../03-specs/while-heuristics-spec.md`
- `../03-specs/recurrence-methods-spec.md`
