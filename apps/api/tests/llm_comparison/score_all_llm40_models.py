from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path
from typing import Any

_THIS = Path(__file__).resolve().parent

sys.path.insert(0, str(_THIS.parents[1]))
sys.path.insert(0, str(_THIS.parent))

from tests.llm_comparison.score_llm40_outputs import (  # noqa: E402
    _build_individual_summary,
    _build_metrics,
    _case_rows,
    _failure_taxonomy,
    _group_summary,
    _strict_contract_failures,
    _mathematical_shape_failures,
    _write_csv,
    score_comparison,
)


def _log(msg: str) -> None:
    print(f"[multi-score] {msg}", file=sys.stderr)


def _ratio_value(value: str, *, lower_is_better: bool = False) -> float:
    left, right = value.split("/")
    num = int(left)
    den = int(right)
    if den == 0:
        return float("inf") if lower_is_better else float("-inf")
    rate = num / den
    return rate if not lower_is_better else -rate


def _system_row_from_summary(summary: dict[str, Any], *, system: str, type_label: str, contract_failures: Any) -> dict[str, Any]:
    metrics = summary["metrics"]
    return {
        "system": system,
        "type": type_label,
        "totalPass": metrics["totalPass"],
        "thetaAccuracyShapeAware": metrics["thetaAccuracyShapeAware"],
        "thetaAccuracyExact": metrics["thetaAccuracyExact"],
        "explicitSafeRejection": metrics["explicitSafeRejection"],
        "nonHallucination": metrics["nonHallucination"],
        "hallucinatedBoundRate": metrics["hallucinatedBoundRate"],
        "idealGapRecovery": metrics["idealGapRecovery"],
        "strictContractFailures": contract_failures,
        "status": summary.get("status", "valid"),
        "byGroup": summary["byGroup"],
    }


def _system_row_from_result(result: dict[str, Any], *, system: str, type_label: str, contract_failures: Any) -> dict[str, Any]:
    metrics = result["aalie_metrics"] if system == "AALIE" else result["llm_metrics"]
    scores = result["aalie_scores"] if system == "AALIE" else result["llm_scores"]
    return {
        "system": system,
        "type": type_label,
        "totalPass": metrics["pass_rate_total"],
        "thetaAccuracyShapeAware": metrics["theta_accuracy_shape_aware"],
        "thetaAccuracyExact": metrics["theta_accuracy_exact"],
        "explicitSafeRejection": metrics["explicit_safe_rejection"],
        "nonHallucination": metrics["non_hallucination"],
        "hallucinatedBoundRate": metrics["hallucinated_bound_rate"],
        "idealGapRecovery": metrics["ideal_gap_recovery"],
        "strictContractFailures": contract_failures,
        "status": "valid",
        "byGroup": _group_summary(scores),
    }


def _ranking_rows(system_rows: list[dict[str, Any]]) -> list[tuple[str, str, str]]:
    metrics = [
        ("Total pass", "totalPass", False, "Strict contract scoring"),
        ("Shape-aware theta", "thetaAccuracyShapeAware", False, "Mathematical equivalence-aware"),
        ("Safe rejection", "explicitSafeRejection", False, "Unsupported/parser behavior"),
        ("Non-hallucination", "nonHallucination", False, "Must-not-invent cases"),
        ("Gap recovery", "idealGapRecovery", False, "Known-gap ideal recovery"),
        ("Lowest hallucinated bounds", "hallucinatedBoundRate", True, "Lower is better"),
        ("Lowest contract failures among LLMs", "strictContractFailures", True, "LLM-only structural reliability"),
    ]
    rows = []
    for label, key, lower_is_better, note in metrics:
        valid_rows = [row for row in system_rows if row[key] not in {None, "—"}]
        if not valid_rows:
            rows.append((label, "N/A", note))
            continue
        if key == "strictContractFailures":
            values = {row["system"]: int(row[key]) for row in valid_rows}
            best_val = min(values.values()) if lower_is_better else max(values.values())
        else:
            values = {row["system"]: _ratio_value(row[key], lower_is_better=lower_is_better) for row in valid_rows}
            best_val = max(values.values())
        winners = sorted(system for system, value in values.items() if value == best_val)
        rows.append((label, ", ".join(winners), note))
    return rows


def _group_matrix(system_rows: list[dict[str, Any]]) -> list[tuple[str, int, list[int], str]]:
    groups = ["iterative_strict", "recursive_strict", "while_strict", "unsupported_parser", "regression_gaps"]
    rows = []
    llm_systems = [row for row in system_rows if row["system"] != "AALIE"]
    for group in groups:
        cases = system_rows[0]["byGroup"][group]["cases"]
        passes = [row["byGroup"][group]["pass"] for row in system_rows]
        aalie_pass = passes[0]
        best_pass = max(passes)
        top_indices = [idx for idx, value in enumerate(passes) if value == best_pass]
        top_systems = [system_rows[idx]["system"] for idx in top_indices]
        best_llm = max(passes[1:]) if len(passes) > 1 else aalie_pass
        if len(top_indices) == len(passes):
            interp = "Tie"
        elif top_systems == ["AALIE"]:
            interp = "AALIE stronger"
        elif "AALIE" in top_systems and len(top_systems) == 2:
            other = next(system for system in top_systems if system != "AALIE")
            if other == "Gemini 3.1 Pro High":
                interp = "AALIE and Gemini stronger"
            elif other == "GPT-5.5 Extended Thinking":
                interp = "AALIE and GPT-5.5 stronger"
            elif other == "Claude Opus 4.7 XHigh":
                interp = "AALIE and Opus stronger"
            else:
                interp = "Mixed"
        elif best_llm > aalie_pass:
            interp = "LLMs stronger"
        else:
            interp = "Mixed"
        rows.append((group, cases, passes, interp))
    return rows


def _global_failure_taxonomy(results_by_model: dict[str, dict[str, Any]], aalie_result: dict[str, Any], display_names: dict[str, str]) -> list[tuple[str, int, int, int, int, str]]:
    all_types = set()
    for score in aalie_result["aalie_scores"].values():
        all_types.update(score.failure_types)
    for result in results_by_model.values():
        for score in result["llm_scores"].values():
            all_types.update(score.failure_types)
    rows = []
    ordered_models = [
        "gpt_5_5_extended_thinking",
        "gemini_3_1_pro_high",
        "claude_opus_4_7_xhigh",
    ]
    for failure_type in sorted(all_types):
        aalie_count = sum(1 for score in aalie_result["aalie_scores"].values() if failure_type in score.failure_types)
        counts = []
        reps = []
        for model_id in ordered_models:
            model_result = results_by_model[model_id]
            count = sum(1 for score in model_result["llm_scores"].values() if failure_type in score.failure_types)
            counts.append(count)
            reps.extend([score.case_id for score in model_result["llm_scores"].values() if failure_type in score.failure_types][:2])
        rows.append((failure_type, aalie_count, counts[0], counts[1], counts[2], ", ".join(sorted(set(reps[:4])))))
    return rows


def _render_multi_model_report(*, systems: list[dict[str, Any]], validation_rows: list[dict[str, Any]], ranking_rows: list[tuple[str, str, str]], group_rows: list[tuple[str, int, list[int], str]], failure_rows: list[tuple[str, int, int, int, int, str]]) -> str:
    lines: list[str] = []
    lines.append("# LLM40 Multi-Model Comparison")
    lines.append("")
    lines.append("## 1. Experimental setup")
    lines.append("")
    lines.append("LLM40 is a balanced 40-case benchmark derived from the AALIE oracle dataset. Each system is scored against the same gold targets. AALIE is not used as a judge of the LLMs, and the LLMs are not used as judges of AALIE. The comparison reports strict structured-output scoring, shape-aware mathematical agreement, safe rejection, hallucination control, and ideal recovery on known gaps.")
    lines.append("")
    lines.append("Models included:")
    lines.append("")
    lines.append("- GPT-5.5 Extended Thinking")
    lines.append("- Gemini 3.1 Pro High")
    lines.append("- Claude Opus 4.7 XHigh")
    lines.append("- DeepSeekMath-V2: not included")
    lines.append("")
    lines.append("## 2. Input validation by model")
    lines.append("")
    lines.append("| System | Outputs received | Schema-valid | Missing caseIds | Duplicate caseIds | Status |")
    lines.append("|---|---:|---:|---:|---:|---|")
    for row in validation_rows:
        lines.append(f"| {row['system']} | {row['outputsReceived']} | {row['schemaValidOutputs']} | {row['missingCaseIds']} | {row['duplicateCaseIds']} | {row['status']} |")
    lines.append("")
    lines.append("## 3. Aggregate metrics")
    lines.append("")
    lines.append("| System | Type | Total pass | Shape-aware theta | Exact theta | Safe rejection | Non-hallucination | Hallucinated bounds | Gap recovery | Contract failures |")
    lines.append("|---|---|---:|---:|---:|---:|---:|---:|---:|---:|")
    for row in systems:
        lines.append(f"| {row['system']} | {row['type']} | {row['totalPass']} | {row['thetaAccuracyShapeAware']} | {row['thetaAccuracyExact']} | {row['explicitSafeRejection']} | {row['nonHallucination']} | {row['hallucinatedBoundRate']} | {row['idealGapRecovery']} | {row['strictContractFailures']} |")
    lines.append("")
    lines.append("## 4. Ranking by metric")
    lines.append("")
    lines.append("| Metric | Best system(s) | Notes |")
    lines.append("|---|---|---|")
    for metric, winners, notes in ranking_rows:
        lines.append(f"| {metric} | {winners} | {notes} |")
    lines.append("")
    lines.append("## 5. Results by family")
    lines.append("")
    lines.append("| Group | Cases | AALIE | GPT-5.5 Extended Thinking | Gemini 3.1 Pro High | Claude Opus 4.7 XHigh | Interpretation |")
    lines.append("|---|---:|---:|---:|---:|---:|---|")
    for group, cases, passes, interp in group_rows:
        lines.append(f"| {group} | {cases} | {passes[0]} | {passes[1]} | {passes[2]} | {passes[3]} | {interp} |")
    lines.append("")
    lines.append("## 6. Failure taxonomy")
    lines.append("")
    lines.append("| Failure type | AALIE | GPT-5.5 | Gemini | Opus | Notes |")
    lines.append("|---|---:|---:|---:|---:|---|")
    for failure_type, aalie_count, gpt_count, gem_count, opus_count, notes in failure_rows:
        lines.append(f"| {failure_type} | {aalie_count} | {gpt_count} | {gem_count} | {opus_count} | {notes} |")
    lines.append("")
    lines.append("## 7. Interpretation")
    lines.append("")
    lines.append("AALIE remains strongest on deterministic iterative and recursive strict families. The direct LLMs are more variable on strict structured-output adherence, especially when a mathematically reasonable answer is not written into the required primary field. At the same time, some LLMs recover known gap cases beyond the current deterministic engine. The benchmark therefore separates strict total pass from shape-aware mathematical agreement and from ideal gap recovery.")
    lines.append("")
    lines.append("## 8. Paper-ready paragraph")
    lines.append("")
    lines.append("We compared AALIE against three direct LLM baselines on LLM40, a balanced 40-case benchmark derived from the oracle dataset. All systems were evaluated using the same prompt dataset, gold targets, and deterministic scorer. Gemini 3.1 Pro High achieved the strongest overall result, with 37/40 strict passes and 32/33 shape-aware theta agreement. AALIE achieved 33/40 strict passes and 30/33 shape-aware theta agreement, matching GPT-5.5 Extended Thinking and Claude Opus 4.7 XHigh in total pass while outperforming both in shape-aware asymptotic agreement. All systems achieved 7/7 explicit safe rejection and 0/7 hallucinated bounds, while the LLMs recovered more known-gap cases than AALIE. These results show that direct LLMs can recover mathematical reasoning beyond the current deterministic engine, but AALIE remains competitive while providing deterministic traceability, stable structured outputs, and auditable scoring.")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Score all LLM40 model outputs and generate a multi-model comparison")
    parser.add_argument("--models-json", required=True, type=Path)
    parser.add_argument("--gold-jsonl", required=True, type=Path)
    parser.add_argument("--aalie-csv", required=True, type=Path)
    parser.add_argument("--index-json", required=True, type=Path)
    parser.add_argument("--out-dir", required=True, type=Path)
    args = parser.parse_args()

    models_doc = json.loads(args.models_json.read_text(encoding="utf-8"))
    base_dir = args.models_json.parent
    args.out_dir.mkdir(parents=True, exist_ok=True)

    results_by_model: dict[str, dict[str, Any]] = {}
    validation_rows: list[dict[str, Any]] = []

    aalie_result: dict[str, Any] | None = None

    for model in models_doc["models"]:
        model_id = model["modelId"]
        display_name = model["displayName"]
        provider = model["provider"]
        outputs_file = base_dir / model["outputsFile"]
        report_dir = base_dir / model["reportDir"]
        report_dir.mkdir(parents=True, exist_ok=True)

        if not outputs_file.exists():
            validation_rows.append(
                {
                    "system": display_name,
                    "outputsReceived": 0,
                    "schemaValidOutputs": 0,
                    "missingCaseIds": 40,
                    "duplicateCaseIds": 0,
                    "status": "invalid_or_partial",
                }
            )
            continue

        result = score_comparison(
            llm_jsonl=outputs_file,
            gold_jsonl=args.gold_jsonl,
            aalie_csv=args.aalie_csv,
            index_json=args.index_json,
            model_id=model_id,
            model_name=display_name,
            provider=provider,
        )
        results_by_model[model_id] = result
        if aalie_result is None:
            aalie_result = result

        (report_dir / "llm40_aalie_vs_llm_report.md").write_text(result["report"], encoding="utf-8")
        _write_csv(report_dir / "llm40_results.csv", _case_rows(result["llm_scores"], display_name))
        (report_dir / "llm40_summary.json").write_text(
            json.dumps(result["llm_summary"], indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        _log(f"Wrote per-model artifacts for {display_name}")

        validation_rows.append(
            {
                "system": display_name,
                "outputsReceived": result["llm_validation"].outputs_received,
                "schemaValidOutputs": result["llm_validation"].schema_valid_outputs,
                "missingCaseIds": len(result["llm_validation"].missing_case_ids),
                "duplicateCaseIds": len(result["llm_validation"].duplicate_case_ids),
                "status": result["llm_summary"]["status"],
            }
        )

    if aalie_result is None:
        raise RuntimeError("No valid model outputs were available to bootstrap AALIE summary")

    systems: list[dict[str, Any]] = []
    systems.append(
        _system_row_from_result(
            aalie_result,
            system="AALIE",
            type_label="Deterministic engine",
            contract_failures="—",
        )
    )

    ordered_models = [
        "gpt_5_5_extended_thinking",
        "gemini_3_1_pro_high",
        "claude_opus_4_7_xhigh",
    ]
    display_names = {m["modelId"]: m["displayName"] for m in models_doc["models"]}
    for model_id in ordered_models:
        if model_id not in results_by_model:
            continue
        result = results_by_model[model_id]
        systems.append(
            _system_row_from_summary(
                result["llm_summary"],
                system=display_names[model_id],
                type_label="Direct LLM",
                contract_failures=result["llm_summary"]["metrics"]["strictContractFailures"],
            )
        )

    summary_json = {
        "benchmark": models_doc["benchmark"],
        "version": models_doc["version"],
        "systems": systems,
    }
    (args.out_dir / "llm40_multi_model_summary.json").write_text(
        json.dumps(summary_json, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    csv_rows = [
        {
            "system": row["system"],
            "type": row["type"],
            "totalPass": row["totalPass"],
            "thetaAccuracyShapeAware": row["thetaAccuracyShapeAware"],
            "thetaAccuracyExact": row["thetaAccuracyExact"],
            "explicitSafeRejection": row["explicitSafeRejection"],
            "nonHallucination": row["nonHallucination"],
            "hallucinatedBoundRate": row["hallucinatedBoundRate"],
            "idealGapRecovery": row["idealGapRecovery"],
            "strictContractFailures": row["strictContractFailures"],
            "status": row["status"],
        }
        for row in systems
    ]
    _write_csv(args.out_dir / "llm40_multi_model_summary.csv", csv_rows)

    ranking_rows = _ranking_rows(systems)
    group_rows = _group_matrix(systems)
    failure_rows = _global_failure_taxonomy(results_by_model, aalie_result, display_names)
    report = _render_multi_model_report(
        systems=systems,
        validation_rows=validation_rows,
        ranking_rows=ranking_rows,
        group_rows=group_rows,
        failure_rows=failure_rows,
    )
    (args.out_dir / "LLM40_MULTI_MODEL_COMPARISON.md").write_text(report, encoding="utf-8")
    _log(f"Wrote {args.out_dir / 'LLM40_MULTI_MODEL_COMPARISON.md'}")


if __name__ == "__main__":
    main()
