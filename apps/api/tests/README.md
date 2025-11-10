# Tests - API de Análisis de Algoritmos

## Introducción

Este directorio contiene todos los tests para la API de análisis de algoritmos. Los tests están organizados en tres categorías principales: unitarios, integración y sistema.

## Estructura de Carpetas

```
tests/
├── README.md                 # Esta documentación
├── unit/                     # Tests unitarios
│   ├── test_expr_converter.py    # Conversión AST a SymPy
│   ├── test_summation_closer.py  # Cierre de sumatorias
│   ├── test_base_analyzer.py     # BaseAnalyzer con SymPy
│   └── test_complexity_classes.py # Clases de complejidad
├── integration/              # Tests de integración
│   ├── test_sympy_integration.py # Integración básica SymPy
│   ├── test_iterative_analyzer.py # Analizador iterativo
│   └── test_algorithms.py        # Algoritmos completos
└── system/                   # Tests de sistema/endpoints
    ├── test_parse_endpoint.py    # Endpoint /grammar/parse
    └── test_analyze_endpoint.py  # Endpoint /analyze/open
```

## Categorías de Tests

### Tests Unitarios (`unit/`)

Los tests unitarios verifican componentes individuales de forma aislada:

- **test_expr_converter.py**: Prueba la conversión de AST a expresiones SymPy
- **test_summation_closer.py**: Verifica el cierre y simplificación de sumatorias
- **test_base_analyzer.py**: Prueba BaseAnalyzer con objetos SymPy
- **test_complexity_classes.py**: Verifica el cálculo de clases de complejidad (Big-O, Big-Ω, Big-Θ)

### Tests de Integración (`integration/`)

Los tests de integración verifican la interacción entre componentes:

- **test_sympy_integration.py**: Verifica que los componentes trabajen juntos con SymPy
- **test_iterative_analyzer.py**: Prueba el flujo completo del analizador iterativo
- **test_algorithms.py**: Verifica el análisis de algoritmos completos (insertion sort, bubble sort, etc.)

### Tests de Sistema (`system/`)

Los tests de sistema verifican los endpoints HTTP completos:

- **test_parse_endpoint.py**: Prueba el endpoint `/grammar/parse` para parsing de pseudocódigo
- **test_analyze_endpoint.py**: Prueba el endpoint `/analyze/open` para análisis de complejidad

## Cómo Ejecutar los Tests

### Ejecutar Todos los Tests

```bash
# Desde la raíz del proyecto
cd apps/api
pytest tests/ -v
```

### Ejecutar Tests Específicos

```bash
# Solo tests unitarios
pytest tests/unit/ -v

# Solo tests de integración
pytest tests/integration/ -v

# Solo tests de sistema
pytest tests/system/ -v

# Un archivo específico
pytest tests/unit/test_expr_converter.py -v

# Un test específico
pytest tests/unit/test_expr_converter.py::TestExprConverter::test_number -v
```

### Ejecutar desde Docker

```bash
# Ejecutar todos los tests
docker exec <container_name> pytest tests/ -v

# Ejecutar tests específicos
docker exec <container_name> pytest tests/unit/ -v
```

### Opciones Útiles de pytest

```bash
# Mostrar output de print statements
pytest tests/ -v -s

# Ejecutar solo los tests que fallaron la última vez
pytest tests/ --lf

# Ejecutar tests en paralelo (requiere pytest-xdist)
pytest tests/ -n auto

# Ver cobertura de código
pytest tests/ --cov=app --cov-report=html
```

## Ejemplos de Uso

### Ejemplo 1: Ejecutar tests unitarios de sumatorias

```bash
pytest tests/unit/test_summation_closer.py -v
```

### Ejemplo 2: Ejecutar tests de un algoritmo específico

```bash
pytest tests/integration/test_algorithms.py::TestAlgorithms::test_insertion_sort -v
```

### Ejemplo 3: Ejecutar tests de un endpoint

```bash
pytest tests/system/test_analyze_endpoint.py::TestAnalyzeEndpoint::test_bubble_sort -v
```

## Convenciones

### Naming

- Archivos de test: `test_*.py`
- Clases de test: `Test*` (ej: `TestExprConverter`)
- Funciones de test: `test_*` (ej: `test_number`)

### Estructura

- Cada test debe tener un docstring descriptivo en español
- Los tests deben ser independientes (no depender de otros tests)
- Usar `setUp()` para configuración común en clases
- Usar fixtures de pytest cuando sea apropiado

### Imports

- Importar desde `app.analysis.*` para componentes de análisis
- Usar `unittest.TestCase` o clases con pytest según corresponda
- Importar `pytest` para funciones de test

### Assertions

- Usar `assert` de Python (pytest lo convierte automáticamente)
- Proporcionar mensajes descriptivos en las aserciones
- Verificar tanto casos exitosos como casos de error

## Guía para Agregar Nuevos Tests

### 1. Tests Unitarios

Para agregar un test unitario:

1. Identifica el componente a probar (ej: `ExprConverter`, `SummationCloser`)
2. Crea o modifica el archivo en `tests/unit/test_<component>.py`
3. Usa `unittest.TestCase` o funciones pytest
4. Escribe tests para cada método/funcionalidad importante

Ejemplo:

```python
# tests/unit/test_my_component.py
import unittest
from app.analysis.my_component import MyComponent

class TestMyComponent(unittest.TestCase):
    def setUp(self):
        self.component = MyComponent()
    
    def test_feature(self):
        """Test: Descripción de la funcionalidad"""
        result = self.component.do_something()
        self.assertEqual(result, expected_value)
```

### 2. Tests de Integración

Para agregar un test de integración:

1. Identifica los componentes que interactúan
2. Crea o modifica el archivo en `tests/integration/test_<feature>.py`
3. Usa `IterativeAnalyzer` o los componentes directamente
4. Verifica el flujo completo sin endpoints HTTP

Ejemplo:

```python
# tests/integration/test_my_feature.py
import pytest
from app.analysis.iterative_analyzer import IterativeAnalyzer

class TestMyFeature:
    def test_integration(self):
        """Test: Verificar integración de componentes"""
        analyzer = IterativeAnalyzer()
        ast = {...}  # AST de ejemplo
        result = analyzer.analyze(ast, mode="worst")
        assert result.get("ok")
        assert "byLine" in result
```

### 3. Tests de Sistema

Para agregar un test de sistema:

1. Identifica el endpoint a probar
2. Crea o modifica el archivo en `tests/system/test_<endpoint>_endpoint.py`
3. Usa `TestClient` de FastAPI
4. Verifica respuestas HTTP y estructura de datos

Ejemplo:

```python
# tests/system/test_my_endpoint.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestMyEndpoint:
    def test_endpoint(self):
        """Test: Verificar endpoint"""
        response = client.post("/my/endpoint", json={"data": "test"})
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok")
```

## Mejores Prácticas

### Organización

- Mantén los tests cerca del código que prueban (en la estructura de carpetas)
- Agrupa tests relacionados en la misma clase o archivo
- Usa nombres descriptivos que expliquen qué se está probando

### Mantenibilidad

- Escribe tests que sean fáciles de entender y modificar
- Evita duplicación: usa fixtures o métodos helper cuando sea apropiado
- Documenta casos edge y comportamientos especiales

### Cobertura

- Intenta cubrir todos los casos importantes (happy path, error cases, edge cases)
- No te obsesiones con el 100% de cobertura, pero sí con las funcionalidades críticas
- Prioriza tests para código que cambia frecuentemente

### Performance

- Los tests unitarios deben ser rápidos (< 1 segundo)
- Los tests de integración pueden ser más lentos pero razonables
- Los tests de sistema pueden ser los más lentos pero necesarios

### Independencia

- Cada test debe poder ejecutarse de forma independiente
- No dependas del orden de ejecución de los tests
- Limpia el estado después de cada test (usando `setUp` y `tearDown`)

## Troubleshooting

### Tests que fallan intermitentemente

- Verifica que no haya dependencias entre tests
- Asegúrate de limpiar el estado correctamente
- Revisa si hay condiciones de carrera

### Tests lentos

- Identifica qué tests son lentos: `pytest tests/ --durations=10`
- Considera usar mocking para componentes externos
- Ejecuta solo los tests relevantes durante desarrollo

### Problemas de imports

- Asegúrate de que el path de Python incluya `apps/api`
- Verifica que las importaciones sean relativas al módulo `app`
- Revisa `__init__.py` en las carpetas de tests

## Recursos Adicionales

- [Documentación de pytest](https://docs.pytest.org/)
- [Documentación de FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [Documentación de unittest](https://docs.python.org/3/library/unittest.html)

## Contribuir

Al agregar nuevos tests:

1. Sigue las convenciones establecidas
2. Asegúrate de que los tests pasen antes de hacer commit
3. Documenta casos especiales o comportamientos no obvios
4. Mantén los tests organizados y fáciles de entender

