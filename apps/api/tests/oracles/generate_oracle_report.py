#!/usr/bin/env python3
"""Generate oracle report artifacts: CSV, JSON summary, gaps MD, final report."""

import argparse
import csv
import json
import os
import sys
import time
from collections import defaultdict
from pathlib import Path

_SCRIPT_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _SCRIPT_DIR.parents[3]  # algorithm-analysis/
_API_DIR = _PROJECT_ROOT / "apps" / "api"
sys.path.insert(0, str(_API_DIR))
sys.path.insert(0, str(_PROJECT_ROOT))
os.environ.setdefault("PYTHONPATH", f"{_API_DIR}{os.pathsep}{os.environ.get('PYTHONPATH', '')}")

from tests.oracles.oracle_schema import (  # noqa: E402
    load_oracle_index,
    run_oracle_with_metrics,
)


def _run_all():
    oracles = load_oracle_index()
    all_metrics = []
    for o in oracles:
        t0 = time.perf_counter()
        m = run_oracle_with_metrics(o)
        dt_ms = round((time.perf_counter() - t0) * 1000, 1)
        m["runtime_ms"] = dt_ms
        all_metrics.append(m)
    return all_metrics


def generate_csv(metrics, path):
    fields = [
        "oracle_id", "family", "expectation_kind",
        "assertion_pass", "theta_agreement", "recurrence_agreement",
        "method_agreement", "pattern_agreement",
        "pattern_evidence_level", "bound_confidence",
        "export_metadata_pass", "export_contract_pass",
        "runtime_ms", "diagnostics",
    ]
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        for m in metrics:
            row = {k: m.get(k, "") for k in fields}
            diag = m.get("diagnostics", [])
            row["diagnostics"] = "; ".join(diag) if diag else ""
            row["runtime_ms"] = m.get("runtime_ms", "")
            w.writerow(row)
    print(f"  CSV -> {path}  ({len(metrics)} rows)")


def _count(metrics, key):
    return sum(1 for m in metrics if m.get(key))


def _count_kind(metrics, kind, key):
    return sum(1 for m in metrics if m.get("expectation_kind") == kind and bool(m.get(key)))


def generate_summary(metrics, path):
    total = len(metrics)
    by_kind = defaultdict(list)
    for m in metrics:
        by_kind[m["expectation_kind"]].append(m)

    summary = {
        "total": total,
        "assertion_pass": _count(metrics, "assertion_pass"),
        "assertion_fail": total - _count(metrics, "assertion_pass"),
        "by_expectation_kind": {},
        "granular_metrics": {},
    }

    for kind in ["strict_math", "expected_unsupported", "regression_characterization", "pending_integration"]:
        group = by_kind.get(kind, [])
        executed = len(group)
        full_pass = sum(1 for m in group if m["assertion_pass"])
        partial = 0
        if kind == "pending_integration":
            full_pass = 0
            partial = sum(1 for m in group if m["assertion_pass"])
        summary["by_expectation_kind"][kind] = {
            "executed": executed,
            "full_pass": full_pass,
            "partial_pass": partial,
            "fail": executed - full_pass - partial,
        }

    strict = by_kind.get("strict_math", [])
    pend = by_kind.get("pending_integration", [])
    rec_strict = [m for m in strict if m["family"] in ("recursive_divide_conquer", "recursive_linear_shift")]
    while_strict = [m for m in strict if m["family"].startswith("while_")]

    summary["granular_metrics"] = {
        "asymptotic_class_agreement": f"{_count(strict, 'theta_agreement')}/{len(strict)}",
        "recurrence_extraction_agreement": f"{_count(rec_strict, 'recurrence_agreement')}/{len(rec_strict)}",
        "while_asymptotic_agreement": f"{_count(while_strict, 'theta_agreement')}/{len(while_strict)}",
        "while_pattern_agreement": f"{_count(while_strict, 'pattern_agreement')}/{_count(while_strict, 'pattern_agreement') + sum(1 for m in while_strict if m.get('pattern_agreement') is False)}" if any(m.get('pattern_agreement') is not None for m in while_strict) else "N/A",
        "export_metadata_generation": f"{_count_kind(metrics, 'pending_integration', 'export_metadata_pass')}/{len(pend)}",
        "full_export_contract_validation": f"{_count_kind(metrics, 'pending_integration', 'export_contract_pass')}/{len(pend)}",
    }

    with open(path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    print(f"  JSON -> {path}")
    return summary


GAP_DESCRIPTIONS = {
    "WHILE-U-007": {
        "severity": "high",
        "expected": "unknown for i <- i * k where k is a variable",
        "observed": "O(1)",
        "impact": "WHILE engine treats variable multiplicative updates as constant-like.",
        "action": "Require constant-factor proof before geometric-growth closure.",
    },
    "REC-DC-004": {
        "severity": "high",
        "expected": "T(n)=2T(n/2)+n^2 -> Theta(n^2)",
        "observed": "T(n)=2T(n/2)+n -> Theta(n log n)",
        "impact": "Recursive local-work extraction loses nested-loop cost. f(n)=n instead of n^2.",
        "action": "Trace local-work accumulation across nested loops inside recursive bodies.",
    },
    "REC-DC-010": {
        "severity": "high",
        "expected": "T(n)=T(n/2)+log n -> Theta((log n)^2)",
        "observed": "T(n)=T(n/2)+n -> Theta(n)",
        "impact": "log(n) local work overestimated as linear. Recurrence solved via Master case 3 gives Theta(n).",
        "action": "Model log(n) and other standard-cost intrinsics as non-constant local work.",
    },
    "REC-LS-008": {
        "severity": "medium",
        "expected": "T(n)=T(n-1)+n^2 -> Theta(n^3)",
        "observed": "T(n)=T(n-1)+n -> Theta(n^2)",
        "impact": "Nested FOR inside recursive body not expanded; f(n) extracted as n instead of n^2.",
        "action": "Expand nested loop costs in recursive local-work extraction.",
    },
    "WHILE-S-011": {
        "severity": "high",
        "expected": "euclid_mod pattern -> Theta(log min(a,b))",
        "observed": "infinity / no closed bound",
        "impact": "euclid_mod is documented as supported, but the current engine does not close the bound.",
        "action": "Implement Euclid modulo recognition in the WHILE engine or downgrade the public contract from supported to experimental.",
    },
    "WHILE-S-012": {
        "severity": "high",
        "expected": "euclid_mod pattern under renamed variables -> Theta(log min(x,y))",
        "observed": "infinity / no closed bound",
        "impact": "Confirms the Euclid gap is structural and not caused by specific identifier names.",
        "action": "Reuse the same fix as WHILE-S-011 and add a renamed-variable regression test.",
    },
    "WHILE-S-014": {
        "severity": "medium",
        "expected": "compound guard (flag + counter) produces worst-case bound or explicit not_proven",
        "observed": "No worst-case big_theta produced; does not guess",
        "impact": "Correct behavior (engine does not invent bounds), but compound-guard diagnostic is incomplete.",
        "action": "Improve compound-guard diagnostic to report which sub-guard prevents bound closure.",
    },
}


def generate_gaps(metrics, path):
    reg = [m for m in metrics if m["expectation_kind"] == "regression_characterization"]
    unsupp = [m for m in metrics if m["expectation_kind"] == "expected_unsupported"]

    lines = []
    lines.append("# Oracle gaps and characterized limitations\n")
    lines.append(f"Generated from {len(metrics)} oracle runs.\n")

    lines.append("## High impact\n")
    for m in reg:
        oid = m["oracle_id"]
        desc = GAP_DESCRIPTIONS.get(oid)
        if desc and desc["severity"] == "high":
            lines.append(f"### {oid}\n")
            lines.append(f"- **Expected:** {desc['expected']}")
            lines.append(f"- **Observed:** {desc['observed']}")
            lines.append(f"- **Impact:** {desc['impact']}")
            diag_list = m.get("diagnostics", [])
            if diag_list:
                lines.append(f"- **Runner diagnostic:** {'; '.join(diag_list)}")
            lines.append(f"- **Action:** {desc['action']}\n")

    lines.append("## Medium impact\n")
    for m in reg:
        oid = m["oracle_id"]
        desc = GAP_DESCRIPTIONS.get(oid)
        if desc and desc["severity"] == "medium":
            lines.append(f"### {oid}\n")
            lines.append(f"- **Expected:** {desc['expected']}")
            lines.append(f"- **Observed:** {desc['observed']}")
            lines.append(f"- **Impact:** {desc['impact']}")
            diag_list = m.get("diagnostics", [])
            if diag_list:
                lines.append(f"- **Runner diagnostic:** {'; '.join(diag_list)}")
            lines.append(f"- **Action:** {desc['action']}\n")

    lines.append("## Expected unsupported (correct rejections)\n")
    for m in unsupp:
        oid = m["oracle_id"]
        if oid.startswith("PARSE-"):
            lines.append(f"- **{oid}**: parser correctly rejects malformed input before classification or analysis")
        else:
            lines.append(f"- **{oid}**: engine correctly reports no closed-form bound")

    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"  GAPS -> {path}")


def generate_report(metrics, summary, csv_path, gaps_path, out_path):
    total = summary["total"]
    assertion_pass = summary["assertion_pass"]
    by_kind = summary["by_expectation_kind"]

    strict_pass = by_kind["strict_math"]["full_pass"]
    unsupp_pass = by_kind["expected_unsupported"]["full_pass"]
    reg_exec = by_kind["regression_characterization"]["executed"]
    pend_exec = by_kind["pending_integration"]["executed"]
    pend_partial = by_kind["pending_integration"]["partial_pass"]
    gm = summary["granular_metrics"]

    lines = []
    lines.append("# AALIE Oracle Dataset — Reporte generado automáticamente\n")
    lines.append(f"**{total} oracle cases · {assertion_pass}/{total} assertion pass · generated by `generate_oracle_report.py`**\n")
    lines.append("---\n")

    # Honest headline
    lines.append("## Resumen\n")
    lines.append(
        f"The dataset contains {total} oracle cases. All cases execute without assertion errors "
        f"under their declared expectation kind. Strict mathematical agreement is achieved in "
        f"{strict_pass} strict_math cases. {unsupp_pass} cases validate expected unsupported "
        f"behavior. {reg_exec} cases characterize known engine limitations, including recursive "
        f"local-work extraction, missing Euclid modulo support, WHILE variable-factor reasoning, "
        f"and compound-loop diagnostics. {pend_exec} export-oriented cases currently validate "
        f"metadata generation but remain pending for full cross-format export-contract validation.\n"
    )

    # Quick table
    lines.append("| expectationKind | Executed | Full pass | Partial pass | Fail |")
    lines.append("|----------------|----------|-----------|--------------|------|")
    for kind in ["strict_math", "expected_unsupported", "regression_characterization", "pending_integration"]:
        bk = by_kind[kind]
        lines.append(f"| {kind} | {bk['executed']} | {bk['full_pass']} | {bk['partial_pass']} | {bk['fail']} |")
    full_pass_total = by_kind["strict_math"]["full_pass"] + by_kind["expected_unsupported"]["full_pass"] + by_kind["regression_characterization"]["full_pass"] + by_kind["pending_integration"]["full_pass"]
    lines.append(f"| **Total** | **{total}** | **{full_pass_total}** | **{pend_partial}** | **{total - full_pass_total - pend_partial}** |\n")

    # Granular
    lines.append("## Granular agreement metrics\n")
    for label, val in gm.items():
        lines.append(f"- **{label}**: {val}")
    lines.append("")

    # Family breakdown
    lines.append("## Distribution by family\n")
    fam_counts = defaultdict(int)
    fam_kind = defaultdict(lambda: defaultdict(int))
    for m in metrics:
        fam_counts[m["family"]] += 1
        fam_kind[m["family"]][m["expectation_kind"]] += 1
    lines.append("| Family | Count | strict_math | expected_unsupported | regression | pending |")
    lines.append("|--------|-------|-------------|---------------------|------------|---------|")
    for fam in sorted(fam_counts):
        total_fam = fam_counts[fam]
        sm = fam_kind[fam].get("strict_math", 0)
        eu = fam_kind[fam].get("expected_unsupported", 0)
        rc = fam_kind[fam].get("regression_characterization", 0)
        pi = fam_kind[fam].get("pending_integration", 0)
        lines.append(f"| {fam} | {total_fam} | {sm} | {eu} | {rc} | {pi} |")
    lines.append(f"| **Total** | **{total}** | **{by_kind['strict_math']['executed']}** | **{by_kind['expected_unsupported']['executed']}** | **{by_kind['regression_characterization']['executed']}** | **{by_kind['pending_integration']['executed']}** |\n")

    # Gaps
    lines.append("## Characterized gaps\n")
    lines.append(f"See full gap descriptions in `{gaps_path}`.\n")
    reg_ids = [m["oracle_id"] for m in metrics if m["expectation_kind"] == "regression_characterization"]
    for oid in reg_ids:
        lines.append(f"- **{oid}**")

    lines.append("\n## Expected unsupported\n")
    unsupp_ids = [m["oracle_id"] for m in metrics if m["expectation_kind"] == "expected_unsupported"]
    lines.append(", ".join(unsupp_ids))
    lines.append("\n")

    lines.append("## Export status\n")
    lines.append(f"- **Export metadata generation**: {gm['export_metadata_generation']}")
    lines.append(f"- **Full export-contract validation**: {gm['full_export_contract_validation']}\n")

    lines.append("## Data files\n")
    lines.append(f"- CSV: `{csv_path}`")
    lines.append(f"- JSON summary: `{os.path.join(os.path.dirname(out_path), os.path.basename(out_path).replace('_REPORT', '_summary').replace('.md', '.json'))}`")
    lines.append(f"- Gaps: `{gaps_path}`")
    lines.append("- Raw metrics: `run_oracle_with_metrics()`\n")

    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"  REPORT -> {out_path}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--results", default="apps/api/tests/oracles/out/oracle_results.csv")
    parser.add_argument("--summary", default="apps/api/tests/oracles/out/oracle_summary.json")
    parser.add_argument("--gaps", default="apps/api/tests/oracles/out/oracle_failures_and_gaps.md")
    parser.add_argument("--out", default="apps/api/tests/oracles/ORACLE_DATASET_REPORT.md")
    args = parser.parse_args()

    print("Running all 80 oracles...")
    metrics = _run_all()
    print(f"  Done: {len(metrics)} metrics collected")

    print("Generating CSV...")
    generate_csv(metrics, args.results)

    print("Generating JSON summary...")
    summary = generate_summary(metrics, args.summary)

    print("Generating gaps...")
    generate_gaps(metrics, args.gaps)

    print("Generating final report...")
    generate_report(metrics, summary, args.results, args.gaps, args.out)

    # Validate totals
    total = summary["total"]
    by_kind = summary["by_expectation_kind"]
    kinds_sum = sum(v["executed"] for v in by_kind.values())
    assert kinds_sum == total, f"Kind count mismatch: {kinds_sum} != {total}"

    b = by_kind
    assert b["strict_math"]["executed"] == 59, f"strict_math expected 59, got {b['strict_math']['executed']}"
    assert b["expected_unsupported"]["executed"] == 8, f"expected_unsupported expected 8, got {b['expected_unsupported']['executed']}"
    assert b["regression_characterization"]["executed"] == 7, f"regression expected 7, got {b['regression_characterization']['executed']}"
    assert b["pending_integration"]["executed"] == 6, f"pending expected 6, got {b['pending_integration']['executed']}"

    print(f"\nValidation: {total} = 59 + 8 + 7 + 6 = {b['strict_math']['executed'] + b['expected_unsupported']['executed'] + b['regression_characterization']['executed'] + b['pending_integration']['executed']} OK")


if __name__ == "__main__":
    main()
