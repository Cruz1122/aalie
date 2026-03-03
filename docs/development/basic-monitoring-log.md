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
- Job (si aplica, especialmente en `/api/llm`)
- Modelo usado (si aplica)
- Duración (ms)
- Estado (`OK` / `ERROR`)
- Código de error (si aplica)
- Mensaje corto
- Usuario o entorno (`local`, `staging`, `prod`)

## Plantilla de registro diario

| Fecha/Hora | Endpoint | Operación | Job | Modelo | Duración (ms) | Estado | Código error | Mensaje corto | Entorno |
|---|---|---|---|---|---:|---|---|---|---|
| 2026-03-01 10:12 | /api/llm | compare | compare | gemini-2.5-pro | 1820 | OK | - | respuesta correcta | local |
| 2026-03-01 10:15 | /api/llm | compare | compare | gemini-2.5-pro | 950 | ERROR | LLM_RATE_LIMIT | límite de tasa | local |
| 2026-03-01 10:21 | /api/llm/recursion-diagram | recursion_diagram | recursion_diagram | gemini-2.5-flash | 2400 | ERROR | JSON_PARSE | JSON inválido en convertidor | local |
| 2026-03-01 19:43 | /api/analyze/open | analyze_open | - | - | 1681 | OK | - | respuesta correcta | local |
| 2026-03-01 19:43 | /api/analyze/trace | trace | - | - | 1078 | OK | - | respuesta correcta | local |
| 2026-03-01 19:45 | /api/analyze/open | analyze_open | - | - | 319 | OK | - | respuesta correcta | local |
| 2026-03-01 19:45 | /api/analyze/trace | trace | - | - | 164 | OK | - | respuesta correcta | local |
| 2026-03-01 19:45 | /api/llm | llm_general | general | gemini-2.5-flash | 2567 | OK | - | respuesta correcta | local |
| 2026-03-01 19:45 | /api/llm/recursion-diagram | recursion_diagram | recursion_diagram | gemini-2.5-flash | 19746 | OK | - | respuesta correcta | local |
| 2026-03-01 19:49 | /api/analyze/open | analyze_open | - | - | 304 | OK | - | respuesta correcta | local |
| 2026-03-01 19:49 | /api/analyze/trace | trace | - | - | 183 | OK | - | respuesta correcta | local |
| 2026-03-01 19:49 | /api/llm | llm_general | general | gemini-2.5-flash | 1657 | OK | - | respuesta correcta | local |
| 2026-03-01 19:49 | /api/llm | llm_parser_assist | parser_assist | gemini-2.5-flash | 4001 | OK | - | respuesta correcta | local |
| 2026-03-01 19:50 | /api/llm | llm_compare | compare | gemini-2.5-pro | 2020 | OK | - | respuesta correcta | local |
| 2026-03-01 19:50 | /api/llm/classify | llm_classify | classify | gemini-2.0-flash-lite | 2107 | OK | - | respuesta correcta | local |
| 2026-03-01 19:50 | /api/llm/generate-diagram | llm_generate_diagram | generate_diagram | gemini-2.5-flash | 13651 | OK | - | respuesta correcta | local |
| 2026-03-01 19:50 | /api/llm/recursion-diagram | recursion_diagram | recursion_diagram | gemini-2.5-flash | 14745 | OK | - | respuesta correcta | local |
| 2026-03-01 19:50 | /api/llm/status | llm_status | - | - | 1365 | OK | - | respuesta correcta | local |
| 2026-03-02 20:02 | /api/analyze/open | analyze_open | - | - | 302 | OK | - | respuesta correcta | local |
| 2026-03-02 20:02 | /api/analyze/trace | trace | - | - | 177 | OK | - | respuesta correcta | local |
| 2026-03-02 20:02 | /api/llm | llm_general | general | gemini-2.5-flash | 1434 | OK | - | respuesta correcta | local |
| 2026-03-02 20:02 | /api/llm | llm_parser_assist | parser_assist | gemini-3-flash-preview | 8619 | OK | - | respuesta correcta | local |
| 2026-03-02 20:03 | /api/llm | llm_repair | repair | gemini-3-flash-preview | 9464 | OK | - | respuesta correcta | local |
| 2026-03-02 20:03 | /api/llm | llm_compare | compare | gemini-3-flash-preview | 1521 | OK | - | respuesta correcta | local |
| 2026-03-02 20:03 | /api/llm/classify | llm_classify | classify | gemini-2.5-flash-lite | 1387 | OK | - | respuesta correcta | local |
| 2026-03-02 20:03 | /api/llm/generate-diagram | llm_generate_diagram | generate_diagram | gemini-2.5-flash | 11359 | OK | - | respuesta correcta | local |
| 2026-03-02 20:03 | /api/llm/recursion-diagram | recursion_diagram | recursion_diagram | gemini-2.5-flash | 13395 | OK | - | respuesta correcta | local |
| 2026-03-02 20:03 | /api/llm/status | llm_status | - | - | 234 | OK | - | respuesta correcta | local |
