# apps/api/app/analysis/for_analyzer.py

from typing import Any, Dict, List, Optional
from .base import BaseAnalyzer


class ForAnalyzer(BaseAnalyzer):
    """
    Analizador que implementa las reglas específicas para bucles FOR.
    
    Implementa:
    - Cabecera del for: (b - a + 2) evaluaciones
    - Cuerpo del for: multiplicado por Σ_{v=a}^{b} 1
    - Procedimiento explicativo
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
    
    def visit_for(self, node: Dict[str, Any], mode: str = "worst") -> None:
        """
        Visita un nodo FOR y aplica las reglas de análisis.
        
        Args:
            node: Nodo FOR del AST
            mode: Modo de análisis ("worst", "best", "avg")
        """
        # Extraer información del nodo FOR
        line = node.get("pos", {}).get("line", 0)
        var = node.get("var", "i")  # variable del bucle
        start_expr = node.get("start")  # expresión de inicio
        end_expr = node.get("end")  # expresión de fin
        body = node.get("body")  # cuerpo del bucle
        
        # Convertir expresiones a strings
        a = self._expr_to_str(start_expr)
        b = self._expr_to_str(end_expr)
        
        # 1) Cabecera del for: (b - a + 2) evaluaciones
        ck_header = self.C()  # generar siguiente constante
        header_count = f"({b}) - ({a}) + 2"
        
        self.add_row(
            line=line,
            kind="for",
            ck=ck_header,
            count=header_count,
            note=f"Cabecera del bucle for {var}={a}..{b}"
        )
        
        # 2) Multiplicador del cuerpo: Σ_{v=a}^{b} 1
        mult = f"\\sum_{{{var}={a}}}^{{{b}}} 1"
        self.push_multiplier(mult)
        
        # 3) Visitar el cuerpo del bucle
        if body:
            self._visit_body(body, mode)
        
        # 4) Salir del contexto del bucle
        self.pop_multiplier()
        
        # 5) Agregar pasos al procedimiento
        self.add_procedure_step(
            rf"En \textbf{{for}}\, {var}={a}\ldots{b}, cabecera: ({b})-({a})+2."
        )
        self.add_procedure_step(
            rf"Cuerpo multiplicado por \sum_{{{var}={a}}}^{{{b}}} 1."
        )
    
    def _visit_body(self, body: Any, mode: str) -> None:
        """
        Visita el cuerpo de un bucle.
        
        Args:
            body: Cuerpo del bucle (puede ser una lista de statements o un solo statement)
            mode: Modo de análisis
        """
        if isinstance(body, list):
            # Múltiples statements
            for stmt in body:
                self._visit_statement(stmt, mode)
        else:
            # Un solo statement
            self._visit_statement(body, mode)
    
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
            # Condicional
            ck = self.C()
            self.add_row(
                line=line,
                kind="if",
                ck=ck,
                count="1",
                note="Condicional if"
            )
            
            # Visitar el cuerpo del if si existe
            if_body = stmt.get("then")
            if if_body:
                self._visit_body(if_body, mode)
        
        elif stmt_type == "for":
            # Bucle anidado
            self.visit_for(stmt, mode)
        
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
    
    def analyze_for_example(self) -> Dict[str, Any]:
        """
        Ejemplo de análisis con un bucle FOR simple.
        
        Returns:
            Resultado del análisis
        """
        # Limpiar datos previos
        self.clear()
        
        # Agregar símbolos
        self.add_symbol("n", "tamaño del arreglo")
        self.add_symbol("izq", "índice izquierdo")
        self.add_symbol("der", "índice derecho")
        
        # Simular un nodo FOR: for j <- izq TO der - 1
        for_node = {
            "type": "for",
            "pos": {"line": 5},
            "var": "j",
            "start": "izq",
            "end": {"type": "binary", "left": "der", "operator": "-", "right": "1"},
            "body": [
                {
                    "type": "assign",
                    "pos": {"line": 6},
                    "left": "temp",
                    "right": {"type": "identifier", "name": "A", "index": {"type": "identifier", "name": "j"}}
                },
                {
                    "type": "assign",
                    "pos": {"line": 7},
                    "left": {"type": "identifier", "name": "A", "index": {"type": "identifier", "name": "j"}},
                    "right": {"type": "identifier", "name": "A", "index": {"type": "identifier", "name": "i"}}
                }
            ]
        }
        
        # Analizar el bucle FOR
        self.visit_for(for_node, "worst")
        
        return self.result()


def create_for_analysis():
    """
    Función de conveniencia para crear un análisis con bucle FOR.
    
    Returns:
        AnalyzeOpenResponse con análisis de bucle FOR
    """
    analyzer = ForAnalyzer()
    return analyzer.analyze_for_example()


if __name__ == "__main__":
    # Prueba básica
    result = create_for_analysis()
    print("Análisis de bucle FOR creado exitosamente:")
    print(f"T_open: {result['totals']['T_open']}")
    print(f"Número de filas: {len(result['byLine'])}")
    print(f"Procedimiento: {len(result['totals']['procedure'])} pasos")
