# apps/api/app/analysis/llm_simplifier.py

import os
import json
from typing import List, Dict, Any, Optional
import httpx
from dotenv import load_dotenv

# Cargar variables de entorno desde .env (respaldo si main.py no lo ha hecho)
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
load_dotenv(env_path)


def _call_gemini_api(
    prompt: str,
    *,
    model: str,
    max_retries: int = 1,
    temperature: float = 0.0,
    top_p: float = 0.0,
    top_k: int = 1,
    max_output_tokens: int = 8000,
    response_mime_type: str = "application/json"
) -> Optional[Dict[str, Any]]:
    """
    Llama directamente a la API de Gemini para simplificar expresiones.
    
    Args:
        prompt: Prompt para el LLM
        max_retries: Número máximo de reintentos (total 2 intentos)
        
    Returns:
        Respuesta del LLM como diccionario, o None si falla
    """
    api_key = os.getenv("API_KEY")
    if not api_key:
        print("[LLM Simplifier] ERROR: API_KEY no encontrada en variables de entorno")
        return None
    
    print(
        f"[LLM Simplifier] Llamando a Gemini API ({model}) con {len(prompt)} caracteres de prompt"
    )
    
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent"
    )
    headers = {
        "Content-Type": "application/json",
    }
    
    system_instruction = {
        "parts": [{
            "text": """Eres un asistente especializado en simplificar expresiones matemáticas de análisis de algoritmos.

TAREA:
1. Simplificar las sumatorias en formato LaTeX a expresiones algebraicas
2. Simplificar expresiones algebraicas generales (eliminar paréntesis innecesarios, simplificar operaciones)
3. Generar la forma polinómica final T(n) = an² + bn + c

REGLAS CRÍTICAS DE NOTACIÓN:
- RESPETA la notación original: si la entrada usa 'n', mantén 'n'; si usa 'N', mantén 'N'
- NO cambies n por N ni viceversa
- NO cambies mayúsculas por minúsculas ni viceversa
- Mantén las variables exactamente como aparecen en la entrada

REGLAS DE SIMPLIFICACIÓN DE SUMATORIAS:
- \\sum_{i=1}^{n} 1 → n (mantener notación: si es n, queda n; si es N, queda N)
- \\sum_{i=2}^{n} 1 → n - 1
- \\sum_{i=k}^{n} 1 → n - k + 1
- \\sum_{i=a}^{b} 1 → b - a + 1 (cuando a y b son constantes o expresiones)
- \\sum_{i=0}^{n} 1 → n + 1 (porque incluye 0)
- \\sum_{i=2}^{n} 1 → n - 1 (porque empieza en 2)
- Simplificar multiplicaciones de sumatorias:
  * (\\sum_{i=a}^{b} 1) \\cdot (\\sum_{j=c}^{d} 1) → (b-a+1)(d-c+1) cuando se pueden calcular
  * (\\sum_{I=0}^{n} 1) \\cdot (\\sum_{J=2}^{n} 1) → (n+1)(n-1) = n² - 1
  * (\\sum_{i=2}^{n} 1) \\cdot (\\sum_{j=2}^{n} 1) → (n-1)² = n² - 2n + 1
- Para sumatorias anidadas o con límites complejos, simplificar paso a paso

REGLAS DE SIMPLIFICACIÓN ALGEBRAICA GENERAL:
- Eliminar paréntesis innecesarios: ((n)) → n, ((n+1)) → n+1
- Simplificar operaciones: n+1-2 → n-1, n-1+1 → n
- Simplificar expresiones: (n) - (1) + 2 → n+1, (n) + (1) → n+1
- Simplificar: (n) - (0) + 2 → n + 2
- Simplificar: (n) - (2) + 2 → n
- Simplificar: ((n) - (1)) - (1) + 2 → n (cuando no hay variables de bucles externos)
- IMPORTANTE: Si una expresión contiene variables de bucles externos (como i, j, k), NO la simplifiques a 0 ni a constantes
- Si una expresión tiene variables de bucles, simplifica solo los paréntesis y operaciones, pero mantén las variables
- Ejemplo: ((n) - (i)) - (1) + 2 → n - i + 1 (NO simplificar a 0, hay variable i)
- Agrupar términos similares: n + n → 2n, n - n → 0 (solo cuando no hay variables de bucles)
- Simplificar multiplicaciones: (1) \\cdot (n) → n, (n) \\cdot (1) → n
- Mantener formato LaTeX en la salida

EJEMPLOS (respetando notación original):
- Si entrada tiene 'n': ((n)) → n, (n) - (0) + 2 → n + 2
- Si entrada tiene 'N': ((N)) → N, (N) - (0) + 2 → N + 2
- n+1-2 → n-1
- (1) \\cdot (n) → n
- \\sum_{i=1}^{n} 1 → n
- \\sum_{i=0}^{n} 1 → n + 1
- (\\sum_{i=1}^{n} 1) \\cdot (2) → 2n
- (\\sum_{I=0}^{n} 1) \\cdot (\\sum_{J=2}^{n} 1) → (n+1)(n-1) = n² - 1
- ((n) - (2) + 2) \\cdot (\\sum_{I=0}^{n} 1) → n \\cdot (n+1) = n² + n
- (\\sum_{I=0}^{n} 1) \\cdot (\\sum_{J=2}^{n} 1) \\cdot (\\sum_{K=a}^{b} 1) → (n+1)(n-1)(b-a+1)
- ((n) - (i)) - (1) + 2 → n - i + 1 (NO simplificar a 0, hay variable i)
- ((n) - (1)) - (1) + 2 → n (sin variables de bucles externos)
- \\sum_{i=1}^{(n) - (1)} ((n) - (i)) - (1) + 2 → \\sum_{i=1}^{n-1} (n - i + 1) (mantener variable i en la expresión)

IMPORTANTE:
- Devuelve SOLO un objeto JSON válido
- El array "counts" debe tener el mismo número de elementos que las filas de entrada
- Mantén el orden de los counts igual al orden de entrada
- Usa formato LaTeX para todas las expresiones
- RESPETA la notación original (n/N, mayúsculas/minúsculas)"""
        }]
    }
    
    contents = [{
        "parts": [{"text": prompt}]
    }]
    
    generation_config = {
        "temperature": temperature,
        "maxOutputTokens": max_output_tokens,
        "responseMimeType": response_mime_type,
    }
    if top_p is not None:
        generation_config["topP"] = top_p
    if top_k is not None:
        generation_config["topK"] = top_k
    
    body = {
        "system_instruction": system_instruction,
        "contents": contents,
        "generationConfig": generation_config
    }
    
    params = {"key": api_key}
    timeout = 30.0
    
    # Intentar con reintentos
    for attempt in range(max_retries + 1):
        try:
            with httpx.Client(timeout=timeout) as client:
                response = client.post(url, headers=headers, params=params, json=body)
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"[LLM Simplifier] Respuesta recibida (intento {attempt + 1})")
                    print(f"[LLM Simplifier] Estructura de respuesta: {list(data.keys())}")
                    # Extraer el texto de la respuesta
                    if "candidates" in data and len(data["candidates"]) > 0:
                        candidate = data["candidates"][0]
                        print(f"[LLM Simplifier] Candidate keys: {list(candidate.keys())}")
                        
                        # Verificar finishReason por si hay bloqueo de seguridad
                        finish_reason = candidate.get("finishReason", "")
                        if finish_reason:
                            print(f"[LLM Simplifier] Finish reason: {finish_reason}")
                            if finish_reason != "STOP":
                                print(f"[LLM Simplifier] WARNING: Finish reason no es STOP: {finish_reason}")
                        
                        content = candidate.get("content", {})
                        print(f"[LLM Simplifier] Content keys: {list(content.keys()) if isinstance(content, dict) else 'No es dict'}")
                        print(f"[LLM Simplifier] Content type: {type(content)}")
                        parts = content.get("parts", []) if isinstance(content, dict) else []
                        print(f"[LLM Simplifier] Parts encontrados: {len(parts)}")
                        if isinstance(content, dict) and not parts:
                            print(f"[LLM Simplifier] Content completo cuando no hay parts: {json.dumps(content, indent=2)[:500]}")
                        if parts and len(parts) > 0:
                            text = parts[0].get("text", "")
                            if text:
                                print(f"[LLM Simplifier] Texto recibido: {text[:300]}")
                                try:
                                    parsed = json.loads(text)
                                    print("[LLM Simplifier] JSON parseado correctamente")
                                    return parsed
                                except json.JSONDecodeError as e:
                                    print(f"[LLM Simplifier] ERROR parseando JSON: {e}")
                                    print(f"[LLM Simplifier] Respuesta completa: {text}")
                                    if attempt < max_retries:
                                        print("[LLM Simplifier] Reintentando...")
                                        continue
                                    return None
                            else:
                                print("[LLM Simplifier] ERROR: Texto vacío en respuesta")
                                if attempt < max_retries:
                                    continue
                                return None
                        else:
                            print("[LLM Simplifier] ERROR: No hay parts en la respuesta")
                            print(f"[LLM Simplifier] Content completo: {json.dumps(content, indent=2)[:500]}")
                            print(f"[LLM Simplifier] Candidate completo: {json.dumps(candidate, indent=2)[:500]}")
                            if attempt < max_retries:
                                continue
                            return None
                    else:
                        print("[LLM Simplifier] ERROR: No hay candidates en la respuesta")
                        print(f"[LLM Simplifier] Respuesta completa: {json.dumps(data, indent=2)[:1000]}")
                        if attempt < max_retries:
                            continue
                        return None
                else:
                    error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
                    error_msg = error_data.get("error", {}).get("message", f"HTTP {response.status_code}")
                    print(f"[LLM Simplifier] Error en intento {attempt + 1}: {error_msg}")
                    if attempt < max_retries:
                        continue
                    return None
                    
        except httpx.TimeoutException:
            print(f"[LLM Simplifier] Timeout en intento {attempt + 1}")
            if attempt < max_retries:
                continue
            return None
        except Exception as e:
            print(f"[LLM Simplifier] Error en intento {attempt + 1}: {e}")
            if attempt < max_retries:
                continue
            return None
    
    return None


def _validate_simplification_response(result: Dict[str, Any], num_rows: int) -> bool:
    """
    Valida que la respuesta del LLM sea correcta.
    
    Args:
        result: Respuesta del LLM
        num_rows: Número de filas esperadas
        
    Returns:
        True si la respuesta es válida, False en caso contrario
    """
    if not isinstance(result, dict):
        return False
    
    if "counts" not in result:
        return False
    
    counts = result.get("counts", [])
    if not isinstance(counts, list):
        return False
    
    if len(counts) != num_rows:
        print(f"[LLM Simplifier] Número de counts ({len(counts)}) no coincide con número de filas ({num_rows})")
        return False
    
    # Validar formato básico de cada count (no vacío, string)
    for i, count in enumerate(counts):
        if not isinstance(count, str) or not count.strip():
            print(f"[LLM Simplifier] Count en posición {i} no es válido: {count}")
            return False
    
    return True


def simplify_counts_with_llm(rows: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Simplifica los count_raw usando el LLM.
    
    Args:
        rows: Lista de filas con count_raw y ck
        
    Returns:
        Diccionario con 'counts' (array de strings) y 'T_polynomial' (string),
        o None si hay error
    """
    if not rows:
        return None
    
    # Construir prompt con todos los count_raw y sus ck
    prompt_parts = ["Simplifica las siguientes expresiones de conteo en formato LaTeX:\n\n"]
    
    for i, row in enumerate(rows):
        ck = row.get("ck", "")
        count_raw = row.get("count_raw", "")
        prompt_parts.append(f"Línea {i + 1}: C_k = {ck}, count_raw = {count_raw}")
    
    prompt_parts.append("\n\nINSTRUCCIONES:")
    prompt_parts.append("1. Simplifica cada count_raw eliminando paréntesis innecesarios y simplificando operaciones")
    prompt_parts.append("2. Simplifica sumatorias: \\sum_{i=1}^{n} 1 → n, \\sum_{i=2}^{n} 1 → n-1, etc.")
    prompt_parts.append("3. Genera la forma polinómica T(n) = an² + bn + c basándote en los counts simplificados")
    prompt_parts.append("4. Usa SIEMPRE la misma forma canónica en los counts simplificados: combina términos semejantes, ordena por grado descendente y evita factorizaciones o permutaciones equivalentes")
    prompt_parts.append("5. Cuando existan sumatorias anidadas, conserva la notación explícita \\sum con índices únicos para las variables ligadas; NO conviertas sumatorias en productos que mezclen variables ligadas con variables libres")
    prompt_parts.append("6. Si la expresión puede escribirse como polinomio en n, devuelve la forma expandida ordenada como a\\cdot n^2 + b\\cdot n + c, sin espacios adicionales ni factorizaciones")

    prompt_parts.append("\nFORMATO DE SALIDA (JSON):")
    prompt_parts.append('{"counts": ["expresión1", "expresión2", ...], "T_polynomial": "a \\cdot n^2 + b \\cdot n + c"}')

    prompt_parts.append("\nIMPORTANTE:")
    prompt_parts.append("- El array 'counts' debe tener exactamente el mismo número de elementos que las líneas de entrada")
    prompt_parts.append("- Mantén el orden de los counts igual al orden de las líneas")
    prompt_parts.append("- Usa formato LaTeX para todas las expresiones")
    prompt_parts.append("- Si N es la variable, úsala en lugar de n en las expresiones")
    prompt_parts.append("- Devuelve expresiones deterministas: sin factorizaciones alternativas ni cambios en el orden de los términos entre ejecuciones")
    prompt_parts.append("- Revisa que los índices de sumatoria no entren en conflicto con variables libres; renómbralos si es necesario para mantenerlos ligados")

    prompt = "\n".join(prompt_parts)
    print(f"[LLM Simplifier] Prompt generado:\n{prompt[:500]}...")
    
    # Llamar al LLM
    print(f"[LLM Simplifier] Simplificando {len(rows)} filas con LLM")
    result = _call_gemini_api(
        prompt,
        model="gemini-2.5-flash",
        max_retries=1,
        temperature=0.0,
        top_p=0.0,
        top_k=1,
        max_output_tokens=8000,
        response_mime_type="application/json",
    )
    
    if not result:
        print("[LLM Simplifier] ERROR: No se pudo obtener respuesta del LLM, usando count_raw como count")
        return None
    
    print(f"[LLM Simplifier] Respuesta recibida del LLM: {list(result.keys())}")
    
    # Validar respuesta
    if not _validate_simplification_response(result, len(rows)):
        print("[LLM Simplifier] ERROR: Respuesta del LLM inválida, usando count_raw como count")
        return None
    
    print("[LLM Simplifier] Respuesta validada correctamente, retornando resultado")
    return result


def _validate_procedures_response(result: Dict[str, Any], num_rows: int) -> bool:
    """Valida la respuesta del modelo para procedimientos paso a paso."""

    if not isinstance(result, dict):
        return False

    procedures = result.get("procedures_by_line")
    if not isinstance(procedures, list):
        print("[LLM Simplifier] procedures_by_line no es un array")
        return False

    if len(procedures) != num_rows:
        print(
            f"[LLM Simplifier] Número de procedures_by_line ({len(procedures)}) no coincide con número de filas ({num_rows})"
        )
        return False

    for i, procedure in enumerate(procedures):
        if not isinstance(procedure, list):
            print(
                f"[LLM Simplifier] Procedure en posición {i} no es un array: {type(procedure)}"
            )
            return False
        for j, step in enumerate(procedure):
            if not isinstance(step, str) or not step.strip():
                print(
                    f"[LLM Simplifier] Paso {j} del procedimiento {i} no es válido: {step}"
                )
                return False

    return True


def generate_procedures_with_llm(rows: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Genera procedimientos detallados a partir de count_raw y count simplificado."""

    if not rows:
        return None

    prompt_parts: List[str] = [
        "Genera procedimientos de simplificación detallados en LaTeX para las siguientes líneas:\n\n"
    ]

    for i, row in enumerate(rows):
        ck = row.get("ck", "")
        original = row.get("count_raw", "")
        simplified = row.get("count", "")
        prompt_parts.append(
            f"Línea {i + 1}: C_k = {ck}\n  Expresión original: {original}\n  Expresión simplificada: {simplified}"
        )

    prompt_parts.append("\nINSTRUCCIONES:")
    prompt_parts.append(
        "1. Para cada línea, produce un procedimiento paso a paso que explique cómo se transformó la expresión original en la forma simplificada"
    )
    prompt_parts.append(
        "2. Usa \\text{} para el texto descriptivo en cada paso, con un espacio al final dentro de las llaves"
    )
    prompt_parts.append(
        "3. Solo incluye pasos donde ocurra una transformación real; evita repeticiones innecesarias"
    )
    prompt_parts.append(
        "4. Siempre incluye una conclusión final como \"Forma final\" o \"Forma simplificada\""
    )
    prompt_parts.append(
        "5. Cuando muestres ecuaciones, escribe explícitamente la transición (por ejemplo, =, →)"
    )

    prompt_parts.append("\nFORMATO DE SALIDA (JSON):")
    prompt_parts.append('{"procedures_by_line": [["paso 1", "paso 2", ...], ...]}')

    prompt_parts.append("\nIMPORTANTE:")
    prompt_parts.append(
        "- El array 'procedures_by_line' debe tener exactamente el mismo número de elementos que las líneas proporcionadas"
    )
    prompt_parts.append(
        "- Cada paso debe comenzar con \\text{Paso X: ... } siguiendo los requisitos de espaciado"
    )
    prompt_parts.append(
        "- Incluye las ecuaciones correspondientes para contrastar original y simplificado"
    )
    prompt_parts.append(
        "- Mantén la notación original de variables (respeta mayúsculas/minúsculas)"
    )

    prompt = "\n".join(prompt_parts)
    print(f"[LLM Simplifier] Prompt de procedimientos generado:\n{prompt[:500]}...")

    result = _call_gemini_api(
        prompt,
        model="gemini-2.5-flash-lite",
        max_retries=1,
        temperature=0.0,
        top_p=0.0,
        top_k=1,
        max_output_tokens=4000,
        response_mime_type="application/json",
    )

    if not result:
        print("[LLM Simplifier] ERROR: No se pudo obtener procedimientos del LLM")
        return None

    if not _validate_procedures_response(result, len(rows)):
        print("[LLM Simplifier] ERROR: Respuesta de procedimientos inválida")
        return None

    return result

