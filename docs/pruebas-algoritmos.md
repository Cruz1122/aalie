# Documento de Pruebas de Algoritmos

**Fecha de generación**: 2025-11-23 22:26:58

Este documento contiene pruebas exhaustivas de múltiples algoritmos, organizados por tipo de análisis.

## Índice

1. [Algoritmos Iterativos](#algoritmos-iterativos)
2. [Algoritmos Recursivos - Método Iterativo](#algoritmos-recursivos---método-iterativo)
3. [Algoritmos Recursivos - Teorema Maestro](#algoritmos-recursivos---teorema-maestro)
4. [Algoritmos Recursivos - Árbol de Recursión](#algoritmos-recursivos---árbol-de-recursión)
5. [Algoritmos Recursivos - Ecuación Característica](#algoritmos-recursivos---ecuación-característica)
6. [Resumen y Estadísticas](#resumen-y-estadísticas)

## Algoritmos Iterativos

### 1. Búsqueda Lineal (ID: 3)

#### Pseudocódigo

```pseudocode
busquedaLineal(A[n], x, n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        IF (A[i] = x) THEN BEGIN
            RETURN i;
        END
    END
    RETURN -1;
END
```

#### AST (Abstract Syntax Tree)

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ProcDef",
      "name": "busquedaLineal",
      "params": [
        {
          "type": "ArrayParam",
          "name": "A",
          "start": {
            "type": "Identifier",
            "name": "n",
            "pos": {
              "line": 0,
              "column": 0
            }
          },
          "end": null,
          "pos": {
            "line": 1,
            "column": 15
          }
        },
        {
          "type": "Param",
          "name": "x",
          "pos": {
            "line": 1,
            "column": 21
          }
        },
        {
          "type": "Param",
          "name": "n",
          "pos": {
            "line": 1,
            "column": 24
          }
        }
      ],
      "body": {
        "type": "Block",
        "body": [
          {
            "type": "For",
            "var": "i",
            "start": {
              "type": "Literal",
              "value": 1,
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "end": {
              "type": "Identifier",
              "name": "n",
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "body": {
              "type": "Block",
              "body": [
                {
                  "type": "If",
                  "test": {
                    "type": "Binary",
                    "op": "==",
                    "left": {
                      "type": "Index",
                      "target": {
                        "type": "Identifier",
                        "name": "A",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "pos": {
                        "line": 3,
                        "column": 13
                      },
                      "index": {
                        "type": "Identifier",
                        "name": "i",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      }
                    },
                    "right": {
                      "type": "Identifier",
                      "name": "x",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "consequent": {
                    "type": "Block",
                    "body": [
                      {
                        "type": "Return",
                        "value": {
                          "type": "Identifier",
                          "name": "i",
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        },
                        "pos": {
                          "line": 4,
                          "column": 12
                        }
                      }
                    ],
                    "pos": {
                      "line": 3,
                      "column": 27
                    }
                  },
                  "alternate": null,
                  "pos": {
                    "line": 3,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 2,
                "column": 23
              }
            },
            "pos": {
              "line": 2,
              "column": 4
            }
          },
          {
            "type": "Return",
            "value": {
              "type": "Unary",
              "op": "-",
              "arg": {
                "type": "Literal",
                "value": 1,
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 7,
                "column": 11
              }
            },
            "pos": {
              "line": 7,
              "column": 4
            }
          }
        ],
        "pos": {
          "line": 1,
          "column": 27
        }
      },
      "pos": {
        "line": 1,
        "column": 0
      }
    }
  ],
  "pos": {
    "line": 1,
    "column": 0
  }
}
```

#### Clasificación: `iterative`

#### Análisis de Complejidad

### Worst Case

**T_open**: `C_{1} \cdot (n + 1) + C_{2} \cdot n + C_{4}`

**T_polynomial**: `(C_{1} + C_{2}) \cdot n + (C_{1} + C_{4})`

**Notaciones Asintóticas:**
- **O**: `O(n)`
- **Ω**: `\Omega(n)`
- **Θ**: `\Theta(n)`

**Análisis por Línea:**

| Línea | Tipo | Costo (C_k) | Count | Count Raw | Nota |
|-------|------|-------------|-------|-----------|------|
| 2 | for | C_{1} | n + 1 | n + 1 | Cabecera del bucle for i=1..n |
| 3 | if | C_{2} | n | \sum_{i=1}^{n} 1 | Evaluación de la condición |
| 7 | return | C_{4} | 1 | 1 | - |

### Best Case

**T_open**: `C`

**T_polynomial**: `(C_{2} + C_{3}) + (C_{1}) \cdot 2`

**Notaciones Asintóticas:**
- **O**: `O(1)`
- **Ω**: `\Omega(1)`
- **Θ**: `\Theta(1)`

**Análisis por Línea:**

| Línea | Tipo | Costo (C_k) | Count | Count Raw | Nota |
|-------|------|-------------|-------|-----------|------|
| 2 | for | C_{1} | 2 | 2 | Cabecera del bucle for i=1..n (best: early return en primera iteración) |
| 3 | if | C_{2} | 1 | 1 | Evaluación de la condición |
| 4 | return | C_{3} | 1 | 1 | best: early-exit (then) |

### Average Case

**T_open**: `C_{1} \cdot (\frac{n}{2} + \frac{3}{2}) + C_{2} \cdot (\frac{n}{2} + \frac{1}{2}) + C_{3} + C_{4} \cdot 0`

**T_polynomial**: `(C_{1} + C_{2}) \cdot \frac{1}{2} \cdot n + (C_{3}) + (C_{2}) \cdot \frac{1}{2} + (C_{1}) \cdot \frac{3}{2}`

**Notaciones Asintóticas:**
- **O**: `O(n)`
- **Ω**: `\Omega(n)`
- **Θ**: `\Theta(n)`

**Análisis por Línea:**

| Línea | Tipo | Costo (C_k) | Count | Count Raw | Nota |
|-------|------|-------------|-------|-----------|------|
| 2 | for | C_{1} | \frac{n}{2} + \frac{3}{2} | \frac{n}{2} + \frac{3}{2} | Cabecera del bucle for i=1..n (avg: E[iter] + 1) |
| 3 | if | C_{2} | \frac{n}{2} + \frac{1}{2} | \frac{n}{2} + \frac{1}{2} | Evaluación de la condición |
| 4 | return | C_{3} | 1 | 1 | avg: éxito seguro |
| 7 | return | C_{4} | 0 | 0 | avg: fracaso (nunca ocurre con éxito seguro) |

**Procedimiento:**

1. \text{Paso 1: Definición de caso promedio}

2. A(n) = \sum_{I \in I_n} T(I) \cdot p(I)

3. \text{Paso 2: Modelo uniforme}

4. A(n) = \frac{1}{|I_n|} \sum_{I \in I_n} T(I)

5. \text{Paso 3: Linealidad de la esperanza}

6. A(n) = \sum_{\ell} C_{\ell} \cdot E[N_{\ell}]

7. \text{Paso 4: Cálculo de } E[N_{\ell}] \text{ por constructo}

8. \text{- FOR con early return: } E[iter] = \frac{n+1}{2} \text{ (uniforme condicionado a éxito)}

9. \text{- IF con early return: siempre entra en THEN (éxito seguro), no aplicar probabilidades}

10. \text{Paso 5: Cierre de sumatorias}

11. A(n) = C_{1} \cdot (\frac{n}{2} + \frac{3}{2}) + C_{2} \cdot (\frac{n}{2} + \frac{1}{2}) + C_{3} + C_{4} \cdot 0

12. \text{Paso 6: Resultado y modelo usado}

13. \text{Modelo: uniforme (éxito)}


#### Tiempo de Ejecución

- Parse: 0.025s
- Clasificación: 0.015s
- Análisis: 0.495s
- **Total**: 0.535s

---

### 2. Factorial Iterativo (ID: 5)

#### Pseudocódigo

```pseudocode
factorial(n) BEGIN
    resultado <- 1;
    FOR i <- 2 TO n DO BEGIN
        resultado <- resultado * i;
    END
    RETURN resultado;
END
```

#### AST (Abstract Syntax Tree)

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ProcDef",
      "name": "factorial",
      "params": [
        {
          "type": "Param",
          "name": "n",
          "pos": {
            "line": 1,
            "column": 10
          }
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
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "value": {
              "type": "Literal",
              "value": 1,
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "pos": {
              "line": 2,
              "column": 4
            }
          },
          {
            "type": "For",
            "var": "i",
            "start": {
              "type": "Literal",
              "value": 2,
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "end": {
              "type": "Identifier",
              "name": "n",
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "body": {
              "type": "Block",
              "body": [
                {
                  "type": "Assign",
                  "target": {
                    "type": "Identifier",
                    "name": "resultado",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "value": {
                    "type": "Binary",
                    "op": "*",
                    "left": {
                      "type": "Identifier",
                      "name": "resultado",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "right": {
                      "type": "Identifier",
                      "name": "i",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 4,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 3,
                "column": 23
              }
            },
            "pos": {
              "line": 3,
              "column": 4
            }
          },
          {
            "type": "Return",
            "value": {
              "type": "Identifier",
              "name": "resultado",
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "pos": {
              "line": 6,
              "column": 4
            }
          }
        ],
        "pos": {
          "line": 1,
          "column": 13
        }
      },
      "pos": {
        "line": 1,
        "column": 0
      }
    }
  ],
  "pos": {
    "line": 1,
    "column": 0
  }
}
```

#### Clasificación: `iterative`

#### Análisis de Complejidad

### Worst Case

**T_open**: `C_{1} + C_{2} \cdot n + C_{3} \cdot (n - 1) + C_{4} \cdot (n - 1) + C_{5}`

**T_polynomial**: `(C_{2} + C_{3} + C_{4}) \cdot n - (C_{3} + C_{4}) + (C_{1} + C_{5})`

**Notaciones Asintóticas:**
- **O**: `O(n)`
- **Ω**: `\Omega(n)`
- **Θ**: `\Theta(n)`

**Análisis por Línea:**

| Línea | Tipo | Costo (C_k) | Count | Count Raw | Nota |
|-------|------|-------------|-------|-----------|------|
| 2 | assign | C_{1} | 1 | 1 | - |
| 3 | for | C_{2} | n | n | Cabecera del bucle for i=2..n |
| 4 | assign | C_{3} + C_{4} | n - 1 | \sum_{i=2}^{n} 1 | - |
| 6 | return | C_{5} | 1 | 1 | - |

**Best Case**: Igual que Worst Case

**Average Case**: Igual que Worst Case

#### Tiempo de Ejecución

- Parse: 0.016s
- Clasificación: 0.016s
- Análisis: 0.403s
- **Total**: 0.434s

---

### 3. Suma de Array (ID: 6)

#### Pseudocódigo

```pseudocode
sumaArray(A[n], n) BEGIN
    suma <- 0;
    FOR i <- 1 TO n DO BEGIN
        suma <- suma + A[i];
    END
    RETURN suma;
END
```

#### AST (Abstract Syntax Tree)

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ProcDef",
      "name": "sumaArray",
      "params": [
        {
          "type": "ArrayParam",
          "name": "A",
          "start": {
            "type": "Identifier",
            "name": "n",
            "pos": {
              "line": 0,
              "column": 0
            }
          },
          "end": null,
          "pos": {
            "line": 1,
            "column": 10
          }
        },
        {
          "type": "Param",
          "name": "n",
          "pos": {
            "line": 1,
            "column": 16
          }
        }
      ],
      "body": {
        "type": "Block",
        "body": [
          {
            "type": "Assign",
            "target": {
              "type": "Identifier",
              "name": "suma",
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "value": {
              "type": "Literal",
              "value": 0,
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "pos": {
              "line": 2,
              "column": 4
            }
          },
          {
            "type": "For",
            "var": "i",
            "start": {
              "type": "Literal",
              "value": 1,
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "end": {
              "type": "Identifier",
              "name": "n",
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "body": {
              "type": "Block",
              "body": [
                {
                  "type": "Assign",
                  "target": {
                    "type": "Identifier",
                    "name": "suma",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "value": {
                    "type": "Binary",
                    "op": "+",
                    "left": {
                      "type": "Identifier",
                      "name": "suma",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "right": {
                      "type": "Index",
                      "target": {
                        "type": "Identifier",
                        "name": "A",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "pos": {
                        "line": 4,
                        "column": 24
                      },
                      "index": {
                        "type": "Identifier",
                        "name": "i",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      }
                    },
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 4,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 3,
                "column": 23
              }
            },
            "pos": {
              "line": 3,
              "column": 4
            }
          },
          {
            "type": "Return",
            "value": {
              "type": "Identifier",
              "name": "suma",
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "pos": {
              "line": 6,
              "column": 4
            }
          }
        ],
        "pos": {
          "line": 1,
          "column": 19
        }
      },
      "pos": {
        "line": 1,
        "column": 0
      }
    }
  ],
  "pos": {
    "line": 1,
    "column": 0
  }
}
```

#### Clasificación: `iterative`

#### Análisis de Complejidad

### Worst Case

**T_open**: `2 n + 3`

**T_polynomial**: `(C_{2} + C_{3} + C_{4} + C_{5}) \cdot n + (C_{1} + C_{2} + C_{6})`

**Notaciones Asintóticas:**
- **O**: `O(n)`
- **Ω**: `\Omega(n)`
- **Θ**: `\Theta(n)`

**Análisis por Línea:**

| Línea | Tipo | Costo (C_k) | Count | Count Raw | Nota |
|-------|------|-------------|-------|-----------|------|
| 2 | assign | C_{1} | 1 | 1 | - |
| 3 | for | C_{2} | n + 1 | n + 1 | Cabecera del bucle for i=1..n |
| 4 | assign | C_{3} + C_{4} + C_{5} | n | \sum_{i=1}^{n} 1 | - |
| 6 | return | C_{6} | 1 | 1 | - |

**Best Case**: Igual que Worst Case

**Average Case**: Igual que Worst Case

#### Tiempo de Ejecución

- Parse: 0.016s
- Clasificación: 0.014s
- Análisis: 0.266s
- **Total**: 0.296s

---

## Algoritmos Recursivos - Método Iterativo

### 1. Factorial Recursivo (ID: 14)

#### Pseudocódigo

```pseudocode
factorialRecursivo(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    ELSE BEGIN
        RETURN n * factorialRecursivo(n - 1);
    END
END
```

#### AST (Abstract Syntax Tree)

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ProcDef",
      "name": "factorialRecursivo",
      "params": [
        {
          "type": "Param",
          "name": "n",
          "pos": {
            "line": 1,
            "column": 19
          }
        }
      ],
      "body": {
        "type": "Block",
        "body": [
          {
            "type": "If",
            "test": {
              "type": "Binary",
              "op": "<=",
              "left": {
                "type": "Identifier",
                "name": "n",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "right": {
                "type": "Literal",
                "value": 1,
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "consequent": {
              "type": "Block",
              "body": [
                {
                  "type": "Return",
                  "value": {
                    "type": "Literal",
                    "value": 1,
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 3,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 2,
                "column": 21
              }
            },
            "alternate": {
              "type": "Block",
              "body": [
                {
                  "type": "Return",
                  "value": {
                    "type": "Binary",
                    "op": "*",
                    "left": {
                      "type": "Identifier",
                      "name": "n",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "right": {
                      "type": "Call",
                      "callee": "factorialRecursivo",
                      "args": [
                        {
                          "type": "Binary",
                          "op": "-",
                          "left": {
                            "type": "Identifier",
                            "name": "n",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "right": {
                            "type": "Literal",
                            "value": 1,
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        }
                      ],
                      "statement": false,
                      "pos": {
                        "line": 6,
                        "column": 19
                      }
                    },
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 6,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 5,
                "column": 9
              }
            },
            "pos": {
              "line": 2,
              "column": 4
            }
          }
        ],
        "pos": {
          "line": 1,
          "column": 22
        }
      },
      "pos": {
        "line": 1,
        "column": 0
      }
    }
  ],
  "pos": {
    "line": 1,
    "column": 0
  }
}
```

#### Clasificación: `recursive`

#### Métodos Aplicables

- **Métodos aplicables**: characteristic_equation, iteration
- **Método por defecto**: `characteristic_equation`

**Información de Recurrencia Detectada:**

- Forma: `T(n) = T(n-1) + g(n)`
- Tipo: `linear_shift`
- Orden: `1`

#### Análisis de Complejidad

### Worst Case

**T_open**: `\Theta(n)`

**Información de Recurrencia:**

- Método: `characteristic_equation`
- Forma: `T(n) = T(n-1) + g(n)`

**Ecuación Característica:**

```json
{
  "method": "characteristic_equation",
  "is_dp_linear": true,
  "equation": "r - 1 = 0",
  "roots": [
    {
      "root": "1",
      "multiplicity": 1
    }
  ],
  "dominant_root": "1",
  "growth_rate": 1.0,
  "solved_by": "characteristic_equation",
  "homogeneous_solution": "A \\cdot 1^n",
  "particular_solution": "A_2 \\cdot n",
  "general_solution": "A \\cdot 1^n + A_2 \\cdot n",
  "base_cases": {
    "T(1)": 1
  },
  "closed_form": "c_1 + c_2 \\cdot n",
  "dp_version": {
    "code": "FUNCIÓN dp_solve(n):\n    SI n <= 0 ENTONCES\n        RETORNAR caso_base[n]\n    \n    // Inicializar tabla DP\n    dp[0..n] = 0\n    \n    // Casos base\n    dp[0] = T0  // Caso base\n    \n    // Llenar tabla bottom-up\n    PARA i = 1 HASTA n HACER\n    dp[i] = dp[i-1]\n    FIN PARA\n    \n    RETORNAR dp[n]\nFIN FUNCIÓN",
    "time_complexity": "O(n)",
    "space_complexity": "O(n)",
    "recursive_complexity": "O(n)"
  },
  "dp_optimized_version": {
    "code": "FUNCIÓN dp_solve_optimized(n):\n    SI n <= 0 ENTONCES\n        RETORNAR caso_base[0]\n    \n    // Versión optimizada O(1) espacio\n    prev = caso_base[0]  // T(0)\n    \n    // Llenar bottom-up con solo variables auxiliares\n    PARA i = 1 HASTA n HACER\n        actual = 1 * prev + g(i)  // T(i) = 1T(i-1) + g(i)\n        prev = actual\n    FIN PARA\n    \n    RETORNAR prev\nFIN FUNCIÓN",
    "time_complexity": "O(n)",
    "space_complexity": "O(1)"
  },
  "dp_equivalence": "Las raíces de la ecuación característica corresponden a los valores propios de la transición lineal del sistema DP. La solución cerrada matemática equivale a la solución iterativa mediante programación dinámica.",
  "theta": "\\Theta(n)",
  "has_early_return": false
}
```

**Best Case**: Igual que Worst Case

**Average Case**: Igual que Worst Case

#### Tiempo de Ejecución

- Parse: 0.010s
- Clasificación: 0.012s
- Detección de métodos: 0.014s
- Análisis: 0.052s
- **Total**: 0.087s

---

### 2. Suma de Array Recursiva (ID: 28)

#### Pseudocódigo

```pseudocode
sumaArray(A[n], n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 0;
    END
    ELSE BEGIN
        RETURN A[n] + sumaArray(A, n - 1);
    END
END
```

#### AST (Abstract Syntax Tree)

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ProcDef",
      "name": "sumaArray",
      "params": [
        {
          "type": "ArrayParam",
          "name": "A",
          "start": {
            "type": "Identifier",
            "name": "n",
            "pos": {
              "line": 0,
              "column": 0
            }
          },
          "end": null,
          "pos": {
            "line": 1,
            "column": 10
          }
        },
        {
          "type": "Param",
          "name": "n",
          "pos": {
            "line": 1,
            "column": 16
          }
        }
      ],
      "body": {
        "type": "Block",
        "body": [
          {
            "type": "If",
            "test": {
              "type": "Binary",
              "op": "==",
              "left": {
                "type": "Identifier",
                "name": "n",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "right": {
                "type": "Literal",
                "value": 0,
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "consequent": {
              "type": "Block",
              "body": [
                {
                  "type": "Return",
                  "value": {
                    "type": "Literal",
                    "value": 0,
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 3,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 2,
                "column": 20
              }
            },
            "alternate": {
              "type": "Block",
              "body": [
                {
                  "type": "Return",
                  "value": {
                    "type": "Binary",
                    "op": "+",
                    "left": {
                      "type": "Index",
                      "target": {
                        "type": "Identifier",
                        "name": "A",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "pos": {
                        "line": 6,
                        "column": 16
                      },
                      "index": {
                        "type": "Identifier",
                        "name": "n",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      }
                    },
                    "right": {
                      "type": "Call",
                      "callee": "sumaArray",
                      "args": [
                        {
                          "type": "Identifier",
                          "name": "A",
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        },
                        {
                          "type": "Binary",
                          "op": "-",
                          "left": {
                            "type": "Identifier",
                            "name": "n",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "right": {
                            "type": "Literal",
                            "value": 1,
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        }
                      ],
                      "statement": false,
                      "pos": {
                        "line": 6,
                        "column": 22
                      }
                    },
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 6,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 5,
                "column": 9
              }
            },
            "pos": {
              "line": 2,
              "column": 4
            }
          }
        ],
        "pos": {
          "line": 1,
          "column": 19
        }
      },
      "pos": {
        "line": 1,
        "column": 0
      }
    }
  ],
  "pos": {
    "line": 1,
    "column": 0
  }
}
```

#### Clasificación: `recursive`

#### Métodos Aplicables

- **Métodos aplicables**: characteristic_equation, iteration
- **Método por defecto**: `characteristic_equation`

**Información de Recurrencia Detectada:**

- Forma: `T(n) = T(n-1) + g(n)`
- Tipo: `linear_shift`
- Orden: `1`

#### Análisis de Complejidad

### Worst Case

**T_open**: `\Theta(n)`

**Información de Recurrencia:**

- Método: `characteristic_equation`
- Forma: `T(n) = T(n-1) + g(n)`

**Ecuación Característica:**

```json
{
  "method": "characteristic_equation",
  "is_dp_linear": true,
  "equation": "r - 1 = 0",
  "roots": [
    {
      "root": "1",
      "multiplicity": 1
    }
  ],
  "dominant_root": "1",
  "growth_rate": 1.0,
  "solved_by": "characteristic_equation",
  "homogeneous_solution": "A \\cdot 1^n",
  "particular_solution": "A_2 \\cdot n",
  "general_solution": "A \\cdot 1^n + A_2 \\cdot n",
  "base_cases": {
    "T(1)": 0
  },
  "closed_form": "c_1 + c_2 \\cdot n",
  "dp_version": {
    "code": "FUNCIÓN dp_solve(n):\n    SI n <= 0 ENTONCES\n        RETORNAR caso_base[n]\n    \n    // Inicializar tabla DP\n    dp[0..n] = 0\n    \n    // Casos base\n    dp[0] = T0  // Caso base\n    \n    // Llenar tabla bottom-up\n    PARA i = 1 HASTA n HACER\n    dp[i] = dp[i-1]\n    FIN PARA\n    \n    RETORNAR dp[n]\nFIN FUNCIÓN",
    "time_complexity": "O(n)",
    "space_complexity": "O(n)",
    "recursive_complexity": "O(n)"
  },
  "dp_optimized_version": {
    "code": "FUNCIÓN dp_solve_optimized(n):\n    SI n <= 0 ENTONCES\n        RETORNAR caso_base[0]\n    \n    // Versión optimizada O(1) espacio\n    prev = caso_base[0]  // T(0)\n    \n    // Llenar bottom-up con solo variables auxiliares\n    PARA i = 1 HASTA n HACER\n        actual = 1 * prev + g(i)  // T(i) = 1T(i-1) + g(i)\n        prev = actual\n    FIN PARA\n    \n    RETORNAR prev\nFIN FUNCIÓN",
    "time_complexity": "O(n)",
    "space_complexity": "O(1)"
  },
  "dp_equivalence": "Las raíces de la ecuación característica corresponden a los valores propios de la transición lineal del sistema DP. La solución cerrada matemática equivale a la solución iterativa mediante programación dinámica.",
  "theta": "\\Theta(n)",
  "has_early_return": false
}
```

**Best Case**: Igual que Worst Case

**Average Case**: Igual que Worst Case

#### Tiempo de Ejecución

- Parse: 0.010s
- Clasificación: 0.013s
- Detección de métodos: 0.013s
- Análisis: 0.062s
- **Total**: 0.098s

---

### 3. Búsqueda en Lista Enlazada (ID: 29)

#### Pseudocódigo

```pseudocode
buscarLista(nodo, valor) BEGIN
    IF (nodo = null) THEN BEGIN
        RETURN false;
    END
    IF (nodo.valor = valor) THEN BEGIN
        RETURN true;
    END
    ELSE BEGIN
        RETURN buscarLista(nodo.siguiente, valor);
    END
END
```

#### AST (Abstract Syntax Tree)

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ProcDef",
      "name": "buscarLista",
      "params": [
        {
          "type": "Param",
          "name": "nodo",
          "pos": {
            "line": 1,
            "column": 12
          }
        },
        {
          "type": "Param",
          "name": "valor",
          "pos": {
            "line": 1,
            "column": 18
          }
        }
      ],
      "body": {
        "type": "Block",
        "body": [
          {
            "type": "If",
            "test": {
              "type": "Binary",
              "op": "==",
              "left": {
                "type": "Identifier",
                "name": "nodo",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "right": {
                "type": "Literal",
                "value": null,
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "consequent": {
              "type": "Block",
              "body": [
                {
                  "type": "Return",
                  "value": {
                    "type": "Identifier",
                    "name": "false",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 3,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 2,
                "column": 26
              }
            },
            "alternate": null,
            "pos": {
              "line": 2,
              "column": 4
            }
          },
          {
            "type": "If",
            "test": {
              "type": "Binary",
              "op": "==",
              "left": {
                "type": "Field",
                "target": {
                  "type": "Identifier",
                  "name": "nodo",
                  "pos": {
                    "line": 0,
                    "column": 0
                  }
                },
                "name": "valor",
                "pos": {
                  "line": 5,
                  "column": 12
                }
              },
              "right": {
                "type": "Identifier",
                "name": "valor",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "consequent": {
              "type": "Block",
              "body": [
                {
                  "type": "Return",
                  "value": {
                    "type": "Identifier",
                    "name": "true",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 6,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 5,
                "column": 33
              }
            },
            "alternate": {
              "type": "Block",
              "body": [
                {
                  "type": "Return",
                  "value": {
                    "type": "Call",
                    "callee": "buscarLista",
                    "args": [
                      {
                        "type": "Field",
                        "target": {
                          "type": "Identifier",
                          "name": "nodo",
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        },
                        "name": "siguiente",
                        "pos": {
                          "line": 9,
                          "column": 31
                        }
                      },
                      {
                        "type": "Identifier",
                        "name": "valor",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      }
                    ],
                    "statement": false,
                    "pos": {
                      "line": 9,
                      "column": 15
                    }
                  },
                  "pos": {
                    "line": 9,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 8,
                "column": 9
              }
            },
            "pos": {
              "line": 5,
              "column": 4
            }
          }
        ],
        "pos": {
          "line": 1,
          "column": 25
        }
      },
      "pos": {
        "line": 1,
        "column": 0
      }
    }
  ],
  "pos": {
    "line": 1,
    "column": 0
  }
}
```

#### Clasificación: `recursive`

#### Métodos Aplicables

- **Métodos aplicables**: characteristic_equation, iteration
- **Método por defecto**: `characteristic_equation`

**Información de Recurrencia Detectada:**

- Forma: `T(n) = T(n-1) + g(n)`
- Tipo: `linear_shift`
- Orden: `1`

#### Análisis de Complejidad

### Worst Case

**T_open**: `\Theta(n)`

**Información de Recurrencia:**

- Método: `characteristic_equation`
- Forma: `T(n) = T(n-1) + g(n)`

**Ecuación Característica:**

```json
{
  "method": "characteristic_equation",
  "is_dp_linear": true,
  "equation": "r - 1 = 0",
  "roots": [
    {
      "root": "1",
      "multiplicity": 1
    }
  ],
  "dominant_root": "1",
  "growth_rate": 1.0,
  "solved_by": "characteristic_equation",
  "homogeneous_solution": "A \\cdot 1^n",
  "particular_solution": "A_2 \\cdot n",
  "general_solution": "A \\cdot 1^n + A_2 \\cdot n",
  "base_cases": null,
  "closed_form": "c_1 + c_2 \\cdot n",
  "dp_version": {
    "code": "FUNCIÓN dp_solve(n):\n    SI n <= 0 ENTONCES\n        RETORNAR caso_base[n]\n    \n    // Inicializar tabla DP\n    dp[0..n] = 0\n    \n    // Casos base\n    dp[0] = T0  // Caso base\n    \n    // Llenar tabla bottom-up\n    PARA i = 1 HASTA n HACER\n    dp[i] = dp[i-1]\n    FIN PARA\n    \n    RETORNAR dp[n]\nFIN FUNCIÓN",
    "time_complexity": "O(n)",
    "space_complexity": "O(n)",
    "recursive_complexity": "O(n)"
  },
  "dp_optimized_version": {
    "code": "FUNCIÓN dp_solve_optimized(n):\n    SI n <= 0 ENTONCES\n        RETORNAR caso_base[0]\n    \n    // Versión optimizada O(1) espacio\n    prev = caso_base[0]  // T(0)\n    \n    // Llenar bottom-up con solo variables auxiliares\n    PARA i = 1 HASTA n HACER\n        actual = 1 * prev + g(i)  // T(i) = 1T(i-1) + g(i)\n        prev = actual\n    FIN PARA\n    \n    RETORNAR prev\nFIN FUNCIÓN",
    "time_complexity": "O(n)",
    "space_complexity": "O(1)"
  },
  "dp_equivalence": "Las raíces de la ecuación característica corresponden a los valores propios de la transición lineal del sistema DP. La solución cerrada matemática equivale a la solución iterativa mediante programación dinámica.",
  "theta": "\\Theta(n)",
  "has_early_return": true
}
```

### Best Case

**T_open**: `O(1)`

### Average Case

**T_open**: `\Theta(n)`

**Información de Recurrencia:**

- Método: `characteristic_equation`
- Forma: `T(n) = T(n-1) + g(n)`

**Ecuación Característica:**

```json
{
  "method": "characteristic_equation",
  "is_dp_linear": true,
  "equation": "r - 1 = 0",
  "roots": [
    {
      "root": "1",
      "multiplicity": 1
    }
  ],
  "dominant_root": "1",
  "growth_rate": 1.0,
  "solved_by": "characteristic_equation",
  "homogeneous_solution": "A \\cdot 1^n",
  "particular_solution": "A_2 \\cdot n",
  "general_solution": "A \\cdot 1^n + A_2 \\cdot n",
  "base_cases": null,
  "closed_form": "c_1 + c_2 \\cdot n",
  "dp_version": {
    "code": "FUNCIÓN dp_solve(n):\n    SI n <= 0 ENTONCES\n        RETORNAR caso_base[n]\n    \n    // Inicializar tabla DP\n    dp[0..n] = 0\n    \n    // Casos base\n    dp[0] = T0  // Caso base\n    \n    // Llenar tabla bottom-up\n    PARA i = 1 HASTA n HACER\n    dp[i] = dp[i-1]\n    FIN PARA\n    \n    RETORNAR dp[n]\nFIN FUNCIÓN",
    "time_complexity": "O(n)",
    "space_complexity": "O(n)",
    "recursive_complexity": "O(n)"
  },
  "dp_optimized_version": {
    "code": "FUNCIÓN dp_solve_optimized(n):\n    SI n <= 0 ENTONCES\n        RETORNAR caso_base[0]\n    \n    // Versión optimizada O(1) espacio\n    prev = caso_base[0]  // T(0)\n    \n    // Llenar bottom-up con solo variables auxiliares\n    PARA i = 1 HASTA n HACER\n        actual = 1 * prev + g(i)  // T(i) = 1T(i-1) + g(i)\n        prev = actual\n    FIN PARA\n    \n    RETORNAR prev\nFIN FUNCIÓN",
    "time_complexity": "O(n)",
    "space_complexity": "O(1)"
  },
  "dp_equivalence": "Las raíces de la ecuación característica corresponden a los valores propios de la transición lineal del sistema DP. La solución cerrada matemática equivale a la solución iterativa mediante programación dinámica.",
  "theta": "\\Theta(n)",
  "has_early_return": true
}
```

#### Tiempo de Ejecución

- Parse: 0.014s
- Clasificación: 0.012s
- Detección de métodos: 0.013s
- Análisis: 0.033s
- **Total**: 0.072s

---

## Algoritmos Recursivos - Teorema Maestro

### 1. Búsqueda Binaria Recursiva (ID: 15)

#### Pseudocódigo

```pseudocode
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

#### AST (Abstract Syntax Tree)

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ProcDef",
      "name": "busquedaBinaria",
      "params": [
        {
          "type": "ArrayParam",
          "name": "A",
          "start": {
            "type": "Identifier",
            "name": "n",
            "pos": {
              "line": 0,
              "column": 0
            }
          },
          "end": null,
          "pos": {
            "line": 1,
            "column": 16
          }
        },
        {
          "type": "Param",
          "name": "x",
          "pos": {
            "line": 1,
            "column": 22
          }
        },
        {
          "type": "Param",
          "name": "inicio",
          "pos": {
            "line": 1,
            "column": 25
          }
        },
        {
          "type": "Param",
          "name": "fin",
          "pos": {
            "line": 1,
            "column": 33
          }
        }
      ],
      "body": {
        "type": "Block",
        "body": [
          {
            "type": "If",
            "test": {
              "type": "Binary",
              "op": ">",
              "left": {
                "type": "Identifier",
                "name": "inicio",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "right": {
                "type": "Identifier",
                "name": "fin",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "consequent": {
              "type": "Block",
              "body": [
                {
                  "type": "Return",
                  "value": {
                    "type": "Unary",
                    "op": "-",
                    "arg": {
                      "type": "Literal",
                      "value": 1,
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 3,
                      "column": 15
                    }
                  },
                  "pos": {
                    "line": 3,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 2,
                "column": 27
              }
            },
            "alternate": null,
            "pos": {
              "line": 2,
              "column": 4
            }
          },
          {
            "type": "Assign",
            "target": {
              "type": "Identifier",
              "name": "mitad",
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "value": {
              "type": "Binary",
              "op": "/",
              "left": {
                "type": "Binary",
                "op": "+",
                "left": {
                  "type": "Identifier",
                  "name": "inicio",
                  "pos": {
                    "line": 0,
                    "column": 0
                  }
                },
                "right": {
                  "type": "Identifier",
                  "name": "fin",
                  "pos": {
                    "line": 0,
                    "column": 0
                  }
                },
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "right": {
                "type": "Literal",
                "value": 2,
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "pos": {
              "line": 5,
              "column": 4
            }
          },
          {
            "type": "If",
            "test": {
              "type": "Binary",
              "op": "==",
              "left": {
                "type": "Index",
                "target": {
                  "type": "Identifier",
                  "name": "A",
                  "pos": {
                    "line": 0,
                    "column": 0
                  }
                },
                "pos": {
                  "line": 6,
                  "column": 9
                },
                "index": {
                  "type": "Identifier",
                  "name": "mitad",
                  "pos": {
                    "line": 0,
                    "column": 0
                  }
                }
              },
              "right": {
                "type": "Identifier",
                "name": "x",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "consequent": {
              "type": "Block",
              "body": [
                {
                  "type": "Return",
                  "value": {
                    "type": "Identifier",
                    "name": "mitad",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 7,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 6,
                "column": 27
              }
            },
            "alternate": {
              "type": "Block",
              "body": [
                {
                  "type": "If",
                  "test": {
                    "type": "Binary",
                    "op": "<",
                    "left": {
                      "type": "Identifier",
                      "name": "x",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "right": {
                      "type": "Index",
                      "target": {
                        "type": "Identifier",
                        "name": "A",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "pos": {
                        "line": 10,
                        "column": 17
                      },
                      "index": {
                        "type": "Identifier",
                        "name": "mitad",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      }
                    },
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "consequent": {
                    "type": "Block",
                    "body": [
                      {
                        "type": "Return",
                        "value": {
                          "type": "Call",
                          "callee": "busquedaBinaria",
                          "args": [
                            {
                              "type": "Identifier",
                              "name": "A",
                              "pos": {
                                "line": 0,
                                "column": 0
                              }
                            },
                            {
                              "type": "Identifier",
                              "name": "x",
                              "pos": {
                                "line": 0,
                                "column": 0
                              }
                            },
                            {
                              "type": "Identifier",
                              "name": "inicio",
                              "pos": {
                                "line": 0,
                                "column": 0
                              }
                            },
                            {
                              "type": "Binary",
                              "op": "-",
                              "left": {
                                "type": "Identifier",
                                "name": "mitad",
                                "pos": {
                                  "line": 0,
                                  "column": 0
                                }
                              },
                              "right": {
                                "type": "Literal",
                                "value": 1,
                                "pos": {
                                  "line": 0,
                                  "column": 0
                                }
                              },
                              "pos": {
                                "line": 0,
                                "column": 0
                              }
                            }
                          ],
                          "statement": false,
                          "pos": {
                            "line": 11,
                            "column": 19
                          }
                        },
                        "pos": {
                          "line": 11,
                          "column": 12
                        }
                      }
                    ],
                    "pos": {
                      "line": 10,
                      "column": 31
                    }
                  },
                  "alternate": {
                    "type": "Block",
                    "body": [
                      {
                        "type": "Return",
                        "value": {
                          "type": "Call",
                          "callee": "busquedaBinaria",
                          "args": [
                            {
                              "type": "Identifier",
                              "name": "A",
                              "pos": {
                                "line": 0,
                                "column": 0
                              }
                            },
                            {
                              "type": "Identifier",
                              "name": "x",
                              "pos": {
                                "line": 0,
                                "column": 0
                              }
                            },
                            {
                              "type": "Binary",
                              "op": "+",
                              "left": {
                                "type": "Identifier",
                                "name": "mitad",
                                "pos": {
                                  "line": 0,
                                  "column": 0
                                }
                              },
                              "right": {
                                "type": "Literal",
                                "value": 1,
                                "pos": {
                                  "line": 0,
                                  "column": 0
                                }
                              },
                              "pos": {
                                "line": 0,
                                "column": 0
                              }
                            },
                            {
                              "type": "Identifier",
                              "name": "fin",
                              "pos": {
                                "line": 0,
                                "column": 0
                              }
                            }
                          ],
                          "statement": false,
                          "pos": {
                            "line": 14,
                            "column": 19
                          }
                        },
                        "pos": {
                          "line": 14,
                          "column": 12
                        }
                      }
                    ],
                    "pos": {
                      "line": 13,
                      "column": 13
                    }
                  },
                  "pos": {
                    "line": 10,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 9,
                "column": 9
              }
            },
            "pos": {
              "line": 6,
              "column": 4
            }
          }
        ],
        "pos": {
          "line": 1,
          "column": 38
        }
      },
      "pos": {
        "line": 1,
        "column": 0
      }
    }
  ],
  "pos": {
    "line": 1,
    "column": 0
  }
}
```

#### Clasificación: `recursive`

#### Métodos Aplicables

- **Métodos aplicables**: master
- **Método por defecto**: `master`

**Información de Recurrencia Detectada:**

- Forma: `T(n) = 1 \cdot T(n/2) + f(n)`
- Tipo: `divide_conquer`
- Orden: `N/A`

#### Análisis de Complejidad

### Worst Case

**T_open**: `\Theta(\log n)`

**Información de Recurrencia:**

- Método: `master`
- Forma: `T(n) = 1 \cdot T(n/2) + f(n)`

### Best Case

**T_open**: `O(1)`

### Average Case

**T_open**: `\Theta(\log n)`

**Información de Recurrencia:**

- Método: `master`
- Forma: `T(n) = 1 \cdot T(n/2) + f(n)`

#### Tiempo de Ejecución

- Parse: 0.020s
- Clasificación: 0.021s
- Detección de métodos: 0.018s
- Análisis: 0.022s
- **Total**: 0.080s

---

### 2. QuickSort (Caso Promedio) (ID: 25)

#### Pseudocódigo

```pseudocode
quicksort(A[n], inicio, fin) BEGIN
    IF (inicio < fin) THEN BEGIN
        pivote <- particionar(A, inicio, fin);
        CALL quicksort(A, inicio, pivote - 1);
        CALL quicksort(A, pivote + 1, fin);
    END
END

particionar(A[n], inicio, fin) BEGIN
    pivote <- A[fin];
    i <- inicio - 1;
    FOR j <- inicio TO fin - 1 DO BEGIN
        IF (A[j] <= pivote) THEN BEGIN
            i <- i + 1;
            temp <- A[i];
            A[i] <- A[j];
            A[j] <- temp;
        END
    END
    temp <- A[i + 1];
    A[i + 1] <- A[fin];
    A[fin] <- temp;
    RETURN i + 1;
END
```

#### AST (Abstract Syntax Tree)

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ProcDef",
      "name": "quicksort",
      "params": [
        {
          "type": "ArrayParam",
          "name": "A",
          "start": {
            "type": "Identifier",
            "name": "n",
            "pos": {
              "line": 0,
              "column": 0
            }
          },
          "end": null,
          "pos": {
            "line": 1,
            "column": 10
          }
        },
        {
          "type": "Param",
          "name": "inicio",
          "pos": {
            "line": 1,
            "column": 16
          }
        },
        {
          "type": "Param",
          "name": "fin",
          "pos": {
            "line": 1,
            "column": 24
          }
        }
      ],
      "body": {
        "type": "Block",
        "body": [
          {
            "type": "If",
            "test": {
              "type": "Binary",
              "op": "<",
              "left": {
                "type": "Identifier",
                "name": "inicio",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "right": {
                "type": "Identifier",
                "name": "fin",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "consequent": {
              "type": "Block",
              "body": [
                {
                  "type": "Assign",
                  "target": {
                    "type": "Identifier",
                    "name": "pivote",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "value": {
                    "type": "Call",
                    "callee": "particionar",
                    "args": [
                      {
                        "type": "Identifier",
                        "name": "A",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      {
                        "type": "Identifier",
                        "name": "inicio",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      {
                        "type": "Identifier",
                        "name": "fin",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      }
                    ],
                    "statement": false,
                    "pos": {
                      "line": 3,
                      "column": 18
                    }
                  },
                  "pos": {
                    "line": 3,
                    "column": 8
                  }
                },
                {
                  "type": "Call",
                  "callee": "quicksort",
                  "args": [
                    {
                      "type": "Identifier",
                      "name": "A",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    {
                      "type": "Identifier",
                      "name": "inicio",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    {
                      "type": "Binary",
                      "op": "-",
                      "left": {
                        "type": "Identifier",
                        "name": "pivote",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "right": {
                        "type": "Literal",
                        "value": 1,
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    }
                  ],
                  "statement": true,
                  "pos": {
                    "line": 4,
                    "column": 8
                  }
                },
                {
                  "type": "Call",
                  "callee": "quicksort",
                  "args": [
                    {
                      "type": "Identifier",
                      "name": "A",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    {
                      "type": "Binary",
                      "op": "+",
                      "left": {
                        "type": "Identifier",
                        "name": "pivote",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "right": {
                        "type": "Literal",
                        "value": 1,
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    {
                      "type": "Identifier",
                      "name": "fin",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    }
                  ],
                  "statement": true,
                  "pos": {
                    "line": 5,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 2,
                "column": 27
              }
            },
            "alternate": null,
            "pos": {
              "line": 2,
              "column": 4
            }
          }
        ],
        "pos": {
          "line": 1,
          "column": 29
        }
      },
      "pos": {
        "line": 1,
        "column": 0
      }
    },
    {
      "type": "ProcDef",
      "name": "particionar",
      "params": [
        {
          "type": "ArrayParam",
          "name": "A",
          "start": {
            "type": "Identifier",
            "name": "n",
            "pos": {
              "line": 0,
              "column": 0
            }
          },
          "end": null,
          "pos": {
            "line": 9,
            "column": 12
          }
        },
        {
          "type": "Param",
          "name": "inicio",
          "pos": {
            "line": 9,
            "column": 18
          }
        },
        {
          "type": "Param",
          "name": "fin",
          "pos": {
            "line": 9,
            "column": 26
          }
        }
      ],
      "body": {
        "type": "Block",
        "body": [
          {
            "type": "Assign",
            "target": {
              "type": "Identifier",
              "name": "pivote",
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "value": {
              "type": "Index",
              "target": {
                "type": "Identifier",
                "name": "A",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 10,
                "column": 15
              },
              "index": {
                "type": "Identifier",
                "name": "fin",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              }
            },
            "pos": {
              "line": 10,
              "column": 4
            }
          },
          {
            "type": "Assign",
            "target": {
              "type": "Identifier",
              "name": "i",
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "value": {
              "type": "Binary",
              "op": "-",
              "left": {
                "type": "Identifier",
                "name": "inicio",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "right": {
                "type": "Literal",
                "value": 1,
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "pos": {
              "line": 11,
              "column": 4
            }
          },
          {
            "type": "For",
            "var": "j",
            "start": {
              "type": "Identifier",
              "name": "inicio",
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "end": {
              "type": "Binary",
              "op": "-",
              "left": {
                "type": "Identifier",
                "name": "fin",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "right": {
                "type": "Literal",
                "value": 1,
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "body": {
              "type": "Block",
              "body": [
                {
                  "type": "If",
                  "test": {
                    "type": "Binary",
                    "op": "<=",
                    "left": {
                      "type": "Index",
                      "target": {
                        "type": "Identifier",
                        "name": "A",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "pos": {
                        "line": 13,
                        "column": 13
                      },
                      "index": {
                        "type": "Identifier",
                        "name": "j",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      }
                    },
                    "right": {
                      "type": "Identifier",
                      "name": "pivote",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "consequent": {
                    "type": "Block",
                    "body": [
                      {
                        "type": "Assign",
                        "target": {
                          "type": "Identifier",
                          "name": "i",
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        },
                        "value": {
                          "type": "Binary",
                          "op": "+",
                          "left": {
                            "type": "Identifier",
                            "name": "i",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "right": {
                            "type": "Literal",
                            "value": 1,
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        },
                        "pos": {
                          "line": 14,
                          "column": 12
                        }
                      },
                      {
                        "type": "Assign",
                        "target": {
                          "type": "Identifier",
                          "name": "temp",
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        },
                        "value": {
                          "type": "Index",
                          "target": {
                            "type": "Identifier",
                            "name": "A",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "pos": {
                            "line": 15,
                            "column": 21
                          },
                          "index": {
                            "type": "Identifier",
                            "name": "i",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          }
                        },
                        "pos": {
                          "line": 15,
                          "column": 12
                        }
                      },
                      {
                        "type": "Assign",
                        "target": {
                          "type": "Index",
                          "target": {
                            "type": "Identifier",
                            "name": "A",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "pos": {
                            "line": 16,
                            "column": 13
                          },
                          "index": {
                            "type": "Identifier",
                            "name": "i",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          }
                        },
                        "value": {
                          "type": "Index",
                          "target": {
                            "type": "Identifier",
                            "name": "A",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "pos": {
                            "line": 16,
                            "column": 21
                          },
                          "index": {
                            "type": "Identifier",
                            "name": "j",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          }
                        },
                        "pos": {
                          "line": 16,
                          "column": 12
                        }
                      },
                      {
                        "type": "Assign",
                        "target": {
                          "type": "Index",
                          "target": {
                            "type": "Identifier",
                            "name": "A",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "pos": {
                            "line": 17,
                            "column": 13
                          },
                          "index": {
                            "type": "Identifier",
                            "name": "j",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          }
                        },
                        "value": {
                          "type": "Identifier",
                          "name": "temp",
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        },
                        "pos": {
                          "line": 17,
                          "column": 12
                        }
                      }
                    ],
                    "pos": {
                      "line": 13,
                      "column": 33
                    }
                  },
                  "alternate": null,
                  "pos": {
                    "line": 13,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 12,
                "column": 34
              }
            },
            "pos": {
              "line": 12,
              "column": 4
            }
          },
          {
            "type": "Assign",
            "target": {
              "type": "Identifier",
              "name": "temp",
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "value": {
              "type": "Index",
              "target": {
                "type": "Identifier",
                "name": "A",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 20,
                "column": 13
              },
              "index": {
                "type": "Binary",
                "op": "+",
                "left": {
                  "type": "Identifier",
                  "name": "i",
                  "pos": {
                    "line": 0,
                    "column": 0
                  }
                },
                "right": {
                  "type": "Literal",
                  "value": 1,
                  "pos": {
                    "line": 0,
                    "column": 0
                  }
                },
                "pos": {
                  "line": 0,
                  "column": 0
                }
              }
            },
            "pos": {
              "line": 20,
              "column": 4
            }
          },
          {
            "type": "Assign",
            "target": {
              "type": "Index",
              "target": {
                "type": "Identifier",
                "name": "A",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 21,
                "column": 5
              },
              "index": {
                "type": "Binary",
                "op": "+",
                "left": {
                  "type": "Identifier",
                  "name": "i",
                  "pos": {
                    "line": 0,
                    "column": 0
                  }
                },
                "right": {
                  "type": "Literal",
                  "value": 1,
                  "pos": {
                    "line": 0,
                    "column": 0
                  }
                },
                "pos": {
                  "line": 0,
                  "column": 0
                }
              }
            },
            "value": {
              "type": "Index",
              "target": {
                "type": "Identifier",
                "name": "A",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 21,
                "column": 17
              },
              "index": {
                "type": "Identifier",
                "name": "fin",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              }
            },
            "pos": {
              "line": 21,
              "column": 4
            }
          },
          {
            "type": "Assign",
            "target": {
              "type": "Index",
              "target": {
                "type": "Identifier",
                "name": "A",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 22,
                "column": 5
              },
              "index": {
                "type": "Identifier",
                "name": "fin",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              }
            },
            "value": {
              "type": "Identifier",
              "name": "temp",
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "pos": {
              "line": 22,
              "column": 4
            }
          },
          {
            "type": "Return",
            "value": {
              "type": "Binary",
              "op": "+",
              "left": {
                "type": "Identifier",
                "name": "i",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "right": {
                "type": "Literal",
                "value": 1,
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "pos": {
              "line": 23,
              "column": 4
            }
          }
        ],
        "pos": {
          "line": 9,
          "column": 31
        }
      },
      "pos": {
        "line": 9,
        "column": 0
      }
    }
  ],
  "pos": {
    "line": 1,
    "column": 0
  }
}
```

#### Clasificación: `hybrid`

#### Métodos Aplicables

- **Métodos aplicables**: recursion_tree, master
- **Método por defecto**: `master`

**Información de Recurrencia Detectada:**

- Forma: `T(n) = 2 \cdot T(n/2) + f(n)`
- Tipo: `divide_conquer`
- Orden: `N/A`

#### Análisis de Complejidad

### Worst Case

**T_open**: `\Theta(n)`

**Información de Recurrencia:**

- Método: `master`
- Forma: `T(n) = 2 \cdot T(n/2) + f(n)`

### Best Case

**T_open**: `O(n)`

**Información de Recurrencia:**

- Método: `master`
- Forma: `T(n) = 2 \cdot T(n/2) + f(n)`

### Average Case

**T_open**: `\Theta(n)`

**Información de Recurrencia:**

- Método: `master`
- Forma: `T(n) = 2 \cdot T(n/2) + f(n)`

#### Tiempo de Ejecución

- Parse: 0.034s
- Clasificación: 0.036s
- Detección de métodos: 0.048s
- Análisis: 0.056s
- **Total**: 0.174s

---

### 3. Exponentiación Rápida Recursiva (ID: 27)

#### Pseudocódigo

```pseudocode
exponenciacionRapida(x, n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 1;
    END
    resultado <- exponenciacionRapida(x, n DIV 2);
    resultado <- resultado * resultado;
    IF (n MOD 2 = 1) THEN BEGIN
        resultado <- resultado * x;
    END
    RETURN resultado;
END
```

#### AST (Abstract Syntax Tree)

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ProcDef",
      "name": "exponenciacionRapida",
      "params": [
        {
          "type": "Param",
          "name": "x",
          "pos": {
            "line": 1,
            "column": 21
          }
        },
        {
          "type": "Param",
          "name": "n",
          "pos": {
            "line": 1,
            "column": 24
          }
        }
      ],
      "body": {
        "type": "Block",
        "body": [
          {
            "type": "If",
            "test": {
              "type": "Binary",
              "op": "==",
              "left": {
                "type": "Identifier",
                "name": "n",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "right": {
                "type": "Literal",
                "value": 0,
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "consequent": {
              "type": "Block",
              "body": [
                {
                  "type": "Return",
                  "value": {
                    "type": "Literal",
                    "value": 1,
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 3,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 2,
                "column": 20
              }
            },
            "alternate": null,
            "pos": {
              "line": 2,
              "column": 4
            }
          },
          {
            "type": "Assign",
            "target": {
              "type": "Identifier",
              "name": "resultado",
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "value": {
              "type": "Call",
              "callee": "exponenciacionRapida",
              "args": [
                {
                  "type": "Identifier",
                  "name": "x",
                  "pos": {
                    "line": 0,
                    "column": 0
                  }
                },
                {
                  "type": "Binary",
                  "op": "div",
                  "left": {
                    "type": "Identifier",
                    "name": "n",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "right": {
                    "type": "Literal",
                    "value": 2,
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 0,
                    "column": 0
                  }
                }
              ],
              "statement": false,
              "pos": {
                "line": 5,
                "column": 17
              }
            },
            "pos": {
              "line": 5,
              "column": 4
            }
          },
          {
            "type": "Assign",
            "target": {
              "type": "Identifier",
              "name": "resultado",
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "value": {
              "type": "Binary",
              "op": "*",
              "left": {
                "type": "Identifier",
                "name": "resultado",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "right": {
                "type": "Identifier",
                "name": "resultado",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "pos": {
              "line": 6,
              "column": 4
            }
          },
          {
            "type": "If",
            "test": {
              "type": "Binary",
              "op": "==",
              "left": {
                "type": "Binary",
                "op": "mod",
                "left": {
                  "type": "Identifier",
                  "name": "n",
                  "pos": {
                    "line": 0,
                    "column": 0
                  }
                },
                "right": {
                  "type": "Literal",
                  "value": 2,
                  "pos": {
                    "line": 0,
                    "column": 0
                  }
                },
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "right": {
                "type": "Literal",
                "value": 1,
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "consequent": {
              "type": "Block",
              "body": [
                {
                  "type": "Assign",
                  "target": {
                    "type": "Identifier",
                    "name": "resultado",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "value": {
                    "type": "Binary",
                    "op": "*",
                    "left": {
                      "type": "Identifier",
                      "name": "resultado",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "right": {
                      "type": "Identifier",
                      "name": "x",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 8,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 7,
                "column": 26
              }
            },
            "alternate": null,
            "pos": {
              "line": 7,
              "column": 4
            }
          },
          {
            "type": "Return",
            "value": {
              "type": "Identifier",
              "name": "resultado",
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "pos": {
              "line": 10,
              "column": 4
            }
          }
        ],
        "pos": {
          "line": 1,
          "column": 27
        }
      },
      "pos": {
        "line": 1,
        "column": 0
      }
    }
  ],
  "pos": {
    "line": 1,
    "column": 0
  }
}
```

#### Clasificación: `recursive`

#### Métodos Aplicables

- **Métodos aplicables**: master
- **Método por defecto**: `master`

**Información de Recurrencia Detectada:**

- Forma: `T(n) = 1 \cdot T(n/2) + f(n)`
- Tipo: `divide_conquer`
- Orden: `N/A`

#### Análisis de Complejidad

### Worst Case

**T_open**: `\Theta(\log n)`

**Información de Recurrencia:**

- Método: `master`
- Forma: `T(n) = 1 \cdot T(n/2) + f(n)`

### Best Case

**T_open**: `O(1)`

### Average Case

**T_open**: `\Theta(\log n)`

**Información de Recurrencia:**

- Método: `master`
- Forma: `T(n) = 1 \cdot T(n/2) + f(n)`

#### Tiempo de Ejecución

- Parse: 0.015s
- Clasificación: 0.017s
- Detección de métodos: 0.017s
- Análisis: 0.027s
- **Total**: 0.076s

---

## Algoritmos Recursivos - Árbol de Recursión

### 1. MergeSort (Ordenamiento por Mezcla) (ID: 16)

#### Pseudocódigo

```pseudocode
mergeSort(A[n], inicio, fin) BEGIN
    IF (inicio < fin) THEN BEGIN
        medio <- (inicio + fin) / 2;
        CALL mergeSort(A, inicio, medio);
        CALL mergeSort(A, medio + 1, fin);
        CALL mezclar(A, inicio, medio, fin);
    END
END

mezclar(A[n], inicio, medio, fin) BEGIN
    i <- inicio;
    j <- medio + 1;
    k <- 1;
    WHILE (i <= medio AND j <= fin) DO BEGIN
        IF (A[i] <= A[j]) THEN BEGIN
            temp[k] <- A[i];
            i <- i + 1;
        END
        ELSE BEGIN
            temp[k] <- A[j];
            j <- j + 1;
        END
        k <- k + 1;
    END
    WHILE (i <= medio) DO BEGIN
        temp[k] <- A[i];
        i <- i + 1;
        k <- k + 1;
    END
    WHILE (j <= fin) DO BEGIN
        temp[k] <- A[j];
        j <- j + 1;
        k <- k + 1;
    END
    FOR i <- 1 TO k - 1 DO BEGIN
        A[inicio + i - 1] <- temp[i];
    END
END
```

#### AST (Abstract Syntax Tree)

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ProcDef",
      "name": "mergeSort",
      "params": [
        {
          "type": "ArrayParam",
          "name": "A",
          "start": {
            "type": "Identifier",
            "name": "n",
            "pos": {
              "line": 0,
              "column": 0
            }
          },
          "end": null,
          "pos": {
            "line": 1,
            "column": 10
          }
        },
        {
          "type": "Param",
          "name": "inicio",
          "pos": {
            "line": 1,
            "column": 16
          }
        },
        {
          "type": "Param",
          "name": "fin",
          "pos": {
            "line": 1,
            "column": 24
          }
        }
      ],
      "body": {
        "type": "Block",
        "body": [
          {
            "type": "If",
            "test": {
              "type": "Binary",
              "op": "<",
              "left": {
                "type": "Identifier",
                "name": "inicio",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "right": {
                "type": "Identifier",
                "name": "fin",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "consequent": {
              "type": "Block",
              "body": [
                {
                  "type": "Assign",
                  "target": {
                    "type": "Identifier",
                    "name": "medio",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "value": {
                    "type": "Binary",
                    "op": "/",
                    "left": {
                      "type": "Binary",
                      "op": "+",
                      "left": {
                        "type": "Identifier",
                        "name": "inicio",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "right": {
                        "type": "Identifier",
                        "name": "fin",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "right": {
                      "type": "Literal",
                      "value": 2,
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 3,
                    "column": 8
                  }
                },
                {
                  "type": "Call",
                  "callee": "mergeSort",
                  "args": [
                    {
                      "type": "Identifier",
                      "name": "A",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    {
                      "type": "Identifier",
                      "name": "inicio",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    {
                      "type": "Identifier",
                      "name": "medio",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    }
                  ],
                  "statement": true,
                  "pos": {
                    "line": 4,
                    "column": 8
                  }
                },
                {
                  "type": "Call",
                  "callee": "mergeSort",
                  "args": [
                    {
                      "type": "Identifier",
                      "name": "A",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    {
                      "type": "Binary",
                      "op": "+",
                      "left": {
                        "type": "Identifier",
                        "name": "medio",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "right": {
                        "type": "Literal",
                        "value": 1,
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    {
                      "type": "Identifier",
                      "name": "fin",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    }
                  ],
                  "statement": true,
                  "pos": {
                    "line": 5,
                    "column": 8
                  }
                },
                {
                  "type": "Call",
                  "callee": "mezclar",
                  "args": [
                    {
                      "type": "Identifier",
                      "name": "A",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    {
                      "type": "Identifier",
                      "name": "inicio",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    {
                      "type": "Identifier",
                      "name": "medio",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    {
                      "type": "Identifier",
                      "name": "fin",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    }
                  ],
                  "statement": true,
                  "pos": {
                    "line": 6,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 2,
                "column": 27
              }
            },
            "alternate": null,
            "pos": {
              "line": 2,
              "column": 4
            }
          }
        ],
        "pos": {
          "line": 1,
          "column": 29
        }
      },
      "pos": {
        "line": 1,
        "column": 0
      }
    },
    {
      "type": "ProcDef",
      "name": "mezclar",
      "params": [
        {
          "type": "ArrayParam",
          "name": "A",
          "start": {
            "type": "Identifier",
            "name": "n",
            "pos": {
              "line": 0,
              "column": 0
            }
          },
          "end": null,
          "pos": {
            "line": 10,
            "column": 8
          }
        },
        {
          "type": "Param",
          "name": "inicio",
          "pos": {
            "line": 10,
            "column": 14
          }
        },
        {
          "type": "Param",
          "name": "medio",
          "pos": {
            "line": 10,
            "column": 22
          }
        },
        {
          "type": "Param",
          "name": "fin",
          "pos": {
            "line": 10,
            "column": 29
          }
        }
      ],
      "body": {
        "type": "Block",
        "body": [
          {
            "type": "Assign",
            "target": {
              "type": "Identifier",
              "name": "i",
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "value": {
              "type": "Identifier",
              "name": "inicio",
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "pos": {
              "line": 11,
              "column": 4
            }
          },
          {
            "type": "Assign",
            "target": {
              "type": "Identifier",
              "name": "j",
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "value": {
              "type": "Binary",
              "op": "+",
              "left": {
                "type": "Identifier",
                "name": "medio",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "right": {
                "type": "Literal",
                "value": 1,
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "pos": {
              "line": 12,
              "column": 4
            }
          },
          {
            "type": "Assign",
            "target": {
              "type": "Identifier",
              "name": "k",
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "value": {
              "type": "Literal",
              "value": 1,
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "pos": {
              "line": 13,
              "column": 4
            }
          },
          {
            "type": "While",
            "test": {
              "type": "Binary",
              "op": "and",
              "left": {
                "type": "Binary",
                "op": "<=",
                "left": {
                  "type": "Identifier",
                  "name": "i",
                  "pos": {
                    "line": 0,
                    "column": 0
                  }
                },
                "right": {
                  "type": "Identifier",
                  "name": "medio",
                  "pos": {
                    "line": 0,
                    "column": 0
                  }
                },
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "right": {
                "type": "Binary",
                "op": "<=",
                "left": {
                  "type": "Identifier",
                  "name": "j",
                  "pos": {
                    "line": 0,
                    "column": 0
                  }
                },
                "right": {
                  "type": "Identifier",
                  "name": "fin",
                  "pos": {
                    "line": 0,
                    "column": 0
                  }
                },
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "body": {
              "type": "Block",
              "body": [
                {
                  "type": "If",
                  "test": {
                    "type": "Binary",
                    "op": "<=",
                    "left": {
                      "type": "Index",
                      "target": {
                        "type": "Identifier",
                        "name": "A",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "pos": {
                        "line": 15,
                        "column": 13
                      },
                      "index": {
                        "type": "Identifier",
                        "name": "i",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      }
                    },
                    "right": {
                      "type": "Index",
                      "target": {
                        "type": "Identifier",
                        "name": "A",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "pos": {
                        "line": 15,
                        "column": 21
                      },
                      "index": {
                        "type": "Identifier",
                        "name": "j",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      }
                    },
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "consequent": {
                    "type": "Block",
                    "body": [
                      {
                        "type": "Assign",
                        "target": {
                          "type": "Index",
                          "target": {
                            "type": "Identifier",
                            "name": "temp",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "pos": {
                            "line": 16,
                            "column": 16
                          },
                          "index": {
                            "type": "Identifier",
                            "name": "k",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          }
                        },
                        "value": {
                          "type": "Index",
                          "target": {
                            "type": "Identifier",
                            "name": "A",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "pos": {
                            "line": 16,
                            "column": 24
                          },
                          "index": {
                            "type": "Identifier",
                            "name": "i",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          }
                        },
                        "pos": {
                          "line": 16,
                          "column": 12
                        }
                      },
                      {
                        "type": "Assign",
                        "target": {
                          "type": "Identifier",
                          "name": "i",
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        },
                        "value": {
                          "type": "Binary",
                          "op": "+",
                          "left": {
                            "type": "Identifier",
                            "name": "i",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "right": {
                            "type": "Literal",
                            "value": 1,
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        },
                        "pos": {
                          "line": 17,
                          "column": 12
                        }
                      }
                    ],
                    "pos": {
                      "line": 15,
                      "column": 31
                    }
                  },
                  "alternate": {
                    "type": "Block",
                    "body": [
                      {
                        "type": "Assign",
                        "target": {
                          "type": "Index",
                          "target": {
                            "type": "Identifier",
                            "name": "temp",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "pos": {
                            "line": 20,
                            "column": 16
                          },
                          "index": {
                            "type": "Identifier",
                            "name": "k",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          }
                        },
                        "value": {
                          "type": "Index",
                          "target": {
                            "type": "Identifier",
                            "name": "A",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "pos": {
                            "line": 20,
                            "column": 24
                          },
                          "index": {
                            "type": "Identifier",
                            "name": "j",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          }
                        },
                        "pos": {
                          "line": 20,
                          "column": 12
                        }
                      },
                      {
                        "type": "Assign",
                        "target": {
                          "type": "Identifier",
                          "name": "j",
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        },
                        "value": {
                          "type": "Binary",
                          "op": "+",
                          "left": {
                            "type": "Identifier",
                            "name": "j",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "right": {
                            "type": "Literal",
                            "value": 1,
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        },
                        "pos": {
                          "line": 21,
                          "column": 12
                        }
                      }
                    ],
                    "pos": {
                      "line": 19,
                      "column": 13
                    }
                  },
                  "pos": {
                    "line": 15,
                    "column": 8
                  }
                },
                {
                  "type": "Assign",
                  "target": {
                    "type": "Identifier",
                    "name": "k",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "value": {
                    "type": "Binary",
                    "op": "+",
                    "left": {
                      "type": "Identifier",
                      "name": "k",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "right": {
                      "type": "Literal",
                      "value": 1,
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 23,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 14,
                "column": 39
              }
            },
            "pos": {
              "line": 14,
              "column": 4
            }
          },
          {
            "type": "While",
            "test": {
              "type": "Binary",
              "op": "<=",
              "left": {
                "type": "Identifier",
                "name": "i",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "right": {
                "type": "Identifier",
                "name": "medio",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "body": {
              "type": "Block",
              "body": [
                {
                  "type": "Assign",
                  "target": {
                    "type": "Index",
                    "target": {
                      "type": "Identifier",
                      "name": "temp",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 26,
                      "column": 12
                    },
                    "index": {
                      "type": "Identifier",
                      "name": "k",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    }
                  },
                  "value": {
                    "type": "Index",
                    "target": {
                      "type": "Identifier",
                      "name": "A",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 26,
                      "column": 20
                    },
                    "index": {
                      "type": "Identifier",
                      "name": "i",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    }
                  },
                  "pos": {
                    "line": 26,
                    "column": 8
                  }
                },
                {
                  "type": "Assign",
                  "target": {
                    "type": "Identifier",
                    "name": "i",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "value": {
                    "type": "Binary",
                    "op": "+",
                    "left": {
                      "type": "Identifier",
                      "name": "i",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "right": {
                      "type": "Literal",
                      "value": 1,
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 27,
                    "column": 8
                  }
                },
                {
                  "type": "Assign",
                  "target": {
                    "type": "Identifier",
                    "name": "k",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "value": {
                    "type": "Binary",
                    "op": "+",
                    "left": {
                      "type": "Identifier",
                      "name": "k",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "right": {
                      "type": "Literal",
                      "value": 1,
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 28,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 25,
                "column": 26
              }
            },
            "pos": {
              "line": 25,
              "column": 4
            }
          },
          {
            "type": "While",
            "test": {
              "type": "Binary",
              "op": "<=",
              "left": {
                "type": "Identifier",
                "name": "j",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "right": {
                "type": "Identifier",
                "name": "fin",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "body": {
              "type": "Block",
              "body": [
                {
                  "type": "Assign",
                  "target": {
                    "type": "Index",
                    "target": {
                      "type": "Identifier",
                      "name": "temp",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 31,
                      "column": 12
                    },
                    "index": {
                      "type": "Identifier",
                      "name": "k",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    }
                  },
                  "value": {
                    "type": "Index",
                    "target": {
                      "type": "Identifier",
                      "name": "A",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 31,
                      "column": 20
                    },
                    "index": {
                      "type": "Identifier",
                      "name": "j",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    }
                  },
                  "pos": {
                    "line": 31,
                    "column": 8
                  }
                },
                {
                  "type": "Assign",
                  "target": {
                    "type": "Identifier",
                    "name": "j",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "value": {
                    "type": "Binary",
                    "op": "+",
                    "left": {
                      "type": "Identifier",
                      "name": "j",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "right": {
                      "type": "Literal",
                      "value": 1,
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 32,
                    "column": 8
                  }
                },
                {
                  "type": "Assign",
                  "target": {
                    "type": "Identifier",
                    "name": "k",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "value": {
                    "type": "Binary",
                    "op": "+",
                    "left": {
                      "type": "Identifier",
                      "name": "k",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "right": {
                      "type": "Literal",
                      "value": 1,
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 33,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 30,
                "column": 24
              }
            },
            "pos": {
              "line": 30,
              "column": 4
            }
          },
          {
            "type": "For",
            "var": "i",
            "start": {
              "type": "Literal",
              "value": 1,
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "end": {
              "type": "Binary",
              "op": "-",
              "left": {
                "type": "Identifier",
                "name": "k",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "right": {
                "type": "Literal",
                "value": 1,
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "body": {
              "type": "Block",
              "body": [
                {
                  "type": "Assign",
                  "target": {
                    "type": "Index",
                    "target": {
                      "type": "Identifier",
                      "name": "A",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 36,
                      "column": 9
                    },
                    "index": {
                      "type": "Binary",
                      "op": "-",
                      "left": {
                        "type": "Binary",
                        "op": "+",
                        "left": {
                          "type": "Identifier",
                          "name": "inicio",
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        },
                        "right": {
                          "type": "Identifier",
                          "name": "i",
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        },
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "right": {
                        "type": "Literal",
                        "value": 1,
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    }
                  },
                  "value": {
                    "type": "Index",
                    "target": {
                      "type": "Identifier",
                      "name": "temp",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 36,
                      "column": 33
                    },
                    "index": {
                      "type": "Identifier",
                      "name": "i",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    }
                  },
                  "pos": {
                    "line": 36,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 35,
                "column": 27
              }
            },
            "pos": {
              "line": 35,
              "column": 4
            }
          }
        ],
        "pos": {
          "line": 10,
          "column": 34
        }
      },
      "pos": {
        "line": 10,
        "column": 0
      }
    }
  ],
  "pos": {
    "line": 1,
    "column": 0
  }
}
```

#### Clasificación: `hybrid`

#### Métodos Aplicables

- **Métodos aplicables**: recursion_tree, master
- **Método por defecto**: `master`

**Información de Recurrencia Detectada:**

- Forma: `T(n) = 2 \cdot T(n/2) + f(n)`
- Tipo: `divide_conquer`
- Orden: `N/A`

#### Análisis de Complejidad

### Worst Case

**T_open**: `\Theta(n \log n)`

**Información de Recurrencia:**

- Método: `master`
- Forma: `T(n) = 2 \cdot T(n/2) + f(n)`

### Best Case

**T_open**: `O(n \log n)`

**Información de Recurrencia:**

- Método: `master`
- Forma: `T(n) = 2 \cdot T(n/2) + f(n)`

### Average Case

**T_open**: `\Theta(n \log n)`

**Información de Recurrencia:**

- Método: `master`
- Forma: `T(n) = 2 \cdot T(n/2) + f(n)`

#### Tiempo de Ejecución

- Parse: 0.045s
- Clasificación: 0.036s
- Detección de métodos: 0.050s
- Análisis: 0.049s
- **Total**: 0.179s

---

### 2. Algoritmo Divide Desigual (ID: 17)

#### Pseudocódigo

```pseudocode
algoritmoDivideDesigual(arreglo, inicio, fin) BEGIN
    IF (fin - inicio <= 1) THEN BEGIN
        RETURN arreglo[inicio];
    END
    ELSE BEGIN
        medio1 <- inicio + (fin - inicio) DIV 3;
        medio2 <- inicio + 2 * (fin - inicio) DIV 3;
        resultado1 <- algoritmoDivideDesigual(arreglo, inicio, medio1);
        resultado2 <- algoritmoDivideDesigual(arreglo, medio1, medio2);
        resultado3 <- algoritmoDivideDesigual(arreglo, medio2, fin);
        RETURN resultado1 + resultado2 + resultado3;
    END
END
```

#### AST (Abstract Syntax Tree)

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ProcDef",
      "name": "algoritmoDivideDesigual",
      "params": [
        {
          "type": "Param",
          "name": "arreglo",
          "pos": {
            "line": 1,
            "column": 24
          }
        },
        {
          "type": "Param",
          "name": "inicio",
          "pos": {
            "line": 1,
            "column": 33
          }
        },
        {
          "type": "Param",
          "name": "fin",
          "pos": {
            "line": 1,
            "column": 41
          }
        }
      ],
      "body": {
        "type": "Block",
        "body": [
          {
            "type": "If",
            "test": {
              "type": "Binary",
              "op": "<=",
              "left": {
                "type": "Binary",
                "op": "-",
                "left": {
                  "type": "Identifier",
                  "name": "fin",
                  "pos": {
                    "line": 0,
                    "column": 0
                  }
                },
                "right": {
                  "type": "Identifier",
                  "name": "inicio",
                  "pos": {
                    "line": 0,
                    "column": 0
                  }
                },
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "right": {
                "type": "Literal",
                "value": 1,
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "consequent": {
              "type": "Block",
              "body": [
                {
                  "type": "Return",
                  "value": {
                    "type": "Index",
                    "target": {
                      "type": "Identifier",
                      "name": "arreglo",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 3,
                      "column": 22
                    },
                    "index": {
                      "type": "Identifier",
                      "name": "inicio",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    }
                  },
                  "pos": {
                    "line": 3,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 2,
                "column": 32
              }
            },
            "alternate": {
              "type": "Block",
              "body": [
                {
                  "type": "Assign",
                  "target": {
                    "type": "Identifier",
                    "name": "medio1",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "value": {
                    "type": "Binary",
                    "op": "+",
                    "left": {
                      "type": "Identifier",
                      "name": "inicio",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "right": {
                      "type": "Binary",
                      "op": "div",
                      "left": {
                        "type": "Binary",
                        "op": "-",
                        "left": {
                          "type": "Identifier",
                          "name": "fin",
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        },
                        "right": {
                          "type": "Identifier",
                          "name": "inicio",
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        },
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "right": {
                        "type": "Literal",
                        "value": 3,
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 6,
                    "column": 8
                  }
                },
                {
                  "type": "Assign",
                  "target": {
                    "type": "Identifier",
                    "name": "medio2",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "value": {
                    "type": "Binary",
                    "op": "+",
                    "left": {
                      "type": "Identifier",
                      "name": "inicio",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "right": {
                      "type": "Binary",
                      "op": "div",
                      "left": {
                        "type": "Binary",
                        "op": "*",
                        "left": {
                          "type": "Literal",
                          "value": 2,
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        },
                        "right": {
                          "type": "Binary",
                          "op": "-",
                          "left": {
                            "type": "Identifier",
                            "name": "fin",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "right": {
                            "type": "Identifier",
                            "name": "inicio",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        },
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "right": {
                        "type": "Literal",
                        "value": 3,
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 7,
                    "column": 8
                  }
                },
                {
                  "type": "Assign",
                  "target": {
                    "type": "Identifier",
                    "name": "resultado1",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "value": {
                    "type": "Call",
                    "callee": "algoritmoDivideDesigual",
                    "args": [
                      {
                        "type": "Identifier",
                        "name": "arreglo",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      {
                        "type": "Identifier",
                        "name": "inicio",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      {
                        "type": "Identifier",
                        "name": "medio1",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      }
                    ],
                    "statement": false,
                    "pos": {
                      "line": 8,
                      "column": 22
                    }
                  },
                  "pos": {
                    "line": 8,
                    "column": 8
                  }
                },
                {
                  "type": "Assign",
                  "target": {
                    "type": "Identifier",
                    "name": "resultado2",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "value": {
                    "type": "Call",
                    "callee": "algoritmoDivideDesigual",
                    "args": [
                      {
                        "type": "Identifier",
                        "name": "arreglo",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      {
                        "type": "Identifier",
                        "name": "medio1",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      {
                        "type": "Identifier",
                        "name": "medio2",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      }
                    ],
                    "statement": false,
                    "pos": {
                      "line": 9,
                      "column": 22
                    }
                  },
                  "pos": {
                    "line": 9,
                    "column": 8
                  }
                },
                {
                  "type": "Assign",
                  "target": {
                    "type": "Identifier",
                    "name": "resultado3",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "value": {
                    "type": "Call",
                    "callee": "algoritmoDivideDesigual",
                    "args": [
                      {
                        "type": "Identifier",
                        "name": "arreglo",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      {
                        "type": "Identifier",
                        "name": "medio2",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      {
                        "type": "Identifier",
                        "name": "fin",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      }
                    ],
                    "statement": false,
                    "pos": {
                      "line": 10,
                      "column": 22
                    }
                  },
                  "pos": {
                    "line": 10,
                    "column": 8
                  }
                },
                {
                  "type": "Return",
                  "value": {
                    "type": "Binary",
                    "op": "+",
                    "left": {
                      "type": "Binary",
                      "op": "+",
                      "left": {
                        "type": "Identifier",
                        "name": "resultado1",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "right": {
                        "type": "Identifier",
                        "name": "resultado2",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "right": {
                      "type": "Identifier",
                      "name": "resultado3",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 11,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 5,
                "column": 9
              }
            },
            "pos": {
              "line": 2,
              "column": 4
            }
          }
        ],
        "pos": {
          "line": 1,
          "column": 46
        }
      },
      "pos": {
        "line": 1,
        "column": 0
      }
    }
  ],
  "pos": {
    "line": 1,
    "column": 0
  }
}
```

#### Clasificación: `recursive`

#### Métodos Aplicables

- **Métodos aplicables**: recursion_tree, master
- **Método por defecto**: `master`

**Información de Recurrencia Detectada:**

- Forma: `T(n) = 3 \cdot T(n/3) + f(n)`
- Tipo: `divide_conquer`
- Orden: `N/A`

#### Análisis de Complejidad

### Worst Case

**T_open**: `\Theta(n)`

**Información de Recurrencia:**

- Método: `master`
- Forma: `T(n) = 3 \cdot T(n/3) + f(n)`

### Best Case

**T_open**: `O(n)`

**Información de Recurrencia:**

- Método: `master`
- Forma: `T(n) = 3 \cdot T(n/3) + f(n)`

### Average Case

**T_open**: `\Theta(n)`

**Información de Recurrencia:**

- Método: `master`
- Forma: `T(n) = 3 \cdot T(n/3) + f(n)`

#### Tiempo de Ejecución

- Parse: 0.023s
- Clasificación: 0.020s
- Detección de métodos: 0.021s
- Análisis: 0.056s
- **Total**: 0.119s

---

### 3. QuickSort (Ordenamiento Rápido) (ID: 19)

#### Pseudocódigo

```pseudocode
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

#### AST (Abstract Syntax Tree)

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ProcDef",
      "name": "quicksort",
      "params": [
        {
          "type": "ArrayParam",
          "name": "A",
          "start": {
            "type": "Identifier",
            "name": "n",
            "pos": {
              "line": 0,
              "column": 0
            }
          },
          "end": null,
          "pos": {
            "line": 1,
            "column": 10
          }
        },
        {
          "type": "Param",
          "name": "izq",
          "pos": {
            "line": 1,
            "column": 16
          }
        },
        {
          "type": "Param",
          "name": "der",
          "pos": {
            "line": 1,
            "column": 21
          }
        }
      ],
      "body": {
        "type": "Block",
        "body": [
          {
            "type": "If",
            "test": {
              "type": "Binary",
              "op": "<",
              "left": {
                "type": "Identifier",
                "name": "izq",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "right": {
                "type": "Identifier",
                "name": "der",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "consequent": {
              "type": "Block",
              "body": [
                {
                  "type": "Assign",
                  "target": {
                    "type": "Identifier",
                    "name": "pivot",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "value": {
                    "type": "Index",
                    "target": {
                      "type": "Identifier",
                      "name": "A",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 3,
                      "column": 18
                    },
                    "index": {
                      "type": "Identifier",
                      "name": "der",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    }
                  },
                  "pos": {
                    "line": 3,
                    "column": 8
                  }
                },
                {
                  "type": "Assign",
                  "target": {
                    "type": "Identifier",
                    "name": "i",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "value": {
                    "type": "Binary",
                    "op": "-",
                    "left": {
                      "type": "Identifier",
                      "name": "izq",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "right": {
                      "type": "Literal",
                      "value": 1,
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 4,
                    "column": 8
                  }
                },
                {
                  "type": "For",
                  "var": "j",
                  "start": {
                    "type": "Identifier",
                    "name": "izq",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "end": {
                    "type": "Binary",
                    "op": "-",
                    "left": {
                      "type": "Identifier",
                      "name": "der",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "right": {
                      "type": "Literal",
                      "value": 1,
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "body": {
                    "type": "Block",
                    "body": [
                      {
                        "type": "If",
                        "test": {
                          "type": "Binary",
                          "op": "<=",
                          "left": {
                            "type": "Index",
                            "target": {
                              "type": "Identifier",
                              "name": "A",
                              "pos": {
                                "line": 0,
                                "column": 0
                              }
                            },
                            "pos": {
                              "line": 6,
                              "column": 17
                            },
                            "index": {
                              "type": "Identifier",
                              "name": "j",
                              "pos": {
                                "line": 0,
                                "column": 0
                              }
                            }
                          },
                          "right": {
                            "type": "Identifier",
                            "name": "pivot",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        },
                        "consequent": {
                          "type": "Block",
                          "body": [
                            {
                              "type": "Assign",
                              "target": {
                                "type": "Identifier",
                                "name": "i",
                                "pos": {
                                  "line": 0,
                                  "column": 0
                                }
                              },
                              "value": {
                                "type": "Binary",
                                "op": "+",
                                "left": {
                                  "type": "Identifier",
                                  "name": "i",
                                  "pos": {
                                    "line": 0,
                                    "column": 0
                                  }
                                },
                                "right": {
                                  "type": "Literal",
                                  "value": 1,
                                  "pos": {
                                    "line": 0,
                                    "column": 0
                                  }
                                },
                                "pos": {
                                  "line": 0,
                                  "column": 0
                                }
                              },
                              "pos": {
                                "line": 7,
                                "column": 16
                              }
                            },
                            {
                              "type": "Assign",
                              "target": {
                                "type": "Identifier",
                                "name": "temp",
                                "pos": {
                                  "line": 0,
                                  "column": 0
                                }
                              },
                              "value": {
                                "type": "Index",
                                "target": {
                                  "type": "Identifier",
                                  "name": "A",
                                  "pos": {
                                    "line": 0,
                                    "column": 0
                                  }
                                },
                                "pos": {
                                  "line": 8,
                                  "column": 25
                                },
                                "index": {
                                  "type": "Identifier",
                                  "name": "i",
                                  "pos": {
                                    "line": 0,
                                    "column": 0
                                  }
                                }
                              },
                              "pos": {
                                "line": 8,
                                "column": 16
                              }
                            },
                            {
                              "type": "Assign",
                              "target": {
                                "type": "Index",
                                "target": {
                                  "type": "Identifier",
                                  "name": "A",
                                  "pos": {
                                    "line": 0,
                                    "column": 0
                                  }
                                },
                                "pos": {
                                  "line": 9,
                                  "column": 17
                                },
                                "index": {
                                  "type": "Identifier",
                                  "name": "i",
                                  "pos": {
                                    "line": 0,
                                    "column": 0
                                  }
                                }
                              },
                              "value": {
                                "type": "Index",
                                "target": {
                                  "type": "Identifier",
                                  "name": "A",
                                  "pos": {
                                    "line": 0,
                                    "column": 0
                                  }
                                },
                                "pos": {
                                  "line": 9,
                                  "column": 25
                                },
                                "index": {
                                  "type": "Identifier",
                                  "name": "j",
                                  "pos": {
                                    "line": 0,
                                    "column": 0
                                  }
                                }
                              },
                              "pos": {
                                "line": 9,
                                "column": 16
                              }
                            },
                            {
                              "type": "Assign",
                              "target": {
                                "type": "Index",
                                "target": {
                                  "type": "Identifier",
                                  "name": "A",
                                  "pos": {
                                    "line": 0,
                                    "column": 0
                                  }
                                },
                                "pos": {
                                  "line": 10,
                                  "column": 17
                                },
                                "index": {
                                  "type": "Identifier",
                                  "name": "j",
                                  "pos": {
                                    "line": 0,
                                    "column": 0
                                  }
                                }
                              },
                              "value": {
                                "type": "Identifier",
                                "name": "temp",
                                "pos": {
                                  "line": 0,
                                  "column": 0
                                }
                              },
                              "pos": {
                                "line": 10,
                                "column": 16
                              }
                            }
                          ],
                          "pos": {
                            "line": 6,
                            "column": 36
                          }
                        },
                        "alternate": null,
                        "pos": {
                          "line": 6,
                          "column": 12
                        }
                      }
                    ],
                    "pos": {
                      "line": 5,
                      "column": 35
                    }
                  },
                  "pos": {
                    "line": 5,
                    "column": 8
                  }
                },
                {
                  "type": "Assign",
                  "target": {
                    "type": "Identifier",
                    "name": "temp",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "value": {
                    "type": "Index",
                    "target": {
                      "type": "Identifier",
                      "name": "A",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 13,
                      "column": 17
                    },
                    "index": {
                      "type": "Binary",
                      "op": "+",
                      "left": {
                        "type": "Identifier",
                        "name": "i",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "right": {
                        "type": "Literal",
                        "value": 1,
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    }
                  },
                  "pos": {
                    "line": 13,
                    "column": 8
                  }
                },
                {
                  "type": "Assign",
                  "target": {
                    "type": "Index",
                    "target": {
                      "type": "Identifier",
                      "name": "A",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 14,
                      "column": 9
                    },
                    "index": {
                      "type": "Binary",
                      "op": "+",
                      "left": {
                        "type": "Identifier",
                        "name": "i",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "right": {
                        "type": "Literal",
                        "value": 1,
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    }
                  },
                  "value": {
                    "type": "Index",
                    "target": {
                      "type": "Identifier",
                      "name": "A",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 14,
                      "column": 21
                    },
                    "index": {
                      "type": "Identifier",
                      "name": "der",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    }
                  },
                  "pos": {
                    "line": 14,
                    "column": 8
                  }
                },
                {
                  "type": "Assign",
                  "target": {
                    "type": "Index",
                    "target": {
                      "type": "Identifier",
                      "name": "A",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 15,
                      "column": 9
                    },
                    "index": {
                      "type": "Identifier",
                      "name": "der",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    }
                  },
                  "value": {
                    "type": "Identifier",
                    "name": "temp",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 15,
                    "column": 8
                  }
                },
                {
                  "type": "Assign",
                  "target": {
                    "type": "Identifier",
                    "name": "pi",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "value": {
                    "type": "Binary",
                    "op": "+",
                    "left": {
                      "type": "Identifier",
                      "name": "i",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "right": {
                      "type": "Literal",
                      "value": 1,
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 16,
                    "column": 8
                  }
                },
                {
                  "type": "Call",
                  "callee": "quicksort",
                  "args": [
                    {
                      "type": "Identifier",
                      "name": "A",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    {
                      "type": "Identifier",
                      "name": "izq",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    {
                      "type": "Binary",
                      "op": "-",
                      "left": {
                        "type": "Identifier",
                        "name": "pi",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "right": {
                        "type": "Literal",
                        "value": 1,
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    }
                  ],
                  "statement": true,
                  "pos": {
                    "line": 17,
                    "column": 8
                  }
                },
                {
                  "type": "Call",
                  "callee": "quicksort",
                  "args": [
                    {
                      "type": "Identifier",
                      "name": "A",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    {
                      "type": "Binary",
                      "op": "+",
                      "left": {
                        "type": "Identifier",
                        "name": "pi",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "right": {
                        "type": "Literal",
                        "value": 1,
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    {
                      "type": "Identifier",
                      "name": "der",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    }
                  ],
                  "statement": true,
                  "pos": {
                    "line": 18,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 2,
                "column": 24
              }
            },
            "alternate": null,
            "pos": {
              "line": 2,
              "column": 4
            }
          }
        ],
        "pos": {
          "line": 1,
          "column": 26
        }
      },
      "pos": {
        "line": 1,
        "column": 0
      }
    }
  ],
  "pos": {
    "line": 1,
    "column": 0
  }
}
```

#### Clasificación: `hybrid`

#### Métodos Aplicables

- **Métodos aplicables**: recursion_tree, master
- **Método por defecto**: `master`

**Información de Recurrencia Detectada:**

- Forma: `T(n) = 2 \cdot T(n/2) + f(n)`
- Tipo: `divide_conquer`
- Orden: `N/A`

#### Análisis de Complejidad

### Worst Case

**T_open**: `\Theta(n \log n)`

**Información de Recurrencia:**

- Método: `master`
- Forma: `T(n) = 2 \cdot T(n/2) + f(n)`

### Best Case

**T_open**: `O(n \log n)`

**Información de Recurrencia:**

- Método: `master`
- Forma: `T(n) = 2 \cdot T(n/2) + f(n)`

### Average Case

**T_open**: `\Theta(n \log n)`

**Información de Recurrencia:**

- Método: `master`
- Forma: `T(n) = 2 \cdot T(n/2) + f(n)`

#### Tiempo de Ejecución

- Parse: 0.034s
- Clasificación: 0.034s
- Detección de métodos: 0.040s
- Análisis: 0.039s
- **Total**: 0.148s

---

## Algoritmos Recursivos - Ecuación Característica

### 1. Fibonacci Recursivo (ID: 12)

#### Pseudocódigo

```pseudocode
fibonacci(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    ELSE BEGIN
        RETURN fibonacci(n - 1) + fibonacci(n - 2);
    END
END
```

#### AST (Abstract Syntax Tree)

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ProcDef",
      "name": "fibonacci",
      "params": [
        {
          "type": "Param",
          "name": "n",
          "pos": {
            "line": 1,
            "column": 10
          }
        }
      ],
      "body": {
        "type": "Block",
        "body": [
          {
            "type": "If",
            "test": {
              "type": "Binary",
              "op": "<=",
              "left": {
                "type": "Identifier",
                "name": "n",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "right": {
                "type": "Literal",
                "value": 1,
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "consequent": {
              "type": "Block",
              "body": [
                {
                  "type": "Return",
                  "value": {
                    "type": "Identifier",
                    "name": "n",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 3,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 2,
                "column": 21
              }
            },
            "alternate": {
              "type": "Block",
              "body": [
                {
                  "type": "Return",
                  "value": {
                    "type": "Binary",
                    "op": "+",
                    "left": {
                      "type": "Call",
                      "callee": "fibonacci",
                      "args": [
                        {
                          "type": "Binary",
                          "op": "-",
                          "left": {
                            "type": "Identifier",
                            "name": "n",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "right": {
                            "type": "Literal",
                            "value": 1,
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        }
                      ],
                      "statement": false,
                      "pos": {
                        "line": 6,
                        "column": 15
                      }
                    },
                    "right": {
                      "type": "Call",
                      "callee": "fibonacci",
                      "args": [
                        {
                          "type": "Binary",
                          "op": "-",
                          "left": {
                            "type": "Identifier",
                            "name": "n",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "right": {
                            "type": "Literal",
                            "value": 2,
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        }
                      ],
                      "statement": false,
                      "pos": {
                        "line": 6,
                        "column": 34
                      }
                    },
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 6,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 5,
                "column": 9
              }
            },
            "pos": {
              "line": 2,
              "column": 4
            }
          }
        ],
        "pos": {
          "line": 1,
          "column": 13
        }
      },
      "pos": {
        "line": 1,
        "column": 0
      }
    }
  ],
  "pos": {
    "line": 1,
    "column": 0
  }
}
```

#### Clasificación: `recursive`

#### Métodos Aplicables

- **Métodos aplicables**: characteristic_equation, iteration
- **Método por defecto**: `characteristic_equation`

**Información de Recurrencia Detectada:**

- Forma: `T(n) = T(n-2) + T(n-1) + g(n)`
- Tipo: `linear_shift`
- Orden: `2`

#### Análisis de Complejidad

### Worst Case

**T_open**: `\Theta(\frac{1 + \sqrt{5}}{2}^n)`

**Información de Recurrencia:**

- Método: `characteristic_equation`
- Forma: `T(n) = T(n-2) + T(n-1) + g(n)`

**Ecuación Característica:**

```json
{
  "method": "characteristic_equation",
  "is_dp_linear": true,
  "equation": "r^{2} - r - 1 = 0",
  "roots": [
    {
      "root": "\\frac{1 + \\sqrt{5}}{2}",
      "multiplicity": 1
    },
    {
      "root": "\\frac{1 - \\sqrt{5}}{2}",
      "multiplicity": 1
    }
  ],
  "dominant_root": "\\frac{1 + \\sqrt{5}}{2}",
  "growth_rate": null,
  "solved_by": "characteristic_equation",
  "homogeneous_solution": "A_1 \\cdot \\frac{1 + \\sqrt{5}}{2}^n + A_2 \\cdot \\frac{1 - \\sqrt{5}}{2}^n",
  "particular_solution": "A_2",
  "general_solution": "A_1 \\cdot \\frac{1 + \\sqrt{5}}{2}^n + A_2 \\cdot \\frac{1 - \\sqrt{5}}{2}^n + A_2",
  "base_cases": {
    "T(0)": 0,
    "T(1)": 1
  },
  "closed_form": "c_1 \\cdot \\frac{1 + \\sqrt{5}}{2}^n + c_2 \\cdot \\frac{1 - \\sqrt{5}}{2}^n",
  "dp_version": {
    "code": "FUNCIÓN dp_solve(n):\n    SI n <= 1 ENTONCES\n        RETORNAR caso_base[n]\n    \n    // Inicializar tabla DP\n    dp[0..n] = 0\n    \n    // Casos base\n    dp[0] = T0  // Caso base\n    dp[1] = T1  // Caso base\n    \n    // Llenar tabla bottom-up\n    PARA i = 2 HASTA n HACER\n    dp[i] = dp[i-1] + dp[i-2]\n    FIN PARA\n    \n    RETORNAR dp[n]\nFIN FUNCIÓN",
    "time_complexity": "O(n)",
    "space_complexity": "O(n)",
    "recursive_complexity": "O(2^n)"
  },
  "dp_optimized_version": {
    "code": "FUNCIÓN dp_solve_optimized(n):\n    SI n <= 0 ENTONCES\n        RETORNAR caso_base[0]\n    SI n = 1 ENTONCES\n        RETORNAR caso_base[1]\n    \n    // Versión optimizada O(1) espacio\n    // Usar solo dos variables auxiliares\n    a = caso_base[0]  // T(0)\n    b = caso_base[1]  // T(1)\n    \n    // Llenar bottom-up con solo variables auxiliares\n    PARA i = 2 HASTA n HACER\n        temp = 1 * b + 1 * a + g(i)  // T(i) = 1T(i-1) + 1T(i-2) + g(i)\n        a = b\n        b = temp\n    FIN PARA\n    \n    RETORNAR b\nFIN FUNCIÓN",
    "time_complexity": "O(n)",
    "space_complexity": "O(1)"
  },
  "dp_equivalence": "Las raíces de la ecuación característica corresponden a los valores propios de la transición lineal del sistema DP. La solución cerrada matemática equivale a la solución iterativa mediante programación dinámica.",
  "theta": "\\Theta(\\frac{1 + \\sqrt{5}}{2}^n)",
  "has_early_return": false
}
```

**Best Case**: Igual que Worst Case

**Average Case**: Igual que Worst Case

#### Tiempo de Ejecución

- Parse: 0.012s
- Clasificación: 0.013s
- Detección de métodos: 0.012s
- Análisis: 0.250s
- **Total**: 0.287s

---

### 2. Torres de Hanoi (ID: 13)

#### Pseudocódigo

```pseudocode
hanoi(n, origen, destino, auxiliar) BEGIN
    IF (n = 1) THEN BEGIN
        RETURN 1;
    END
    ELSE BEGIN
        resultado <- hanoi(n - 1, origen, auxiliar, destino);
        resultado <- resultado + 1;
        resultado <- resultado + hanoi(n - 1, auxiliar, destino, origen);
        RETURN resultado;
    END
END
```

#### AST (Abstract Syntax Tree)

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ProcDef",
      "name": "hanoi",
      "params": [
        {
          "type": "Param",
          "name": "n",
          "pos": {
            "line": 1,
            "column": 6
          }
        },
        {
          "type": "Param",
          "name": "origen",
          "pos": {
            "line": 1,
            "column": 9
          }
        },
        {
          "type": "Param",
          "name": "destino",
          "pos": {
            "line": 1,
            "column": 17
          }
        },
        {
          "type": "Param",
          "name": "auxiliar",
          "pos": {
            "line": 1,
            "column": 26
          }
        }
      ],
      "body": {
        "type": "Block",
        "body": [
          {
            "type": "If",
            "test": {
              "type": "Binary",
              "op": "==",
              "left": {
                "type": "Identifier",
                "name": "n",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "right": {
                "type": "Literal",
                "value": 1,
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "consequent": {
              "type": "Block",
              "body": [
                {
                  "type": "Return",
                  "value": {
                    "type": "Literal",
                    "value": 1,
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 3,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 2,
                "column": 20
              }
            },
            "alternate": {
              "type": "Block",
              "body": [
                {
                  "type": "Assign",
                  "target": {
                    "type": "Identifier",
                    "name": "resultado",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "value": {
                    "type": "Call",
                    "callee": "hanoi",
                    "args": [
                      {
                        "type": "Binary",
                        "op": "-",
                        "left": {
                          "type": "Identifier",
                          "name": "n",
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        },
                        "right": {
                          "type": "Literal",
                          "value": 1,
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        },
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      {
                        "type": "Identifier",
                        "name": "origen",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      {
                        "type": "Identifier",
                        "name": "auxiliar",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      },
                      {
                        "type": "Identifier",
                        "name": "destino",
                        "pos": {
                          "line": 0,
                          "column": 0
                        }
                      }
                    ],
                    "statement": false,
                    "pos": {
                      "line": 6,
                      "column": 21
                    }
                  },
                  "pos": {
                    "line": 6,
                    "column": 8
                  }
                },
                {
                  "type": "Assign",
                  "target": {
                    "type": "Identifier",
                    "name": "resultado",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "value": {
                    "type": "Binary",
                    "op": "+",
                    "left": {
                      "type": "Identifier",
                      "name": "resultado",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "right": {
                      "type": "Literal",
                      "value": 1,
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 7,
                    "column": 8
                  }
                },
                {
                  "type": "Assign",
                  "target": {
                    "type": "Identifier",
                    "name": "resultado",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "value": {
                    "type": "Binary",
                    "op": "+",
                    "left": {
                      "type": "Identifier",
                      "name": "resultado",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "right": {
                      "type": "Call",
                      "callee": "hanoi",
                      "args": [
                        {
                          "type": "Binary",
                          "op": "-",
                          "left": {
                            "type": "Identifier",
                            "name": "n",
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "right": {
                            "type": "Literal",
                            "value": 1,
                            "pos": {
                              "line": 0,
                              "column": 0
                            }
                          },
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        },
                        {
                          "type": "Identifier",
                          "name": "auxiliar",
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        },
                        {
                          "type": "Identifier",
                          "name": "destino",
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        },
                        {
                          "type": "Identifier",
                          "name": "origen",
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        }
                      ],
                      "statement": false,
                      "pos": {
                        "line": 8,
                        "column": 33
                      }
                    },
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 8,
                    "column": 8
                  }
                },
                {
                  "type": "Return",
                  "value": {
                    "type": "Identifier",
                    "name": "resultado",
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 9,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 5,
                "column": 9
              }
            },
            "pos": {
              "line": 2,
              "column": 4
            }
          }
        ],
        "pos": {
          "line": 1,
          "column": 36
        }
      },
      "pos": {
        "line": 1,
        "column": 0
      }
    }
  ],
  "pos": {
    "line": 1,
    "column": 0
  }
}
```

#### Clasificación: `recursive`

#### Métodos Aplicables

- **Métodos aplicables**: characteristic_equation, iteration
- **Método por defecto**: `characteristic_equation`

**Información de Recurrencia Detectada:**

- Forma: `T(n) = 2 \cdot T(n-1) + g(n)`
- Tipo: `linear_shift`
- Orden: `1`

#### Análisis de Complejidad

### Worst Case

**T_open**: `\Theta(2^n)`

**Información de Recurrencia:**

- Método: `characteristic_equation`
- Forma: `T(n) = 2 \cdot T(n-1) + g(n)`

**Ecuación Característica:**

```json
{
  "method": "characteristic_equation",
  "is_dp_linear": true,
  "equation": "r - 2 = 0",
  "roots": [
    {
      "root": "2",
      "multiplicity": 1
    }
  ],
  "dominant_root": "2",
  "growth_rate": 2.0,
  "solved_by": "characteristic_equation",
  "homogeneous_solution": "A \\cdot 2^n",
  "particular_solution": "A_2",
  "general_solution": "A \\cdot 2^n + A_2",
  "base_cases": {
    "T(1)": 1
  },
  "closed_form": "c_1 \\cdot 2^n",
  "dp_version": {
    "code": "FUNCIÓN dp_solve(n):\n    SI n <= 0 ENTONCES\n        RETORNAR caso_base[n]\n    \n    // Inicializar tabla DP\n    dp[0..n] = 0\n    \n    // Casos base\n    dp[0] = T0  // Caso base\n    \n    // Llenar tabla bottom-up\n    PARA i = 1 HASTA n HACER\n    dp[i] = 2 * dp[i-1]\n    FIN PARA\n    \n    RETORNAR dp[n]\nFIN FUNCIÓN",
    "time_complexity": "O(n)",
    "space_complexity": "O(n)",
    "recursive_complexity": "O(2^n)"
  },
  "dp_optimized_version": {
    "code": "FUNCIÓN dp_solve_optimized(n):\n    SI n <= 0 ENTONCES\n        RETORNAR caso_base[0]\n    \n    // Versión optimizada O(1) espacio\n    prev = caso_base[0]  // T(0)\n    \n    // Llenar bottom-up con solo variables auxiliares\n    PARA i = 1 HASTA n HACER\n        actual = 2 * prev + g(i)  // T(i) = 2T(i-1) + g(i)\n        prev = actual\n    FIN PARA\n    \n    RETORNAR prev\nFIN FUNCIÓN",
    "time_complexity": "O(n)",
    "space_complexity": "O(1)"
  },
  "dp_equivalence": "Las raíces de la ecuación característica corresponden a los valores propios de la transición lineal del sistema DP. La solución cerrada matemática equivale a la solución iterativa mediante programación dinámica.",
  "theta": "\\Theta(2^n)",
  "has_early_return": false
}
```

**Best Case**: Igual que Worst Case

**Average Case**: Igual que Worst Case

#### Tiempo de Ejecución

- Parse: 0.015s
- Clasificación: 0.015s
- Detección de métodos: 0.020s
- Análisis: 0.059s
- **Total**: 0.108s

---

### 3. N-Step Stairs (Subir Escaleras) (ID: 20)

#### Pseudocódigo

```pseudocode
subirEscaleras(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    ELSE BEGIN
        IF (n = 2) THEN BEGIN
            RETURN 2;
        END
        ELSE BEGIN
            RETURN subirEscaleras(n - 1) + subirEscaleras(n - 2);
        END
    END
END
```

#### AST (Abstract Syntax Tree)

```json
{
  "type": "Program",
  "body": [
    {
      "type": "ProcDef",
      "name": "subirEscaleras",
      "params": [
        {
          "type": "Param",
          "name": "n",
          "pos": {
            "line": 1,
            "column": 15
          }
        }
      ],
      "body": {
        "type": "Block",
        "body": [
          {
            "type": "If",
            "test": {
              "type": "Binary",
              "op": "<=",
              "left": {
                "type": "Identifier",
                "name": "n",
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "right": {
                "type": "Literal",
                "value": 1,
                "pos": {
                  "line": 0,
                  "column": 0
                }
              },
              "pos": {
                "line": 0,
                "column": 0
              }
            },
            "consequent": {
              "type": "Block",
              "body": [
                {
                  "type": "Return",
                  "value": {
                    "type": "Literal",
                    "value": 1,
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "pos": {
                    "line": 3,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 2,
                "column": 21
              }
            },
            "alternate": {
              "type": "Block",
              "body": [
                {
                  "type": "If",
                  "test": {
                    "type": "Binary",
                    "op": "==",
                    "left": {
                      "type": "Identifier",
                      "name": "n",
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "right": {
                      "type": "Literal",
                      "value": 2,
                      "pos": {
                        "line": 0,
                        "column": 0
                      }
                    },
                    "pos": {
                      "line": 0,
                      "column": 0
                    }
                  },
                  "consequent": {
                    "type": "Block",
                    "body": [
                      {
                        "type": "Return",
                        "value": {
                          "type": "Literal",
                          "value": 2,
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        },
                        "pos": {
                          "line": 7,
                          "column": 12
                        }
                      }
                    ],
                    "pos": {
                      "line": 6,
                      "column": 24
                    }
                  },
                  "alternate": {
                    "type": "Block",
                    "body": [
                      {
                        "type": "Return",
                        "value": {
                          "type": "Binary",
                          "op": "+",
                          "left": {
                            "type": "Call",
                            "callee": "subirEscaleras",
                            "args": [
                              {
                                "type": "Binary",
                                "op": "-",
                                "left": {
                                  "type": "Identifier",
                                  "name": "n",
                                  "pos": {
                                    "line": 0,
                                    "column": 0
                                  }
                                },
                                "right": {
                                  "type": "Literal",
                                  "value": 1,
                                  "pos": {
                                    "line": 0,
                                    "column": 0
                                  }
                                },
                                "pos": {
                                  "line": 0,
                                  "column": 0
                                }
                              }
                            ],
                            "statement": false,
                            "pos": {
                              "line": 10,
                              "column": 19
                            }
                          },
                          "right": {
                            "type": "Call",
                            "callee": "subirEscaleras",
                            "args": [
                              {
                                "type": "Binary",
                                "op": "-",
                                "left": {
                                  "type": "Identifier",
                                  "name": "n",
                                  "pos": {
                                    "line": 0,
                                    "column": 0
                                  }
                                },
                                "right": {
                                  "type": "Literal",
                                  "value": 2,
                                  "pos": {
                                    "line": 0,
                                    "column": 0
                                  }
                                },
                                "pos": {
                                  "line": 0,
                                  "column": 0
                                }
                              }
                            ],
                            "statement": false,
                            "pos": {
                              "line": 10,
                              "column": 43
                            }
                          },
                          "pos": {
                            "line": 0,
                            "column": 0
                          }
                        },
                        "pos": {
                          "line": 10,
                          "column": 12
                        }
                      }
                    ],
                    "pos": {
                      "line": 9,
                      "column": 13
                    }
                  },
                  "pos": {
                    "line": 6,
                    "column": 8
                  }
                }
              ],
              "pos": {
                "line": 5,
                "column": 9
              }
            },
            "pos": {
              "line": 2,
              "column": 4
            }
          }
        ],
        "pos": {
          "line": 1,
          "column": 18
        }
      },
      "pos": {
        "line": 1,
        "column": 0
      }
    }
  ],
  "pos": {
    "line": 1,
    "column": 0
  }
}
```

#### Clasificación: `recursive`

#### Métodos Aplicables

- **Métodos aplicables**: characteristic_equation, iteration
- **Método por defecto**: `characteristic_equation`

**Información de Recurrencia Detectada:**

- Forma: `T(n) = T(n-2) + T(n-1) + g(n)`
- Tipo: `linear_shift`
- Orden: `2`

#### Análisis de Complejidad

### Worst Case

**T_open**: `\Theta(\frac{1 + \sqrt{5}}{2}^n)`

**Información de Recurrencia:**

- Método: `characteristic_equation`
- Forma: `T(n) = T(n-2) + T(n-1) + g(n)`

**Ecuación Característica:**

```json
{
  "method": "characteristic_equation",
  "is_dp_linear": true,
  "equation": "r^{2} - r - 1 = 0",
  "roots": [
    {
      "root": "\\frac{1 + \\sqrt{5}}{2}",
      "multiplicity": 1
    },
    {
      "root": "\\frac{1 - \\sqrt{5}}{2}",
      "multiplicity": 1
    }
  ],
  "dominant_root": "\\frac{1 + \\sqrt{5}}{2}",
  "growth_rate": null,
  "solved_by": "characteristic_equation",
  "homogeneous_solution": "A_1 \\cdot \\frac{1 + \\sqrt{5}}{2}^n + A_2 \\cdot \\frac{1 - \\sqrt{5}}{2}^n",
  "particular_solution": "A_2",
  "general_solution": "A_1 \\cdot \\frac{1 + \\sqrt{5}}{2}^n + A_2 \\cdot \\frac{1 - \\sqrt{5}}{2}^n + A_2",
  "base_cases": {
    "T(1)": 1,
    "T(2)": 2
  },
  "closed_form": "c_1 \\cdot \\frac{1 + \\sqrt{5}}{2}^n + c_2 \\cdot \\frac{1 - \\sqrt{5}}{2}^n",
  "dp_version": {
    "code": "FUNCIÓN dp_solve(n):\n    SI n <= 1 ENTONCES\n        RETORNAR caso_base[n]\n    \n    // Inicializar tabla DP\n    dp[0..n] = 0\n    \n    // Casos base\n    dp[0] = T0  // Caso base\n    dp[1] = T1  // Caso base\n    \n    // Llenar tabla bottom-up\n    PARA i = 2 HASTA n HACER\n    dp[i] = dp[i-1] + dp[i-2]\n    FIN PARA\n    \n    RETORNAR dp[n]\nFIN FUNCIÓN",
    "time_complexity": "O(n)",
    "space_complexity": "O(n)",
    "recursive_complexity": "O(2^n)"
  },
  "dp_optimized_version": {
    "code": "FUNCIÓN dp_solve_optimized(n):\n    SI n <= 0 ENTONCES\n        RETORNAR caso_base[0]\n    SI n = 1 ENTONCES\n        RETORNAR caso_base[1]\n    \n    // Versión optimizada O(1) espacio\n    // Usar solo dos variables auxiliares\n    a = caso_base[0]  // T(0)\n    b = caso_base[1]  // T(1)\n    \n    // Llenar bottom-up con solo variables auxiliares\n    PARA i = 2 HASTA n HACER\n        temp = 1 * b + 1 * a + g(i)  // T(i) = 1T(i-1) + 1T(i-2) + g(i)\n        a = b\n        b = temp\n    FIN PARA\n    \n    RETORNAR b\nFIN FUNCIÓN",
    "time_complexity": "O(n)",
    "space_complexity": "O(1)"
  },
  "dp_equivalence": "Las raíces de la ecuación característica corresponden a los valores propios de la transición lineal del sistema DP. La solución cerrada matemática equivale a la solución iterativa mediante programación dinámica.",
  "theta": "\\Theta(\\frac{1 + \\sqrt{5}}{2}^n)",
  "has_early_return": false
}
```

**Best Case**: Igual que Worst Case

**Average Case**: Igual que Worst Case

#### Tiempo de Ejecución

- Parse: 0.013s
- Clasificación: 0.014s
- Detección de métodos: 0.013s
- Análisis: 0.228s
- **Total**: 0.267s

---

## Resumen y Estadísticas

- **Total de algoritmos analizados**: 15
- **Tiempo total de ejecución**: 2.96s
- **Tiempo promedio por algoritmo**: 0.20s

### Estadísticas por Categoría

| Categoría | Cantidad | Tiempo Total (s) | Tiempo Promedio (s) |
|-----------|----------|------------------|---------------------|
| Algoritmos Iterativos | 3 | 1.27 | 0.42 |
| Algoritmos Recursivos - Método Iterativo | 3 | 0.26 | 0.09 |
| Algoritmos Recursivos - Teorema Maestro | 3 | 0.33 | 0.11 |
| Algoritmos Recursivos - Árbol de Recursión | 3 | 0.45 | 0.15 |
| Algoritmos Recursivos - Ecuación Característica | 3 | 0.66 | 0.22 |
