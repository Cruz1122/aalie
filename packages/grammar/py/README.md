# AA Grammar - Python Parser

Paquete Python generado por ANTLR4 para el análisis de pseudocódigo y algoritmos.

## Instalación

```bash
pip install -e .
```

## Uso

```python
from aa_grammar import parse_code, analyze_complexity

# Parsear código
ast = parse_code("for i in range(n): print(i)")

# Analizar complejidad
complexity = analyze_complexity(ast)
```