# Documentación de la API

Esta carpeta contiene la documentación técnica completa de la API backend del analizador de complejidad algorítmica.

## Índice

- [Endpoints](./endpoints.md) - Documentación completa de todos los endpoints REST
- [Modelos de Datos](./models.md) - Especificación de modelos Pydantic y tipos TypeScript
- [Arquitectura](./architecture.md) - Arquitectura del backend, estructura y flujo de datos
- [Manejo de Errores](./errors.md) - Códigos de error, formatos y estrategias de manejo

## Descripción General

La API está construida con **FastAPI** (Python 3.11+) y proporciona endpoints REST para:

- **Parseo de código**: Convertir pseudocódigo en AST (Abstract Syntax Tree)
- **Análisis de complejidad**: Calcular complejidad temporal (Big-O) de algoritmos
- **Clasificación**: Identificar el tipo de algoritmo (iterativo, recursivo, híbrido)
- **Detección de métodos**: Determinar métodos aplicables para algoritmos recursivos

## Base URL

```
http://localhost:8000
```

O según la configuración de `NEXT_PUBLIC_API_BASE_URL` en el frontend.

## Autenticación

La API no requiere autenticación para la mayoría de endpoints. Algunos endpoints opcionales pueden usar API keys de servicios externos (Gemini, OpenAI) para funcionalidades avanzadas.

## Formato de Respuesta

Todas las respuestas siguen un formato consistente:

```json
{
  "ok": true,
  "data": { ... },
  "errors": []
}
```

O en caso de error:

```json
{
  "ok": false,
  "errors": [
    {
      "message": "Descripción del error",
      "line": 5,
      "column": 10
    }
  ]
}
```

## Ejemplos Rápidos

### Health Check

```bash
curl http://localhost:8000/health
```

### Parsear Código

```bash
curl -X POST http://localhost:8000/grammar/parse \
  -H "Content-Type: application/json" \
  -d '{"source": "factorial(n) BEGIN RETURN 1; END"}'
```

### Analizar Complejidad

```bash
curl -X POST http://localhost:8000/analyze/open \
  -H "Content-Type: application/json" \
  -d '{
    "source": "factorial(n) BEGIN\n  resultado <- 1;\n  FOR i <- 2 TO n DO BEGIN\n    resultado <- resultado * i;\n  END\n  RETURN resultado;\nEND",
    "mode": "worst"
  }'
```

## Tecnologías

- **FastAPI**: Framework web moderno y rápido
- **ANTLR4**: Parser para la gramática de pseudocódigo
- **SymPy**: Biblioteca para manipulación matemática simbólica
- **Pydantic**: Validación de datos y modelos

## Más Información

Para detalles específicos, consulta los documentos individuales en esta carpeta.

