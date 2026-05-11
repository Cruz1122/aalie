# Schema JSON de quiz

**Tipo:** normativa

## Propósito

Definir el contrato JSON canónico para el banco de preguntas del sistema de quizzes de AALIE.

El contrato permite que el backend seleccione preguntas de forma determinista según progreso, temas estudiados y áreas a reforzar, y que el frontend pueda renderizar, responder, evaluar visualmente y mostrar retroalimentación sin lógica ad hoc por tipo de pregunta.

## Alcance

Aplica a:

- banco canónico de preguntas;
- validadores de dataset;
- selección adaptativa determinista;
- render de preguntas en frontend;
- feedback por opción;
- enlace estricto con contenido académico;
- ejemplos de authoring;
- crecimiento del banco hasta al menos 500 preguntas.

No aplica a:

- persistencia de sesiones de usuario;
- analítica histórica;
- seguridad real contra inspección de respuestas en cliente;
- evaluación con LLM;
- preguntas abiertas con calificación automática;
- preguntas sobre uso de AALIE como herramienta.

## Fuente de verdad

- `../03-specs/quizzes-spec.md`
- `content-model.md`
- `course-json-schema.md`
- `authoring-guide.md`
- `examples/quiz-bank.sample.json`

## Estructura

### Principios contractuales

1. El dataset canónico debe ser JSON.
2. CSV puede existir solo como formato auxiliar de authoring, importación o exportación.
3. El banco de preguntas no puede depender de componentes de UI.
4. La UI no debe tener lógica especial por pregunta concreta.
5. La evaluación debe ser determinista.
6. La selección adaptativa debe consumir metadatos explícitos, no interpretar texto libre.
7. Toda pregunta activa debe estar enlazada a contenido académico existente.
8. Las respuestas correctas viven claramente en el dataset canónico.
9. Cualquier ofuscación de respuesta pertenece al contrato runtime/API, no al dataset canónico.
10. El quiz evalúa Análisis y Diseño de Algoritmos, no uso de AALIE.

### Dataset raíz

```json
{
	"schemaVersion": "1.0.0",
	"datasetId": "ada-quiz-bank",
	"locale": "es-CO",
	"courseId": "ada",
	"taxonomyVersion": "1.0.0",
	"questions": []
}
```

Campos raíz:

- `schemaVersion` (string semver, obligatorio)
- `datasetId` (string, obligatorio)
- `locale` (string, obligatorio)
- `courseId` (string, obligatorio)
- `taxonomyVersion` (string semver, obligatorio)
- `questions` (array, obligatorio)

### Pregunta

```json
{
	"questionId": "ada-asymptotic-notation-basic-001",
	"questionVersion": 1,
	"status": "active",
	"type": "single_choice",
	"difficulty": "basic",
	"cognitiveLevel": "understand",
	"topic": "asymptotic_notation",
	"tags": ["big_o", "upper_bound", "limits"],
	"skillIds": ["skill.asymptotic.big_o.interpretation"],
	"prompt": { "blocks": [] },
	"options": [],
	"answer": {},
	"gradingPolicy": {},
	"explanation": { "blocks": [] },
	"contentRefs": [],
	"selectionMeta": {}
}
```

Campos obligatorios por pregunta:

- `questionId` (string)
- `questionVersion` (integer >= 1)
- `status` (`draft | active | deprecated | archived`)
- `type` (`single_choice | multiple_choice | true_false | ordering | match_pairs`)
- `difficulty` (`basic | intermediate | advanced`)
- `cognitiveLevel` (`recall | understand | apply | analyze`)
- `topic` (enum de taxonomía controlada ADA)
- `tags[]` (controladas)
- `skillIds[]`
- `prompt` (contenido renderizable)
- `answer` (respuesta canónica)
- `gradingPolicy` (determinista)
- `explanation` (contenido renderizable)
- `contentRefs[]` (con mínimo `courseId`, `moduleId`, `chapterId`)
- `selectionMeta`

### Estados editoriales

- `draft`: incompleta o no lista para selección.
- `active`: válida y seleccionable.
- `deprecated`: válida históricamente, no seleccionable.
- `archived`: retirada del banco activo.

Reglas:

- Solo `active` puede entrar a selección.
- Una pregunta `active` debe pasar todas las validaciones bloqueantes.

### Tipos de pregunta soportados

- `single_choice`
- `multiple_choice`
- `true_false`
- `ordering`
- `match_pairs`

Reglas por tipo:

- `single_choice`: mínimo 2 opciones y exactamente 1 correcta.
- `multiple_choice`: mínimo 2 opciones y al menos 1 correcta.
- `true_false`: 2 opciones (`true` y `false`) y exactamente 1 correcta.
- `ordering`: mínimo 3 elementos ordenables y `answer.orderedOptionIds` completo.
- `match_pairs`: mínimo 2 pares, sin duplicados de lado izquierdo.

### Contenido renderizable

Aplica a:

- `prompt`
- `options[].content`
- `options[].feedback`
- `explanation`
- `leftItems[].content`
- `rightItems[].content`

```json
{
	"blocks": [
		{
			"type": "markdown",
			"content": "Texto con Markdown restringido y fórmulas inline."
		},
		{
			"type": "code",
			"language": "aalie-pseudocode",
			"content": "..."
		}
	]
}
```

Bloques permitidos:

- `markdown`
- `code`

Markdown restringido:

- Permitido: párrafos, negrita, cursiva, listas, código inline, fórmulas inline y de bloque, tablas simples.
- Prohibido: HTML arbitrario, scripts, iframes, estilos inline, imágenes remotas no controladas.

### Opciones y feedback

```json
{
	"optionId": "a",
	"content": {
		"blocks": [
			{
				"type": "markdown",
				"content": "Opción renderizable."
			}
		]
	},
	"feedback": {
		"blocks": [
			{
				"type": "markdown",
				"content": "Feedback específico para esta opción."
			}
		],
		"contentRefs": []
	}
}
```

Reglas:

- `optionId` único dentro de la pregunta.
- Toda opción debe tener `content`.
- Toda opción debe tener `feedback`, incluso la correcta.

### Respuesta canónica

`single_choice` y `true_false`:

```json
{ "correctOptionIds": ["a"] }
```

`multiple_choice`:

```json
{ "correctOptionIds": ["a", "c"] }
```

`ordering`:

```json
{ "orderedOptionIds": ["step-1", "step-2", "step-3"] }
```

`match_pairs`:

```json
{
	"pairs": [
		{ "leftId": "left-1", "rightId": "right-1" }
	]
}
```

Reglas:

- La respuesta debe ser clara en el dataset canónico.
- No se permite inferencia desde texto.
- La respuesta debe referir IDs existentes.

### Política de calificación

```json
{
	"mode": "all_or_nothing",
	"maxScore": 1,
	"penalty": 0
}
```

Modos permitidos:

- `all_or_nothing`
- `exact_set`
- `partial_credit`
- `ordered_exact`
- `pairwise`

Compatibilidad por tipo:

- `single_choice`: `all_or_nothing`
- `true_false`: `all_or_nothing`
- `multiple_choice`: `all_or_nothing | exact_set | partial_credit`
- `ordering`: `ordered_exact | partial_credit`
- `match_pairs`: `pairwise | all_or_nothing`

### Referencias a contenido

```json
{
	"courseId": "ada",
	"moduleId": "notacion-asintotica",
	"chapterId": "big-o",
	"blockId": "definicion-big-o"
}
```

Reglas:

- Toda pregunta `active` debe tener al menos un `contentRef`.
- `courseId`, `moduleId`, `chapterId` son obligatorios.
- `blockId` es opcional.
- Toda referencia debe resolver contra el contenido real.

### Metadatos de selección adaptativa

```json
{
	"weight": 1,
	"estimatedTimeSec": 60,
	"targetMastery": 0.75,
	"prerequisiteSkillIds": [],
	"reinforcesSkillIds": [],
	"exposureLimit": 3,
	"cooldownSessions": 2,
	"discrimination": "medium"
}
```

`discrimination` permitido: `low | medium | high`.

Reglas:

- `selectionMeta` debe estar separado del contenido pedagógico.
- El selector adaptativo no interpreta prompt, explicación ni feedback.

### Taxonomía controlada ADA

`topic` debe pertenecer a:

- `asymptotic_notation`
- `function_growth`
- `common_functions`
- `algorithm_analysis`
- `elementary_operations`
- `temporal_complexity`
- `spatial_complexity`
- `probability`
- `correctness`
- `loop_invariant`
- `limits`
- `series`
- `divide_and_conquer`
- `merge_sort`
- `quick_sort`
- `heaps`
- `heap_sort`
- `priority_queues`
- `recurrence_equations`
- `iteration_method`
- `recursion_tree_method`
- `master_theorem`
- `intelligent_substitution`
- `characteristic_equation`
- `greedy_algorithms`
- `backtracking`
- `branch_and_bound`
- `heuristics`
- `uniform_cost_search`
- `best_first_search`
- `a_star`
- `minimax`
- `alpha_beta_pruning`
- `dynamic_programming`

## Ejemplos

Ver dataset completo de muestra en `examples/quiz-bank.sample.json`, que cubre categorías y dificultades con los cinco tipos soportados.

## Inputs

- dataset JSON con `schemaVersion`.
- curso y taxonomía declarados.
- referencias de contenido válidas.

## Outputs

- dataset renderizable por frontend sin lógica ad hoc por pregunta.
- respuesta canónica evaluable de forma determinista.
- metadatos para selección adaptativa.

## Invariantes

- Solo preguntas `active` son seleccionables.
- Una pregunta `active` nunca apunta a contenido inexistente.
- La respuesta correcta siempre existe en el dataset canónico.
- Prompt, opciones, explicación y feedback usan bloques renderizables.
- La evaluación no requiere LLM.

## Errores esperables

- pregunta `active` con `contentRefs` vacíos o rotos;
- tipo no soportado o enum inválido;
- política de calificación incompatible con tipo;
- IDs duplicados internos;
- respuesta referenciando IDs inexistentes;
- opción sin feedback;
- pregunta sobre uso de AALIE como herramienta.

## Validaciones bloqueantes

Una pregunta `active` es inválida si:

- falta cualquier campo obligatorio;
- `questionId` no es único;
- `questionVersion` no es entero positivo;
- `type`, `difficulty` o `cognitiveLevel` no pertenecen al enum;
- `topic` no pertenece a la taxonomía controlada;
- `skillIds[]` está vacío;
- `prompt.blocks[]` o `explanation.blocks[]` está vacío;
- `contentRefs[]` está vacío o no resuelve;
- hay IDs duplicados de opciones/items;
- la respuesta referencia IDs inexistentes;
- la política de calificación no es compatible con el tipo;
- alguna opción no tiene feedback;
- el contenido incluye HTML no permitido;
- la pregunta evalúa uso de AALIE en lugar de ADA.

## Warnings recomendados

Advertir (sin bloquear) si:

- `estimatedTimeSec` es atípico para la dificultad;
- hay menos de 2 tags o más de 8;
- explicación demasiado corta;
- feedback sin `contentRefs`;
- sobrerrepresentación de mismo `topic`/`skillId`;
- diferencias extremas de longitud entre opciones;
- uso de pistas obvias como "todas las anteriores".

## Compatibilidad y versionado

`schemaVersion` sigue semver.

Cambio compatible:

- agregar campos opcionales;
- agregar tags o skillIds controlados;
- agregar warnings.

Cambio incompatible:

- remover campos obligatorios;
- renombrar campos públicos;
- cambiar semántica de respuesta o gradingPolicy;
- cambiar estructura de `contentRefs`.

`questionVersion` se incrementa cuando cambian:

- respuesta correcta;
- intención conceptual;
- dificultad;
- nivel cognitivo;
- política de calificación.

No requiere incremento por correcciones ortográficas o redacción sin cambio semántico.

## Limites conocidos

- Este contrato no define persistencia de sesión.
- Este contrato no define endpoint runtime de selección.
- Este contrato no ofrece seguridad real para ocultar respuestas en cliente.
- La ofuscación de respuestas, si existe, pertenece al contrato runtime/API.
- No soporta preguntas abiertas con calificación automática.

## Archivos relacionados

- `content-model.md`
- `course-json-schema.md`
- `authoring-guide.md`
- `examples/quiz-bank.sample.json`
- `../03-specs/quizzes-spec.md`
