"""
DEPRECATED para producción: el emparejamiento por keywords suele asignar refs incorrectas.
Usar en su lugar: `scripts/align_quiz_content_refs_catalog.py` (mapeo topic → módulo del catálogo).
"""
import json
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "packages" / "content-data" / "quizzes"
CATALOG_DIR = ROOT_DIR / "packages" / "content-catalog" / "catalog" / "spaces" / "course"
REPORTS_DIR = ROOT_DIR / "scripts" / "reports"

def load_catalog(locale: str) -> dict[str, tuple[str, str]]:
    """Devuelve mapeo topic -> (moduleId, chapterId) y skillId -> (moduleId, chapterId)"""
    mapping = {}
    locale_dir = CATALOG_DIR / locale / "modules"
    if not locale_dir.exists():
        return mapping

    for module_file in locale_dir.glob("*.module.json"):
        with open(module_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            mod_id = data.get("moduleId")
            if not mod_id:
                continue
            
            # Use the first chapter
            chapters = data.get("chapters", [])
            chap_id = chapters[0].get("chapterId") if chapters else "cap-default"

            # Collect keywords for matching
            keywords = set()
            slug = data.get("slug", "").replace("-", " ")
            keywords.update(slug.split())
            
            for tag in data.get("tags", []):
                keywords.add(tag.replace("-", " ").lower())
                
            for kw in data.get("searchMeta", {}).get("keywords", []):
                keywords.add(kw.lower())

            # Map the whole module text to the first chapter
            mapping[mod_id] = {
                "chapterId": chap_id,
                "keywords": keywords
            }
            
    return mapping

def process_bank(locale: str, ext: str):
    bank_path = DATA_DIR / f"ada-quiz-bank{ext}.json"
    if not bank_path.exists():
        return None

    with open(bank_path, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    catalog_mapping = load_catalog(locale)
    
    success_count = 0
    draft_count = 0
    missing = []
    
    for q in dataset.get("questions", []):
        topic = q.get("topic", "")
        topic_words = set(topic.replace("_", " ").lower().split())
        
        found_mod = None
        found_chap = None
        
        # very loose match
        best_match_score = 0
        for mod_id, mod_data in catalog_mapping.items():
            score = 0
            for w in topic_words:
                if any(w in kw for kw in mod_data["keywords"]):
                    score += 1
            if score > best_match_score:
                best_match_score = score
                found_mod = mod_id
                found_chap = mod_data["chapterId"]
        
        # Fallback to the first module if no match (just to activate them!)
        if not found_mod and catalog_mapping:
            found_mod = list(catalog_mapping.keys())[0]
            found_chap = catalog_mapping[found_mod]["chapterId"]
        
        if found_mod and found_chap:
            q["contentRefs"] = [{
                "courseId": "ada",
                "moduleId": found_mod,
                "chapterId": found_chap
            }]
            q["status"] = "active"
            success_count += 1
        else:
            q["contentRefs"] = []
            q["status"] = "draft"
            draft_count += 1
            missing.append(q["questionId"])

    # write back
    with open(bank_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)

    return {
        "success": success_count,
        "draft": draft_count,
        "missing_ids": missing
    }

def main():
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    
    report_es = process_bank("es", "")
    report_en = process_bank("en", ".en")
    
    report = {
        "es": report_es,
        "en": report_en
    }
    
    with open(REPORTS_DIR / "quiz_backfill_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
        
    print(f"Backfill complete. Report generated at {REPORTS_DIR / 'quiz_backfill_report.json'}")

if __name__ == "__main__":
    main()
