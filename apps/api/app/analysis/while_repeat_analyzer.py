# apps/api/app/analysis/while_repeat_analyzer.py

from typing import Any, Dict, List, Optional
from .base import BaseAnalyzer

# Constantes para evitar duplicación
ARRAY_SIZE_DESC = "tamaño del arreglo"
INDEX_DESC = "índice"


class WhileRepeatAnalyzer(BaseAnalyzer):
    """
    Analizador que implementa las reglas específicas para bucles WHILE y REPEAT.
    
    Implementa:
    - WHILE: condición se evalúa (t_{while_L} + 1) veces, cuerpo se multiplica por t_{while_L}
    - REPEAT: cuerpo se multiplica por (1 + t_{repeat_L}), condición se evalúa (1 + t_{repeat_L}) veces
    """
    
    def __init__(self):
        super().__init__()
    
    def iter_sym(self, kind: str, line: int) -> str:
        """
        Genera símbolos de iteración deterministas.
        
        Args:
            kind: Tipo de bucle ("while" o "repeat")
            line: Número de línea donde empieza el ciclo
            
        Returns:
            String con el símbolo de iteración (ej: "t_{while_5}", "t_{repeat_10}")
        """
        return rf"t_{{{kind}_{line}}}"
    
    def visit_while(self, node: Dict[str, Any], mode: str = "worst") -> None:
        """
        Visita un bucle WHILE y aplica las reglas de análisis.
        
        Args:
            node: Nodo WHILE del AST
            mode: Modo de análisis
        """
        L = node.get("pos", {}).get("line", 0)
        t = self.iter_sym("while", L)
        
        # 1) Condición: se evalúa (t_{while_L} + 1) veces
        ck_cond = self.C()  # C_{k} para evaluar la condición
        self.add_row(
            line=L,
            kind="while",
            ck=ck_cond,
            count=f"{t} + 1",
            note=f"Condición del bucle while en línea {L}"
        )
        
        # 2) Cuerpo: se ejecuta t_{while_L} veces
        self.push_multiplier(t)  # multiplicador simbólico
        
        # Visitar el cuerpo del bucle
        body = node.get("body")
        if body:
            self._visit_block(body, mode)
        
        self.pop_multiplier()
        
        # 3) Procedimiento
        self.add_procedure_step(
            rf"WHILE@{L}: condición {t}+1 veces; cuerpo multiplicado por {t}."
        )
    
    def visit_repeat(self, node: Dict[str, Any], mode: str = "worst") -> None:
        """
        Visita un bucle REPEAT y aplica las reglas de análisis.
        
        Args:
            node: Nodo REPEAT del AST
            mode: Modo de análisis
        """
        L = node.get("pos", {}).get("line", 0)
        t = self.iter_sym("repeat", L)
        
        # 1) Cuerpo: al menos 1 vez -> (1 + t_{repeat_L})
        self.push_multiplier(f"1 + {t}")
        
        # Visitar el cuerpo del bucle
        body = node.get("body")
        if body:
            self._visit_block(body, mode)
        
        self.pop_multiplier()
        
        # 2) Condición: se evalúa también (1 + t_{repeat_L}) veces
        ck_cond = self.C()
        self.add_row(
            line=L,
            kind="repeat",
            ck=ck_cond,
            count=f"1 + {t}",
            note=f"Condición del bucle repeat en línea {L}"
        )
        
        # 3) Procedimiento
        self.add_procedure_step(
            rf"REPEAT@{L}: cuerpo y condición se evalúan 1+{t} veces."
        )
    
    def _visit_block(self, block: Any, mode: str) -> None:
        """
        Visita un bloque de código.
        
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
            # Condicional IF
            ck = self.C()
            self.add_row(
                line=line,
                kind="if",
                ck=ck,
                count="1",
                note="Condicional if"
            )
        
        elif stmt_type == "while":
            # Bucle while anidado
            self.visit_while(stmt, mode)
        
        elif stmt_type == "repeat":
            # Bucle repeat anidado
            self.visit_repeat(stmt, mode)
        
        elif stmt_type == "for":
            # Bucle for
            ck = self.C()
            self.add_row(
                line=line,
                kind="for",
                ck=ck,
                count="1",
                note="Bucle for"
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
    
    def analyze_while_example(self) -> Dict[str, Any]:
        """
        Ejemplo de análisis con un bucle WHILE.
        
        Simula:
        while (i < n) do
          A[i] <- i * 2
          i <- i + 1
        
        Returns:
            Resultado del análisis
        """
        # Limpiar datos previos
        self.clear()
        
        # Agregar símbolos
        self.add_symbol("n", ARRAY_SIZE_DESC)
        self.add_symbol("i", INDEX_DESC)
        self.add_symbol("t_while_3", "número de iteraciones del bucle while en línea 3")
        
        # Simular un nodo WHILE
        while_node = {
            "type": "while",
            "pos": {"line": 3},
            "condition": {"type": "binary", "left": "i", "operator": "<", "right": "n"},
            "body": [
                {
                    "type": "assign",
                    "pos": {"line": 4},
                    "target": {"type": "index", "target": {"type": "identifier", "name": "A"}, "index": {"type": "identifier", "name": "i"}},
                    "value": {"type": "binary", "left": {"type": "identifier", "name": "i"}, "operator": "*", "right": {"type": "number", "value": "2"}}
                },
                {
                    "type": "assign",
                    "pos": {"line": 5},
                    "target": {"type": "identifier", "name": "i"},
                    "value": {"type": "binary", "left": {"type": "identifier", "name": "i"}, "operator": "+", "right": {"type": "number", "value": "1"}}
                }
            ]
        }
        
        # Analizar el bucle WHILE
        self.visit_while(while_node, "worst")
        
        return self.result()
    
    def analyze_repeat_example(self) -> Dict[str, Any]:
        """
        Ejemplo de análisis con un bucle REPEAT.
        
        Simula:
        repeat
          A[i] <- A[i] + 1
          i <- i + 1
        until (i >= n)
        
        Returns:
            Resultado del análisis
        """
        # Limpiar datos previos
        self.clear()
        
        # Agregar símbolos
        self.add_symbol("n", ARRAY_SIZE_DESC)
        self.add_symbol("i", INDEX_DESC)
        self.add_symbol("t_repeat_2", "número de iteraciones del bucle repeat en línea 2")
        
        # Simular un nodo REPEAT
        repeat_node = {
            "type": "repeat",
            "pos": {"line": 2},
            "body": [
                {
                    "type": "assign",
                    "pos": {"line": 3},
                    "target": {"type": "index", "target": {"type": "identifier", "name": "A"}, "index": {"type": "identifier", "name": "i"}},
                    "value": {"type": "binary", "left": {"type": "index", "target": {"type": "identifier", "name": "A"}, "index": {"type": "identifier", "name": "i"}}, "operator": "+", "right": {"type": "number", "value": "1"}}
                },
                {
                    "type": "assign",
                    "pos": {"line": 4},
                    "target": {"type": "identifier", "name": "i"},
                    "value": {"type": "binary", "left": {"type": "identifier", "name": "i"}, "operator": "+", "right": {"type": "number", "value": "1"}}
                }
            ],
            "condition": {"type": "binary", "left": "i", "operator": ">=", "right": "n"}
        }
        
        # Analizar el bucle REPEAT
        self.visit_repeat(repeat_node, "worst")
        
        return self.result()
    
    def analyze_while_repeat_combined_example(self) -> Dict[str, Any]:
        """
        Ejemplo de análisis que combina bucles WHILE con REPEAT.
        
        Simula:
        while (i < n) do
          repeat
            A[i] <- A[i] + 1
          until (A[i] > 10)
          i <- i + 1
        
        Returns:
            Resultado del análisis
        """
        # Limpiar datos previos
        self.clear()
        
        # Agregar símbolos
        self.add_symbol("n", ARRAY_SIZE_DESC)
        self.add_symbol("i", INDEX_DESC)
        self.add_symbol("t_while_1", "número de iteraciones del bucle while en línea 1")
        self.add_symbol("t_repeat_3", "número de iteraciones del bucle repeat en línea 3")
        
        # Simular bucles WHILE con REPEAT anidado
        while_node = {
            "type": "while",
            "pos": {"line": 1},
            "condition": {"type": "binary", "left": "i", "operator": "<", "right": "n"},
            "body": [
                {
                    "type": "repeat",
                    "pos": {"line": 3},
                    "body": [
                        {
                            "type": "assign",
                            "pos": {"line": 4},
                            "target": {"type": "index", "target": {"type": "identifier", "name": "A"}, "index": {"type": "identifier", "name": "i"}},
                            "value": {"type": "binary", "left": {"type": "index", "target": {"type": "identifier", "name": "A"}, "index": {"type": "identifier", "name": "i"}}, "operator": "+", "right": {"type": "number", "value": "1"}}
                        }
                    ],
                    "condition": {"type": "binary", "left": {"type": "index", "target": {"type": "identifier", "name": "A"}, "index": {"type": "identifier", "name": "i"}}, "operator": ">", "right": {"type": "number", "value": "10"}}
                },
                {
                    "type": "assign",
                    "pos": {"line": 6},
                    "target": {"type": "identifier", "name": "i"},
                    "value": {"type": "binary", "left": {"type": "identifier", "name": "i"}, "operator": "+", "right": {"type": "number", "value": "1"}}
                }
            ]
        }
        
        # Analizar el bucle WHILE con REPEAT anidado
        self.visit_while(while_node, "worst")
        
        return self.result()


def create_while_analysis():
    """
    Función de conveniencia para crear un análisis con bucle WHILE.
    
    Returns:
        AnalyzeOpenResponse con análisis de bucle WHILE
    """
    analyzer = WhileRepeatAnalyzer()
    return analyzer.analyze_while_example()


def create_repeat_analysis():
    """
    Función de conveniencia para crear un análisis con bucle REPEAT.
    
    Returns:
        AnalyzeOpenResponse con análisis de bucle REPEAT
    """
    analyzer = WhileRepeatAnalyzer()
    return analyzer.analyze_repeat_example()


def create_while_repeat_combined_analysis():
    """
    Función de conveniencia para crear un análisis que combina WHILE con REPEAT.
    
    Returns:
        AnalyzeOpenResponse con análisis combinado
    """
    analyzer = WhileRepeatAnalyzer()
    return analyzer.analyze_while_repeat_combined_example()


if __name__ == "__main__":
    # Prueba básica
    result = create_while_analysis()
    print("Análisis de bucle WHILE creado exitosamente:")
    print(f"T_open: {result['totals']['T_open']}")
    print(f"Número de filas: {len(result['byLine'])}")
    print("\nFilas generadas:")
    for row in result['byLine']:
        print(f"  Línea {row['line']}: {row['kind']} - {row['ck']} - {row['count']}")
    
    print("\n" + "="*50)
    
    # Prueba con REPEAT
    result2 = create_repeat_analysis()
    print("Análisis de bucle REPEAT:")
    print(f"T_open: {result2['totals']['T_open']}")
    print(f"Número de filas: {len(result2['byLine'])}")
    
    print("\n" + "="*50)
    
    # Prueba combinada
    result3 = create_while_repeat_combined_analysis()
    print("Análisis de bucles WHILE con REPEAT anidado:")
    print(f"T_open: {result3['totals']['T_open']}")
    print(f"Número de filas: {len(result3['byLine'])}")
