# Grammar Package

Gramática ANTLR para el Analizador de Complejidad que genera parsers tanto para TypeScript (cliente web) como Python (servidor API).

## Estructura

```
packages/grammar/
  package.json          # Dependencias y scripts
  tsconfig.json         # Configuración TypeScript
  scripts/
    gen-ts.js           # Generador TS (antlr4ts-cli)
    gen-py.js           # Generador Python (JAR oficial)
  grammar/
    Language.g4         # Gramática ANTLR
  src/ts/               # Salida TypeScript generada
  out/py/               # Salida Python generada
  tooling/
    antlr-4.13.2-complete.jar  # JAR oficial de ANTLR
```

## Instalación

Desde la raíz del monorepo:

```bash
# Instalar dependencias
pnpm install -w

# Generar parser TypeScript
pnpm --filter "@aa/grammar" run build

# Generar parser Python
pnpm --filter "@aa/grammar" run gen:py

# Limpiar salidas generadas
pnpm --filter "@aa/grammar" run clean
```

## Verificación

### TypeScript
El parser TypeScript se verifica automáticamente cuando Next.js inicia:
```bash
pnpm --filter web dev
```

Para verificación manual:
```bash
node -e "console.log('TS files generated:'); require('fs').readdirSync('./packages/grammar/src/ts').forEach(f => console.log(f))"
```

### Python (dentro del contenedor API)
```bash
docker compose exec api python - <<'PY'
import sys
sys.path.append('/usr/src/app/../packages/grammar/out/py')
try:
    import LanguageLexer, LanguageParser
    print("Py parser OK")
except Exception as e:
    print("Py parser FAIL:", e)
PY
```

## Uso

### En Next.js (Web)
```typescript
import { LanguageLexer } from "@aa/grammar/src/ts/LanguageLexer";
import { LanguageParser } from "@aa/grammar/src/ts/LanguageParser";
```

### En FastAPI (API)
```python
# Añadir al PYTHONPATH o sys.path.append('/path/to/packages/grammar/out/py')
from LanguageLexer import LanguageLexer
from LanguageParser import LanguageParser
```

## Dependencias

- **antlr4ts@0.5.0-alpha.4**: Runtime TypeScript para parsers generados
- **antlr4ts-cli@0.5.0-alpha.4**: CLI para generar parsers TypeScript
- **Java 8+**: Requerido para generar parsers Python con el JAR oficial

## Verificación rápida E2E

```bash
# 1. Generar parsers
pnpm --filter "@aa/grammar" run build && pnpm --filter "@aa/grammar" run gen:py

# 2. Verificar archivos generados
ls packages/grammar/src/ts/    # Debe mostrar *.ts files
ls packages/grammar/out/py/    # Debe mostrar *.py files

# 3. Verificar que Next.js puede usar el paquete
pnpm --filter web dev          # La app debe iniciar sin errores
```

## Troubleshooting Windows

Si falla la generación Python por rutas con acentos:
- Asegúrate de usar comillas en paths (ya implementado en gen-py.js)
- Verifica que tienes Java 8+ instalado: `java -version`

Si aparecen múltiples lockfiles:
- Elimina package-lock.json de subdirectorios
- Usa solo pnpm-lock.yaml en la raíz

Si Next.js falla con "npm error EUNSUPPORTEDPROTOCOL":
- Elimina apps/web/package-lock.json y apps/web/node_modules
- Reinstala con `pnpm install` desde la raíz
- Nunca uses npm dentro del workspace, solo pnpm

## Notas

- La gramática actual es una demo básica con funciones, for loops y expresiones
- Los parsers TypeScript se generan sin Java usando antlr4ts-cli
- Los parsers Python requieren el JAR oficial y Java en el host
- Next.js transpila automáticamente este paquete vía `transpilePackages`
