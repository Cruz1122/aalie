from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from .schemas import TaxonomyModel

REPO_ROOT = Path(__file__).resolve().parents[5]
TAXONOMY_PATH = REPO_ROOT / "packages" / "content-data" / "quizzes" / "ada-taxonomy.json"


@lru_cache(maxsize=1)
def load_taxonomy() -> TaxonomyModel:
    data = json.loads(TAXONOMY_PATH.read_text(encoding="utf-8"))
    return TaxonomyModel.model_validate(data)


def validate_topic(topic: str) -> bool:
    return topic in set(load_taxonomy().topics)


def validate_tag(tag: str) -> bool:
    return tag in set(load_taxonomy().tags)


def validate_skill(skill_id: str) -> bool:
    return skill_id in set(load_taxonomy().skills)
