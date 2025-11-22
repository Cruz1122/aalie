"""
Módulo para clasificación de algoritmos basado en AST.

Este módulo es la fuente única de verdad para detectar si un algoritmo
es iterative, recursive, hybrid o unknown.
"""
from typing import Any, Dict, List, Optional


def detect_algorithm_kind(ast: Dict[str, Any]) -> str:
    """
    Detecta el tipo de algoritmo desde el AST.
    
    Fuente única de verdad para clasificación de algoritmos.
    
    Args:
        ast: AST del programa parseado
        
    Returns:
        "iterative", "recursive", "hybrid", o "unknown"
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
    Verifica si el AST contiene construcciones iterativas (For, While, Repeat).
    
    Args:
        ast: AST del programa
        
    Returns:
        True si encuentra construcciones iterativas
    """
    return _find_node_type(ast, ["For", "While", "Repeat"])


def _find_node_type(node: Any, target_types: List[str]) -> bool:
    """
    Busca recursivamente un tipo de nodo en el AST.
    
    Args:
        node: Nodo del AST (puede ser dict, list, o valor primitivo)
        target_types: Lista de tipos de nodo a buscar (ej: ["For", "While"])
        
    Returns:
        True si encuentra al menos uno de los tipos buscados
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
    Encuentra la definición del procedimiento principal en el AST.
    
    Args:
        ast: AST del programa
        
    Returns:
        Nodo ProcDef del procedimiento principal o None si no se encuentra
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
    Verifica si un procedimiento tiene llamadas recursivas a sí mismo.
    
    Args:
        proc_def: Nodo ProcDef del procedimiento
        proc_name: Nombre del procedimiento
        
    Returns:
        True si encuentra al menos una llamada recursiva
    """
    # Obtener el cuerpo del procedimiento
    proc_body = (
        proc_def.get("body") or 
        proc_def.get("block") or 
        proc_def.get("statements") or
        proc_def
    )
    
    return _search_recursive_calls(proc_body, proc_name)


def _search_recursive_calls(node: Any, proc_name: str) -> bool:
    """
    Busca recursivamente llamadas a proc_name en el árbol de nodos.
    
    Args:
        node: Nodo del AST donde buscar
        proc_name: Nombre del procedimiento a buscar
        
    Returns:
        True si encuentra una llamada recursiva
    """
    if not isinstance(node, dict):
        return False
    
    node_type = node.get("type", "")
    
    # Verificar si es un nodo Call
    if node_type == "Call":
        # Buscar el nombre de la llamada en múltiples campos posibles
        call_name = (
            node.get("name") or 
            node.get("callee") or 
            node.get("function") or
            (node.get("target", {}).get("name") if isinstance(node.get("target"), dict) else None)
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

