# apps/api/app/analysis/simple_analyzer.py

from typing import Any, Dict, List, Optional
from .base import BaseAnalyzer

# Constantes para evitar duplicación
ARRAY_SIZE_DESC = "tamaño del arreglo"


class SimpleAnalyzer(BaseAnalyzer):
    """
    Analizador que implementa las reglas específicas para líneas "simples".
    
    Cubre:
    - Asignaciones (target <- expr)
    - Llamadas (CALL f(args) o call-expr)
    - Return (return expr)
    - Declaraciones (Decl/declVectorStmt)
    - Otras líneas simples
    """
    
    def __init__(self):
        super().__init__()
    
    def _expr_to_str(self, expr: Any) -> str:
        """
        Convierte una expresión del AST a string.
        
        Args:
            expr: Expresión del AST
            
        Returns:
            String representando la expresión
        """
        if isinstance(expr, str):
            return expr
        elif isinstance(expr, dict):
            if expr.get("type") == "identifier":
                return expr.get("name", "unknown")
            elif expr.get("type") == "number":
                return str(expr.get("value", "0"))
            elif expr.get("type") == "binary":
                left = self._expr_to_str(expr.get("left", ""))
                right = self._expr_to_str(expr.get("right", ""))
                op = expr.get("operator", "")
                return f"({left}) {op} ({right})"
            else:
                return str(expr)
        else:
            return str(expr)
    
    def visit_assign(self, node: Dict[str, Any], _mode: str = "worst") -> None:
        """
        Visita una asignación y aplica las reglas de análisis.
        
        Args:
            node: Nodo de asignación del AST
            mode: Modo de análisis
        """
        line = node.get("pos", {}).get("line", 0)
        ck_terms = []
        
        # target (p.ej., A[i] o x.f)
        ck_terms += self._cost_of_lvalue(node.get("target", {}))
        
        # expr (recorre y collecciona constantes)
        ck_terms += self._cost_of_expr(node.get("value"))
        
        # constante de la propia asignación
        ck_terms.append(self.C())  # -> "C_{k}"
        
        ck = " + ".join(ck_terms)
        self.add_row(line, "assign", ck, "1")
    
    def visit_call_stmt(self, node: Dict[str, Any], _mode: str = "worst") -> None:
        """
        Visita una llamada como sentencia y aplica las reglas de análisis.
        
        Args:
            node: Nodo de llamada del AST
            mode: Modo de análisis
        """
        line = node.get("pos", {}).get("line", 0)
        ck_terms = [self.C()]  # costo de la llamada
        
        for arg in node.get("args", []):
            ck_terms += self._cost_of_expr(arg)
        
        ck = " + ".join(ck_terms)
        self.add_row(line, "call", ck, "1")
    
    def visit_return(self, node: Dict[str, Any], _mode: str = "worst") -> None:
        """
        Visita un return y aplica las reglas de análisis.
        
        Args:
            node: Nodo de return del AST
            mode: Modo de análisis
        """
        line = node.get("pos", {}).get("line", 0)
        ck_terms = self._cost_of_expr(node.get("value"))
        ck_terms.append(self.C())  # costo del return
        
        ck = " + ".join(ck_terms)
        self.add_row(line, "return", ck, "1")
    
    def visit_decl(self, node: Dict[str, Any], _mode: str = "worst") -> None:
        """
        Visita una declaración y aplica las reglas de análisis.
        
        Args:
            node: Nodo de declaración del AST
            mode: Modo de análisis
        """
        line = node.get("pos", {}).get("line", 0)
        ck_terms = [self.C()]  # costo de la declaración
        
        # Si la declaración incluye tamaños con expresiones
        if "size" in node:
            ck_terms += self._cost_of_expr(node["size"])
        
        ck = " + ".join(ck_terms)
        self.add_row(line, "decl", ck, "1")
    
    def _cost_of_lvalue(self, lv: Dict[str, Any]) -> List[str]:
        """
        Calcula el costo de un lvalue (lado izquierdo de una asignación).
        
        Args:
            lv: Lvalue del AST
            
        Returns:
            Lista de términos de costo
        """
        terms = []
        
        if not isinstance(lv, dict):
            return terms
        
        t = lv.get("type", "")
        
        # ID simple: no agrega nada
        if t == "identifier":
            return terms
        
        # A[i] o anidado
        elif t == "index":
            terms.append(self.C())  # costo de indexación
            terms += self._cost_of_expr(lv.get("index", {}))
            # Si el target es también un índice o campo, calcular su costo
            target = lv.get("target", {})
            if target.get("type") in ("index", "field"):
                terms += self._cost_of_lvalue(target)
        
        # Acceso a campo x.f
        elif t == "field":
            terms.append(self.C())  # costo de acceso a campo
            # Si el target es también un índice o campo, calcular su costo
            target = lv.get("target", {})
            if target.get("type") in ("index", "field"):
                terms += self._cost_of_lvalue(target)
        
        return terms
    
    def _cost_of_expr(self, e: Any) -> List[str]:
        """
        Calcula el costo de una expresión.
        
        Args:
            e: Expresión del AST
            
        Returns:
            Lista de términos de costo
        """
        if e is None:
            return []
        
        if not isinstance(e, dict):
            return []
        
        t = e.get("type", "")
        
        # Literales y identificadores simples: no tienen costo
        if t in ("literal", "identifier", "number", "string", "true", "false", "null"):
            return []
        
        # Acceso a índice A[i]
        elif t == "index":
            terms = [self.C()]  # costo del acceso
            terms += self._cost_of_expr(e.get("index", {}))
            # Si el target es también un índice, calcular su costo
            target = e.get("target", {})
            if target.get("type") == "index":
                terms += self._cost_of_expr(target)
            return terms
        
        # Acceso a campo x.f
        elif t == "field":
            terms = [self.C()]  # costo del acceso a campo
            terms += self._cost_of_expr(e.get("target", {}))
            return terms
        
        # Operación binaria
        elif t == "binary":
            terms = []
            terms += self._cost_of_expr(e.get("left", {}))
            terms += self._cost_of_expr(e.get("right", {}))
            terms.append(self.C())  # costo de la operación
            return terms
        
        # Operación unaria
        elif t == "unary":
            terms = self._cost_of_expr(e.get("arg", {}))
            terms.append(self.C())  # costo de la operación
            return terms
        
        # Llamada a función
        elif t == "call":
            terms = [self.C()]  # costo de la llamada
            for arg in e.get("args", []):
                terms += self._cost_of_expr(arg)
            return terms
        
        # Otros tipos: fallback prudente
        else:
            return [self.C()]
    
    def analyze_simple_example(self) -> Dict[str, Any]:
        """
        Ejemplo de análisis con líneas simples.
        
        Simula:
        1. pivot <- A[der]
        2. i <- izq - 1
        3. temp <- A[j]
        4. A[j] <- A[i]
        5. A[i] <- temp
        
        Returns:
            Resultado del análisis
        """
        # Limpiar datos previos
        self.clear()
        
        # Agregar símbolos
        self.add_symbol("n", ARRAY_SIZE_DESC)
        self.add_symbol("izq", "índice izquierdo")
        self.add_symbol("der", "índice derecho")
        self.add_symbol("pivot", "valor pivote")
        
        # Simular asignaciones simples
        assignments = [
            {
                "type": "assign",
                "pos": {"line": 1},
                "target": {"type": "identifier", "name": "pivot"},
                "value": {"type": "index", "target": {"type": "identifier", "name": "A"}, "index": {"type": "identifier", "name": "der"}}
            },
            {
                "type": "assign",
                "pos": {"line": 2},
                "target": {"type": "identifier", "name": "i"},
                "value": {"type": "binary", "left": {"type": "identifier", "name": "izq"}, "operator": "-", "right": {"type": "number", "value": "1"}}
            },
            {
                "type": "assign",
                "pos": {"line": 3},
                "target": {"type": "identifier", "name": "temp"},
                "value": {"type": "index", "target": {"type": "identifier", "name": "A"}, "index": {"type": "identifier", "name": "j"}}
            },
            {
                "type": "assign",
                "pos": {"line": 4},
                "target": {"type": "index", "target": {"type": "identifier", "name": "A"}, "index": {"type": "identifier", "name": "j"}},
                "value": {"type": "index", "target": {"type": "identifier", "name": "A"}, "index": {"type": "identifier", "name": "i"}}
            },
            {
                "type": "assign",
                "pos": {"line": 5},
                "target": {"type": "index", "target": {"type": "identifier", "name": "A"}, "index": {"type": "identifier", "name": "i"}},
                "value": {"type": "identifier", "name": "temp"}
            }
        ]
        
        # Analizar cada asignación
        for assignment in assignments:
            self.visit_assign(assignment, "worst")
        
        # Agregar pasos al procedimiento
        self.add_procedure_step(
            r"Cada asignación suma una constante C_{k} y los costes de su RHS (llamadas, aritmética, indexaciones)."
        )
        
        return self.result()
    
    def analyze_call_example(self) -> Dict[str, Any]:
        """
        Ejemplo de análisis con llamadas a función.
        
        Simula:
        1. CALL swap(A, i, j)
        2. CALL partition(A, izq, der)
        
        Returns:
            Resultado del análisis
        """
        # Limpiar datos previos
        self.clear()
        
        # Agregar símbolos
        self.add_symbol("n", ARRAY_SIZE_DESC)
        self.add_symbol("izq", "índice izquierdo")
        self.add_symbol("der", "índice derecho")
        
        # Simular llamadas a función
        calls = [
            {
                "type": "call",
                "pos": {"line": 1},
                "name": "swap",
                "args": [
                    {"type": "identifier", "name": "A"},
                    {"type": "identifier", "name": "i"},
                    {"type": "identifier", "name": "j"}
                ]
            },
            {
                "type": "call",
                "pos": {"line": 2},
                "name": "partition",
                "args": [
                    {"type": "identifier", "name": "A"},
                    {"type": "identifier", "name": "izq"},
                    {"type": "identifier", "name": "der"}
                ]
            }
        ]
        
        # Analizar cada llamada
        for call in calls:
            self.visit_call_stmt(call, "worst")
        
        # Agregar pasos al procedimiento
        self.add_procedure_step(
            r"Una llamada (CALL o en expresión) suma una constante y los costes de sus argumentos."
        )
        
        return self.result()
    
    def analyze_return_example(self) -> Dict[str, Any]:
        """
        Ejemplo de análisis con return.
        
        Simula:
        1. return i
        2. return A[i] + 1
        
        Returns:
            Resultado del análisis
        """
        # Limpiar datos previos
        self.clear()
        
        # Agregar símbolos
        self.add_symbol("n", ARRAY_SIZE_DESC)
        self.add_symbol("i", "índice")
        
        # Simular returns
        returns = [
            {
                "type": "return",
                "pos": {"line": 1},
                "value": {"type": "identifier", "name": "i"}
            },
            {
                "type": "return",
                "pos": {"line": 2},
                "value": {
                    "type": "binary",
                    "left": {"type": "index", "target": {"type": "identifier", "name": "A"}, "index": {"type": "identifier", "name": "i"}},
                    "operator": "+",
                    "right": {"type": "number", "value": "1"}
                }
            }
        ]
        
        # Analizar cada return
        for return_stmt in returns:
            self.visit_return(return_stmt, "worst")
        
        # Agregar pasos al procedimiento
        self.add_procedure_step(
            r"Un return suma su constante más el coste de evaluar la expresión."
        )
        
        return self.result()


def create_simple_analysis():
    """
    Función de conveniencia para crear un análisis con líneas simples.
    
    Returns:
        AnalyzeOpenResponse con análisis de líneas simples
    """
    analyzer = SimpleAnalyzer()
    return analyzer.analyze_simple_example()


def create_call_analysis():
    """
    Función de conveniencia para crear un análisis con llamadas.
    
    Returns:
        AnalyzeOpenResponse con análisis de llamadas
    """
    analyzer = SimpleAnalyzer()
    return analyzer.analyze_call_example()


def create_return_analysis():
    """
    Función de conveniencia para crear un análisis con returns.
    
    Returns:
        AnalyzeOpenResponse con análisis de returns
    """
    analyzer = SimpleAnalyzer()
    return analyzer.analyze_return_example()


if __name__ == "__main__":
    # Prueba básica
    result = create_simple_analysis()
    print("Análisis de líneas simples creado exitosamente:")
    print(f"T_open: {result['totals']['T_open']}")
    print(f"Número de filas: {len(result['byLine'])}")
    print("\nFilas generadas:")
    for row in result['byLine']:
        print(f"  Línea {row['line']}: {row['kind']} - {row['ck']} - {row['count']}")
    
    print("\n" + "="*50)
    
    # Prueba con llamadas
    result2 = create_call_analysis()
    print("Análisis de llamadas:")
    print(f"T_open: {result2['totals']['T_open']}")
    print(f"Número de filas: {len(result2['byLine'])}")
    
    print("\n" + "="*50)
    
    # Prueba con returns
    result3 = create_return_analysis()
    print("Análisis de returns:")
    print(f"T_open: {result3['totals']['T_open']}")
    print(f"Número de filas: {len(result3['byLine'])}")
