# apps/api/app/analysis/base.py

from typing import List, Dict, Any, Optional

# Tipos de datos que espejan el contrato ya implementado
LineCost = Dict[str, Any]
AnalyzeOpenResponse = Dict[str, Any]


class BaseAnalyzer:
    """
    Clase base con utilidades para análisis de algoritmos.
    
    Proporciona funcionalidades para:
    - Agregar filas de la tabla por línea
    - Aplicar multiplicadores de bucles (stack)
    - Construir la ecuación de eficiencia T_open = Σ C_{k}·count_{k}
    - Registrar el procedimiento (pasos) que llevaron a T_open
    - Memoización sencilla (PD) por nodo+contexto
    """
    
    def __init__(self):
        self.rows: List[LineCost] = []      # tabla por línea
        self.loop_stack: List[str] = []     # multiplicadores activos (strings KaTeX)
        self.procedure: List[str] = []      # pasos KaTeX/strings breves
        self.symbols: Dict[str, str] = {}   # ej: { "n": "length(A)" }
        self.notes: List[str] = []          # reglas aplicadas / comentarios
        self.memo: Dict[str, List[LineCost]] = {}  # PD: cache de filas por nodo+contexto
        
        # Inicializar procedimiento básico
        self._init_procedure()

    def _init_procedure(self):
        """Inicializa los pasos básicos del procedimiento."""
        self.procedure = [
            r"1) Se asignan costos constantes C_{1}, C_{2}, \ldots",
            r"2) Se extraen por línea los costos C_{k} y los conteos #ejecuciones",
            r"3) Se multiplican los conteos por los iteradores activos (for/while/repeat)",
            r"4) Se suman los términos para formar T_{\text{open}}"
        ]

    # --- util 1: agregar fila ---
    def add_row(self, line: int, kind: str, ck: str, count: str, note: Optional[str] = None):
        """
        Inserta una fila aplicando el multiplicador del contexto de bucles.
        
        Args:
            line: Número de línea
            kind: Tipo de instrucción (assign, for, while, if, etc.)
            ck: Costo individual de la línea (string KaTeX)
            count: Número de ejecuciones (string KaTeX)
            note: Nota opcional sobre la línea
        """
        # Aplicar multiplicadores del stack de bucles
        mult = "*".join([f"({m})" for m in self.loop_stack]) if self.loop_stack else ""
        final_count = f"({count})*{mult}" if mult else f"{count}"
        
        row = {
            "line": line,
            "kind": kind,
            "ck": ck,              # Ej: "C_{2} + C_{3}"
            "count": final_count,  # Ej: "n", "(n)*(\sum ...)"
            "note": note
        }
        
        self.rows.append(row)

    # --- util 2: gestionar contexto de bucles ---
    def push_multiplier(self, m: str):
        """
        Activa un multiplicador (p.ej., iteraciones de un for).
        
        Args:
            m: Multiplicador en formato KaTeX (ej: "\\sum_{i=1}^{n} 1")
        """
        self.loop_stack.append(m)

    def pop_multiplier(self):
        """Desactiva el último multiplicador."""
        if self.loop_stack:
            self.loop_stack.pop()

    # --- util 3: ensamblar T_open ---
    def build_t_open(self) -> str:
        """
        Construye la ecuación T_open = Σ C_{k}·count_{k} en formato KaTeX.
        
        Returns:
            String con la ecuación de eficiencia en formato KaTeX
        """
        if not self.rows:
            return "0"
        
        terms = []
        for r in self.rows:
            if r['ck'] != "—" and r['count'] != "—":
                term = f"({r['ck']})\\cdot({r['count']})"
                terms.append(term)
        
        return " + ".join(terms) if terms else "0"

    # --- util 4: emitir respuesta estándar ---
    def result(self) -> AnalyzeOpenResponse:
        """
        Genera la respuesta estándar del análisis.
        
        Returns:
            Diccionario que cumple el contrato AnalyzeOpenResponse
        """
        return {
            "ok": True,
            "byLine": self.rows,
            "totals": {
                "T_open": self.build_t_open(),
                "procedure": self.procedure,
                "symbols": self.symbols if self.symbols else None,
                "notes": self.notes if self.notes else None
            }
        }

    # --- util 5: memoización (PD) ---
    def memo_key(self, node: Any, mode: str, ctx_hash: str) -> str:
        """
        Genera clave estable para cachear filas de un subárbol bajo un contexto.
        
        Args:
            node: Nodo del AST
            mode: Modo de análisis (ej: "recursive", "iterative")
            ctx_hash: Hash del contexto actual
            
        Returns:
            Clave única para el cache
        """
        nid = getattr(node, "id", None) or str(id(node))
        return f"{nid}|{mode}|{ctx_hash}"

    def memo_get(self, key: str) -> Optional[List[LineCost]]:
        """
        Obtiene filas del cache.
        
        Args:
            key: Clave del cache
            
        Returns:
            Lista de filas cacheadas o None si no existe
        """
        return self.memo.get(key)

    def memo_set(self, key: str, rows: List[LineCost]):
        """
        Guarda filas en el cache.
        
        Args:
            key: Clave del cache
            rows: Lista de filas a cachear
        """
        # Guardar una copia superficial para evitar aliasing accidental
        self.memo[key] = [dict(r) for r in rows]

    # --- utilidades adicionales ---
    def add_symbol(self, symbol: str, description: str):
        """
        Agrega un símbolo con su descripción.
        
        Args:
            symbol: Símbolo matemático (ej: "n", "m", "k")
            description: Descripción del símbolo (ej: "length(A)", "number of iterations")
        """
        self.symbols[symbol] = description

    def add_note(self, note: str):
        """
        Agrega una nota al análisis.
        
        Args:
            note: Nota descriptiva
        """
        self.notes.append(note)

    def add_procedure_step(self, step: str):
        """
        Agrega un paso al procedimiento.
        
        Args:
            step: Paso del procedimiento en formato KaTeX
        """
        self.procedure.append(step)

    def clear(self):
        """Limpia todos los datos del analizador."""
        self.rows.clear()
        self.loop_stack.clear()
        self.procedure.clear()
        self.symbols.clear()
        self.notes.clear()
        self.memo.clear()
        self._init_procedure()

    def get_context_hash(self) -> str:
        """
        Genera un hash del contexto actual (loop_stack).
        
        Returns:
            String hash del contexto
        """
        return "|".join(self.loop_stack) if self.loop_stack else "root"
