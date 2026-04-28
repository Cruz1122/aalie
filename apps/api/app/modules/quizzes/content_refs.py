from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from .schemas import ContentRef

REPO_ROOT = Path(__file__).resolve().parents[5]
CATALOG_ROOT = (
    REPO_ROOT / "packages" / "content-catalog" / "catalog" / "spaces" / "theory" / "es"
)


@lru_cache(maxsize=1)
def _load_catalog_index() -> dict[str, dict[str, dict[str, set[str]]]]:
    modules_dir = CATALOG_ROOT / "modules"
    modules: dict[str, dict[str, set[str]]] = {}

    for module_file in sorted(modules_dir.glob("*.module.json")):
        data = json.loads(module_file.read_text(encoding="utf-8"))
        module_id = data.get("moduleId")
        if not module_id:
            continue

        chapters: dict[str, set[str]] = {}
        for chapter in data.get("chapters", []):
            chapter_id = chapter.get("chapterId")
            if not chapter_id:
                continue

            block_ids: set[str] = set()
            for section in chapter.get("sections", []):
                for block in section.get("blocks", []):
                    block_id = block.get("id")
                    if block_id:
                        block_ids.add(block_id)
                    for nested in block.get("blocks", []):
                        nested_id = nested.get("id")
                        if nested_id:
                            block_ids.add(nested_id)
            chapters[chapter_id] = block_ids

        modules[module_id] = chapters

    return {"ada": modules}


def content_ref_exists(ref: ContentRef) -> bool:
    index = _load_catalog_index()
    course_modules = index.get(ref.courseId)
    if course_modules is None:
        return False

    module = course_modules.get(ref.moduleId)
    if module is None:
        return False

    chapter_blocks = module.get(ref.chapterId)
    if chapter_blocks is None:
        return False

    if ref.blockId:
        return ref.blockId in chapter_blocks

    return True
