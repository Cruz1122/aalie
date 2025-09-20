# @aa/grammar

**Paquete de gramática ANTLR para análisis de complejidad algorítmica**

## Propósito

El paquete `@aa/grammar` define la gramática ANTLR y genera los parsers para ambos mundos: TypeScript (cliente/Next.js) y Python (servidor/FastAPI). Provee un AST canónico idéntico en cliente y servidor, garantizando que el pseudocódigo se interpreta igual en la UI (validaciones rápidas) y en el backend (análisis formal).

## Arquitectura

```
@aa/grammar
├── grammar/Language.g4      # Definición de la gramática ANTLR
├── src/ts/                  # Parsers generados para TypeScript
├── out/py/                  # Parsers generados para Python
├── scripts/
│   ├── gen-ts.js           # Generador para TypeScript (antlr4ts)
│   └── gen-py.js           # Generador para Python
└── tooling/antlr-4.13.2-complete.jar
```

## Entradas y Salidas

### Entrada
- **Pseudocódigo del usuario**: Código estructurado que sigue la gramática definida en `Language.g4`

### Salidas
- **TypeScript** (`src/ts/`): Lexer/Parser/Visitor para validación y UX en Next.js
- **Python** (`out/py/`): Lexer/Parser/Visitor para análisis formal en FastAPI

## Quién lo usa

- **Web (Next.js)**: Para validación en vivo y feedback inmediato al usuario
- **API (FastAPI)**: Para parse canónico como fuente de verdad del análisis

## Scripts de construcción

```bash
# Generar parsers TypeScript
pnpm run gen:ts

# Generar parsers Python  
pnpm run gen:py

# Generar ambos
pnpm run build
```

## Notas importantes

- Los parsers Python (`out/py/`) se commitean para evitar exigir Java/ANTLR a todos los desarrolladores
- Este paquete no persiste datos, solo transforma pseudocódigo en AST
- Cualquier cambio en `Language.g4` requiere regenerar ambos conjuntos de parsers
- La consistencia entre parsers TS/Python es crítica para la integridad del sistema

## Dependencias

- **ANTLR 4.13.2**: Generador de parsers
- **antlr4ts**: Runtime TypeScript
- **Node.js**: Para scripts de generación

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
- **Java 8+**: Solo requerido para regenerar parsers Python (opcional en dev)

## Archivos Python Pre-generados

Los archivos Python generados (`out/py/`) están committeados en el repo para evitar que cada desarrollador necesite tener Java instalado. Solo necesitas Java si quieres modificar la gramática y regenerar los parsers.

Para usar los parsers Python existentes, simplemente:
```python
# La API puede importar directamente sin regenerar
sys.path.append('/path/to/packages/grammar/out/py')
from LanguageLexer import LanguageLexer
```

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
