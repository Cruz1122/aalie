# Especificación del sistema de quizzes

**Tipo:** normativa

## Propósito

Definir el comportamiento contractual del sistema de quizzes: selección, entrega, evaluación, feedback y compatibilidad con el banco de preguntas.

## Alcance

Aplica a:

- selección determinista adaptativa;
- consumo backend del dataset;
- payload enviado al frontend;
- evaluación determinista;
- retroalimentación por opción;
- resumen de áreas a reforzar;
- vínculo con contenido académico;
- validación del banco.

No aplica a:

- generación de preguntas por LLM;
- calificación con LLM;
- preguntas sobre uso de AALIE;
- analítica avanzada;
- seguridad criptográfica de respuestas;
- persistencia backend obligatoria.

## Fuente de verdad

- `../08-content/quiz-json-schema.md`
- `../08-content/course-json-schema.md`
- `../08-content/content-model.md`
- `../08-content/authoring-guide.md`
- `../08-content/examples/quiz-bank.sample.json`

## Estructura

### Decisiones

#### Dataset

El banco canónico de preguntas es JSON.

CSV puede existir únicamente como formato auxiliar para authoring, importación o auditoría, pero no puede ser fuente contractual.

#### Propiedad del dataset

El backend posee el dataset y selecciona preguntas.

El frontend no debe seleccionar preguntas por su cuenta, salvo en modo fallback explícito o demo local.

#### Evaluación

La evaluación es determinista.

No se permite usar LLM para decidir si una respuesta es correcta.

#### Seguridad de respuestas

La respuesta canónica vive clara en el dataset.

Si preocupa exposición en frontend, el contrato runtime puede enviar respuesta ofuscada o token. Esa ofuscación no es seguridad real: seguridad real implica evaluación en backend.

#### Contenido evaluado

El quiz evalúa Análisis y Diseño de Algoritmos.

No se permiten preguntas cuyo objetivo sea enseñar o evaluar uso de AALIE como herramienta.

### Flujo contractual

```text
dataset JSON
	-> validación de dataset
	-> backend recibe contexto del estudiante
	-> backend selecciona preguntas
	-> backend entrega intento al frontend
	-> frontend renderiza
	-> estudiante responde
	-> evaluación determinista
	-> feedback por pregunta y por opción
	-> resumen de áreas a reforzar
	-> links directos al contenido
```

## Inputs

Contexto de estudiante esperado:

```json
{
	"studentId": "local-or-server-id",
	"studiedContentRefs": [
		{
			"courseId": "ada",
			"moduleId": "notacion-asintotica",
			"chapterId": "big-o"
		}
	],
	"masteryBySkill": {
		"skill.asymptotic.big_o.interpretation": 0.6
	},
	"weakSkillIds": ["skill.asymptotic.limit-criteria"],
	"recentQuestionIds": ["ada-asymptotic-notation-basic-001"],
	"sessionPreferences": {
		"questionCount": 5,
		"difficultyMix": {
			"basic": 0.4,
			"intermediate": 0.4,
			"advanced": 0.2
		}
	}
}
```

## Outputs

Payload de intento hacia frontend:

```json
{
	"sessionId": "quiz-session-001",
	"schemaVersion": "1.0.0",
	"locale": "es-CO",
	"courseId": "ada",
	"questions": [],
	"metadata": {
		"selectedAt": "2026-04-26T00:00:00Z",
		"selectionMode": "adaptive_deterministic",
		"questionCount": 5
	}
}
```

Respuesta del estudiante por tipo:

- `single_choice` y `multiple_choice`: `selectedOptionIds[]`
- `true_false`: `selectedOptionIds[]` con `true/false`
- `ordering`: `orderedOptionIds[]`
- `match_pairs`: `pairs[]`

Resultado de intento:

```json
{
	"sessionId": "quiz-session-001",
	"score": 3,
	"maxScore": 5,
	"accuracy": 0.6,
	"results": [],
	"strengths": [],
	"areasToImprove": []
}
```

## Invariantes

- la selección es determinista;
- la evaluación es determinista;
- una pregunta activa siempre referencia contenido existente;
- el feedback siempre puede renderizarse;
- la UI no requiere lógica por `questionId`;
- las respuestas canónicas no se infieren desde texto;
- el sistema no evalúa uso de AALIE.

## Selección determinista adaptativa

El selector puede usar:

- `status`, `type`, `difficulty`, `cognitiveLevel`, `topic`, `tags`, `skillIds`, `contentRefs`, `selectionMeta`;
- contenido estudiado, dominio por habilidad y preguntas recientes.

El selector no debe usar:

- texto libre de prompt/opciones/explanation/feedback;
- inferencias semánticas por LLM;
- aleatoriedad no semillada.

Algoritmo sugerido:

1. filtrar preguntas `active`;
2. excluir referencias no estudiadas (salvo modo diagnóstico);
3. excluir preguntas en cooldown;
4. priorizar `weakSkillIds`;
5. balancear por `topic`, `difficulty` y `cognitiveLevel`;
6. aplicar `weight`;
7. ordenar por score descendente y `questionId` ascendente;
8. tomar `questionCount`.

## Evaluación determinista

Modos:

- `all_or_nothing`
- `exact_set`
- `partial_credit`
- `ordered_exact`
- `pairwise`

`partial_credit` sugerido:

```text
raw = correctSelected / totalCorrect - incorrectSelected * penalty
score = max(minScore, raw * maxScore)
```

Reglas:

- `penalty` declarado en `gradingPolicy`;
- sin puntajes negativos salvo decisión contractual futura;
- no se permite lógica personalizada por pregunta.

## Feedback

El feedback debe combinar:

- feedback específico de cada opción elegida;
- explicación general de la pregunta;
- links de repaso desde `contentRefs`.

Reglas:

- toda opción debe tener feedback;
- feedback correcto explica por qué es correcto;
- feedback incorrecto explica el error conceptual;
- renderer unificado por bloques renderizables.

## Errores esperables

- dataset inválido;
- pregunta `active` incompleta;
- referencia rota a contenido;
- tipo no soportado;
- política incompatible;
- respuesta canónica mal formada;
- pregunta sin feedback por opción;
- taxonomía no reconocida;
- no hay suficientes preguntas para filtros de intento.

## Degradación permitida

Si no hay suficientes preguntas:

- relajar cooldown;
- relajar balance de dificultad;
- relajar balance de nivel cognitivo;
- permitir preguntas de contenido relacionado;
- devolver menos preguntas con warning.

No se permite:

- inventar preguntas;
- seleccionar `draft`, `deprecated` o referencias rotas;
- evaluar con LLM.

## Ejemplos

Ejemplos canónicos del banco están en `../08-content/examples/quiz-bank.sample.json`.

## Compatibilidad

Cambios compatibles:

- nuevos tópicos/tags/skillIds controlados;
- nuevos warnings;
- nuevos campos opcionales de runtime.

Cambios incompatibles:

- cambiar estructura de respuesta;
- cambiar semántica de calificación;
- remover campos obligatorios;
- cambiar estructura de `contentRefs`.

## Criterios de aceptación

- backend carga dataset JSON;
- validador rechaza `active` incompletas;
- validador rechaza referencias rotas;
- selector usa solo `active`;
- selector es reproducible con mismos inputs;
- frontend renderiza los cinco tipos soportados;
- frontend renderiza prompt, opciones, explicación y feedback con el mismo renderer;
- evaluación no usa LLM;
- resultado de intento produce áreas a reforzar con links de contenido;
- el banco puede crecer a 500 preguntas sin modificar lógica base.

## Limites conocidos

- ofuscación de respuesta no es seguridad real;
- persistencia local puede perderse en cliente;
- adaptación es determinista, no inferencia estadística avanzada;
- calidad final depende de authoring y validación del banco;
- no hay evaluación automática de respuesta abierta.

## Archivos relacionados

- `../08-content/quiz-json-schema.md`
- `../08-content/course-json-schema.md`
- `../08-content/content-model.md`
- `../08-content/authoring-guide.md`
- `../08-content/examples/quiz-bank.sample.json`
