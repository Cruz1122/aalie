# Gramática para Análisis de Algoritmos

Este documento describe la gramática ANTLR4 para el lenguaje de pseudocódigo utilizado en el análisis de complejidad algorítmica.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Sintaxis](#sintaxis)
  - [Definición de Procedimientos](#definición-de-procedimientos)
  - [Tipos de Parámetros](#tipos-de-parámetros)
  - [Bloques](#bloques)
  - [Sentencias](#sentencias)
  - [Expresiones](#expresiones)
  - [Operadores](#operadores)
- [Ejemplos de Algoritmos](#ejemplos-de-algoritmos)
- [Guía de Desarrollo](#-guía-de-desarrollo)
  - [Generación de Código (Codegen)](#generación-de-código-codegen)
  - [Probar el Endpoint /parse](#probar-el-endpoint-parse)
  - [Activar KaTeX](#activar-katex-para-renderizado-de-fórmulas)
  - [Contratos de Tipos en @aa/types](#contratos-de-tipos-en-aatypes)

---

## 🎯 Características

- **Procedimientos**: Definición de funciones con parámetros tipados
- **Arrays con rangos**: Soporte para parámetros de array con notación `A[inicio]..[fin]`
- **Estructuras de control**: `IF-THEN-ELSE`, `FOR`, `WHILE`, `REPEAT-UNTIL`
- **Operadores normalizados**: Comparación, aritméticos y lógicos
- **Llamadas a funciones**: Con `CALL` para statements (no recursivas) o directas en expresiones (recursivas sin CALL)
- **Return explícito**: Para retornar valores de procedimientos

---

## 📖 Sintaxis

### Definición de Procedimientos

```
nombreProcedimiento(parametros) BEGIN
    sentencias...
END
```

**Ejemplo:**
```
factorial(n) BEGIN
    resultado <- 1;
    RETURN resultado;
END
```

### Tipos de Parámetros

#### 1. **Parámetros escalares**
```
procedimiento(a, b, c) BEGIN
    ...
END
```

#### 2. **Parámetros de array**
Pueden especificar dimensiones o rangos:

```
procedimiento(A[n]) BEGIN          ▸ Array con dimensión n
procedimiento(A[1]..[n]) BEGIN     ▸ Array desde índice 1 hasta n
procedimiento(A[i]..[j]) BEGIN     ▸ Array desde índice i hasta j
```

#### 3. **Parámetros de objeto**
```
procedimiento(Clase objeto) BEGIN
    ...
END
```

### Bloques

Los bloques pueden usar dos sintaxis:

```
BEGIN
    sentencias...
END
```

O con llaves:
```
{
    sentencias...
}
```

**⚠️ Importante**: Todas las estructuras de control (`IF`, `FOR`, `WHILE`) requieren bloques completos.

### Sentencias

#### Asignación
La sintaxis oficial visible usa:
```
variable <- expresion;
```

Por compatibilidad legacy, el parser todavía acepta `:=`, `🡨`, `←` y `⟵`, pero la app no debe enseñarlos ni insertarlos.

#### Declaración de arrays
```
A[n];
matriz[n][m];
```

#### Llamadas a procedimientos
```
CALL nombreProcedimiento(argumentos);
```

#### Estructuras de control

**IF-THEN-ELSE:**
```
IF (condicion) THEN BEGIN
    sentencias...
END
ELSE BEGIN
    sentencias...
END
```

**FOR:**
```
FOR variable <- inicio TO fin DO BEGIN
    sentencias...
END
```

**WHILE:**
```
WHILE (condicion) DO BEGIN
    sentencias...
END
```

**REPEAT-UNTIL:**
```
REPEAT
    sentencias...
UNTIL (condicion);
```

#### Return
```
RETURN expresion;
```

### Expresiones

Las expresiones siguen las reglas de precedencia estándar:

1. Paréntesis `()`
2. Unarios: `NOT`, `-`
3. Multiplicativos: `*`, `/`, `DIV`, `MOD`
4. Aditivos: `+`, `-`
5. Relacionales: `<`, `>`, `<=`, `>=`, `=`, `!=`
6. Lógicos: `AND`, `OR`

**Acceso a arrays:**
```
A[i]
A[i + 1]
matriz[i][j]
```

**Acceso a campos de objetos:**
```
objeto.campo
```

**Llamadas en expresiones (sin CALL):**
```
resultado <- fibonacci(n - 1) + fibonacci(n - 2);
RETURN factorial(n - 1);
```
**Nota:** Las llamadas recursivas NO usan CALL, simplemente se invocan directamente como expresiones.

### Operadores

#### Operadores de asignación
- `<-` (ASCII oficial visible)

Compatibilidad legacy de parseo:
- `:=`
- `🡨`
- `←`
- `⟵`

**Nota**: La gramática todavía acepta operadores legacy por compatibilidad, pero snippets, documentación y ayudas visibles deben enseñar solo `<-`.

#### Operadores de comparación
Sintaxis oficial visible:
- `=` (igual)
- `!=` (diferente)
- `<` (menor)
- `>` (mayor)
- `<=` (menor o igual)
- `>=` (mayor o igual)

Compatibilidad legacy de parseo:
- `<>`, `≠`
- `≤`
- `≥`

#### Operadores aritméticos
- `+` (suma)
- `-` (resta)
- `*` (multiplicación)
- `/` (división)
- `DIV` (división entera)
- `MOD` (módulo)

#### Operadores lógicos
- `AND` (y lógico)
- `OR` (o lógico)
- `NOT` (negación)

---

## 🧪 Ejemplos de Algoritmos

### 1. Búsqueda Lineal

**Descripción:** Recorre un array secuencialmente buscando un elemento específico.

**Complejidad:** O(n)

**Código:**
```
busquedaLineal(A[n], x, n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        IF (A[i] = x) THEN BEGIN
            RETURN i;
        END
    END
    RETURN -1;
END
```

**Formato JSON para parser:**
```json
{
  "input": "busquedaLineal(A[n], x, n) BEGIN\nFOR i <- 1 TO n DO BEGIN\nIF (A[i] = x) THEN BEGIN\nRETURN i;\nEND\nEND\nRETURN -1;\nEND"
}
```

---

### 2. Búsqueda Binaria

**Descripción:** Busca un elemento en un array ordenado dividiendo el espacio de búsqueda a la mitad en cada iteración.

**Complejidad:** O(log n)

**Código:**
```
busquedaBinaria(A[n], x, inicio, fin) BEGIN
    IF (inicio > fin) THEN BEGIN
        RETURN -1;
    END
    mitad <- (inicio + fin) / 2;
    IF (A[mitad] = x) THEN BEGIN
        RETURN mitad;
    END
    ELSE BEGIN
        IF (x < A[mitad]) THEN BEGIN
            RETURN busquedaBinaria(A, x, inicio, mitad - 1);
        END
        ELSE BEGIN
            RETURN busquedaBinaria(A, x, mitad + 1, fin);
        END
    END
END
```

**Formato JSON para parser:**
```json
{
  "input": "busquedaBinaria(A[n], x, inicio, fin) BEGIN\nIF (inicio > fin) THEN BEGIN\nRETURN -1;\nEND\nmitad <- (inicio + fin) / 2;\nIF (A[mitad] = x) THEN BEGIN\nRETURN mitad;\nEND\nELSE BEGIN\nIF (x < A[mitad]) THEN BEGIN\nRETURN busquedaBinaria(A, x, inicio, mitad - 1);\nEND\nELSE BEGIN\nRETURN busquedaBinaria(A, x, mitad + 1, fin);\nEND\nEND\nEND"
}
```

---

### 3. Ordenamiento Burbuja (Bubble Sort)

**Descripción:** Ordena un array comparando elementos adyacentes e intercambiándolos si están en el orden incorrecto.

**Complejidad:** O(n²)

**Código:**
```
burbuja(A[n], n) BEGIN
    FOR i <- 1 TO n - 1 DO BEGIN
        FOR j <- 1 TO n - i DO BEGIN
            IF (A[j] > A[j + 1]) THEN BEGIN
                temp <- A[j];
                A[j] <- A[j + 1];
                A[j + 1] <- temp;
            END
        END
    END
END
```

**Formato JSON para parser:**
```json
{
  "input": "burbuja(A[n], n) BEGIN\nFOR i <- 1 TO n - 1 DO BEGIN\nFOR j <- 1 TO n - i DO BEGIN\nIF (A[j] > A[j + 1]) THEN BEGIN\ntemp <- A[j];\nA[j] <- A[j + 1];\nA[j + 1] <- temp;\nEND\nEND\nEND\nEND"
}
```

---

### 4. Ordenamiento por Inserción (Insertion Sort)

**Descripción:** Construye el array ordenado insertando cada elemento en su posición correcta.

**Complejidad:** O(n²) en el peor caso, O(n) en el mejor caso

**Código:**
```
insercion(A[n], n) BEGIN
    FOR i <- 2 TO n DO BEGIN
        clave <- A[i];
        j <- i - 1;
        WHILE (j > 0 AND A[j] > clave) DO BEGIN
            A[j + 1] <- A[j];
            j <- j - 1;
        END
        A[j + 1] <- clave;
    END
END
```

**Formato JSON para parser:**
```json
{
  "input": "insercion(A[n], n) BEGIN\nFOR i <- 2 TO n DO BEGIN\nclave <- A[i];\nj <- i - 1;\nWHILE (j > 0 AND A[j] > clave) DO BEGIN\nA[j + 1] <- A[j];\nj <- j - 1;\nEND\nA[j + 1] <- clave;\nEND\nEND"
}
```

---

### 5. Ordenamiento por Selección (Selection Sort)

**Descripción:** Encuentra el elemento mínimo y lo coloca en su posición final en cada iteración.

**Complejidad:** O(n²)

**Código:**
```
seleccion(A[n], n) BEGIN
    FOR i <- 1 TO n - 1 DO BEGIN
        min_idx <- i;
        FOR j <- i + 1 TO n DO BEGIN
            IF (A[j] < A[min_idx]) THEN BEGIN
                min_idx <- j;
            END
        END
        temp <- A[i];
        A[i] <- A[min_idx];
        A[min_idx] <- temp;
    END
END
```

**Formato JSON para parser:**
```json
{
  "input": "seleccion(A[n], n) BEGIN\nFOR i <- 1 TO n - 1 DO BEGIN\nmin_idx <- i;\nFOR j <- i + 1 TO n DO BEGIN\nIF (A[j] < A[min_idx]) THEN BEGIN\nmin_idx <- j;\nEND\nEND\ntemp <- A[i];\nA[i] <- A[min_idx];\nA[min_idx] <- temp;\nEND\nEND"
}
```

---

### 6. Fibonacci Recursivo

**Descripción:** Calcula el n-ésimo número de Fibonacci usando recursión.

**Complejidad:** O(2ⁿ) - Exponencial

**Código:**
```
fibonacci(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    ELSE BEGIN
        RETURN fibonacci(n - 1) + fibonacci(n - 2);
    END
END
```

---

### 7. Factorial con IF-ELSE-IF Encadenado

**Descripción:** Calcula el factorial de un número usando múltiples condiciones IF-ELSE-IF explícitas.

**Complejidad:** O(n) - Lineal

**Código:**
```
calcularFactorialRecursivo(n) BEGIN
    IF (n < 0) THEN BEGIN
        print("Error: El factorial no está definido para números negativos.");
        RETURN -1;
    END ELSE IF (n = 0) THEN BEGIN
        RETURN 1;
    END ELSE IF (n = 1) THEN BEGIN
        RETURN 1;
    END ELSE BEGIN
        RETURN n * calcularFactorialRecursivo(n - 1);
    END
END
```

**Formato JSON para parser:**
```json
{
  "input": "calcularFactorialRecursivo(n) BEGIN\nIF (n < 0) THEN BEGIN\nprint(\"Error: El factorial no está definido para números negativos.\");\nRETURN -1;\nEND ELSE IF (n = 0) THEN BEGIN\nRETURN 1;\nEND ELSE IF (n = 1) THEN BEGIN\nRETURN 1;\nEND ELSE BEGIN\nRETURN n * calcularFactorialRecursivo(n - 1);\nEND\nEND"
}
```

**Nota:** La estructura `IF-ELSE IF-ELSE` es explícita en la gramática, permitiendo encadenar múltiples condiciones sin necesidad de anidar bloques BEGIN-END adicionales.

**Formato JSON para parser:**
```json
{
  "input": "fibonacci(n) BEGIN\nIF (n <= 1) THEN BEGIN\nRETURN n;\nEND\nELSE BEGIN\nRETURN fibonacci(n - 1) + fibonacci(n - 2;\nEND\nEND"
}
```

---

### 7. Máximo Común Divisor - Algoritmo de Euclides

**Descripción:** Calcula el máximo común divisor de dos números usando el algoritmo de Euclides.

**Complejidad:** O(log min(a, b))

**Código:**
```
mcd(a, b) BEGIN
    WHILE (b != 0) DO BEGIN
        temp <- b;
        b <- a MOD b;
        a <- temp;
    END
    RETURN a;
END
```

**Formato JSON para parser:**
```json
{
  "input": "mcd(a, b) BEGIN\nWHILE (b != 0) DO BEGIN\ntemp <- b;\nb <- a MOD b;\na <- temp;\nEND\nRETURN a;\nEND"
}
```

---

### 8. Factorial Iterativo

**Descripción:** Calcula el factorial de un número de forma iterativa.

**Complejidad:** O(n)

**Código:**
```
factorial(n) BEGIN
    resultado <- 1;
    FOR i <- 2 TO n DO BEGIN
        resultado <- resultado * i;
    END
    RETURN resultado;
END
```

**Formato JSON para parser:**
```json
{
  "input": "factorial(n) BEGIN\nresultado <- 1;\nFOR i <- 2 TO n DO BEGIN\nresultado <- resultado * i;\nEND\nRETURN resultado;\nEND"
}
```

---

### 9. Torres de Hanoi

**Descripción:** Resuelve el problema clásico de las Torres de Hanoi usando recursión.

**Complejidad:** O(2ⁿ)

**Código:**
```
hanoi(n, origen, destino, auxiliar) BEGIN
    IF (n = 1) THEN BEGIN
        CALL moverDisco(origen, destino);
    END
    ELSE BEGIN
        CALL hanoi(n - 1, origen, auxiliar, destino);
        CALL moverDisco(origen, destino);
        CALL hanoi(n - 1, auxiliar, destino, origen);
    END
END
```

**Formato JSON para parser:**
```json
{
  "input": "hanoi(n, origen, destino, auxiliar) BEGIN\nIF (n = 1) THEN BEGIN\nCALL moverDisco(origen, destino);\nEND\nELSE BEGIN\nCALL hanoi(n - 1, origen, auxiliar, destino);\nCALL moverDisco(origen, destino);\nCALL hanoi(n - 1, auxiliar, destino, origen);\nEND\nEND"
}
```

---

### 10. QuickSort (Ordenamiento Rápido)

**Descripción:** Algoritmo de ordenamiento divide y conquista usando particionamiento.

**Complejidad:** O(n log n) en promedio, O(n²) en el peor caso

**Código:**
```
quicksort(A[n], izq, der) BEGIN
    IF (izq < der) THEN BEGIN
        pivot <- A[der];
        i <- izq - 1;
        FOR j <- izq TO der - 1 DO BEGIN
            IF (A[j] <= pivot) THEN BEGIN
                i <- i + 1;
                temp <- A[i];
                A[i] <- A[j];
                A[j] <- temp;
            END
        END
        temp <- A[i + 1];
        A[i + 1] <- A[der];
        A[der] <- temp;
        pi <- i + 1;
        CALL quicksort(A, izq, pi - 1);
        CALL quicksort(A, pi + 1, der);
    END
END
```

**Formato JSON para parser:**
```json
{
  "input": "quicksort(A[n], izq, der) BEGIN\nIF (izq < der) THEN BEGIN\npivot <- A[der];\ni <- izq - 1;\nFOR j <- izq TO der - 1 DO BEGIN\nIF (A[j] <= pivot) THEN BEGIN\ni <- i + 1;\ntemp <- A[i];\nA[i] <- A[j];\nA[j] <- temp;\nEND\nEND\ntemp <- A[i + 1];\nA[i + 1] <- A[der];\nA[der] <- temp;\npi <- i + 1;\nCALL quicksort(A, izq, pi - 1);\nCALL quicksort(A, pi + 1, der);\nEND\nEND"
}
```

---

## 🔧 Uso del Parser

### API Endpoint

**POST** `/grammar/parse`

**Request:**
```json
{
  "input": "codigo_pseudocodigo"
}
```

**Response exitosa:**
```json
{
  "ok": true,
  "available": true,
  "runtime": "python",
  "error": null,
  "ast": {
    "type": "Program",
    "body": [...],
    "pos": {"line": 1, "column": 0}
  },
  "errors": []
}
```

**Response con error:**
```json
{
  "ok": false,
  "available": true,
  "runtime": "python",
  "error": "mensaje de error",
  "ast": null,
  "errors": [
    {
      "line": 1,
      "column": 10,
      "message": "descripción del error"
    }
  ]
}
```

### Ejemplo completo de ParseResponse

**Request (factorial):**
```json
{
  "input": "factorial(n) BEGIN\n  resultado <- 1;\n  FOR i <- 2 TO n DO BEGIN\n    resultado <- resultado * i;\n  END\n  RETURN resultado;\nEND"
}
```

**Response exitosa con AST completo:**
```json
{
  "ok": true,
  "available": true,
  "runtime": "python",
  "error": null,
  "ast": {
    "type": "Program",
    "body": [
      {
        "type": "ProcDef",
        "name": "factorial",
        "params": [
          {
            "type": "Param",
            "name": "n",
            "pos": { "line": 1, "column": 10 }
          }
        ],
        "body": {
          "type": "Block",
          "body": [
            {
              "type": "Assign",
              "target": {
                "type": "Identifier",
                "name": "resultado",
                "pos": { "line": 2, "column": 2 }
              },
              "value": {
                "type": "Literal",
                "value": 1,
                "pos": { "line": 2, "column": 15 }
              },
              "pos": { "line": 2, "column": 2 }
            },
            {
              "type": "For",
              "var": "i",
              "start": {
                "type": "Literal",
                "value": 2,
                "pos": { "line": 3, "column": 13 }
              },
              "end": {
                "type": "Identifier",
                "name": "n",
                "pos": { "line": 3, "column": 18 }
              },
              "body": {
                "type": "Block",
                "body": [
                  {
                    "type": "Assign",
                    "target": {
                      "type": "Identifier",
                      "name": "resultado",
                      "pos": { "line": 4, "column": 4 }
                    },
                    "value": {
                      "type": "Binary",
                      "op": "*",
                      "left": {
                        "type": "Identifier",
                        "name": "resultado",
                        "pos": { "line": 4, "column": 17 }
                      },
                      "right": {
                        "type": "Identifier",
                        "name": "i",
                        "pos": { "line": 4, "column": 29 }
                      },
                      "pos": { "line": 4, "column": 27 }
                    },
                    "pos": { "line": 4, "column": 4 }
                  }
                ],
                "pos": { "line": 3, "column": 23 }
              },
              "pos": { "line": 3, "column": 2 }
            },
            {
              "type": "Return",
              "value": {
                "type": "Identifier",
                "name": "resultado",
                "pos": { "line": 6, "column": 9 }
              },
              "pos": { "line": 6, "column": 2 }
            }
          ],
          "pos": { "line": 1, "column": 13 }
        },
        "pos": { "line": 1, "column": 0 }
      }
    ],
    "pos": { "line": 1, "column": 0 }
  },
  "errors": []
}
```

**Características clave del AST:**
- Cada nodo incluye `pos` con `line` y `column` para rastreo preciso de errores
- Los operadores están normalizados a un conjunto cerrado (`==`, `!=`, `<=`, `>=`, `<`, `>`, `+`, `-`, `*`, `/`, `div`, `mod`, `and`, `or`, `not`)
- Los nodos `Call` tienen `statement: true` si se usan como statement, `false` si están en una expresión
- Los bloques siempre son nodos `Block` con un array `body`
- Los tipos TypeScript completos están disponibles en `@aa/types`

### Estructura del AST

El AST generado incluye:
- **`pos`**: Posición (`line`, `column`) para cada nodo
- **Operadores normalizados**: Conjunto cerrado de operadores
- **Consistencia en `Call`**: `statement: true/false` según el contexto

**Ejemplo de nodo:**
```json
{
  "type": "ProcDef",
  "name": "fibonacci",
  "params": [...],
  "body": {...},
  "pos": {"line": 1, "column": 0}
}
```

---

## 📚 Reglas Importantes

1. **IF-THEN siempre requiere bloques BEGIN...END**
   ```
   ✅ IF (x > 0) THEN BEGIN resultado <- 1; END
   ❌ IF (x > 0) THEN resultado <- 1;
   ```
   
   **IF-ELSE-IF encadenado es explícito:**
   ```
   ✅ IF (n < 0) THEN BEGIN
         print("Error");
         RETURN -1;
      END ELSE IF (n = 0) THEN BEGIN
         RETURN 1;
      END ELSE IF (n = 1) THEN BEGIN
         RETURN 1;
      END ELSE BEGIN
         RETURN n * factorial(n - 1);
      END
   ```
   El `ELSE` puede ir seguido directamente de otro `IF` o de un bloque `BEGIN...END`.

2. **FOR y WHILE requieren bloques**
   ```
   ✅ FOR i <- 1 TO n DO BEGIN ... END
   ❌ FOR i <- 1 TO n DO sentencia;
   ```

3. **CALL solo para statements, no en expresiones**
   ```
   ✅ CALL procedimiento(x);
   ✅ resultado <- funcion(x);
   ❌ resultado <- CALL funcion(x);
   ```

4. **Llamadas recursivas NO usan CALL, solo se invocan directamente**
   ```
   ✅ RETURN factorial(n - 1);
   ✅ resultado <- fibonacci(n - 1) + fibonacci(n - 2);
   ✅ quicksort(A, izq, pi - 1);  // Como statement directo, sin CALL
   ❌ RETURN CALL factorial(n - 1);
   ❌ resultado <- CALL fibonacci(n - 1) + CALL fibonacci(n - 2);
   ❌ CALL quicksort(A, izq, pi - 1);  // INCORRECTO para recursivas
   ```
   Las llamadas recursivas siempre se hacen como expresiones (en RETURN, asignaciones, etc.) o directamente como statements sin CALL. Solo usa CALL para funciones auxiliares no recursivas.

5. **Arrays pueden usar literales en rangos**
   ```
   ✅ procedimiento(A[1]..[n])
   ✅ procedimiento(A[n])
   ✅ procedimiento(A[i]..[j])
   ```

---

## 🔧 Guía de Desarrollo

### Generación de Código (Codegen)

El proyecto utiliza ANTLR4 para generar parsers en TypeScript y Python a partir de la gramática `Language.g4`.

#### Generar Parser TypeScript

Desde el directorio `packages/grammar`:

```bash
npm run build
```

O desde la raíz del proyecto:

```bash
pnpm --filter @aa/grammar build
```

**¿Qué hace esto?**
- Ejecuta `scripts/gen-ts.js`
- Usa `antlr4ts` para generar el parser TypeScript
- Genera archivos en `packages/grammar/src/ts/`:
  - `LanguageLexer.ts`
  - `LanguageParser.ts`
  - `LanguageVisitor.ts`
  - `Language.tokens`, etc.

**Requisitos:**
- Node.js ≥20 <23
- `antlr4ts-cli` instalado (incluido en devDependencies)

#### Generar Parser Python

Desde el directorio `packages/grammar`:

```bash
npm run gen:py
```

O desde la raíz del proyecto:

```bash
pnpm --filter @aa/grammar gen:py
```

**¿Qué hace esto?**
- Ejecuta `scripts/gen-py.js`
- Usa el JAR oficial de ANTLR (`tooling/antlr-4.13.2-complete.jar`)
- Genera archivos en `packages/grammar/out/py/`:
  - `LanguageLexer.py`
  - `LanguageParser.py`
  - `LanguageVisitor.py`
  - `Language.tokens`, etc.

**Requisitos:**
- Java ≥8 instalado en el sistema
- `tooling/antlr-4.13.2-complete.jar` presente

**📝 Nota:** Después de generar el parser Python, copia manualmente los archivos generados a `packages/grammar/py/src/aa_grammar/generated/` si necesitas usarlos en la API.

---

### Probar el Endpoint `/parse`

El backend FastAPI expone un endpoint `/grammar/parse` que recibe pseudocódigo y devuelve el AST.

#### 1. Iniciar el servidor API

Desde el directorio `apps/api`:

```bash
# Instalar dependencias (primera vez)
pip install -r requirements.txt

# Iniciar el servidor
python -m uvicorn app.main:app --reload --port 8000
```

O usando Docker:

```bash
cd infra
docker-compose up api
```

#### 2. Probar el endpoint

**Con curl:**

```bash
curl -X POST http://localhost:8000/grammar/parse \
  -H "Content-Type: application/json" \
  -d '{
    "input": "factorial(n) BEGIN\n  resultado <- 1;\n  RETURN resultado;\nEND"
  }'
```

**Con Python:**

```python
import requests

response = requests.post(
    "http://localhost:8000/grammar/parse",
    json={
        "input": """
factorial(n) BEGIN
  resultado <- 1;
  FOR i <- 2 TO n DO BEGIN
    resultado <- resultado * i;
  END
  RETURN resultado;
END
        """
    }
)

print(response.json())
```

**Con la aplicación web:**

La aplicación Next.js en `apps/web` se comunica con este endpoint a través de `src/services/grammar-api.ts`.

#### 3. Formato de respuesta

**Respuesta exitosa:**
```json
{
  "ok": true,
  "available": true,
  "runtime": "python",
  "ast": {
    "type": "Program",
    "body": [...],
    "pos": {"line": 1, "column": 0}
  },
  "errors": []
}
```

**Respuesta con errores:**
```json
{
  "ok": false,
  "available": true,
  "runtime": "python",
  "error": "mismatched input ';' expecting 'BEGIN'",
  "ast": null,
  "errors": [
    {
      "line": 2,
      "column": 15,
      "message": "mismatched input ';' expecting 'BEGIN'"
    }
  ]
}
```

#### 4. Ejecutar tests

Desde `apps/api`:

```bash
pytest test/test_parse.py -v
```

---

### Activar KaTeX para Renderizado de Fórmulas

El proyecto utiliza KaTeX para renderizar fórmulas matemáticas en LaTeX.

#### 1. Instalación

KaTeX ya está incluido en las dependencias de `apps/web`:

```json
{
  "dependencies": {
    "katex": "0.16.10",
    "@types/katex": "^0.16.7"
  }
}
```

Para instalar:

```bash
cd apps/web
pnpm install
```

#### 2. Uso en componentes

El módulo `src/lib/katex.ts` proporciona una función segura para renderizar LaTeX:

```typescript
import { renderLatexToHtml } from "@/lib/katex";

// Renderizar en modo inline
const html = renderLatexToHtml("T(n) = O(n^2)");

// Renderizar en modo display (centrado)
const htmlBlock = renderLatexToHtml("T(n) = \\sum_{i=1}^{n} i", {
  displayMode: true
});

// Usar en JSX
<div dangerouslySetInnerHTML={{ __html: html }} />
```

#### 3. Configuración

La función `renderLatexToHtml` usa configuraciones seguras por defecto:

```typescript
{
  displayMode: false,      // inline por defecto
  throwOnError: false,     // nunca rompe la UI
  trust: false,            // no ejecuta código embebido
  strict: "ignore",        // ignora warnings de LaTeX
  output: "html"           // genera HTML (no MathML)
}
```

#### 4. Estilos CSS

**Importante:** Debes importar los estilos de KaTeX en tu aplicación:

```tsx
// En apps/web/src/app/layout.tsx o donde uses KaTeX
import "katex/dist/katex.min.css";
```

O añade el CDN en `<head>`:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css">
```

#### 5. Ejemplos de uso en el proyecto

- **`Formula.tsx`**: Renderiza fórmulas inline
- **`FormulaBlock.tsx`**: Renderiza fórmulas en bloque (centradas)
- **`CostsTable.tsx`**: Muestra fórmulas de costos en tablas

---

### Contratos de Tipos en `@aa/types`

El paquete `@aa/types` (`packages/types/`) define todos los tipos e interfaces compartidos entre el frontend y el backend.

#### Estructura del Paquete

```
packages/types/
├── src/
│   └── index.ts       # Exporta todos los tipos
├── dist/
│   ├── index.d.ts     # Definiciones TypeScript compiladas
│   └── index.js       # Código JavaScript compilado
├── package.json
└── tsconfig.json
```

#### Categorías de Tipos

##### 1. **Health Check**

```typescript
interface Health {
  status: "ok";
}

interface HealthResponse {
  ok: boolean;
  service?: string;
  error?: string;
  status?: string;
}
```

##### 2. **Nodos AST**

Todos los nodos AST heredan de `BaseNode`:

```typescript
interface BaseNode {
  type: string;
  pos: Position;
}

interface Position {
  line: number;
  column: number;
}
```

**Tipos de nodos principales:**

- **Literales e identificadores**: `Literal`, `Identifier`
- **Expresiones**: `Binary`, `Unary`, `Index`, `Field`, `Call`
- **Statements**: `Block`, `Assign`, `DeclVector`, `If`, `While`, `For`, `Repeat`, `Return`
- **Parámetros**: `Param`, `ArrayParam`, `ObjectParam`
- **Nivel superior**: `ProcDef`, `Program`

**Tipo unión:**

```typescript
type AstNode =
  | Program
  | ProcDef
  | Block
  | Assign
  | DeclVector
  | If
  | While
  | For
  | Repeat
  | Return
  | Call
  | Binary
  | Unary
  | Index
  | Field
  | Literal
  | Identifier
  | Param
  | ArrayParam
  | ObjectParam;
```

##### 3. **Parse API**

```typescript
interface ParseRequest {
  source: string;
}

interface GrammarParseRequest {
  input: string;
}

interface ParseError {
  line: number;
  column: number;
  message: string;
}

interface ParseResponse {
  ok: boolean;
  ast?: Program;
  errors?: ParseError[];
}

interface GrammarParseResponse extends ParseResponse {
  available?: boolean;
  runtime?: string;
  error?: string;
}
```

**Type guard:**

```typescript
function isGrammarParseResponse(obj: unknown): obj is GrammarParseResponse;
```

##### 4. **Analyze API**

```typescript
type CaseMode = "best" | "avg" | "worst" | "all";

interface AnalyzeOptions {
  mode?: CaseMode;
  ck?: Record<string, number>;
  avgModel?: {
    assumptions?: string;
    params?: Record<string, unknown>;
  };
}

interface LineCost {
  no: number;           // Número de línea
  code: string;         // Texto de la línea
  ck: string;           // Etiqueta de costo (C1, C2, ...)
  execs: string;        // Número de ejecuciones
  cost: string;         // Costo total
}

interface CaseResult {
  assumptions: string;
  stepsLatex: string[];
  Tlatex: string;
  Tclosed: string;
}

interface AnalyzeResponse {
  lines: LineCost[];
  cases: {
    best?: CaseResult;
    avg?: CaseResult;
    worst?: CaseResult;
  };
}
```

##### 5. **LLM API**

```typescript
interface LLMCompareRequest {
  source: string;
  astSummary?: string;
  ourResult: {
    best?: Pick<CaseResult, "Tlatex" | "Tclosed">;
    avg?: Pick<CaseResult, "Tlatex" | "Tclosed">;
    worst?: Pick<CaseResult, "Tlatex" | "Tclosed">;
  };
}

interface LLMOpinion {
  explanation: string;
  T?: string;
}

interface LLMCompareResponse {
  llmOpinion: {
    best?: LLMOpinion;
    avg?: LLMOpinion;
    worst?: LLMOpinion;
  };
  diffSummary: string;
}
```

##### 6. **Documentación**

```typescript
interface DocumentationSection {
  id: string;
  title: string;
  description: string;
  image: {
    src: string;
    alt: string;
    width: number;
    height: number;
    caption?: string;
  };
}
```

#### Uso en el Proyecto

**En TypeScript (frontend/Next.js):**

```typescript
import type {
  ParseRequest,
  ParseResponse,
  AstNode,
  Program,
  AnalyzeResponse
} from "@aa/types";

async function parseCode(code: string): Promise<ParseResponse> {
  const request: ParseRequest = { source: code };
  const response = await fetch("/api/grammar/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });
  return response.json();
}
```

**En Python (backend):**

Los tipos TypeScript sirven como documentación para el contrato de la API. El backend debe devolver JSONs que coincidan con estos tipos.

```python
# apps/api/app/routers/parse.py
def parse(payload: Dict[str, Any]) -> Dict[str, Any]:
    # Devuelve un dict que coincide con GrammarParseResponse
    return {
        "ok": True,
        "available": True,
        "runtime": "python",
        "ast": ast_dict,
        "errors": []
    }
```

#### Compilar el Paquete

Para generar los archivos `.d.ts` y `.js`:

```bash
cd packages/types
pnpm run build
```

Esto ejecuta `tsc` y genera `dist/index.d.ts` y `dist/index.js`.

---

## 🎓 Recursos Adicionales

- **Archivo de gramática**: `Language.g4`
- **Tests**: `packages/grammar/fixtures/`
- **Generador de parsers**: `npm run gen:py` (Python) o `npm run build` (TypeScript)
- **Tipos compartidos**: `packages/types/src/index.ts`
- **API de parsing**: `apps/api/app/routers/parse.py`
- **Librería KaTeX**: `apps/web/src/lib/katex.ts`

---

**Última actualización:** Octubre 2025
