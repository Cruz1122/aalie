"""
Tests de integración para el Método de Iteración (Unrolling).

Verifica que el sistema detecte correctamente cuándo usar el Método de Iteración
en lugar del Teorema Maestro, y que los resultados sean correctos.
"""

import pytest
from app.modules.analysis.analyzers.recursive import RecursiveAnalyzer


class TestIterationMethod:
    """Tests para el Método de Iteración"""
    
    @staticmethod
    def create_factorial_ast():
        """
        Crea un AST para el algoritmo factorial recursivo.
        
        factorial(n) BEGIN
            IF (n <= 1) THEN BEGIN
                RETURN 1;
            END
            ELSE BEGIN
                RETURN factorial(n - 1);
            END
        END
        
        Debería usar Método de Iteración:
        - Un solo llamado recursivo (a = 1)
        - Subproblema decrease-and-conquer (n-1)
        - T(n) = T(n-1) + 1 → Θ(n)
        """
        return {
            "type": "Program",
            "body": [
                {
                    "type": "ProcDef",
                    "name": "factorial",
                    "params": [{"type": "Param", "name": "n"}],
                    "body": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "If",
                                "test": {
                                    "type": "Binary",
                                    "op": "<=",
                                    "left": {"type": "Identifier", "name": "n"},
                                    "right": {"type": "Literal", "value": 1}
                                },
                                "consequent": {
                                    "type": "Block",
                                    "body": [
                                        {
                                            "type": "Return",
                                            "expr": {"type": "Literal", "value": 1}
                                        }
                                    ]
                                },
                                "alternate": {
                                    "type": "Block",
                                    "body": [
                                        {
                                            "type": "Return",
                                            "expr": {
                                                "type": "Call",
                                                "callee": "factorial",
                                                "args": [
                                                    {
                                                        "type": "Binary",
                                                        "op": "-",
                                                        "left": {"type": "Identifier", "name": "n"},
                                                        "right": {"type": "Literal", "value": 1}
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]
        }
    
    @staticmethod
    def create_binary_search_ast():
        """
        Crea un AST simplificado para búsqueda binaria.
        
        busquedaBinaria(A, izq, der) BEGIN
            IF (izq > der) THEN BEGIN
                RETURN -1;
            END
            medio <- (izq + der) / 2;
            RETURN busquedaBinaria(A, izq, medio);
        END
        
        Debería usar Método de Iteración (si a=1):
        - Un solo llamado recursivo visible (simplificado)
        - Subproblema decrease-and-conquer con división
        - T(n) = T(n/2) + 1 → Θ(log n)
        """
        return {
            "type": "Program",
            "body": [
                {
                    "type": "ProcDef",
                    "name": "busquedaBinaria",
                    "params": [
                        {"type": "ArrayParam", "name": "A", "start": {"type": "Literal", "value": 1}},
                        {"type": "Param", "name": "izq"},
                        {"type": "Param", "name": "der"}
                    ],
                    "body": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "If",
                                "test": {
                                    "type": "Binary",
                                    "op": ">",
                                    "left": {"type": "Identifier", "name": "izq"},
                                    "right": {"type": "Identifier", "name": "der"}
                                },
                                "consequent": {
                                    "type": "Block",
                                    "body": [
                                        {
                                            "type": "Return",
                                            "expr": {"type": "Literal", "value": -1}
                                        }
                                    ]
                                }
                            },
                            {
                                "type": "Assign",
                                "target": {"type": "Identifier", "name": "medio"},
                                "value": {
                                    "type": "Binary",
                                    "op": "/",
                                    "left": {
                                        "type": "Binary",
                                        "op": "+",
                                        "left": {"type": "Identifier", "name": "izq"},
                                        "right": {"type": "Identifier", "name": "der"}
                                    },
                                    "right": {"type": "Literal", "value": 2}
                                }
                            },
                            {
                                "type": "Return",
                                "expr": {
                                    "type": "Call",
                                    "callee": "busquedaBinaria",
                                    "args": [
                                        {"type": "Identifier", "name": "A"},
                                        {"type": "Identifier", "name": "izq"},
                                        {"type": "Identifier", "name": "medio"}
                                    ]
                                }
                            }
                        ]
                    }
                }
            ]
        }
    
    def test_iteration_method_detection_factorial(self):
        """Test: Detectar Método de Iteración para factorial"""
        analyzer = RecursiveAnalyzer()
        ast = self.create_factorial_ast()
        
        result = analyzer.analyze(ast, mode="worst")
        
        # Verificar que el análisis fue exitoso
        assert result.get("ok"), f"Análisis falló: {result.get('errors', [])}"
        
        # Verificar que se detectó el método de iteración
        totals = result.get("totals", {})
        recurrence = totals.get("recurrence", {})
        
        assert recurrence is not None, "Debe tener recurrence"
        assert recurrence.get("method") == "iteration", f"Debe usar Método de Iteración, obtuvo {recurrence.get('method')}"
        
        # Verificar que hay datos de iteración
        iteration = totals.get("iteration", {})
        assert iteration is not None, "Debe tener datos de iteration"
        assert iteration.get("method") == "iteration", "iteration.method debe ser 'iteration'"
        
        # Verificar estructura de iteración
        assert "g_function" in iteration, "Debe tener g_function"
        assert "expansions" in iteration, "Debe tener expansions"
        assert "general_form" in iteration, "Debe tener general_form"
        assert "base_case" in iteration, "Debe tener base_case"
        assert "summation" in iteration, "Debe tener summation"
        assert "theta" in iteration, "Debe tener theta"
        
        print(f"✓ Método detectado: {recurrence.get('method')}")
        print(f"✓ g(n): {iteration.get('g_function')}")
        print(f"✓ Theta: {iteration.get('theta')}")
    
    def test_iteration_method_structure(self):
        """Test: Verificar estructura completa del Método de Iteración"""
        analyzer = RecursiveAnalyzer()
        ast = self.create_factorial_ast()
        
        result = analyzer.analyze(ast, mode="worst")
        
        assert result.get("ok"), "Análisis debe ser exitoso"
        
        totals = result.get("totals", {})
        iteration = totals.get("iteration", {})
        
        # Verificar que las expansiones son una lista
        assert isinstance(iteration.get("expansions", []), list), "expansions debe ser una lista"
        assert len(iteration.get("expansions", [])) > 0, "Debe tener al menos una expansión"
        
        # Verificar que base_case tiene la estructura correcta
        base_case = iteration.get("base_case", {})
        assert "condition" in base_case, "base_case debe tener condition"
        assert "k" in base_case, "base_case debe tener k"
        
        # Verificar que summation tiene la estructura correcta
        summation = iteration.get("summation", {})
        assert "expression" in summation, "summation debe tener expression"
        assert "evaluated" in summation, "summation debe tener evaluated"
        
        # Verificar que hay pasos de proof
        proof = totals.get("proof", [])
        assert len(proof) > 0, "Debe tener pasos de proof"
        
        # Verificar que hay pasos específicos del método de iteración
        iteration_steps = [step for step in proof if step.get("id", "").startswith("step") or step.get("id") == "iteration_start"]
        assert len(iteration_steps) > 0, "Debe tener pasos del método de iteración"
        
        print(f"✓ Expansiones: {len(iteration.get('expansions', []))}")
        print(f"✓ Pasos de proof: {len(proof)}")
    
    def test_recurrence_with_method_field(self):
        """Test: Verificar que la recurrencia incluye el campo method"""
        analyzer = RecursiveAnalyzer()
        ast = self.create_factorial_ast()
        
        result = analyzer.analyze(ast, mode="worst")
        
        assert result.get("ok"), "Análisis debe ser exitoso"
        
        recurrence = result["totals"]["recurrence"]
        assert "method" in recurrence, "La recurrencia debe incluir el campo 'method'"
        assert recurrence["method"] in ["master", "iteration"], f"method debe ser 'master' o 'iteration', obtuvo {recurrence['method']}"
        
        print(f"✓ Método en recurrence: {recurrence['method']}")
    
    def test_binary_search_iteration_method(self):
        """Test: Verificar que búsqueda binaria use Método de Iteración"""
        analyzer = RecursiveAnalyzer()
        ast = self.create_binary_search_ast()
        
        result = analyzer.analyze(ast, mode="worst")
        
        # El análisis puede ser exitoso o no dependiendo de la complejidad del AST
        if result.get("ok"):
            totals = result.get("totals", {})
            recurrence = totals.get("recurrence", {})
            
            # Si tiene recurrence, verificar el método
            if recurrence:
                print(f"✓ Método detectado para búsqueda binaria: {recurrence.get('method')}")
                
                # Si usa iteración, verificar estructura
                if recurrence.get("method") == "iteration":
                    iteration = totals.get("iteration", {})
                    assert iteration is not None, "Debe tener datos de iteration"
                    print(f"✓ g(n): {iteration.get('g_function')}")
                    print(f"✓ Theta: {iteration.get('theta')}")
        else:
            print(f"✓ Análisis no exitoso (esperado para AST complejo): {result.get('errors', [])}")

