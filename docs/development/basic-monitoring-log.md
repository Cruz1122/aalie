# Registro básico de monitoreo (tiempos y errores)

## Objetivo
Tener un monitoreo mínimo y consistente de:
- **Tiempos de respuesta** por endpoint/flujo.
- **Errores** (tipo, frecuencia y severidad).

Este registro es manual/semi-manual y sirve para reportes rápidos del proyecto.

## Alcance sugerido
Registrar al menos estos flujos:
- `/api/llm`
- `/api/llm/recursion-diagram`
- `/api/analyze/trace`
- `/api/analyze/open`

## Campos mínimos por evento
- Fecha y hora
- Endpoint/flujo
- Operación (ej. `compare`, `trace`, `recursion_diagram`)
- Duración (ms)
- Estado (`OK` / `ERROR`)
- Código de error (si aplica)
- Mensaje corto
- Usuario o entorno (`local`, `staging`, `prod`)

## Plantilla de registro diario

| Fecha/Hora | Endpoint | Operación | Duración (ms) | Estado | Código error | Mensaje corto | Entorno |
|---|---|---|---:|---|---|---|---|
| 2026-03-01 10:12 | /api/llm | compare | 1820 | OK | - | respuesta correcta | local |
| 2026-03-01 10:15 | /api/llm | compare | 950 | ERROR | LLM_RATE_LIMIT | límite de tasa | local |
| 2026-03-01 10:21 | /api/llm/recursion-diagram | recursion_diagram | 2400 | ERROR | JSON_PARSE | JSON inválido en convertidor | local |
| 2026-03-01 19:43 | /api/analyze/open | analyze_open | 1681 | OK | - | respuesta correcta | local |
| 2026-03-01 19:43 | /api/analyze/trace | trace | 1078 | OK | - | respuesta correcta | local |
| 2026-03-01 19:45 | /api/analyze/open | analyze_open | 319 | OK | - | respuesta correcta | local |
| 2026-03-01 19:45 | /api/analyze/trace | trace | 164 | OK | - | respuesta correcta | local |
| 2026-03-01 19:45 | /api/llm | llm_general | 2567 | OK | - | respuesta correcta | local |
| 2026-03-01 19:45 | /api/llm/recursion-diagram | recursion_diagram | 19746 | OK | - | respuesta correcta | local |
| 2026-03-01 19:49 | /api/analyze/open | analyze_open | 304 | OK | - | respuesta correcta | local |
| 2026-03-01 19:49 | /api/analyze/trace | trace | 183 | OK | - | respuesta correcta | local |
| 2026-03-01 19:49 | /api/llm | llm_general | 1657 | OK | - | respuesta correcta | local |
| 2026-03-01 19:49 | /api/llm | llm_parser_assist | 4001 | OK | - | respuesta correcta | local |
| 2026-03-01 19:50 | /api/llm | llm_compare | 2020 | OK | - | respuesta correcta | local |
| 2026-03-01 19:50 | /api/llm/classify | llm_classify | 2107 | OK | - | respuesta correcta | local |
| 2026-03-01 19:50 | /api/llm/generate-diagram | llm_generate_diagram | 13651 | OK | - | respuesta correcta | local |
| 2026-03-01 19:50 | /api/llm/recursion-diagram | recursion_diagram | 14745 | OK | - | respuesta correcta | local |
| 2026-03-01 19:50 | /api/llm/status | llm_status | 1365 | OK | - | respuesta correcta | local |
