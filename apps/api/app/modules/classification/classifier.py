"""
Módulo para clasificación de algoritmos basado en AST.

Este módulo es la fuente única de verdad para detectar si un algoritmo
es iterativo, recursivo, híbrido o desconocido.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""

from typing import Any, Dict, List, Optional


def detect_algorithm_kind(ast: Dict[str, Any]) -> str:
    """
    Detecta la clase de un algoritmo a partir de su AST.

    Esta función centraliza la lógica de clasificación y determina si el
    algoritmo analizado utiliza estructuras iterativas, llamadas recursivas,
    una combinación de ambas o si no se puede establecer una categoría.

    Args:
        ast: Árbol de sintaxis abstracta del programa ya parseado.

    Returns:
        Cadena con la clase detectada del algoritmo: "iterative",
        "recursive", "hybrid" o "unknown".

    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    # Buscar construcciones iterativas
    has_iterative = _has_iterative_constructs(ast)

    # Buscar procedimiento y llamadas recursivas
    proc_def = _find_procedure_definition(ast)
    has_recursive = False

    if proc_def:
        proc_name = proc_def.get("name")
        if proc_name:
            has_recursive = _has_recursive_calls(proc_def, proc_name)

    # Clasificar
    if has_iterative and has_recursive:
        return "hybrid"
    elif has_recursive:
        return "recursive"
    elif has_iterative:
        return "iterative"
    else:
        return "unknown"


def _has_iterative_constructs(ast: Dict[str, Any]) -> bool:
    """
    Verifica si el AST contiene construcciones iterativas.

    Se consideran iterativas las estructuras For, While y Repeat.

    Args:
        ast: Árbol de sintaxis abstracta del programa.

    Returns:
        True si encuentra al menos una construcción iterativa;
        en caso contrario, False.

    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    return _find_node_type(ast, ["For", "While", "Repeat"])


def _find_node_type(node: Any, target_types: List[str]) -> bool:
    """
    Busca de forma recursiva tipos de nodo específicos dentro del AST.

    Args:
        node: Nodo actual del AST. Puede ser un diccionario, una lista o un
            valor primitivo.
        target_types: Lista de tipos de nodo que se desean localizar, por
            ejemplo ["For", "While"].

    Returns:
        True si encuentra al menos uno de los tipos indicados;
        en caso contrario, False.

    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    if not isinstance(node, dict):
        return False

    node_type = node.get("type", "")
    if node_type in target_types:
        return True

    # Buscar recursivamente en todos los campos
    for key, value in node.items():
        # Saltar campos que no contienen nodos hijos relevantes
        if key in ["type", "pos"]:
            continue

        if isinstance(value, list):
            for item in value:
                if _find_node_type(item, target_types):
                    return True
        elif isinstance(value, dict):
            if _find_node_type(value, target_types):
                return True

    return False


def _find_procedure_definition(ast: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Encuentra la primera definición de procedimiento en el AST.

    Args:
        ast: Árbol de sintaxis abstracta del programa.

    Returns:
        Nodo ProcDef correspondiente al procedimiento encontrado o None
        si el árbol no contiene una definición de procedimiento.

    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    body = ast.get("body", [])
    if not isinstance(body, list):
        return None

    for item in body:
        if isinstance(item, dict) and item.get("type") == "ProcDef":
            return item

    return None


def _has_recursive_calls(proc_def: Dict[str, Any], proc_name: str) -> bool:
    """
    Verifica si un procedimiento contiene llamadas recursivas a sí mismo.

    Args:
        proc_def: Nodo ProcDef del procedimiento a inspeccionar.
        proc_name: Nombre del procedimiento que se usará como referencia.

    Returns:
        True si encuentra al menos una llamada recursiva al mismo
        procedimiento; en caso contrario, False.

    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    # Obtener el cuerpo del procedimiento
    proc_body = (
        proc_def.get("body")
        or proc_def.get("block")
        or proc_def.get("statements")
        or proc_def
    )

    return _search_recursive_calls(proc_body, proc_name)


def _search_recursive_calls(node: Any, proc_name: str) -> bool:
    """
    Busca de forma recursiva llamadas a un procedimiento dentro del árbol.

    Args:
        node: Nodo del AST desde el que inicia la búsqueda.
        proc_name: Nombre del procedimiento que debe coincidir con la llamada.

    Returns:
        True si encuentra una llamada recursiva al procedimiento indicado;
        en caso contrario, False.

    Author: Juan Camilo Cruz Parra (@Cruz1122)
    """
    if not isinstance(node, dict):
        return False

    node_type = node.get("type", "")

    # Verificar si es un nodo Call
    if node_type == "Call":
        # Buscar el nombre de la llamada en múltiples campos posibles
        call_name = (
            node.get("name")
            or node.get("callee")
            or node.get("function")
            or (
                node.get("target", {}).get("name")
                if isinstance(node.get("target"), dict)
                else None
            )
        )
        # Comparar sin importar mayúsculas/minúsculas
        if call_name and call_name.lower() == proc_name.lower():
            return True

    # Buscar recursivamente en todos los campos
    for key, value in node.items():
        # Saltar campos que no contienen nodos hijos relevantes
        if key in ["type", "pos"]:
            continue

        if isinstance(value, list):
            for item in value:
                if _search_recursive_calls(item, proc_name):
                    return True
        elif isinstance(value, dict):
            if _search_recursive_calls(value, proc_name):
                return True

    return False
