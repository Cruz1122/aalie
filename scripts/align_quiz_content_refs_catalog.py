#!/usr/bin/env python3
"""
Reasigna contentRefs del banco ADA para que apunten al módulo/capítulo del catálogo
que corresponde al tema pedagógico (topic), no solo al módulo donde quedó tras backfills.

Uso: desde la raíz del repo
  python scripts/align_quiz_content_refs_catalog.py
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "packages" / "content-data" / "quizzes"
CATALOG_ROOT = ROOT / "packages" / "content-catalog" / "catalog" / "spaces" / "course"

# Taxonomía pedagógica: topic del banco -> moduleId canónico del curso (locale ES/EN comparten ids).
TOPIC_TO_MODULE: dict[str, str] = {
    "a_star": "mod-comparacion-tecnicas-algoritmicas",
    "algorithm_analysis_fundamentals": "mod-complejidad-temporal-espacial",
    "algorithm_correctness": "mod-loop-invariant",
    "algorithm_formulation": "mod-comparacion-tecnicas-algoritmicas",
    "algorithm_specification": "mod-comparacion-tecnicas-algoritmicas",
    "alpha_beta_pruning": "mod-comparacion-tecnicas-algoritmicas",
    "asymptotic_notation": "mod-notaciones-asintoticas",
    "backtracking": "mod-backtracking",
    "best_first_search": "mod-comparacion-tecnicas-algoritmicas",
    "branch_and_bound": "mod-branch-and-bound",
    "characteristic_equation": "mod-ecuacion-caracteristica",
    "cost_analysis": "mod-complejidad-temporal-espacial",
    "divide_and_conquer": "mod-algoritmos-recursivos",
    "dynamic_programming": "mod-programacion-dinamica",
    "function_growth": "mod-notaciones-asintoticas",
    "greedy_algorithms": "mod-algoritmos-voraces",
    "heap_sort": "mod-tabla-sumatorias-comunes",
    "heaps": "mod-algoritmos-iterativos-patrones-costos",
    "heuristics": "mod-algoritmos-voraces",
    "input_size": "mod-complejidad-temporal-espacial",
    "intelligent_substitution": "mod-suposiciones-inteligentes",
    "iteration_method": "mod-complejidad-temporal-espacial",
    "limits": "mod-demostraciones-completas-teorema-limites",
    "loop_invariant": "mod-loop-invariant",
    "master_theorem": "mod-teorema-maestro",
    "merge_sort": "mod-algoritmos-recursivos",
    "minimax": "mod-comparacion-tecnicas-algoritmicas",
    "priority_queues": "mod-algoritmos-iterativos-patrones-costos",
    "recurrence_equations": "mod-teorema-maestro",
    "recursion_tree_method": "mod-arbol-recursion",
    "semantic_analysis": "mod-comparacion-tecnicas-algoritmicas",
    "series": "mod-tabla-sumatorias-comunes",
    "spatial_complexity": "mod-complejidad-temporal-espacial",
    "temporal_complexity": "mod-complejidad-temporal-espacial",
    "uniform_cost_search": "mod-comparacion-tecnicas-algoritmicas",
}


def load_module(locale: str, module_id: str) -> dict[str, Any] | None:
    """Carga el JSON del módulo por moduleId (primer archivo que coincida)."""
    mod_dir = CATALOG_ROOT / locale / "modules"
    if not mod_dir.exists():
        return None
    for path in mod_dir.glob("*.module.json"):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except OSError:
            continue
        if data.get("moduleId") == module_id:
            return data
    return None


def chapter_blob(ch: dict[str, Any]) -> str:
    parts = [ch.get("title", ""), ch.get("summary", "")]
    for sec in ch.get("sections", []) or []:
        parts.append(sec.get("title", ""))
        parts.append(sec.get("summary", ""))
    return " ".join(parts).lower()


def pick_chapter(module: dict[str, Any], topic: str, tags: list[str]) -> str:
    chapters = module.get("chapters") or []
    if not chapters:
        raise ValueError(module.get("moduleId", "?") + " sin capítulos")
    tokens: set[str] = set()
    tokens.update(topic.replace("_", " ").lower().split())
    for t in tags:
        tokens.update(t.lower().replace("-", " ").split())
    tokens = {t for t in tokens if len(t) > 1}

    best_id = chapters[0]["chapterId"]
    best = -1
    for ch in chapters:
        blob = chapter_blob(ch)
        score = sum(1 for tok in tokens if tok in blob)
        if score > best:
            best = score
            best_id = ch["chapterId"]
    return best_id


def is_ada_ref(item: dict[str, Any]) -> bool:
    return item.get("courseId") == "ada" and bool(item.get("moduleId"))


def patch_content_refs_tree(obj: Any, module_id: str, chapter_id: str) -> None:
    """Sustituye cualquier lista contentRefs con una ref única coherente."""
    new_ref = [
        {
            "courseId": "ada",
            "moduleId": module_id,
            "chapterId": chapter_id,
        }
    ]
    if isinstance(obj, dict):
        if (
            "contentRefs" in obj
            and isinstance(obj["contentRefs"], list)
            and obj["contentRefs"]
            and isinstance(obj["contentRefs"][0], dict)
            and is_ada_ref(obj["contentRefs"][0])
        ):
            obj["contentRefs"] = [dict(new_ref[0])]
        for v in obj.values():
            patch_content_refs_tree(v, module_id, chapter_id)
    elif isinstance(obj, list):
        for item in obj:
            patch_content_refs_tree(item, module_id, chapter_id)


def process_bank(locale: str, filename: str) -> dict[str, int]:
    path = DATA_DIR / filename
    if not path.exists():
        return {"skipped": 1}

    dataset = json.loads(path.read_text(encoding="utf-8"))
    updated = 0
    skipped_topic = 0

    for q in dataset.get("questions", []):
        topic = q.get("topic") or ""
        mod_id = TOPIC_TO_MODULE.get(topic)
        if not mod_id:
            skipped_topic += 1
            continue

        module = load_module(locale, mod_id)
        if module is None:
            raise RuntimeError(f"Catálogo {locale}: módulo no encontrado {mod_id}")

        tags = list(q.get("tags") or [])
        chapter_id = pick_chapter(module, topic, tags)
        patch_content_refs_tree(q, mod_id, chapter_id)
        updated += 1

    path.write_text(json.dumps(dataset, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return {"questions_updated": updated, "skipped_unknown_topic": skipped_topic}


def main() -> None:
    r_es = process_bank("es", "ada-quiz-bank.json")
    r_en = process_bank("en", "ada-quiz-bank.en.json")
    print(json.dumps({"es": r_es, "en": r_en}, indent=2))


if __name__ == "__main__":
    main()
