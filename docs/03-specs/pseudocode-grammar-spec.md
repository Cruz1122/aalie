# Especificación de gramática de pseudocódigo

**Tipo:** normativa

## Propósito

Fijar la gramática soportada hoy por AALIE y separar claramente lo que la gramática acepta de lo que el motor posterior realmente analiza con cobertura fuerte.

## Alcance

Aplica al parser ANTLR y al AST canónico generado desde `source`.

## Fuente de verdad

- `packages/grammar/grammar/Language.g4`
- AST builders en `packages/grammar/py/src/aa_grammar/ast_builder.py` y `packages/grammar/src/ts/ast-builder.ts`

## Estructura

### Gramática efectiva soportada hoy

- procedimientos: `nombre(parametros) block`
- bloques: `BEGIN ... END` o `{ ... }`
- sentencias: `assignment`, `call`, `print`, `if`, `while`, `repeat`, `for`, `return`, `declVector`
- parámetros: escalares, arrays, objetos
- expresiones: binarias, unarias, llamadas, índices, campos, literales
- comentarios: `//` y `►`

### Diferencia entre gramática ideal y efectiva

- la gramática puede aceptar más formas de entrada que las plenamente soportadas por el motor de análisis;
- parsear correctamente no implica que WHILE, recurrencias o simplificaciones queden cubiertas con conclusión fuerte;
- los alias Unicode y operadores alternativos existen a nivel de parseo, pero el equipo debe preferir formas ASCII en ejemplos y soporte.

## Inputs

- `source: string`

## Outputs

- AST canónico con nodo raíz `Program`;
- lista de errores con `line`, `column` y `message` si el parseo falla.

## Invariantes

- un `Program` puede contener `classDef*` y luego `procDef | stmt`;
- toda estructura de control usa `block` completo;
- `returnStmt` exige expresión;
- `callStmt` con `CALL`; `callExpr` sin `CALL`.

## Errores esperables

- tokens inesperados;
- bloques incompletos;
- paréntesis o corchetes no balanceados;
- uso de construcciones fuera de la gramática.

## Ejemplos

### Ejemplos validos

```text
factorial(n) BEGIN
  resultado <- 1;
  FOR i <- 2 TO n DO BEGIN
    resultado <- resultado * i;
  END
  RETURN resultado;
END
```

```text
busqueda(A[n], x) BEGIN
  i <- 1;
  WHILE (i <= n AND A[i] != x) DO BEGIN
    i <- i + 1;
  END
  RETURN i;
END
```

### Ejemplos no soportados

```text
// no existe sintaxis Python-like por indentación
IF x > 0:
  RETURN x
```

```text
// no existe for-each en la gramática actual
FOR item IN A DO BEGIN
  PRINT(item);
END
```

## Limites conocidos

- La gramática acepta arrays y objetos, pero el nivel de soporte analítico posterior depende del visitor y del método.
- La gramática no documenta por sí sola la cobertura matemática de recurrencias o WHILE.

## Archivos relacionados

- `ast-schema.md`
- `../04-api/parse-api.md`
- `../04-api/schemas/parse-schema.md`
