# apps/api/app/analysis/visitors/while_repeat_visitor.py

from typing import Any, Dict, List, Optional


class WhileRepeatVisitor:
    """
    Visitor que implementa las reglas específicas para bucles WHILE y REPEAT.
    
    Implementa:
    - WHILE: condición se evalúa (t_{while_L} + 1) veces, cuerpo se multiplica por t_{while_L}
    - REPEAT: cuerpo se multiplica por (1 + t_{repeat_L}), condición se evalúa (1 + t_{repeat_L}) veces
    """
    
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
    
    def visitWhile(self, node: Dict[str, Any], mode: str = "worst") -> None:
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
            self.visit(body, mode)
        
        self.pop_multiplier()
        
        # 3) Procedimiento
        self.add_procedure_step(
            rf"WHILE@{L}: condición {t}+1 veces; cuerpo multiplicado por {t}."
        )
    
    def visitRepeat(self, node: Dict[str, Any], mode: str = "worst") -> None:
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
            self.visit(body, mode)
        
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
