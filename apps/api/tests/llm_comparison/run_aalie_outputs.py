from __future__ import annotations

import argparse
import csv
import json
import sys
import time
from pathlib import Path
from typing import Any

_THIS = Path(__file__).resolve().parent

sys.path.insert(0, str(_THIS.parents[1]))
sys.path.insert(0, str(_THIS.parent))

from tests.oracles.oracle_schema import (
    AalieOracle,
    load_oracle_index,
    run_oracle,
)
from tests.llm_comparison.normalize_aalie_output import normalize_aalie_output, normalize_theta
from tests._support.assertions import infer_complexity_class


def _log(msg: str) -> None:
    print(f"[run] {msg}", file=sys.stderr)


def _find_oracle(oracle_id: str, oracles: list[AalieOracle]) -> AalieOracle:
    for o in oracles:
        if o.id == oracle_id:
            return o
    raise ValueError(f"Oracle {oracle_id} not found in index")


def _run_single_case(
    case: dict[str, Any],
    oracle: AalieOracle,
) -> tuple[dict[str, Any], dict[str, Any], float]:
    t0 = time.perf_counter()
    raw = run_oracle(oracle, mode="all", locale="en")
    runtime_ms = (time.perf_counter() - t0) * 1000.0
    normalized = normalize_aalie_output(case["caseId"], raw)
    return raw, normalized, runtime_ms


def _theta_shape_aware_match(expected: str | None, actual: str | None) -> bool:
    if not expected or not actual:
        return False
    norm_expected = normalize_theta(expected)
    norm_actual = normalize_theta(actual)
    if norm_expected and norm_actual and norm_expected == norm_actual:
        return True
    return infer_complexity_class(expected) == infer_complexity_class(actual) != "unknown"


def _score_case(
    normalized: dict[str, Any],
    gold: dict[str, Any],
    scoring: dict[str, Any],
    case: dict[str, Any],
) -> dict[str, Any]:
    case_id = normalized["caseId"]
    expected_big_theta = gold.get("bigTheta")
    should_reject = gold.get("shouldReject", False)
    must_not_invent = gold.get("mustNotInventTheta", False)

    actual_big_theta = normalized.get("bigTheta")
    actual_big_o = normalized.get("bigO")
    actual_big_omega = normalized.get("bigOmega")

    theta_agreement = False
    theta_shape_aware_agreement = False
    safe_rejection = False
    hallucinated_bound = False
    ideal_recovery = False
    pass_ = False

    if should_reject:
        hallucinated = bool(actual_big_theta or actual_big_o or actual_big_omega)
        hallucinated_bound = hallucinated
        analysis_status = normalized.get("analysisStatus", "")
        safe_rejection = analysis_status in ("unsupported", "unknown", "not_proven", "partial") and not hallucinated
        pass_ = safe_rejection
        theta_agreement = False
        theta_shape_aware_agreement = False

    elif case_id == "WHILE-S-014":
        if expected_big_theta and actual_big_theta:
            norm_actual = normalize_theta(actual_big_theta)
            norm_expected = normalize_theta(expected_big_theta)
            theta_agreement = bool(norm_actual and norm_expected and norm_actual == norm_expected)
            theta_shape_aware_agreement = _theta_shape_aware_match(expected_big_theta, actual_big_theta)
        if theta_agreement:
            pass_ = True
            ideal_recovery = True
        elif normalized.get("analysisStatus") in ("unsupported", "unknown", "not_proven", "partial"):
            pass_ = True
            ideal_recovery = False
            safe_rejection = True
        else:
            pass_ = False
    else:
        if expected_big_theta and actual_big_theta:
            norm_actual = normalize_theta(actual_big_theta)
            norm_expected = normalize_theta(expected_big_theta)
            theta_agreement = bool(norm_actual and norm_expected and norm_actual == norm_expected)
            theta_shape_aware_agreement = _theta_shape_aware_match(expected_big_theta, actual_big_theta)
        pass_ = theta_agreement

    return {
        "case_id": case_id,
        "oracle_id": case.get("oracleId", case_id),
        "group": case.get("group", ""),
        "family": case.get("family", ""),
        "expectation_kind": case.get("expectationKind", ""),
        "system": "AALIE",
        "parse_status": normalized.get("parseStatus", ""),
        "analysis_status": normalized.get("analysisStatus", ""),
        "big_theta": actual_big_theta,
        "expected_big_theta": expected_big_theta,
        "should_reject": should_reject,
        "must_not_invent_theta": must_not_invent,
        "theta_agreement": theta_agreement,
        "theta_shape_aware_agreement": theta_shape_aware_agreement,
        "safe_rejection": safe_rejection,
        "hallucinated_bound": hallucinated_bound,
        "non_hallucination": not hallucinated_bound if must_not_invent else "",
        "explicit_safe_rejection": safe_rejection if should_reject else "",
        "ideal_recovery": ideal_recovery,
        "pass": pass_,
        "runtime_ms": None,
        "diagnostics": "; ".join(normalized.get("diagnostics", [])),
    }


def _compute_summary(rows: list[dict[str, Any]]) -> dict[str, Any]:
    by_group: dict[str, dict[str, Any]] = {}
    total_theta_exact = 0
    total_theta_shape = 0
    total_theta_den = 0
    total_safe_reject = 0
    total_should_reject = 0
    total_non_hallucination = 0
    total_must_not_invent = 0
    total_hallucinated = 0
    total_gap_ideal = 0
    total_gap_cases = 0

    for r in rows:
        g = r["group"]
        if g not in by_group:
            by_group[g] = {"cases": 0, "pass": 0, "ideal_recovery": 0, "safe_rejection": 0}
        by_group[g]["cases"] += 1
        if r["pass"]:
            by_group[g]["pass"] += 1
        if r["ideal_recovery"]:
            by_group[g]["ideal_recovery"] += 1
            total_gap_ideal += 1
        if g == "regression_gaps":
            total_gap_cases += 1
        if r["safe_rejection"]:
            by_group[g]["safe_rejection"] += 1
            total_safe_reject += 1
        if r["should_reject"]:
            total_should_reject += 1
        if r["hallucinated_bound"]:
            total_hallucinated += 1
        if r["must_not_invent_theta"]:
            total_must_not_invent += 1
            if not r["hallucinated_bound"]:
                total_non_hallucination += 1
        if not r["should_reject"]:
            total_theta_den += 1
            if r["theta_agreement"]:
                total_theta_exact += 1
            if r["theta_shape_aware_agreement"]:
                total_theta_shape += 1

    total = len(rows)

    return {
        "total_cases": total,
        "system": "AALIE",
        "by_group": by_group,
        "metrics": {
            "theta_accuracy_exact": f"{total_theta_exact}/{total_theta_den}",
            "theta_accuracy_shape_aware": f"{total_theta_shape}/{total_theta_den}",
            "explicit_safe_rejection": f"{total_safe_reject}/{total_should_reject}",
            "non_hallucination": f"{total_non_hallucination}/{total_must_not_invent}",
            "hallucinated_bound_rate": f"{total_hallucinated}/{total_must_not_invent}",
            "ideal_gap_recovery": f"{total_gap_ideal}/{total_gap_cases}",
        },
    }


def main():
    ap = argparse.ArgumentParser(description="Run AALIE on LLM40 dataset")
    ap.add_argument("--index", required=True, type=str, help="Path to llm40_index.json")
    ap.add_argument("--out-dir", required=True, type=str, help="Output directory")
    args = ap.parse_args()

    index_path = Path(args.index)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    index = json.loads(index_path.read_text(encoding="utf-8"))
    cases = index["cases"]

    _log(f"Loaded {len(cases)} cases from {index_path}")

    oracles = load_oracle_index()
    _log(f"Loaded {len(oracles)} oracles")

    raw_lines: list[str] = []
    norm_lines: list[str] = []
    rows: list[dict[str, Any]] = []

    for i, case in enumerate(cases):
        case_id = case["caseId"]
        _log(f"[{i+1}/{len(cases)}] Running {case_id}...")

        try:
            oracle = _find_oracle(case_id, oracles)
        except ValueError as e:
            _log(f"  SKIP {case_id}: {e}")
            continue

        raw, normalized, runtime_ms = _run_single_case(case, oracle)
        score = _score_case(normalized, case["gold"], case["scoring"], case)
        score["runtime_ms"] = round(runtime_ms, 2)

        raw_lines.append(json.dumps(raw, ensure_ascii=False, default=str))
        norm_lines.append(json.dumps(normalized, ensure_ascii=False, default=str))
        rows.append(score)

    raw_path = out_dir / "aalie40_raw_outputs.jsonl"
    raw_path.write_text("\n".join(raw_lines) + "\n", encoding="utf-8")
    _log(f"Wrote {raw_path} ({len(raw_lines)} lines)")

    norm_path = out_dir / "aalie40_outputs.jsonl"
    norm_path.write_text("\n".join(norm_lines) + "\n", encoding="utf-8")
    _log(f"Wrote {norm_path} ({len(norm_lines)} lines)")

    csv_path = out_dir / "aalie40_results.csv"
    if rows:
        fieldnames = list(rows[0].keys())
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
    _log(f"Wrote {csv_path} ({len(rows)} rows)")

    summary = _compute_summary(rows)
    summary_path = out_dir / "aalie40_summary.json"
    summary_path.write_text(
        json.dumps(summary, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    _log(f"Wrote {summary_path}")

    _log("Done.")


if __name__ == "__main__":
    main()
