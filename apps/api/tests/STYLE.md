# Estilo de tests (AAA obligatorio)

Todos los tests deben seguir el patrón **Arrange-Act-Assert** (AAA) y ser legibles "como un cuento".

## Plantilla oficial

```python
def test_xxx():
    # Arrange
    ...

    # Act
    ...

    # Assert
    ...
```

## Regla

Si un test no se puede leer en ese orden (preparar → ejecutar → comprobar), se reescribe.

## Ejemplo

```python
def test_linear_search_worst_linear():
    # Arrange
    source = load_algorithm("math", "linear_search")
    # Act
    result = analyze_algorithm(source, mode="all")
    # Assert
    assert result.get("ok")
    assert_complexity_class(result, "worst", "linear", "linear_search")
```

## Aserciones semánticas

Usar **solo** los helpers de `tests/_support/assertions.py` para verificar resultados de análisis (complejidad, notación, esquemas). No inventar asserts ad hoc para lo mismo.

## Revisión

En code review se exige que los tests nuevos sigan AAA y usen el oráculo de `_support/assertions.py`.
