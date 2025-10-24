# apps/api/app/analysis/for_if_combined_example.py

from typing import Any, Dict
from .for_analyzer import ForAnalyzer


class ForIfCombinedAnalyzer(ForAnalyzer):
    """
    Analizador que combina bucles FOR con condicionales IF.
    
    Demuestra cómo funcionan juntos los multiplicadores de bucles
    y la selección de ramas dominantes en condicionales.
    """
    
    def __init__(self):
        super().__init__()
    
    def _visit_statement(self, stmt: Dict[str, Any], mode: str) -> None:
        """
        Visita un statement individual, incluyendo condicionales IF.
        
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
            # Condicional IF
            self.visit_if(stmt, mode)
        
        elif stmt_type == "for":
            # Bucle for
            self.visit_for(stmt, mode)
        
        elif stmt_type == "while":
            # Bucle while
            ck = self.C()
            self.add_row(
                line=line,
                kind="while",
                ck=ck,
                count="1",
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
    
    def analyze_for_if_combined_example(self) -> Dict[str, Any]:
        """
        Ejemplo de análisis que combina bucles FOR con condicionales IF.
        
        Simula: for j <- izq TO der - 1
                  if (A[j] <= pivot) then
                    temp <- A[j]
                    A[j] <- A[i]
                    i <- i + 1
        
        Returns:
            Resultado del análisis
        """
        # Limpiar datos previos
        self.clear()
        
        # Agregar símbolos
        self.add_symbol("n", "tamaño del arreglo")
        self.add_symbol("izq", "índice izquierdo")
        self.add_symbol("der", "índice derecho")
        self.add_symbol("pivot", "valor pivote")
        
        # Simular bucles FOR con IF anidado
        for_node = {
            "type": "for",
            "pos": {"line": 5},
            "var": "j",
            "start": "izq",
            "end": {"type": "binary", "left": "der", "operator": "-", "right": "1"},
            "body": [
                {
                    "type": "if",
                    "pos": {"line": 6},
                    "condition": {"type": "binary", "left": "A[j]", "operator": "<=", "right": "pivot"},
                    "consequent": [
                        {
                            "type": "assign",
                            "pos": {"line": 7},
                            "left": "temp",
                            "right": "A[j]"
                        },
                        {
                            "type": "assign",
                            "pos": {"line": 8},
                            "left": "A[j]",
                            "right": "A[i]"
                        },
                        {
                            "type": "assign",
                            "pos": {"line": 9},
                            "left": "i",
                            "right": {"type": "binary", "left": "i", "operator": "+", "right": "1"}
                        }
                    ],
                    "alternate": None  # No hay else
                }
            ]
        }
        
        # Analizar el bucle FOR con IF anidado
        self.visit_for(for_node, "worst")
        
        return self.result()


def create_for_if_combined_analysis():
    """
    Función de conveniencia para crear un análisis que combina FOR con IF.
    
    Returns:
        AnalyzeOpenResponse con análisis combinado
    """
    analyzer = ForIfCombinedAnalyzer()
    return analyzer.analyze_for_if_combined_example()


if __name__ == "__main__":
    # Prueba con FOR e IF combinados
    result = create_for_if_combined_analysis()
    print("Análisis de bucle FOR con IF anidado:")
    print(f"T_open: {result['totals']['T_open']}")
    print(f"Número de filas: {len(result['byLine'])}")
    print("\nFilas generadas:")
    for row in result['byLine']:
        print(f"  Línea {row['line']}: {row['kind']} - {row['ck']} - {row['count']} - {row['note']}")
    
    print("\nProcedimiento:")
    for i, step in enumerate(result['totals']['procedure'], 1):
        print(f"  {i}. {step}")
