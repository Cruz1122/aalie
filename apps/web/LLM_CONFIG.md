# Configuración de LLM - Modos LOCAL y REMOTE

## Variables de Entorno Requeridas

Agregar estas variables a tu archivo `.env.local`:

```bash
# ============== CONFIGURACIÓN DE LLM ==============

# Modo de LLM: 'LOCAL' para LM Studio o 'REMOTE' para GitHub Models
LLM_MODE=REMOTE

# ============== CONFIGURACIÓN REMOTE (GitHub Models) ==============
# Token de GitHub para usar GitHub Models
GITHUB_TOKEN=your_github_token_here

# ============== CONFIGURACIÓN LOCAL (LM Studio) ==============
# URL del endpoint de LM Studio (por defecto: http://localhost:1234/v1)
LM_STUDIO_ENDPOINT=http://localhost:1234/v1

# API Key para LM Studio (por defecto: lm-studio)
LM_STUDIO_API_KEY=lm-studio
```

## Modos Disponibles

### 1. Modo LOCAL (LM Studio)
- **Uso**: Para desarrollo local con modelos ejecutándose en tu máquina
- **Modelo**: gpt-oss-20b
- **Ventajas**: Más rápido, sin dependencia de internet, privacidad total
- **Desventajas**: Requiere recursos locales, configuración inicial

**Configuración:**
1. Instalar LM Studio
2. Descargar el modelo `openai/gpt-oss-20b`
3. Cargar el modelo en LM Studio
4. Iniciar el servidor local en LM Studio (puerto 1234)
5. Establecer `LLM_MODE=LOCAL`
6. Verificar que el endpoint esté en `http://localhost:1234/v1`

**Curl de prueba:**
```bash
curl http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-oss-20b",
    "messages": [
      { "role": "system", "content": "Always answer in rhymes. Today is Thursday" },
      { "role": "user", "content": "What day is it today?" }
    ],
    "temperature": 0.7,
    "max_tokens": 100,
    "stream": false
}'
```

### 2. Modo REMOTE (GitHub Models)
- **Uso**: Para producción y cuando no tienes recursos locales
- **Modelos**: gpt-5-nano, grok-3-mini
- **Ventajas**: Confiable, sin configuración local, modelos potentes
- **Desventajas**: Depende de internet, requiere token de GitHub

**Configuración:**
1. Obtener token de GitHub
2. Establecer `LLM_MODE=REMOTE`
3. Configurar `GITHUB_TOKEN`

## Configuración de Modelos por Modo

### Modo LOCAL
- **Clasificación**: lmstudio-community/Llama-3.2-1B-Instruct-GGUF (temp: 0.1)
- **Parser Assist**: lmstudio-community/Llama-3.2-1B-Instruct-GGUF (temp: 0.7)
- **General**: lmstudio-community/Llama-3.2-1B-Instruct-GGUF (temp: 0.7)

### Modo REMOTE
- **Clasificación**: grok-3-mini (temp: 0)
- **Parser Assist**: gpt-5-nano (temp: 1)
- **General**: gpt-5-nano (temp: 1)

## Cambio de Modo

Para cambiar entre modos, simplemente modifica la variable `LLM_MODE`:

```bash
# Para modo local
LLM_MODE=LOCAL

# Para modo remoto
LLM_MODE=REMOTE
```

Reinicia el servidor después de cambiar el modo.

## Troubleshooting

### Modo LOCAL

#### Problema: "ECONNREFUSED 127.0.0.1:1234"
**Causa**: Docker no puede acceder a LM Studio en el host.

**Soluciones**:

1. **Para Docker Compose** (Recomendado):
   ```bash
   # En tu .env.local o docker-compose.yml
   LM_STUDIO_ENDPOINT=http://host.docker.internal:1234/v1
   ```

2. **Para Docker run**:
   ```bash
   # Usar host.docker.internal en lugar de localhost
   docker run -e LM_STUDIO_ENDPOINT=http://host.docker.internal:1234/v1 ...
   ```

3. **Verificar LM Studio**:
   - Asegúrate de que LM Studio esté ejecutándose
   - Verifica que el puerto 1234 esté disponible
   - Confirma que el modelo esté cargado en LM Studio

4. **Fallback Automático**:
   - El sistema detecta automáticamente si LM Studio no está disponible
   - Hace fallback automático a modo REMOTE
   - Muestra warnings en los logs

#### Verificación Manual:
```bash
# Desde el contenedor Docker
curl http://host.docker.internal:1234/v1/models

# Desde tu máquina host
curl http://localhost:1234/v1/models
```

### Modo REMOTE
- Verificar que el token de GitHub sea válido
- Comprobar conectividad a internet
- Revisar límites de API de GitHub

### Fallback Automático
El sistema incluye un mecanismo de fallback automático:
- Si `LLM_MODE=LOCAL` pero LM Studio no está disponible
- Automáticamente cambia a modo REMOTE
- Registra el fallback en los logs
- Continúa funcionando sin interrupciones

## Logs

El sistema registra en consola:
- Modo actual (`LOCAL` o `REMOTE`)
- Tipo de trabajo (`classify`, `parser_assist`, `general`)
- Modelo utilizado
- Errores específicos por modo
