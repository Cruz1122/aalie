# Troubleshooting

**Tipo:** guía
**Estado:** final
**Audiencia:** dev | operador
**Fuente de verdad:** configuración del repo, errores observables en rutas, tests y Docker, `apps/api/app/core/config.py`, `apps/api/.env.example`, `apps/web/.env.example`, `infra/docker-compose.yml`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** local-development, environment-variables, deployment, release-checklist

---

## Backend no arranca

### Síntoma

`uvicorn` falla al iniciar, error de puerto o error de importación.

### Causa probable

1. **Puerto ocupado:** otro proceso usando `:8000`.
2. **Dependencias faltantes:** `pip install -r requirements.txt` no ejecutado o incompleto.
3. **Versión de Python incorrecta:** Python < 3.11.

### Verificación

```bash
# Puerto ocupado
netstat -ano | findstr :8000    # Windows
lsof -i :8000                   # Linux/macOS

# Versión Python
python --version   # debe ser 3.11+

# Dependencias
cd apps/api && pip list | grep fastapi
```

### Solución

```bash
# Puerto ocupado: matar proceso o cambiar puerto
# Windows: taskkill /PID <pid> /F
# Linux/macOS: kill -9 <pid>
# Alternativa: usar --port 8001

# Dependencias faltantes
cd apps/api && pip install -r requirements.txt

# Python version: instalar 3.11+ via pyenv/conda/brew
```

### Prevención

- Usar Docker si los conflictos de puertos son frecuentes.
- Agregar `python --version` check en script de setup local.
- Mantener `requirements.txt` sincronizado con dependencias reales.

---

## Frontend no conecta a API

### Síntoma

La UI carga pero no muestra resultados de análisis, o los healthchecks fallan.

### Causa probable

1. Backend no está corriendo.
2. `NEXT_PUBLIC_API_BASE_URL` incorrecta.
3. Error de CORS (ver sección siguiente).

### Verificación

```bash
# Backend vivo?
curl http://localhost:8000/health

# Variables en el frontend (revisar .env.local)
cat apps/web/.env.local
```

### Solución

1. Iniciar backend: `cd apps/api && python -m uvicorn app.main:app --reload --port 8000`
2. Ajustar `NEXT_PUBLIC_API_BASE_URL` a la URL correcta del backend.
3. Verificar CORS.

### Prevención

- Usar `.env.local` con valores por defecto correctos.
- En Docker, verificar que `API_INTERNAL_BASE_URL` apunte a `http://api:8000`.

---

## CORS errors en navegador

### Síntoma

La consola del navegador muestra: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`.

### Causa probable

CORS no habilitado o `CORS_ALLOWED_ORIGINS` no incluye el origen del frontend.

### Verificación

```bash
# Revisar las variables CORS en el backend
echo $CORS_ENABLED
echo $CORS_ALLOWED_ORIGINS
echo $DEV_ALLOWED_ORIGINS
```

### Solución

```bash
# Habilitar CORS y permitir orígenes
CORS_ENABLED=true
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# O para desarrollo
DEV_CORS_ENABLED=1
DEV_ALLOWED_ORIGINS=http://localhost:3000
```

### Prevención

- En desarrollo, usar los valores por defecto (CORS habilitado, orígenes default locales).
- En producción, definir `CORS_ALLOWED_ORIGINS` con la lista exacta de dominios.

---

## Parser falla

### Síntoma

`POST /grammar/parse` retorna error 500 o el análisis no puede parsear pseudocódigo válido.

### Causa probable

1. Grammar package de Python no instalado.
2. Artefactos ANTLR no generados o desactualizados.
3. Cambio reciente en `Language.g4`.

### Verificación

```bash
python -c "import aanlie_parser"  # falla si no instalado

# Verificar artefactos generados
ls packages/grammar/py/aanlie_parser/  # debe contener .interp, .tokens, .py
```

### Solución

```bash
# Instalar grammar package
pip install -e packages/grammar/py

# Regenerar parsers (requiere Java)
pnpm --filter @aa/grammar build    # TS
pnpm --filter @aa/grammar gen:py   # Python
```

### Prevención

- Agregar `pip install -e packages/grammar/py` a la documentación de onboarding.
- En CI, el job `test-pr-gate` instala el grammar package antes de correr tests.
- Si se modifica `Language.g4`, regenerar ambos parsers y commitear los artefactos.

---

## Grammar package no encontrado

### Síntoma

`pnpm --filter @aa/grammar build` falla o el módulo `@aa/grammar` no se resuelve.

### Causa probable

`pnpm install` no ejecutado, o el paquete no está correctamente referenciado en el workspace.

### Verificación

```bash
pnpm ls --filter @aa/grammar   # debe mostrar el paquete
ls packages/grammar/package.json
```

### Solución

```bash
pnpm install
pnpm -C packages/grammar build
```

Si el problema persiste, verificar `pnpm-workspace.yaml` incluye `packages/grammar`.

### Prevención

- Ejecutar `pnpm install && pnpm -C packages/types build && pnpm -C packages/grammar build` como paso de setup.
- CI ejecuta estos pasos secuencialmente en el job `build`.

---

## Tests Python no encuentran grammar module

### Síntoma

`pytest` falla con `ModuleNotFoundError: No module named 'aanlie_parser'`.

### Causa probable

Grammar package no instalado en modo editable.

### Verificación

```bash
pip list | grep aanlie
pip show aanlie-parser  # debe mostrar ubicación editable
```

### Solución

```bash
pip install -e packages/grammar/py
```

### Prevención

- Agregar al script de setup local.
- El CI lo instala en `test-pr-gate`, `test-extended-lanes` y `test-nightly-lanes`.

---

## SymPy demasiado lento

### Síntoma

El análisis de algoritmos iterativos con sumatorias grandes tarda segundos o minutos.

### Causa probable

Expresiones simbólicas grandes, sumas con muchas iteraciones simbólicas, o cierre de sumas que SymPy resuelve con algoritmos costosos.

### Verificación

```bash
# Medir tiempo de una request específica
curl -X POST http://localhost:8000/analyze/open -H "Content-Type: application/json" -d '{"code": "..."}' -w "\n%{time_total}s\n"
```

### Solución

- Simplificar el algoritmo de entrada (menos líneas, menos anidamiento).
- Usar parámetros de entrada pequeños para el análisis interactivo.
- Reconocer que ciertas sumas no tienen forma cerrada simple y SymPy puede tardar en demostrarlo.

### Prevención

- Los tests de estrés (`test:api:stress`) monitorean tiempos de respuesta.
- Los contratos de análisis definen límites de complejidad del código de entrada.

---

## Export PDF falla

### Síntoma

`POST /export/report` con formato `pdf` retorna error 500.

### Causa probable

1. `pdflatex` no instalado en el runtime del backend.
2. Paquetes LaTeX faltantes.
3. Assets LaTeX no encontrados (directorio `AALIE_EXPORTER_ASSETS_DIR` incorrecto).

### Verificación

```bash
which pdflatex      # debe encontrar el binario
pdflatex --version  # debe mostrar versión
```

### Solución

```bash
# Linux (Debian/Ubuntu)
apt-get install texlive-latex-base texlive-latex-recommended texlive-fonts-recommended

# macOS
brew install texlive

# Windows: instalar MiKTeX o TeX Live

# Verificar assets
echo $AALIE_EXPORTER_ASSETS_DIR
ls $AALIE_EXPORTER_ASSETS_DIR  # debe contener plantillas LaTeX
```

### Prevención

- En Docker, la imagen API ya incluye TeX. Verificar `apps/api/Dockerfile`.
- Markdown y LaTeX (sin PDF) no dependen de `pdflatex`; usarlos como fallback.

---

## LLM no aparece en UI

### Síntoma

El asistente embebido (launcher flotante) no se renderiza en `/analyzer`, `/examples`, o `/user-guide`.

### Causa probable

1. No hay `API_KEY` configurada en el backend.
2. `GEMINI_ENDPOINT_BASE` incorrecto.
3. El backend no puede contactar al proveedor LLM.

### Verificación

```bash
curl http://localhost:8000/llm/status
# Debe retornar hasApiKey: true
```

### Solución

```bash
# Configurar API key
export API_KEY="tu-gemini-key"

# Verificar endpoint
export GEMINI_ENDPOINT_BASE="https://generativelanguage.googleapis.com/v1beta/models"

# Reiniciar backend
```

### Prevención

- El backend expone `GET /llm/status` que permite diagnosticar el estado de la configuración LLM.
- En UI, `getApiKeyStatus().hasAny === true` controla la visibilidad del asistente.

---

## API key inválida

### Síntoma

El asistente LLM aparece pero devuelve errores en los jobs.

### Causa probable

1. API key incorrecta o expirada.
2. Endpoint del proveedor incorrecto.
3. Cuota de API excedida.

### Verificación

```bash
curl -X POST http://localhost:8000/llm -H "Content-Type: application/json" -d '{"model":"...", "messages":[...]}'
# Revisar código de error en respuesta
```

### Solución

1. Regenerar API key en la consola del proveedor (Gemini).
2. Verificar que `GEMINI_ENDPOINT_BASE` es correcto.
3. Revisar cuota y límites de la cuenta.

### Prevención

- Monitorear códigos de error HTTP del proveedor (401 = key inválida, 429 = rate limit).
- El backend registra el error del proveedor en logs.

---

## Quizzes no cargan

### Síntoma

La página de quizzes muestra "no hay quizzes disponibles" o error de carga.

### Causa probable

1. Banco de quizzes vacío o sin preguntas activas (verificar con `validate_quiz_bank.py`).
2. Ruta de archivos de quiz no encontrada.

### Verificación

```bash
curl http://localhost:8000/quizzes/health
curl http://localhost:8000/quizzes/dataset/summary   # muestra conteo por estado
```

### Solución

1. Activar preguntas en los archivos JSON de quiz (campo `status: "active"`).
2. Verificar que los bancos existen en `packages/content-data/quizzes/`.

### Prevención

- Ejecutar `python apps/api/scripts/validate_quiz_bank.py` después de cambios en el banco.
- Ejecutar `python apps/api/scripts/report_quiz_bank_coverage.py --fail-on-critical` para verificar cobertura mínima.

---

## Quiz bank inválido (schema validation fails)

### Síntoma

`validate_quiz_bank.py` retorna error.

### Causa probable

El archivo JSON del banco no cumple el schema definido: campos faltantes, tipos incorrectos, referencias rotas.

### Verificación

```bash
python apps/api/scripts/validate_quiz_bank.py --verbose
```

### Solución

Corregir los errores de schema indicados por el script. Los errores típicos incluyen:

- `id` faltante o duplicado
- `difficulty` fuera de rango
- `contentRefs` que referencian contenido inexistente

### Prevención

- Agregar validación como hook de pre-commit.
- El CI ejecuta la validación en el job `quizzes-quality`.

---

## Content catalog inválido

### Síntoma

`pnpm test:docs-contracts` falla o la validación de contenido retorna errores.

### Causa probable

1. Schema violation en archivos de contenido JSON.
2. Referencias rotas entre módulos.
3. Versión de schema desactualizada vs código.

### Verificación

```bash
python scripts/check_docs_contracts.py
```

### Solución

Corregir los errores de schema o referencias. Si se cambió la versión de schema (`CONTENT_CATALOG_SCHEMA_VERSION`), actualizar tanto el código como los archivos de contenido y el spec.

### Prevención

- `pnpm test:docs-contracts` debe ejecutarse antes de cada merge.
- El CI lo ejecuta en el job `docs-contracts`.

---

## Web build falla

### Síntoma

`pnpm -C apps/web build` falla con errores de TypeScript.

### Causa probable

1. Errores de tipo en el código TypeScript.
2. Paquetes `@aa/types` o `@aa/grammar` no construidos previamente.
3. Dependencia faltante.

### Verificación

```bash
pnpm -C apps/web build 2>&1 | head -50
```

### Solución

```bash
# Construir dependencias primero
pnpm -C packages/types build
pnpm -C packages/grammar build

# Luego web
pnpm -C apps/web build
```

Si hay errores de tipo, corregirlos según el mensaje de TypeScript.

### Prevención

- El CI ejecuta build secuencial en el job `build` (types → grammar → web).
- `pnpm lint:web` detecta errores de lint antes del build.

---

## Docs contracts fallan

### Síntoma

`python scripts/check_docs_contracts.py` retorna exit code distinto de 0.

### Causa probable

1. Directorio de docs esperado no existe.
2. Schema version mismatch entre docs y código.
3. Archivo de contrato faltante o con estructura inválida.

### Verificación

```bash
python scripts/check_docs_contracts.py --verbose
```

### Solución

- Si falta un directorio, crearlo (puede estar vacío si el contenido no aplica).
- Si hay version mismatch, actualizar la versión en el código y docs.
- Si un archivo está mal estructurado, revisar contra el schema esperado.

### Prevención

- `pnpm test:docs-contracts` debe ser parte del PR gate.
- El CI lo ejecuta en el job `docs-contracts`.

---

## Límites conocidos

- Algunos fallos del proveedor LLM solo pueden reproducirse con la misma key/cuota del entorno afectado.
- La resolución de CORS puede tener comportamiento distinto entre navegadores (especialmente Safari con `localhost`).
- Los tests de estrés pueden fallar por tiempo en entornos de CI lentos; revisar los timeouts.

## Archivos relacionados

- `local-development.md`
- `environment-variables.md`
- `deployment.md`
- `release-checklist.md`
- `../../03-specs/export-engine-spec.md`
- `../../05-quality/ci-cd.md`
