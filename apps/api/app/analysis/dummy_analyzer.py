# apps/api/app/analysis/dummy_analyzer.py

from .base import BaseAnalyzer


class DummyAnalyzer(BaseAnalyzer):
    """
    Analizador dummy para probar la funcionalidad de BaseAnalyzer.
    
    Simula un análisis simple con algunas líneas de código.
    """
    
    def analyze(self):
        """
        Realiza un análisis dummy con líneas de ejemplo.
        """
        # Limpiar datos previos
        self.clear()
        
        # Agregar símbolos
        self.add_symbol("n", "tamaño del arreglo")
        self.add_symbol("C_1", "costo de asignación")
        self.add_symbol("C_2", "costo de comparación")
        self.add_symbol("C_3", "costo de incremento")
        
        # Agregar notas
        self.add_note("Análisis dummy para demostrar funcionalidad")
        self.add_note("Se asumen costos constantes por operación")
        
        # Línea 1: Declaración de variable
        self.add_row(
            line=1,
            kind="decl",
            ck="C_1",
            count="1",
            note="Declaración de variable i"
        )
        
        # Línea 2: Asignación inicial
        self.add_row(
            line=2,
            kind="assign",
            ck="C_1",
            count="1",
            note="Inicialización de i = 0"
        )
        
        # Línea 3: Inicio del bucle for
        self.add_row(
            line=3,
            kind="for",
            ck="C_2",
            count="n + 1",
            note="Condición del bucle for (se evalúa n+1 veces)"
        )
        
        # Entrar al contexto del bucle
        self.push_multiplier("n")
        
        # Línea 4: Cuerpo del bucle - asignación
        self.add_row(
            line=4,
            kind="assign",
            ck="C_1",
            count="1",
            note="Asignación dentro del bucle"
        )
        
        # Línea 5: Cuerpo del bucle - incremento
        self.add_row(
            line=5,
            kind="assign",
            ck="C_3",
            count="1",
            note="Incremento de i"
        )
        
        # Salir del contexto del bucle
        self.pop_multiplier()
        
        # Línea 6: Return
        self.add_row(
            line=6,
            kind="return",
            ck="C_1",
            count="1",
            note="Retorno de la función"
        )
        
        # Agregar pasos específicos del procedimiento
        self.add_procedure_step(r"5) Se identifican las líneas con costos constantes")
        self.add_procedure_step(r"6) Se aplica el multiplicador del bucle for a las líneas 4-5")
        self.add_procedure_step(r"7) Se construye la ecuación final: T_{\text{open}} = C_1 + C_1 + C_2(n+1) + n(C_1 + C_3) + C_1")
        
        return self.result()


def create_dummy_analysis():
    """
    Función de conveniencia para crear un análisis dummy.
    
    Returns:
        AnalyzeOpenResponse con datos de ejemplo
    """
    analyzer = DummyAnalyzer()
    return analyzer.analyze()


if __name__ == "__main__":
    # Prueba básica
    result = create_dummy_analysis()
    print("Análisis dummy creado exitosamente:")
    print(f"T_open: {result['totals']['T_open']}")
    print(f"Número de filas: {len(result['byLine'])}")
    print(f"Procedimiento: {len(result['totals']['procedure'])} pasos")
