from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

_THIS = Path(__file__).resolve().parent
_ORACLE_DIR = _THIS.parent / "oracles"
_SEED_PATH = _THIS / "llm40_cases.seed.json"
_OUT_DIR = _THIS

sys.path.insert(0, str(_THIS.parents[1]))
sys.path.insert(0, str(_THIS.parent))

from tests.oracles.oracle_schema import (  # noqa: E402
    AalieOracle,
    ExpectationKind,
    load_oracle_index,
    load_oracle_source,
)

GOLD_OVERRIDES: dict[str, dict[str, Any]] = {
    "REC-DC-004": {
        "parseStatus": "valid",
        "analysisStatus": "available",
        "algorithmKind": "recursive",
        "bigTheta": "Theta(n^2)",
        "recurrence": "T(n)=2T(n/2)+n^2",
        "recurrenceFamily": "divide_conquer",
        "shouldReject": False,
        "mustNotInventTheta": False,
    },
    "REC-DC-010": {
        "parseStatus": "valid",
        "analysisStatus": "available",
        "algorithmKind": "recursive",
        "bigTheta": "Theta((log n)^2)",
        "recurrence": "T(n)=T(n/2)+log n",
        "recurrenceFamily": "divide_conquer",
        "shouldReject": False,
        "mustNotInventTheta": False,
    },
    "REC-LS-008": {
        "parseStatus": "valid",
        "analysisStatus": "available",
        "algorithmKind": "recursive",
        "bigTheta": "Theta(n^3)",
        "recurrence": "T(n)=T(n-1)+n^2",
        "recurrenceFamily": "linear_shift",
        "shouldReject": False,
        "mustNotInventTheta": False,
    },
    "WHILE-S-011": {
        "parseStatus": "valid",
        "analysisStatus": "available",
        "algorithmKind": "iterative",
        "bigTheta": "Theta(log min(a,b))",
        "recurrence": None,
        "recurrenceFamily": None,
        "shouldReject": False,
        "mustNotInventTheta": False,
    },
    "WHILE-S-012": {
        "parseStatus": "valid",
        "analysisStatus": "available",
        "algorithmKind": "iterative",
        "bigTheta": "Theta(log min(x,y))",
        "recurrence": None,
        "recurrenceFamily": None,
        "shouldReject": False,
        "mustNotInventTheta": False,
    },
    "WHILE-S-014": {
        "parseStatus": "valid",
        "analysisStatus": "available",
        "algorithmKind": "iterative",
        "bigTheta": "Theta(n)",
        "cases": {
            "worst": {"bigTheta": "Theta(n)"},
            "best": {"bigTheta": "Theta(1)"},
        },
        "recurrence": None,
        "recurrenceFamily": None,
        "shouldReject": False,
        "mustNotInventTheta": False,
    },
    "WHILE-U-007": {
        "parseStatus": "valid",
        "analysisStatus": "unsupported",
        "algorithmKind": "iterative",
        "bigTheta": None,
        "recurrence": None,
        "recurrenceFamily": None,
        "shouldReject": True,
        "mustNotInventTheta": True,
        "unsupportedReason": "Variable multiplier k is not proven to be a constant greater than one.",
    },
}

EXPECTED_GROUP_COUNTS = {
    "iterative_strict": 12,
    "recursive_strict": 10,
    "while_strict": 8,
    "unsupported_parser": 6,
    "regression_gaps": 4,
}

FORBIDDEN_PROMPT_TOKENS = ["gold", "expected", "bigTheta", "expectationKind", "regression"]


def _log(msg: str) -> None:
    print(f"[select] {msg}", file=sys.stderr)


def _build_gold(oracle: AalieOracle) -> dict[str, Any]:
    case_id = oracle.id
    if case_id in GOLD_OVERRIDES:
        gold = dict(GOLD_OVERRIDES[case_id])
        return gold

    exp = oracle.expected

    if exp.expectationKind == ExpectationKind.expected_unsupported:
        parse_status = "invalid" if not exp.parseOk else "valid"
        analysis_status = "unsupported"
        algorithm_kind = (exp.algorithmKind.value if exp.algorithmKind else "unknown")
        return {
            "parseStatus": parse_status,
            "analysisStatus": analysis_status,
            "algorithmKind": algorithm_kind,
            "bigTheta": None,
            "recurrence": None,
            "recurrenceFamily": None,
            "shouldReject": True,
            "mustNotInventTheta": True,
            "unsupportedReason": _unsupported_reason(oracle),
        }

    parse_status = "valid" if exp.parseOk else "invalid"
    analysis_status = (exp.status.value if exp.status else "available")
    algorithm_kind = (exp.algorithmKind.value if exp.algorithmKind else None)
    should_reject = (exp.mustNotInventTheta or False)
    must_not_invent = (exp.mustNotInventTheta or False)

    big_theta = (
        exp.expectedMathTheta
        or exp.expectedEngineTheta
        or exp.bigTheta
        or None
    )

    if not big_theta and exp.cases:
        worst_case = exp.cases.get("worst", {})
        if isinstance(worst_case, dict):
            big_theta = worst_case.get("bigTheta") or worst_case.get("bigO") or None

    gold: dict[str, Any] = {
        "parseStatus": parse_status,
        "analysisStatus": analysis_status,
        "algorithmKind": algorithm_kind,
        "bigTheta": (big_theta if not should_reject else None),
        "bigO": (exp.bigO or None if not should_reject else None),
        "bigOmega": (exp.bigOmega or None if not should_reject else None),
        "recurrence": (exp.recurrence or None),
        "recurrenceFamily": (exp.recurrenceFamily or None),
        "shouldReject": should_reject,
        "mustNotInventTheta": must_not_invent,
    }

    if exp.cases:
        gold["cases"] = exp.cases

    return gold


def _unsupported_reason(oracle: AalieOracle) -> str:
    notes = oracle.validation.notes if oracle.validation else ""
    if not notes and not oracle.expected.parseOk:
        return "Malformed pseudocode."
    if not notes:
        return "No locally inferable loop bound."
    return notes


def _build_scoring(oracle: AalieOracle, group: str) -> dict[str, Any]:
    case_id = oracle.id
    exp = oracle.expected

    if group == "regression_gaps":
        if case_id == "WHILE-S-014":
            return {
                "primary": "theta_or_safe_rejection",
                "acceptSafeRejection": True,
                "notes": "Theta(n) is ideal worst-case; explicit not_proven is also safe but not counted as ideal recovery.",
            }
        return {
            "primary": "theta",
            "acceptSafeRejection": False,
        }

    if exp.expectationKind == ExpectationKind.expected_unsupported:
        if not exp.parseOk:
            return {"primary": "parse_rejection", "acceptSafeRejection": True}
        return {"primary": "safe_rejection", "acceptSafeRejection": True}

    if exp.mustNotInventTheta:
        return {"primary": "safe_rejection", "acceptSafeRejection": True}

    return {"primary": "theta", "acceptSafeRejection": False}


def _family_to_group(family: str, oracle: AalieOracle) -> str:
    mapping = {
        "for_simple": "iterative_strict",
        "for_nested": "iterative_strict",
        "conditional": "iterative_strict",
        "while_supported": "while_strict",
        "while_unsupported": "unsupported_parser",
        "parser_negative": "unsupported_parser",
        "recursive_divide_conquer": "recursive_strict",
        "recursive_linear_shift": "recursive_strict",
    }
    exp = oracle.expected
    if exp.expectationKind == ExpectationKind.regression_characterization:
        return "regression_gaps"
    if oracle.id in ("PARSE-001", "PARSE-002"):
        return "unsupported_parser"
    if oracle.id in ("WHILE-U-001", "WHILE-U-002", "WHILE-U-003", "WHILE-U-004", "WHILE-U-005", "WHILE-U-008"):
        if exp.expectationKind == ExpectationKind.expected_unsupported:
            return "unsupported_parser"
    return mapping.get(family, "unknown")


def main():
    seed = json.loads(_SEED_PATH.read_text(encoding="utf-8"))
    groups = seed["groups"]
    assert set(groups) == set(EXPECTED_GROUP_COUNTS), (
        f"Unexpected group keys: {sorted(groups)}"
    )
    all_oracle_ids = []
    for ids in groups.values():
        all_oracle_ids.extend(ids)

    _log(f"Seed has {len(all_oracle_ids)} IDs")
    assert len(all_oracle_ids) == 40, f"Expected 40, got {len(all_oracle_ids)}"
    assert len(set(all_oracle_ids)) == 40, "Seed contains duplicate oracle IDs"
    for group_name, expected_count in EXPECTED_GROUP_COUNTS.items():
        actual_count = len(groups[group_name])
        assert actual_count == expected_count, (
            f"Expected {group_name}={expected_count}, got {actual_count}"
        )

    oracles = load_oracle_index()
    oracle_map: dict[str, AalieOracle] = {o.id: o for o in oracles}

    missing = [oid for oid in all_oracle_ids if oid not in oracle_map]
    if missing:
        _log(f"ERROR: Missing oracle IDs: {missing}")
        sys.exit(1)

    cases: list[dict[str, Any]] = []

    for group_name, group_ids in groups.items():
        for case_id in group_ids:
            oracle = oracle_map[case_id]
            source = load_oracle_source(oracle.sourceFile)
            gold = _build_gold(oracle)
            scoring = _build_scoring(oracle, group_name)
            actual_group = group_name

            entry = {
                "caseId": case_id,
                "oracleId": case_id,
                "group": actual_group,
                "family": oracle.family.value,
                "expectationKind": oracle.expected.expectationKind.value,
                "sourceFile": str(oracle.sourceFile),
                "source": source.strip(),
                "gold": gold,
                "scoring": scoring,
            }
            cases.append(entry)

    index = {
        "version": seed["version"],
        "description": seed["description"],
        "cases": cases,
    }

    index_path = _OUT_DIR / "llm40_index.json"
    index_path.write_text(
        json.dumps(index, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    _log(f"Wrote {index_path} ({len(cases)} cases)")

    gold_lines: list[str] = []
    prompt_lines: list[str] = []

    for c in cases:
        gold_entry = {"caseId": c["caseId"], "gold": c["gold"]}
        gold_lines.append(json.dumps(gold_entry, ensure_ascii=False))

        prompt_entry = {
            "caseId": c["caseId"],
            "family": c["family"],
            "source": c["source"],
        }
        prompt_lines.append(json.dumps(prompt_entry, ensure_ascii=False))

    gold_path = _OUT_DIR / "llm40_gold.jsonl"
    gold_path.write_text("\n".join(gold_lines) + "\n", encoding="utf-8")
    _log(f"Wrote {gold_path} ({len(gold_lines)} lines)")

    prompt_path = _OUT_DIR / "llm40_prompt_dataset.jsonl"
    prompt_path.write_text("\n".join(prompt_lines) + "\n", encoding="utf-8")
    _log(f"Wrote {prompt_path} ({len(prompt_lines)} lines)")

    prompt_text = prompt_path.read_text(encoding="utf-8")
    leaked = [token for token in FORBIDDEN_PROMPT_TOKENS if token in prompt_text]
    assert not leaked, f"Prompt dataset leaked forbidden tokens: {leaked}"

    _log("Done. Generated index, gold, and prompt dataset.")


if __name__ == "__main__":
    main()
