from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.modules.quizzes.content_refs import content_ref_exists  # noqa: E402
from app.modules.quizzes.repository import get_validated_dataset  # noqa: E402


def build_report() -> dict[str, object]:
    dataset, validation = get_validated_dataset()

    by_topic: Counter[str] = Counter()
    by_difficulty: Counter[str] = Counter()
    by_cognitive: Counter[str] = Counter()
    by_status: Counter[str] = Counter()
    by_skill: Counter[str] = Counter()

    broken_refs: list[dict[str, object]] = []
    prompts: Counter[str] = Counter()

    active_questions = [q for q in dataset.questions if q.status == "active"]

    for question in dataset.questions:
        by_topic[question.topic] += 1
        by_difficulty[question.difficulty] += 1
        by_cognitive[question.cognitiveLevel] += 1
        by_status[question.status] += 1
        for skill in question.skillIds:
            by_skill[skill] += 1

        prompt_text = " ".join(block.content.strip().lower() for block in question.prompt.blocks)
        prompts[prompt_text] += 1

        for ref in question.contentRefs:
            if not content_ref_exists(ref):
                broken_refs.append(
                    {
                        "questionId": question.questionId,
                        "ref": ref.model_dump(),
                    }
                )

    duplicate_like_questions = [
        {"prompt": prompt, "count": count}
        for prompt, count in prompts.items()
        if prompt and count > 1
    ]

    missing_type_warnings: list[str] = []
    present_types = {q.type for q in dataset.questions}
    for expected in {
        "single_choice",
        "multiple_choice",
        "true_false",
        "ordering",
        "match_pairs",
    }:
        if expected not in present_types:
            missing_type_warnings.append(f"missing_type:{expected}")

    coverage_warnings: list[str] = []
    for expected in {"basic", "intermediate", "advanced"}:
        if by_difficulty.get(expected, 0) == 0:
            coverage_warnings.append(f"missing_difficulty:{expected}")
    for expected in {"recall", "understand", "apply", "analyze"}:
        if by_cognitive.get(expected, 0) == 0:
            coverage_warnings.append(f"missing_cognitive:{expected}")
    if len(dataset.questions) > 500:
        coverage_warnings.append("dataset_above_500")
    for skill, count in by_skill.items():
        if count < 3:
            coverage_warnings.append(f"undercovered_skill:{skill}:{count}")

    return {
        "datasetId": dataset.datasetId,
        "schemaVersion": dataset.schemaVersion,
        "totalQuestions": len(dataset.questions),
        "activeQuestions": len(active_questions),
        "byTopic": dict(sorted(by_topic.items())),
        "byDifficulty": dict(sorted(by_difficulty.items())),
        "byCognitiveLevel": dict(sorted(by_cognitive.items())),
        "byStatus": dict(sorted(by_status.items())),
        "bySkill": dict(sorted(by_skill.items())),
        "brokenRefs": broken_refs,
        "warnings": [w.model_dump() for w in validation.warnings],
        "coverageWarnings": sorted(coverage_warnings + missing_type_warnings),
        "duplicateLikeQuestions": duplicate_like_questions,
    }


def critical_checks(report: dict[str, object]) -> list[str]:
    errors: list[str] = []

    total = int(report["totalQuestions"])
    active = int(report["activeQuestions"])
    by_topic = report["byTopic"]
    by_difficulty = report["byDifficulty"]
    broken_refs = report["brokenRefs"]

    if active < 5:
        errors.append(f"Active questions below threshold: {active} < 5")
    if total > 500:
        errors.append(f"Total questions exceeds scope: {total} > 500")

    advanced = int(by_difficulty.get("advanced", 0))
    advanced_ratio = (advanced / total) if total else 0.0
    if advanced_ratio < 0.15:
        errors.append(f"Advanced ratio below threshold: {advanced_ratio:.2%} < 15%")

    for topic, count in by_topic.items():
        ratio = (count / total) if total else 0.0
        if ratio > 0.35:
            errors.append(f"Topic over-concentration: {topic} ({ratio:.2%} > 35%)")

    if broken_refs:
        errors.append(f"Broken content refs found: {len(broken_refs)}")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Report quiz bank coverage")
    parser.add_argument("--fail-on-critical", action="store_true")
    args = parser.parse_args()

    report = build_report()
    print(json.dumps(report, indent=2, ensure_ascii=False))

    if args.fail_on_critical:
        failures = critical_checks(report)
        if failures:
            print("coverage-check: FAIL")
            for item in failures:
                print(f"- {item}")
            return 1
        print("coverage-check: OK")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
