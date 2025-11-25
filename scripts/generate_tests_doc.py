#!/usr/bin/env python3
"""
Script para generar el documento de pruebas de algoritmos.
Hace peticiones a la API y genera un documento markdown con los resultados.
"""

import json
import time
import sys
from typing import Dict, Any, Optional
from datetime import datetime

try:
    import requests
except ImportError:
    print("Error: Se requiere la librería 'requests'. Instálala con: pip install requests")
    sys.exit(1)

# Configuración
API_BASE_URL = "http://localhost:8000"
OUTPUT_FILE = "docs/pruebas-algoritmos.md"

# Algoritmos seleccionados según el plan
ALGORITHMS = {
    "iterative": [
        {
            "id": 3,
            "name": "Búsqueda Lineal",
            "code": """busquedaLineal(A[n], x, n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        IF (A[i] = x) THEN BEGIN
            RETURN i;
        END
    END
    RETURN -1;
END"""
        },
        {
            "id": 5,
            "name": "Factorial Iterativo",
            "code": """factorial(n) BEGIN
    resultado <- 1;
    FOR i <- 2 TO n DO BEGIN
        resultado <- resultado * i;
    END
    RETURN resultado;
END"""
        },
        {
            "id": 6,
            "name": "Suma de Array",
            "code": """sumaArray(A[n], n) BEGIN
    suma <- 0;
    FOR i <- 1 TO n DO BEGIN
        suma <- suma + A[i];
    END
    RETURN suma;
END"""
        }
    ],
    "recursive_iteration": [
        {
            "id": 14,
            "name": "Factorial Recursivo",
            "code": """factorialRecursivo(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    ELSE BEGIN
        RETURN n * factorialRecursivo(n - 1);
    END
END"""
        },
        {
            "id": 28,
            "name": "Suma de Array Recursiva",
            "code": """sumaArray(A[n], n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 0;
    END
    ELSE BEGIN
        RETURN A[n] + sumaArray(A, n - 1);
    END
END"""
        },
        {
            "id": 29,
            "name": "Búsqueda en Lista Enlazada",
            "code": """buscarLista(nodo, valor) BEGIN
    IF (nodo = null) THEN BEGIN
        RETURN false;
    END
    IF (nodo.valor = valor) THEN BEGIN
        RETURN true;
    END
    ELSE BEGIN
        RETURN buscarLista(nodo.siguiente, valor);
    END
END"""
        }
    ],
    "recursive_master": [
        {
            "id": 15,
            "name": "Búsqueda Binaria Recursiva",
            "code": """busquedaBinaria(A[n], x, inicio, fin) BEGIN
    IF (inicio > fin) THEN BEGIN
        RETURN -1;
    END
    mitad <- (inicio + fin) / 2;
    IF (A[mitad] = x) THEN BEGIN
        RETURN mitad;
    END
    ELSE BEGIN
        IF (x < A[mitad]) THEN BEGIN
            RETURN busquedaBinaria(A, x, inicio, mitad - 1);
        END
        ELSE BEGIN
            RETURN busquedaBinaria(A, x, mitad + 1, fin);
        END
    END
END"""
        },
        {
            "id": 25,
            "name": "QuickSort (Caso Promedio)",
            "code": """quicksort(A[n], inicio, fin) BEGIN
    IF (inicio < fin) THEN BEGIN
        pivote <- particionar(A, inicio, fin);
        CALL quicksort(A, inicio, pivote - 1);
        CALL quicksort(A, pivote + 1, fin);
    END
END

particionar(A[n], inicio, fin) BEGIN
    pivote <- A[fin];
    i <- inicio - 1;
    FOR j <- inicio TO fin - 1 DO BEGIN
        IF (A[j] <= pivote) THEN BEGIN
            i <- i + 1;
            temp <- A[i];
            A[i] <- A[j];
            A[j] <- temp;
        END
    END
    temp <- A[i + 1];
    A[i + 1] <- A[fin];
    A[fin] <- temp;
    RETURN i + 1;
END"""
        },
        {
            "id": 27,
            "name": "Exponentiación Rápida Recursiva",
            "code": """exponenciacionRapida(x, n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 1;
    END
    resultado <- exponenciacionRapida(x, n DIV 2);
    resultado <- resultado * resultado;
    IF (n MOD 2 = 1) THEN BEGIN
        resultado <- resultado * x;
    END
    RETURN resultado;
END"""
        }
    ],
    "recursive_tree": [
        {
            "id": 16,
            "name": "MergeSort (Ordenamiento por Mezcla)",
            "code": """mergeSort(A[n], inicio, fin) BEGIN
    IF (inicio < fin) THEN BEGIN
        medio <- (inicio + fin) / 2;
        CALL mergeSort(A, inicio, medio);
        CALL mergeSort(A, medio + 1, fin);
        CALL mezclar(A, inicio, medio, fin);
    END
END

mezclar(A[n], inicio, medio, fin) BEGIN
    i <- inicio;
    j <- medio + 1;
    k <- 1;
    WHILE (i <= medio AND j <= fin) DO BEGIN
        IF (A[i] <= A[j]) THEN BEGIN
            temp[k] <- A[i];
            i <- i + 1;
        END
        ELSE BEGIN
            temp[k] <- A[j];
            j <- j + 1;
        END
        k <- k + 1;
    END
    WHILE (i <= medio) DO BEGIN
        temp[k] <- A[i];
        i <- i + 1;
        k <- k + 1;
    END
    WHILE (j <= fin) DO BEGIN
        temp[k] <- A[j];
        j <- j + 1;
        k <- k + 1;
    END
    FOR i <- 1 TO k - 1 DO BEGIN
        A[inicio + i - 1] <- temp[i];
    END
END"""
        },
        {
            "id": 17,
            "name": "Algoritmo Divide Desigual",
            "code": """algoritmoDivideDesigual(arreglo, inicio, fin) BEGIN
    IF (fin - inicio <= 1) THEN BEGIN
        RETURN arreglo[inicio];
    END
    ELSE BEGIN
        medio1 <- inicio + (fin - inicio) DIV 3;
        medio2 <- inicio + 2 * (fin - inicio) DIV 3;
        resultado1 <- algoritmoDivideDesigual(arreglo, inicio, medio1);
        resultado2 <- algoritmoDivideDesigual(arreglo, medio1, medio2);
        resultado3 <- algoritmoDivideDesigual(arreglo, medio2, fin);
        RETURN resultado1 + resultado2 + resultado3;
    END
END"""
        },
        {
            "id": 19,
            "name": "QuickSort (Ordenamiento Rápido)",
            "code": """quicksort(A[n], izq, der) BEGIN
    IF (izq < der) THEN BEGIN
        pivot <- A[der];
        i <- izq - 1;
        FOR j <- izq TO der - 1 DO BEGIN
            IF (A[j] <= pivot) THEN BEGIN
                i <- i + 1;
                temp <- A[i];
                A[i] <- A[j];
                A[j] <- temp;
            END
        END
        temp <- A[i + 1];
        A[i + 1] <- A[der];
        A[der] <- temp;
        pi <- i + 1;
        CALL quicksort(A, izq, pi - 1);
        CALL quicksort(A, pi + 1, der);
    END
END"""
        }
    ],
    "recursive_characteristic": [
        {
            "id": 12,
            "name": "Fibonacci Recursivo",
            "code": """fibonacci(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    ELSE BEGIN
        RETURN fibonacci(n - 1) + fibonacci(n - 2);
    END
END"""
        },
        {
            "id": 13,
            "name": "Torres de Hanoi",
            "code": """hanoi(n, origen, destino, auxiliar) BEGIN
    IF (n = 1) THEN BEGIN
        RETURN 1;
    END
    ELSE BEGIN
        resultado <- hanoi(n - 1, origen, auxiliar, destino);
        resultado <- resultado + 1;
        resultado <- resultado + hanoi(n - 1, auxiliar, destino, origen);
        RETURN resultado;
    END
END"""
        },
        {
            "id": 20,
            "name": "N-Step Stairs (Subir Escaleras)",
            "code": """subirEscaleras(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    ELSE BEGIN
        IF (n = 2) THEN BEGIN
            RETURN 2;
        END
        ELSE BEGIN
            RETURN subirEscaleras(n - 1) + subirEscaleras(n - 2);
        END
    END
END"""
        }
    ]
}


def make_request(method: str, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
    """Hace una petición HTTP a la API."""
    url = f"{API_BASE_URL}{endpoint}"
    try:
        if method == "GET":
            response = requests.get(url, timeout=30)
        else:
            response = requests.post(url, json=data, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error en petición {method} {endpoint}: {e}")
        return {"ok": False, "error": str(e)}


def analyze_algorithm(algorithm: Dict[str, Any], category: str) -> Dict[str, Any]:
    """Analiza un algoritmo completo y retorna todos los datos."""
    code = algorithm["code"]
    print(f"  Analizando: {algorithm['name']} (ID: {algorithm['id']})...")
    
    result = {
        "algorithm": algorithm,
        "category": category,
        "parse": None,
        "classify": None,
        "detect_methods": None,
        "analysis": None,
        "execution_time": {}
    }
    
    # 1. Parsear código
    start_time = time.time()
    parse_result = make_request("POST", "/grammar/parse", {"source": code})
    result["execution_time"]["parse"] = time.time() - start_time
    result["parse"] = parse_result
    
    if not parse_result.get("ok"):
        print(f"    ⚠️  Error al parsear: {parse_result.get('error', 'Unknown error')}")
        return result
    
    # 2. Clasificar algoritmo
    start_time = time.time()
    classify_result = make_request("POST", "/classify", {"source": code})
    result["execution_time"]["classify"] = time.time() - start_time
    result["classify"] = classify_result
    
    algorithm_kind = classify_result.get("kind", "unknown")
    
    # 3. Detectar métodos (solo recursivos)
    if algorithm_kind in ["recursive", "hybrid"]:
        start_time = time.time()
        detect_result = make_request("POST", "/analyze/detect-methods", {
            "source": code,
            "algorithm_kind": algorithm_kind
        })
        result["execution_time"]["detect_methods"] = time.time() - start_time
        result["detect_methods"] = detect_result
        
        preferred_method = detect_result.get("default_method", "master")
    else:
        preferred_method = None
    
    # 4. Analizar complejidad
    analyze_payload = {
        "source": code,
        "mode": "all",
        "algorithm_kind": algorithm_kind
    }
    
    if preferred_method:
        analyze_payload["preferred_method"] = preferred_method
    
    start_time = time.time()
    analysis_result = make_request("POST", "/analyze/open", analyze_payload)
    result["execution_time"]["analysis"] = time.time() - start_time
    result["analysis"] = analysis_result
    
    total_time = sum(result["execution_time"].values())
    print(f"    ✓ Completado en {total_time:.2f}s")
    
    return result


def format_json(obj: Any, indent: int = 2) -> str:
    """Formatea JSON de forma legible."""
    return json.dumps(obj, indent=indent, ensure_ascii=False)


def format_table_by_line(by_line: list) -> str:
    """Formatea la tabla byLine en markdown."""
    if not by_line:
        return "N/A"
    
    lines = ["| Línea | Tipo | Costo (C_k) | Count | Count Raw | Nota |"]
    lines.append("|-------|------|-------------|-------|-----------|------|")
    
    for item in by_line:
        line_num = item.get("line", "?")
        kind = item.get("kind", "?")
        ck = item.get("ck", "?")
        count = item.get("count", "?")
        count_raw = item.get("count_raw", "?")
        note = item.get("note") or "-"
        
        lines.append(f"| {line_num} | {kind} | {ck} | {count} | {count_raw} | {note} |")
    
    return "\n".join(lines)


def format_procedure(procedure: list) -> str:
    """Formatea el procedimiento en markdown."""
    if not procedure:
        return "N/A"
    
    lines = []
    for idx, step in enumerate(procedure, 1):
        if isinstance(step, dict):
            step_num = step.get("step", idx)
            desc = step.get("description", "")
            formula = step.get("formula", "")
            lines.append(f"{step_num}. **{desc}**")
            if formula:
                lines.append(f"   - Fórmula: `{formula}`")
        elif isinstance(step, str):
            lines.append(f"{idx}. {step}")
        else:
            lines.append(f"{idx}. {str(step)}")
        lines.append("")
    
    return "\n".join(lines)


def format_case_analysis(case_data: Any, case_name: str) -> str:
    """Formatea el análisis de un caso (worst/best/avg)."""
    if isinstance(case_data, str) and case_data == "same_as_worst":
        return f"**{case_name} Case**: Igual que Worst Case\n"
    
    if not isinstance(case_data, dict) or not case_data.get("ok"):
        return f"**{case_name} Case**: Error en el análisis\n"
    
    lines = [f"### {case_name} Case\n"]
    
    totals = case_data.get("totals", {})
    
    # T_open
    t_open = totals.get("T_open", "N/A")
    lines.append(f"**T_open**: `{t_open}`\n")
    
    # T_polynomial
    t_poly = totals.get("T_polynomial")
    if t_poly:
        lines.append(f"**T_polynomial**: `{t_poly}`\n")
    
    # Notaciones asintóticas
    big_o = totals.get("big_o")
    big_omega = totals.get("big_omega")
    big_theta = totals.get("big_theta")
    
    if big_o or big_omega or big_theta:
        lines.append("**Notaciones Asintóticas:**")
        if big_o:
            lines.append(f"- **O**: `{big_o}`")
        if big_omega:
            lines.append(f"- **Ω**: `{big_omega}`")
        if big_theta:
            lines.append(f"- **Θ**: `{big_theta}`")
        lines.append("")
    
    # byLine
    by_line = case_data.get("byLine", [])
    if by_line:
        lines.append("**Análisis por Línea:**")
        lines.append("")
        lines.append(format_table_by_line(by_line))
        lines.append("")
    
    # Procedure
    procedure = totals.get("procedure", [])
    if procedure:
        lines.append("**Procedimiento:**")
        lines.append("")
        lines.append(format_procedure(procedure))
        lines.append("")
    
    # Recurrence (solo recursivos)
    recurrence = totals.get("recurrence")
    if recurrence:
        lines.append("**Información de Recurrencia:**")
        lines.append("")
        if isinstance(recurrence, dict):
            method = recurrence.get("method", "N/A")
            form = recurrence.get("form", "N/A")
            lines.append(f"- Método: `{method}`")
            lines.append(f"- Forma: `{form}`")
        else:
            lines.append(f"```json\n{format_json(recurrence)}\n```")
        lines.append("")
    
    # Characteristic equation (solo ecuación característica)
    char_eq = totals.get("characteristic_equation")
    if char_eq:
        lines.append("**Ecuación Característica:**")
        lines.append("")
        lines.append(f"```json\n{format_json(char_eq, indent=2)}\n```")
        lines.append("")
    
    return "\n".join(lines)


def generate_markdown(all_results: list) -> str:
    """Genera el documento markdown completo."""
    lines = []
    
    # Encabezado
    lines.append("# Documento de Pruebas de Algoritmos")
    lines.append("")
    lines.append(f"**Fecha de generación**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append("")
    lines.append("Este documento contiene pruebas exhaustivas de múltiples algoritmos, organizados por tipo de análisis.")
    lines.append("")
    lines.append("## Índice")
    lines.append("")
    lines.append("1. [Algoritmos Iterativos](#algoritmos-iterativos)")
    lines.append("2. [Algoritmos Recursivos - Método Iterativo](#algoritmos-recursivos---método-iterativo)")
    lines.append("3. [Algoritmos Recursivos - Teorema Maestro](#algoritmos-recursivos---teorema-maestro)")
    lines.append("4. [Algoritmos Recursivos - Árbol de Recursión](#algoritmos-recursivos---árbol-de-recursión)")
    lines.append("5. [Algoritmos Recursivos - Ecuación Característica](#algoritmos-recursivos---ecuación-característica)")
    lines.append("6. [Resumen y Estadísticas](#resumen-y-estadísticas)")
    lines.append("")
    
    # Procesar cada categoría
    category_names = {
        "iterative": "Algoritmos Iterativos",
        "recursive_iteration": "Algoritmos Recursivos - Método Iterativo",
        "recursive_master": "Algoritmos Recursivos - Teorema Maestro",
        "recursive_tree": "Algoritmos Recursivos - Árbol de Recursión",
        "recursive_characteristic": "Algoritmos Recursivos - Ecuación Característica"
    }
    
    for category, category_name in category_names.items():
        category_results = [r for r in all_results if r["category"] == category]
        if not category_results:
            continue
        
        lines.append(f"## {category_name}")
        lines.append("")
        
        for idx, result in enumerate(category_results, 1):
            algorithm = result["algorithm"]
            lines.append(f"### {idx}. {algorithm['name']} (ID: {algorithm['id']})")
            lines.append("")
            
            # Pseudocódigo
            lines.append("#### Pseudocódigo")
            lines.append("")
            lines.append("```pseudocode")
            lines.append(algorithm["code"])
            lines.append("```")
            lines.append("")
            
            # AST
            parse_result = result.get("parse")
            if parse_result and parse_result.get("ok") and parse_result.get("ast"):
                lines.append("#### AST (Abstract Syntax Tree)")
                lines.append("")
                lines.append("```json")
                lines.append(format_json(parse_result["ast"], indent=2))
                lines.append("```")
                lines.append("")
            
            # Clasificación
            classify_result = result.get("classify")
            if classify_result:
                kind = classify_result.get("kind", "unknown")
                lines.append(f"#### Clasificación: `{kind}`")
                lines.append("")
            
            # Detección de métodos (solo recursivos)
            detect_result = result.get("detect_methods")
            if detect_result and detect_result.get("ok"):
                lines.append("#### Métodos Aplicables")
                lines.append("")
                applicable = detect_result.get("applicable_methods", [])
                default = detect_result.get("default_method", "N/A")
                lines.append(f"- **Métodos aplicables**: {', '.join(applicable)}")
                lines.append(f"- **Método por defecto**: `{default}`")
                lines.append("")
                
                recurrence_info = detect_result.get("recurrence_info")
                if recurrence_info:
                    lines.append("**Información de Recurrencia Detectada:**")
                    lines.append("")
                    if isinstance(recurrence_info, dict):
                        form = recurrence_info.get("form", "N/A")
                        rec_type = recurrence_info.get("type", "N/A")
                        order = recurrence_info.get("order", "N/A")
                        lines.append(f"- Forma: `{form}`")
                        lines.append(f"- Tipo: `{rec_type}`")
                        lines.append(f"- Orden: `{order}`")
                    else:
                        lines.append(f"```json\n{format_json(recurrence_info)}\n```")
                    lines.append("")
            
            # Análisis de complejidad
            analysis_result = result.get("analysis")
            if analysis_result and analysis_result.get("ok"):
                lines.append("#### Análisis de Complejidad")
                lines.append("")
                
                # Worst case
                worst = analysis_result.get("worst")
                if worst:
                    lines.append(format_case_analysis(worst, "Worst"))
                
                # Best case
                best = analysis_result.get("best")
                if best:
                    lines.append(format_case_analysis(best, "Best"))
                
                # Average case
                avg = analysis_result.get("avg")
                if avg:
                    lines.append(format_case_analysis(avg, "Average"))
            
            # Tiempo de ejecución
            exec_times = result.get("execution_time", {})
            if exec_times:
                total_time = sum(exec_times.values())
                lines.append("#### Tiempo de Ejecución")
                lines.append("")
                lines.append(f"- Parse: {exec_times.get('parse', 0):.3f}s")
                if "classify" in exec_times:
                    lines.append(f"- Clasificación: {exec_times.get('classify', 0):.3f}s")
                if "detect_methods" in exec_times:
                    lines.append(f"- Detección de métodos: {exec_times.get('detect_methods', 0):.3f}s")
                if "analysis" in exec_times:
                    lines.append(f"- Análisis: {exec_times.get('analysis', 0):.3f}s")
                lines.append(f"- **Total**: {total_time:.3f}s")
                lines.append("")
            
            lines.append("---")
            lines.append("")
    
    # Resumen y estadísticas
    lines.append("## Resumen y Estadísticas")
    lines.append("")
    
    total_algorithms = len(all_results)
    total_time = sum(sum(r.get("execution_time", {}).values()) for r in all_results)
    
    lines.append(f"- **Total de algoritmos analizados**: {total_algorithms}")
    lines.append(f"- **Tiempo total de ejecución**: {total_time:.2f}s")
    lines.append(f"- **Tiempo promedio por algoritmo**: {total_time/total_algorithms:.2f}s")
    lines.append("")
    
    # Estadísticas por categoría
    lines.append("### Estadísticas por Categoría")
    lines.append("")
    lines.append("| Categoría | Cantidad | Tiempo Total (s) | Tiempo Promedio (s) |")
    lines.append("|-----------|----------|------------------|---------------------|")
    
    for category, category_name in category_names.items():
        cat_results = [r for r in all_results if r["category"] == category]
        if cat_results:
            cat_time = sum(sum(r.get("execution_time", {}).values()) for r in cat_results)
            cat_avg = cat_time / len(cat_results)
            lines.append(f"| {category_name} | {len(cat_results)} | {cat_time:.2f} | {cat_avg:.2f} |")
    
    lines.append("")
    
    return "\n".join(lines)


def main():
    """Función principal."""
    print("=" * 60)
    print("Generador de Documento de Pruebas de Algoritmos")
    print("=" * 60)
    print()
    
    # Verificar que la API esté disponible
    print("Verificando conexión con la API...")
    health_check = make_request("GET", "/health")
    if not health_check.get("status") == "ok":
        print("⚠️  Advertencia: La API podría no estar disponible")
    else:
        print("✓ API disponible")
    print()
    
    # Analizar todos los algoritmos
    all_results = []
    total_algorithms = sum(len(algs) for algs in ALGORITHMS.values())
    current = 0
    
    for category, algorithms in ALGORITHMS.items():
        print(f"\n📁 Procesando categoría: {category}")
        print(f"   Algoritmos: {len(algorithms)}")
        
        for algorithm in algorithms:
            current += 1
            print(f"\n[{current}/{total_algorithms}]", end=" ")
            result = analyze_algorithm(algorithm, category)
            all_results.append(result)
    
    # Generar documento
    print("\n" + "=" * 60)
    print("Generando documento markdown...")
    markdown_content = generate_markdown(all_results)
    
    # Guardar archivo
    import os
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(markdown_content)
    
    print(f"✓ Documento generado: {OUTPUT_FILE}")
    print("=" * 60)


if __name__ == "__main__":
    main()

