# apps/api/app/analysis/if_analyzer.py

from typing import Any, Dict, List, Optional
from .base import BaseAnalyzer


class IfAnalyzer(BaseAnalyzer):
    """
    Analizador que implementa las reglas específicas para condicionales IF.
    
    Implementa:
    - Guardia del if: siempre se evalúa una vez
    - Rama THEN: líneas internas, ya multiplicadas por bucles activos
    - Rama ELSE: igual que THEN (si existe)
    - En peor caso: tomar la rama dominante (la que "cuesta más")
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
    
    def visit_if(self, node: Dict[str, Any], mode: str = "worst") -> None:
        """
        Visita un nodo IF y aplica las reglas de análisis.
        
        Args:
            node: Nodo IF del AST
            mode: Modo de análisis ("worst", "best", "avg")
        """
        # Extraer información del nodo IF
        line = node.get("pos", {}).get("line", 0)
        consequent = node.get("consequent")  # bloque THEN
        alternate = node.get("alternate")  # bloque ELSE (opcional)
        
        # 1) Guardia: siempre se evalúa una vez
        ck_guard = self.C()  # generar siguiente constante
        self.add_row(
            line=line,
            kind="if",
            ck=ck_guard,
            count="1",
            note="Evaluación de la condición"
        )
        
        # Helper para ejecutar un bloque y extraer solo las filas nuevas
        def run_block_to_buffer(block_node):
            # Guardar estado de rows para extraer solo lo nuevo
            start = len(self.rows)
            # Visitar el bloque sobre el mismo contexto (loop_stack se respeta)
            if block_node:
                self._visit_block(block_node, mode)
            # Extraer lo recién agregado
            new_rows = self.rows[start:]
            # Removerlos de rows para decidir luego qué rama se queda
            self.rows = self.rows[:start]
            return new_rows
        
        # 2) THEN y 3) ELSE -> buffers
        then_buf = run_block_to_buffer(consequent)
        else_buf = run_block_to_buffer(alternate)
        
        # 4) Elegir rama dominante (worst)
        if mode == "worst":
            if not else_buf:
                chosen = then_buf
                annotate = "worst: then (no else)"
            else:
                # Heurística simple: más filas => más "peso"
                chosen = then_buf if len(then_buf) >= len(else_buf) else else_buf
                annotate = "worst: max(then, else)"
            
            # Anotar en la primera fila elegida
            if chosen:
                chosen[0] = {**chosen[0], "note": annotate}
            self.rows.extend(chosen)
        
        # 5) Procedure
        self.add_procedure_step(
            r"IF: guardia evaluada una vez; en peor caso se toma \max(\text{then}, \text{else})."
        )
    
    def _visit_block(self, block: Any, mode: str) -> None:
        """
        Visita un bloque de código (THEN o ELSE).
        
        Args:
            block: Bloque de código (puede ser una lista de statements o un solo statement)
            mode: Modo de análisis
        """
        if isinstance(block, list):
            # Múltiples statements
            for stmt in block:
                self._visit_statement(stmt, mode)
        else:
            # Un solo statement
            self._visit_statement(block, mode)
    
    def _visit_statement(self, stmt: Dict[str, Any], mode: str) -> None:
        """
        Visita un statement individual.
        
        Args:
            stmt: Statement del AST
            mode: Modo de análisis
        """
        stmt_type = stmt.get("type", "unknown")
        line = stmt.get("pos", {}).get("line", 0)
        
        if stmt_type == "assign":
            # Asignación
            ck = self.C()
            self.add_row(
                line=line,
                kind="assign",
                ck=ck,
                count="1",
                note="Asignación"
            )
        
        elif stmt_type == "if":
            # Condicional anidado
            self.visit_if(stmt, mode)
        
        elif stmt_type == "for":
            # Bucle for
            ck = self.C()
            self.add_row(
                line=line,
                kind="for",
                ck=ck,
                count="1",  # Por ahora, se implementará en la siguiente micro
                note="Bucle for"
            )
        
        elif stmt_type == "while":
            # Bucle while
            ck = self.C()
            self.add_row(
                line=line,
                kind="while",
                ck=ck,
                count="1",  # Por ahora, se implementará en la siguiente micro
                note="Bucle while"
            )
        
        elif stmt_type == "call":
            # Llamada a función
            ck = self.C()
            self.add_row(
                line=line,
                kind="call",
                ck=ck,
                count="1",
                note="Llamada a función"
            )
        
        elif stmt_type == "return":
            # Return
            ck = self.C()
            self.add_row(
                line=line,
                kind="return",
                ck=ck,
                count="1",
                note="Return"
            )
        
        else:
            # Statement desconocido
            ck = self.C()
            self.add_row(
                line=line,
                kind="other",
                ck=ck,
                count="1",
                note=f"Statement {stmt_type}"
            )
    
    def analyze_if_example(self) -> Dict[str, Any]:
        """
        Ejemplo de análisis con un condicional IF simple.
        
        Returns:
            Resultado del análisis
        """
        # Limpiar datos previos
        self.clear()
        
        # Agregar símbolos
        self.add_symbol("n", "tamaño del arreglo")
        self.add_symbol("pivot", "valor pivote")
        
        # Simular un nodo IF: if (A[j] <= pivot)
        if_node = {
            "type": "if",
            "pos": {"line": 5},
            "condition": {"type": "binary", "left": "A[j]", "operator": "<=", "right": "pivot"},
            "consequent": [
                {
                    "type": "assign",
                    "pos": {"line": 6},
                    "left": "temp",
                    "right": "A[j]"
                },
                {
                    "type": "assign",
                    "pos": {"line": 7},
                    "left": "A[j]",
                    "right": "A[i]"
                }
            ],
            "alternate": None  # No hay else
        }
        
        # Analizar el condicional IF
        self.visit_if(if_node, "worst")
        
        return self.result()
    
    def analyze_if_with_else_example(self) -> Dict[str, Any]:
        """
        Ejemplo de análisis con un condicional IF con ELSE.
        
        Returns:
            Resultado del análisis
        """
        # Limpiar datos previos
        self.clear()
        
        # Agregar símbolos
        self.add_symbol("n", "tamaño del arreglo")
        self.add_symbol("target", "valor objetivo")
        
        # Simular un nodo IF con ELSE: if (A[i] == target) then ... else ...
        if_node = {
            "type": "if",
            "pos": {"line": 3},
            "condition": {"type": "binary", "left": "A[i]", "operator": "==", "right": "target"},
            "consequent": [
                {
                    "type": "assign",
                    "pos": {"line": 4},
                    "left": "found",
                    "right": "true"
                }
            ],
            "alternate": [
                {
                    "type": "assign",
                    "pos": {"line": 6},
                    "left": "found",
                    "right": "false"
                },
                {
                    "type": "assign",
                    "pos": {"line": 7},
                    "left": "i",
                    "right": "i + 1"
                }
            ]
        }
        
        # Analizar el condicional IF con ELSE
        self.visit_if(if_node, "worst")
        
        return self.result()


def create_if_analysis():
    """
    Función de conveniencia para crear un análisis con condicional IF.
    
    Returns:
        AnalyzeOpenResponse con análisis de condicional IF
    """
    analyzer = IfAnalyzer()
    return analyzer.analyze_if_example()


def create_if_with_else_analysis():
    """
    Función de conveniencia para crear un análisis con condicional IF con ELSE.
    
    Returns:
        AnalyzeOpenResponse con análisis de condicional IF con ELSE
    """
    analyzer = IfAnalyzer()
    return analyzer.analyze_if_with_else_example()


if __name__ == "__main__":
    # Prueba básica
    result = create_if_analysis()
    print("Análisis de condicional IF creado exitosamente:")
    print(f"T_open: {result['totals']['T_open']}")
    print(f"Número de filas: {len(result['byLine'])}")
    print(f"Procedimiento: {len(result['totals']['procedure'])} pasos")
    
    print("\n" + "="*50)
    
    # Prueba con ELSE
    result2 = create_if_with_else_analysis()
    print("Análisis de condicional IF con ELSE:")
    print(f"T_open: {result2['totals']['T_open']}")
    print(f"Número de filas: {len(result2['byLine'])}")
    print(f"Procedimiento: {len(result2['totals']['procedure'])} pasos")
