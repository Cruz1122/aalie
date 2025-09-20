def parse_expr(expr):
    # Ejemplo simple: evalúa la expresión matemática
    # En producción, deberías usar un parser seguro
    try:
        return eval(expr)
    except Exception as e:
        return f"Error: {e}"
