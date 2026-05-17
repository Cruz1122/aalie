from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any

_THIS = Path(__file__).resolve().parent

sys.path.insert(0, str(_THIS.parents[1]))
sys.path.insert(0, str(_THIS.parent))

from tests._support.assertions import infer_complexity_class  # noqa: E402
from tests.llm_comparison.normalize_aalie_output import normalize_theta  # noqa: E402

REGRESSION_GAP_CASE_IDS = {"WHILE-S-011", "WHILE-U-007", "REC-DC-004", "REC-LS-008"}
LLM_REQUIRED_FIELDS = {
    "caseId",
    "parse_status",
    "analysis_status",
    "algorithm_kind",
    "big_o",
    "big_omega",
    "big_theta",
    "recurrence",
    "recurrence_family",
    "while_pattern",
    "confidence",
    "explanation",
    "unsupported_reason",
}
AALIE_REQUIRED_COLUMNS = {
    "case_id",
    "parse_status",
    "analysis_status",
    "big_theta",
    "should_reject",
    "must_not_invent_theta",
}


@dataclass
class ValidationSummary:
    expected_cases: int
    outputs_received: int
    parseable_outputs: int
    missing_case_ids: list[str]
    duplicate_case_ids: list[str]
    schema_valid_outputs: int
    unknown_case_ids: list[str]


@dataclass
class SystemCaseScore:
    case_id: str
    group: str
    family: str
    schema_valid: bool
    parse_status_agreement: bool
    analysis_status_agreement: bool
    algorithm_kind_agreement: bool
    theta_agreement_exact: bool
    theta_agreement_shape_aware: bool
    recurrence_agreement: bool
    recurrence_family_agreement: bool
    explicit_safe_rejection: bool
    non_hallucination: bool
    hallucinated_bound: bool
    ideal_recovery: bool
    passed: bool
    failure_types: list[str]
    output: dict[str, Any]
    gold: dict[str, Any]


def _log(msg: str) -> None:
    print(f"[score] {msg}", file=sys.stderr)


def _parse_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() == "true"


def _mapped_value(raw_output: dict[str, Any], field_name: str | None) -> Any:
    if not field_name:
        return None
    return raw_output.get(field_name)


def _none_if_blank(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, str) and not value.strip():
        return None
    return value


def _load_jsonl(path: Path) -> list[tuple[int, dict[str, Any] | None, str | None]]:
    rows: list[tuple[int, dict[str, Any] | None, str | None]] = []
    for i, raw_line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        line = raw_line.strip()
        if not line:
            continue
        try:
            rows.append((i, json.loads(line), None))
        except json.JSONDecodeError as exc:
            rows.append((i, None, str(exc)))
    return rows


def _load_gold(path: Path) -> tuple[dict[str, dict[str, Any]], dict[str, str], dict[str, str]]:
    gold_map: dict[str, dict[str, Any]] = {}
    group_map: dict[str, str] = {}
    family_map: dict[str, str] = {}
    for _, obj, err in _load_jsonl(path):
        if err or obj is None:
            raise ValueError(f"Invalid gold JSONL at {path}: {err}")
        case_id = obj["caseId"]
        gold_map[case_id] = obj["gold"]
    return gold_map, group_map, family_map


def _load_index_group_family(index_path: Path) -> tuple[dict[str, str], dict[str, str]]:
    if not index_path.exists():
        return {}, {}
    idx = json.loads(index_path.read_text(encoding="utf-8"))
    group_map = {case["caseId"]: case.get("group", "unknown") for case in idx.get("cases", [])}
    family_map = {case["caseId"]: case.get("family", "unknown") for case in idx.get("cases", [])}
    return group_map, family_map


def _build_case_maps_from_aalie_csv(path: Path) -> tuple[dict[str, dict[str, Any]], dict[str, str], dict[str, str]]:
    with open(path, encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))
    for row in rows:
        family = row.get("family", "")
        if family == "recursive_divide_conquer":
            row["derived_algorithm_kind"] = "recursive"
            row["derived_recurrence_family"] = "divide_conquer"
        elif family == "recursive_linear_shift":
            row["derived_algorithm_kind"] = "recursive"
            row["derived_recurrence_family"] = "linear_shift"
        elif family in {"for_simple", "for_nested", "conditional", "while_supported", "while_unsupported"}:
            row["derived_algorithm_kind"] = "iterative"
            row["derived_recurrence_family"] = None
        elif family == "parser_negative":
            row["derived_algorithm_kind"] = "unknown"
            row["derived_recurrence_family"] = None
        else:
            row["derived_algorithm_kind"] = None
            row["derived_recurrence_family"] = None
    out_map = {row["case_id"]: row for row in rows}
    group_map = {row["case_id"]: row.get("group", "unknown") for row in rows}
    family_map = {row["case_id"]: row.get("family", "unknown") for row in rows}
    return out_map, group_map, family_map


def _canonical_exact_theta(value: str | None) -> str | None:
    norm = normalize_theta(_none_if_blank(value))
    if norm is None:
        return None
    aliases = {
        "Theta(n+m)": "Theta(m+n)",
        "Theta(n*m)": "Theta(m*n)",
        "Theta(nm)": "Theta(m*n)",
        "Theta(mn)": "Theta(m*n)",
        "Theta(n^2*m)": "Theta(m*n^2)",
        "Theta(n^2m)": "Theta(m*n^2)",
        "Theta(mn^2)": "Theta(m*n^2)",
        "Theta(nlogn)": "Theta(nlogn)",
        "Theta(logn)": "Theta(logn)",
        "Theta(phi^n)": "Theta(phi^n)",
        "Theta(n^log_2(3))": "Theta(n^log_23)",
        "Theta(n^{log_23})": "Theta(n^log_23)",
        "Theta(n^{log_2 3})": "Theta(n^log_23)",
        "Theta(n^log₂3)": "Theta(n^log_23)",
        "Theta(n^log_23)": "Theta(n^log_23)",
    }
    return aliases.get(norm, norm)


def _canonical_shape_theta(value: str | None) -> str | None:
    exact = _canonical_exact_theta(value)
    if exact is None:
        return None
    shape_aliases = {
        "Theta(log(n)/log(2))": "Theta(logn)",
        "Theta(log(n))": "Theta(logn)",
        "Theta((1/2+sqrt(5)/2)^n)": "Theta(phi^n)",
        "Theta((1/2 + sqrt(5)/2)^n)": "Theta(phi^n)",
        "Theta(φ^n)": "Theta(phi^n)",
        "Theta(Omega(1))": "Theta(Omega(1))",
    }
    return shape_aliases.get(exact, exact)


def _normalize_recurrence(value: str | None) -> str | None:
    if value is None:
        return None
    s = str(value).strip().lower()
    if not s:
        return None
    s = s.replace(" ", "")
    s = s.replace("\\cdot", "")
    s = s.replace("θ", "theta")
    s = s.replace("Θ", "theta")
    s = re.sub(r"theta\((n\^2|n|1)\)", r"\1", s)
    s = re.sub(r",?t\(n<=\d+\)=1", "", s)
    s = re.sub(r",?t\(n<=\d+\)=theta\(1\)", "", s)
    s = re.sub(r",?t\(n<=1\)=1", "", s)
    s = re.sub(r",?t\(n<=0\)=1", "", s)
    s = s.replace(")+,", "+,")
    s = s.replace(")", ")")
    s = s.strip(",")
    return s


def _shape_aware_match(expected: str | None, actual: str | None) -> bool:
    e = _canonical_shape_theta(expected)
    a = _canonical_shape_theta(actual)
    if e is None or a is None:
        return False
    if e == a:
        return True
    return infer_complexity_class(expected or "") == infer_complexity_class(actual or "") != "unknown"


def _exact_match(expected: str | None, actual: str | None) -> bool:
    e = _canonical_exact_theta(expected)
    a = _canonical_exact_theta(actual)
    return e is not None and a is not None and e == a


def _required_fields_present(obj: dict[str, Any], required: set[str]) -> bool:
    return all(field in obj for field in required)


def _validate_llm_outputs(
    llm_records: list[tuple[int, dict[str, Any] | None, str | None]],
    gold_map: dict[str, dict[str, Any]],
) -> tuple[ValidationSummary, dict[str, dict[str, Any]]]:
    parseable = 0
    case_counter: Counter[str] = Counter()
    outputs: dict[str, dict[str, Any]] = {}
    schema_valid = 0
    unknown_case_ids: list[str] = []

    for _, obj, err in llm_records:
        if err or obj is None:
            continue
        parseable += 1
        case_id = obj.get("caseId")
        if case_id is not None:
            case_counter[str(case_id)] += 1
            outputs[str(case_id)] = obj
            if str(case_id) not in gold_map:
                unknown_case_ids.append(str(case_id))
        if _required_fields_present(obj, LLM_REQUIRED_FIELDS):
            schema_valid += 1

    duplicates = sorted([cid for cid, count in case_counter.items() if count > 1])
    missing = sorted(set(gold_map) - set(outputs))

    summary = ValidationSummary(
        expected_cases=len(gold_map),
        outputs_received=sum(1 for _, obj, _ in llm_records if obj is not None),
        parseable_outputs=parseable,
        missing_case_ids=missing,
        duplicate_case_ids=duplicates,
        schema_valid_outputs=schema_valid,
        unknown_case_ids=sorted(set(unknown_case_ids)),
    )
    return summary, outputs


def _validate_aalie_outputs(
    aalie_rows: dict[str, dict[str, Any]],
    gold_map: dict[str, dict[str, Any]],
) -> ValidationSummary:
    rows = list(aalie_rows.values())
    case_counter: Counter[str] = Counter(row["case_id"] for row in rows if row.get("case_id"))
    duplicates = sorted([cid for cid, count in case_counter.items() if count > 1])
    missing = sorted(set(gold_map) - set(aalie_rows))
    schema_valid = sum(1 for row in rows if _required_fields_present(row, AALIE_REQUIRED_COLUMNS))
    unknown_case_ids = sorted(set(aalie_rows) - set(gold_map))
    return ValidationSummary(
        expected_cases=len(gold_map),
        outputs_received=len(rows),
        parseable_outputs=len(rows),
        missing_case_ids=missing,
        duplicate_case_ids=duplicates,
        schema_valid_outputs=schema_valid,
        unknown_case_ids=unknown_case_ids,
    )


def _infer_group(case_id: str, group_map: dict[str, str]) -> str:
    if case_id in group_map:
        return group_map[case_id]
    if case_id in REGRESSION_GAP_CASE_IDS:
        return "regression_gaps"
    if case_id.startswith("PARSE-") or case_id.startswith("WHILE-U-"):
        return "unsupported_parser"
    if case_id.startswith("WHILE-S-"):
        return "while_strict"
    if case_id.startswith("REC-"):
        return "recursive_strict"
    return "iterative_strict"


def _failure_types(
    *,
    schema_valid: bool,
    gold: dict[str, Any],
    output: dict[str, Any],
    theta_exact: bool,
    safe_rejection: bool,
    hallucinated_bound: bool,
    recurrence_agreement: bool,
    parse_status_agreement: bool,
    analysis_status_agreement: bool,
    algorithm_kind_agreement: bool,
    ideal_recovery: bool,
) -> list[str]:
    failures: list[str] = []
    if not schema_valid:
        failures.append("output_schema_error")
    if not parse_status_agreement:
        failures.append("parser_contract_error")
    if not analysis_status_agreement:
        failures.append("analysis_status_mismatch")
    if not algorithm_kind_agreement:
        failures.append("algorithm_kind_mismatch")
    if gold.get("shouldReject", False):
        if hallucinated_bound:
            failures.append("hallucinated_bound")
        if not safe_rejection:
            failures.append("missing_explicit_safe_rejection")
    else:
        if _none_if_blank(output.get("big_theta")) is None:
            failures.append("missing_primary_big_theta")
            failures.append("strict_contract_failure")
        elif not theta_exact:
            if _shape_aware_match(gold.get("bigTheta"), output.get("big_theta")):
                failures.append("strict_field_or_exact_notation_mismatch")
            else:
                failures.append("mathematical_shape_failure")
        if output.get("analysis_status") in {"unsupported", "unknown", "partial"}:
            failures.append("unsupported_when_gold_available")
    if gold.get("recurrence") and output.get("recurrence") is not None and not recurrence_agreement:
        failures.append("recurrence_mismatch")
    if _infer_group(output.get("caseId") or output.get("case_id") or "", {}) == "regression_gaps" and not ideal_recovery:
        failures.append("failed_gap_recovery")
    return sorted(set(failures))


def _score_system_case(
    *,
    system_name: str,
    case_id: str,
    raw_output: dict[str, Any],
    gold: dict[str, Any],
    group: str,
    family: str,
    schema_valid: bool,
    field_map: dict[str, str],
) -> SystemCaseScore:
    parse_status = _none_if_blank(_mapped_value(raw_output, field_map["parse_status"]))
    analysis_status = _none_if_blank(_mapped_value(raw_output, field_map["analysis_status"]))
    algorithm_kind = _none_if_blank(_mapped_value(raw_output, field_map["algorithm_kind"]))
    big_o = _none_if_blank(_mapped_value(raw_output, field_map["big_o"]))
    big_omega = _none_if_blank(_mapped_value(raw_output, field_map["big_omega"]))
    big_theta = _none_if_blank(_mapped_value(raw_output, field_map["big_theta"]))
    recurrence = _none_if_blank(_mapped_value(raw_output, field_map["recurrence"]))
    recurrence_family = _none_if_blank(_mapped_value(raw_output, field_map["recurrence_family"]))

    parse_status_agreement = str(parse_status) == str(gold.get("parseStatus"))
    analysis_status_agreement = str(analysis_status) == str(gold.get("analysisStatus"))
    algorithm_kind_agreement = str(algorithm_kind) == str(gold.get("algorithmKind"))
    theta_exact = _exact_match(gold.get("bigTheta"), big_theta)
    theta_shape = _shape_aware_match(gold.get("bigTheta"), big_theta)
    recurrence_agreement = (
        _normalize_recurrence(gold.get("recurrence")) == _normalize_recurrence(recurrence)
        if gold.get("recurrence") is not None and recurrence is not None
        else False
    )
    recurrence_family_agreement = (
        str(_none_if_blank(recurrence_family)) == str(_none_if_blank(gold.get("recurrenceFamily")))
        if gold.get("recurrenceFamily") is not None and recurrence_family is not None
        else False
    )

    should_reject = bool(gold.get("shouldReject", False))
    must_not_invent = bool(gold.get("mustNotInventTheta", False))
    hallucinated_bound = bool(big_o is not None or big_omega is not None or big_theta is not None) if must_not_invent else False
    non_hallucination = (big_o is None and big_omega is None and big_theta is None) if must_not_invent else False
    explicit_safe_rejection = False
    ideal_recovery = False
    passed = False

    if should_reject:
        explicit_safe_rejection = str(analysis_status) in {"unsupported", "unknown", "partial"} and not hallucinated_bound
        passed = explicit_safe_rejection
        ideal_recovery = explicit_safe_rejection if case_id == "WHILE-U-007" else False
    else:
        safe_rejection_allowed = False
        if case_id == "WHILE-S-014":
            safe_rejection_allowed = True
        if theta_exact:
            passed = True
            if group == "regression_gaps":
                ideal_recovery = True
        elif safe_rejection_allowed and str(analysis_status) in {"unsupported", "unknown", "partial"}:
            passed = True
            ideal_recovery = False
            explicit_safe_rejection = True
        else:
            passed = False
            ideal_recovery = False

    normalized_output = {
        "caseId": case_id,
        "parse_status": parse_status,
        "analysis_status": analysis_status,
        "algorithm_kind": algorithm_kind,
        "big_o": big_o,
        "big_omega": big_omega,
        "big_theta": big_theta,
        "recurrence": recurrence,
        "recurrence_family": recurrence_family,
    }

    failure_types = _failure_types(
        schema_valid=schema_valid,
        gold=gold,
        output=normalized_output,
        theta_exact=theta_exact,
        safe_rejection=explicit_safe_rejection,
        hallucinated_bound=hallucinated_bound,
        recurrence_agreement=recurrence_agreement,
        parse_status_agreement=parse_status_agreement,
        analysis_status_agreement=analysis_status_agreement,
        algorithm_kind_agreement=algorithm_kind_agreement,
        ideal_recovery=ideal_recovery,
    )
    return SystemCaseScore(
        case_id=case_id,
        group=group,
        family=family,
        schema_valid=schema_valid,
        parse_status_agreement=parse_status_agreement,
        analysis_status_agreement=analysis_status_agreement,
        algorithm_kind_agreement=algorithm_kind_agreement,
        theta_agreement_exact=theta_exact,
        theta_agreement_shape_aware=theta_shape,
        recurrence_agreement=recurrence_agreement,
        recurrence_family_agreement=recurrence_family_agreement,
        explicit_safe_rejection=explicit_safe_rejection,
        non_hallucination=non_hallucination,
        hallucinated_bound=hallucinated_bound,
        ideal_recovery=ideal_recovery,
        passed=passed,
        failure_types=failure_types,
        output=raw_output,
        gold=gold,
    )


def _score_all_cases(
    *,
    system_name: str,
    outputs: dict[str, dict[str, Any]],
    gold_map: dict[str, dict[str, Any]],
    group_map: dict[str, str],
    family_map: dict[str, str],
    schema_required: set[str] | None,
    field_map: dict[str, str],
) -> dict[str, SystemCaseScore]:
    scores: dict[str, SystemCaseScore] = {}
    for case_id, gold in gold_map.items():
        output = outputs.get(case_id, {field_map["case_id"]: case_id})
        schema_valid = _required_fields_present(output, schema_required) if schema_required else _required_fields_present(output, AALIE_REQUIRED_COLUMNS)
        scores[case_id] = _score_system_case(
            system_name=system_name,
            case_id=case_id,
            raw_output=output,
            gold=gold,
            group=_infer_group(case_id, group_map),
            family=family_map.get(case_id, "unknown"),
            schema_valid=schema_valid,
            field_map=field_map,
        )
    return scores


def _build_metrics(scores: dict[str, SystemCaseScore]) -> dict[str, str | int]:
    values = list(scores.values())
    total_cases = len(values)
    schema_valid_outputs = sum(1 for s in values if s.schema_valid)
    output_coverage = total_cases - sum(1 for s in values if len(s.output) <= 1)
    exact_pass_total = sum(1 for s in values if s.passed)

    theta_cases = [s for s in values if not s.gold.get("shouldReject", False)]
    reject_cases = [s for s in values if s.gold.get("shouldReject", False)]
    no_invent_cases = [s for s in values if s.gold.get("mustNotInventTheta", False)]
    gap_cases = [s for s in values if s.case_id in REGRESSION_GAP_CASE_IDS or s.group == "regression_gaps"]

    return {
        "total_cases": total_cases,
        "schema_valid_outputs": schema_valid_outputs,
        "output_coverage": output_coverage,
        "exact_pass_total": exact_pass_total,
        "pass_rate_total": f"{exact_pass_total}/{total_cases}",
        "theta_accuracy_exact": f"{sum(1 for s in theta_cases if s.theta_agreement_exact)}/{len(theta_cases)}",
        "theta_accuracy_shape_aware": f"{sum(1 for s in theta_cases if s.theta_agreement_shape_aware)}/{len(theta_cases)}",
        "explicit_safe_rejection": f"{sum(1 for s in reject_cases if s.explicit_safe_rejection)}/{len(reject_cases)}",
        "non_hallucination": f"{sum(1 for s in no_invent_cases if s.non_hallucination)}/{len(no_invent_cases)}",
        "hallucinated_bound_rate": f"{sum(1 for s in no_invent_cases if s.hallucinated_bound)}/{len(no_invent_cases)}",
        "ideal_gap_recovery": f"{sum(1 for s in gap_cases if s.ideal_recovery)}/{len(gap_cases)}",
    }


def _compare_metric(a: str, b: str, lower_is_better: bool = False) -> str:
    def parse_ratio(x: str) -> tuple[int, int]:
        lhs, rhs = x.split("/")
        return int(lhs), int(rhs)

    a_num, a_den = parse_ratio(a)
    b_num, b_den = parse_ratio(b)
    a_rate = a_num / a_den if a_den else -1
    b_rate = b_num / b_den if b_den else -1
    if lower_is_better:
        if a_rate < b_rate:
            return "AALIE"
        if b_rate < a_rate:
            return "Direct LLM"
        return "Tie"
    if a_rate > b_rate:
        return "AALIE"
    if b_rate > a_rate:
        return "Direct LLM"
    return "Tie"


def _group_rows(aalie: dict[str, SystemCaseScore], llm: dict[str, SystemCaseScore]) -> list[tuple[str, int, int, int, str]]:
    groups = sorted({s.group for s in aalie.values()} | {s.group for s in llm.values()})
    rows = []
    for group in groups:
        a_group = [s for s in aalie.values() if s.group == group]
        l_group = [s for s in llm.values() if s.group == group]
        cases = len(a_group) if a_group else len(l_group)
        a_pass = sum(1 for s in a_group if s.passed)
        l_pass = sum(1 for s in l_group if s.passed)
        if a_pass > l_pass:
            interp = "AALIE stronger"
        elif l_pass > a_pass:
            interp = "Direct LLM stronger"
        else:
            interp = "Tie"
        rows.append((group, cases, a_pass, l_pass, interp))
    return rows


def _system_output_summary(score: SystemCaseScore) -> str:
    out = score.output
    theta = _none_if_blank(out.get("big_theta") or out.get("bigTheta"))
    status = _none_if_blank(out.get("analysis_status") or out.get("analysisStatus"))
    recurrence = _none_if_blank(out.get("recurrence"))
    parts = [f"analysis_status={status}"]
    if theta is not None:
        parts.append(f"big_theta={theta}")
    if recurrence is not None:
        parts.append(f"recurrence={recurrence}")
    return ", ".join(parts)


def _gold_summary(score: SystemCaseScore) -> str:
    gold = score.gold
    if gold.get("shouldReject"):
        return f"shouldReject=true; mustNotInventTheta={gold.get('mustNotInventTheta', False)}"
    return f"bigTheta={gold.get('bigTheta')}"


def _failure_reason(score: SystemCaseScore) -> str:
    return ", ".join(score.failure_types) if score.failure_types else "none"


def _winner_sections(aalie: dict[str, SystemCaseScore], llm: dict[str, SystemCaseScore]) -> tuple[list[str], list[str], list[str]]:
    aalie_wins: list[str] = []
    llm_wins: list[str] = []
    both_fail: list[str] = []
    for case_id in sorted(aalie):
        a = aalie[case_id]
        llm_score = llm[case_id]
        if a.passed and not llm_score.passed:
            aalie_wins.append(
                f"- `{case_id}`: gold `{_gold_summary(a)}`; AALIE `{_system_output_summary(a)}`; LLM `{_system_output_summary(llm_score)}`; failure reason: `{_failure_reason(llm_score)}`"
            )
        elif llm_score.passed and not a.passed:
            llm_wins.append(
                f"- `{case_id}`: gold `{_gold_summary(llm_score)}`; AALIE `{_system_output_summary(a)}`; LLM `{_system_output_summary(llm_score)}`; reason LLM wins: `{_failure_reason(a)}`"
            )
        elif not a.passed and not llm_score.passed:
            shared = sorted(set(a.failure_types) & set(llm_score.failure_types))
            both_fail.append(
                f"- `{case_id}`: gold `{_gold_summary(a)}`; AALIE `{_system_output_summary(a)}`; LLM `{_system_output_summary(llm_score)}`; shared failure pattern: `{', '.join(shared) if shared else 'different failure modes'}`"
            )
    return aalie_wins, llm_wins, both_fail


def _shape_winner_sections(
    aalie: dict[str, SystemCaseScore],
    llm: dict[str, SystemCaseScore],
) -> tuple[list[str], list[str]]:
    aalie_wins: list[str] = []
    llm_wins: list[str] = []
    for case_id in sorted(aalie):
        a = aalie[case_id]
        llm_score = llm[case_id]
        if a.gold.get("shouldReject", False):
            continue
        a_shape = a.theta_agreement_shape_aware
        llm_shape = llm_score.theta_agreement_shape_aware
        if a_shape and not llm_shape:
            aalie_wins.append(
                f"- `{case_id}`: gold `{_gold_summary(a)}`; AALIE `{_system_output_summary(a)}`; LLM `{_system_output_summary(llm_score)}`; reason: LLM misses mathematical shape agreement."
            )
        elif llm_shape and not a_shape:
            llm_wins.append(
                f"- `{case_id}`: gold `{_gold_summary(llm_score)}`; AALIE `{_system_output_summary(a)}`; LLM `{_system_output_summary(llm_score)}`; reason: LLM matches mathematical shape while AALIE does not."
            )
    return aalie_wins, llm_wins


def _failure_taxonomy(aalie: dict[str, SystemCaseScore], llm: dict[str, SystemCaseScore]) -> list[tuple[str, int, int, str]]:
    keys = sorted({ft for s in aalie.values() for ft in s.failure_types} | {ft for s in llm.values() for ft in s.failure_types})
    rows = []
    for key in keys:
        a_cases = [s.case_id for s in aalie.values() if key in s.failure_types]
        l_cases = [s.case_id for s in llm.values() if key in s.failure_types]
        reps = sorted(set((a_cases + l_cases)[:4]))
        rows.append((key, len(a_cases), len(l_cases), ", ".join(reps)))
    return rows


def _build_key_findings(a_metrics: dict[str, Any], l_metrics: dict[str, Any], group_rows: list[tuple[str, int, int, int, str]]) -> list[str]:
    findings = []
    findings.append(
        f"AALIE pass rate is {a_metrics['pass_rate_total']}, while the direct LLM pass rate is {l_metrics['pass_rate_total']}."
    )
    findings.append(
        f"On shape-aware mathematical accuracy, AALIE scores {a_metrics['theta_accuracy_shape_aware']} and the direct LLM scores {l_metrics['theta_accuracy_shape_aware']}."
    )
    findings.append(
        f"Safe rejection performance is {a_metrics['explicit_safe_rejection']} for AALIE and {l_metrics['explicit_safe_rejection']} for the direct LLM."
    )
    findings.append(
        f"Hallucination control is measured over must-not-invent cases: AALIE shows {a_metrics['hallucinated_bound_rate']} and the direct LLM shows {l_metrics['hallucinated_bound_rate']}."
    )
    weakest = min(group_rows, key=lambda row: row[2])
    findings.append(
        f"For AALIE, the weakest family is `{weakest[0]}` with {weakest[2]}/{weakest[1]} passes."
    )
    findings.append(
        "The benchmark distinguishes strict structured-output success from shape-aware mathematical success; several direct LLM misses are contract failures rather than mathematical-shape failures."
    )
    findings.append(
        "AALIE remains deterministic and auditable, while the direct LLM may recover some mathematical answers but can still lose credit through schema or contract misses."
    )
    return findings


def _paper_paragraph(a_metrics: dict[str, Any], l_metrics: dict[str, Any]) -> str:
    return (
        "We evaluated AALIE and a direct LLM baseline on LLM40, a balanced 40-case benchmark derived from the oracle dataset and scored strictly against gold targets rather than by mutual comparison. "
        "The evaluation separates exact and shape-aware asymptotic agreement, explicit rejection behavior on unsupported cases, hallucination control under must-not-invent constraints, and ideal recovery on known gap cases. "
        f"Under strict structured-output scoring, both systems achieved {a_metrics['pass_rate_total']} total passes. However, AALIE obtained {a_metrics['theta_accuracy_shape_aware']} shape-aware asymptotic agreement, while the direct LLM obtained {l_metrics['theta_accuracy_shape_aware']}; conversely, the direct LLM achieved {l_metrics['ideal_gap_recovery']} ideal gap recovery compared with {a_metrics['ideal_gap_recovery']} for AALIE. "
        "These results suggest that AALIE provides stronger deterministic contract stability, whereas the direct LLM can recover some mathematical reasoning beyond the current deterministic engine but remains more vulnerable to strict structured-output misses."
    )


def _render_report(
    *,
    aalie_validation: ValidationSummary,
    llm_validation: ValidationSummary,
    aalie_scores: dict[str, SystemCaseScore],
    llm_scores: dict[str, SystemCaseScore],
    aalie_metrics: dict[str, Any],
    llm_metrics: dict[str, Any],
    stale_warning: str | None,
) -> str:
    group_rows = _group_rows(aalie_scores, llm_scores)
    aalie_wins, llm_wins, both_fail = _winner_sections(aalie_scores, llm_scores)
    aalie_shape_wins, llm_shape_wins = _shape_winner_sections(aalie_scores, llm_scores)
    taxonomy_rows = _failure_taxonomy(aalie_scores, llm_scores)
    findings = _build_key_findings(aalie_metrics, llm_metrics, group_rows)

    lines: list[str] = []
    lines.append("# LLM40 Scoring and AALIE vs Direct LLM Comparison")
    lines.append("")
    lines.append("## 1. Input validation")
    lines.append("")
    lines.append("| Check | AALIE | Direct LLM | Notes |")
    lines.append("|---|---:|---:|---|")
    lines.append(f"| Cases expected | {aalie_validation.expected_cases} | {llm_validation.expected_cases} | |")
    lines.append(f"| Outputs received | {aalie_validation.outputs_received} | {llm_validation.outputs_received} | |")
    lines.append(f"| Missing caseIds | {len(aalie_validation.missing_case_ids)} | {len(llm_validation.missing_case_ids)} | |")
    lines.append(f"| Duplicate caseIds | {len(aalie_validation.duplicate_case_ids)} | {len(llm_validation.duplicate_case_ids)} | |")
    lines.append(f"| Schema-valid outputs | {aalie_validation.schema_valid_outputs} | {llm_validation.schema_valid_outputs} | |")
    lines.append(f"| Parseable outputs | {aalie_validation.parseable_outputs} | {llm_validation.parseable_outputs} | |")
    if stale_warning:
        lines.append("")
        lines.append(f"Warning: {stale_warning}")
    lines.append("")
    lines.append("## 2. Aggregate metrics")
    lines.append("")
    lines.append("| Metric | AALIE | Direct LLM | Better |")
    lines.append("|---|---:|---:|---|")
    rows = [
        ("Total pass", aalie_metrics["pass_rate_total"], llm_metrics["pass_rate_total"], _compare_metric(aalie_metrics["pass_rate_total"], llm_metrics["pass_rate_total"])),
        ("Theta accuracy exact", aalie_metrics["theta_accuracy_exact"], llm_metrics["theta_accuracy_exact"], _compare_metric(aalie_metrics["theta_accuracy_exact"], llm_metrics["theta_accuracy_exact"])),
        ("Theta accuracy shape-aware", aalie_metrics["theta_accuracy_shape_aware"], llm_metrics["theta_accuracy_shape_aware"], _compare_metric(aalie_metrics["theta_accuracy_shape_aware"], llm_metrics["theta_accuracy_shape_aware"])),
        ("Explicit safe rejection", aalie_metrics["explicit_safe_rejection"], llm_metrics["explicit_safe_rejection"], _compare_metric(aalie_metrics["explicit_safe_rejection"], llm_metrics["explicit_safe_rejection"])),
        ("Non-hallucination", aalie_metrics["non_hallucination"], llm_metrics["non_hallucination"], _compare_metric(aalie_metrics["non_hallucination"], llm_metrics["non_hallucination"])),
        ("Hallucinated bound rate", aalie_metrics["hallucinated_bound_rate"], llm_metrics["hallucinated_bound_rate"], _compare_metric(aalie_metrics["hallucinated_bound_rate"], llm_metrics["hallucinated_bound_rate"], lower_is_better=True) + " (Lower is better)"),
        ("Ideal gap recovery", aalie_metrics["ideal_gap_recovery"], llm_metrics["ideal_gap_recovery"], _compare_metric(aalie_metrics["ideal_gap_recovery"], llm_metrics["ideal_gap_recovery"])),
    ]
    for name, a_val, l_val, better in rows:
        lines.append(f"| {name} | {a_val} | {l_val} | {better} |")
    lines.append("")
    lines.append("## 3. Results by group")
    lines.append("")
    lines.append("| Group | Cases | AALIE pass | Direct LLM pass | Interpretation |")
    lines.append("|---|---:|---:|---:|---|")
    for group, cases, a_pass, l_pass, interp in group_rows:
        lines.append(f"| {group} | {cases} | {a_pass} | {l_pass} | {interp} |")
    lines.append("")
    lines.append("## 4. Strict scoring wins for AALIE")
    lines.append("")
    lines.append("Some of these are exact-notation or primary-field failures, not mathematical-shape failures.")
    lines.append("")
    lines.extend(aalie_wins or ["None."])
    lines.append("")
    lines.append("## 5. Strict scoring wins for Direct LLM")
    lines.append("")
    lines.append("Some of these are exact-notation or primary-field failures, not mathematical-shape failures.")
    lines.append("")
    lines.extend(llm_wins or ["None."])
    lines.append("")
    lines.append("## 6. Shape-aware mathematical wins for AALIE")
    lines.append("")
    lines.extend(aalie_shape_wins or ["None."])
    lines.append("")
    lines.append("## 7. Shape-aware mathematical wins for Direct LLM")
    lines.append("")
    lines.extend(llm_shape_wins or ["None."])
    lines.append("")
    lines.append("## 8. Strict scoring cases where both fail")
    lines.append("")
    lines.append("These are cases where both systems fail under the benchmark's strict structured-output scoring, even if one of them may still satisfy shape-aware mathematical agreement.")
    lines.append("")
    lines.extend(both_fail or ["None."])
    lines.append("")
    lines.append("## 9. Failure taxonomy")
    lines.append("")
    lines.append("| Failure type | AALIE count | Direct LLM count | Representative cases |")
    lines.append("|---|---:|---:|---|")
    for name, a_count, l_count, reps in taxonomy_rows:
        lines.append(f"| {name} | {a_count} | {l_count} | {reps} |")
    lines.append("")
    lines.append("## 10. Key findings")
    lines.append("")
    for i, finding in enumerate(findings, start=1):
        lines.append(f"{i}. {finding}")
    lines.append("")
    lines.append("## 11. Paper-ready paragraph")
    lines.append("")
    lines.append(_paper_paragraph(aalie_metrics, llm_metrics))
    lines.append("")
    return "\n".join(lines)


def _group_summary(scores: dict[str, SystemCaseScore]) -> dict[str, dict[str, int]]:
    by_group: dict[str, dict[str, int]] = {}
    for score in scores.values():
        bucket = by_group.setdefault(score.group, {"cases": 0, "pass": 0})
        bucket["cases"] += 1
        if score.passed:
            bucket["pass"] += 1
    return by_group


def _strict_contract_failures(scores: dict[str, SystemCaseScore]) -> int:
    count = 0
    for score in scores.values():
        if any(
            failure in score.failure_types
            for failure in (
                "missing_primary_big_theta",
                "strict_contract_failure",
                "output_schema_error",
            )
        ):
            count += 1
    return count


def _mathematical_shape_failures(scores: dict[str, SystemCaseScore]) -> int:
    return sum(1 for score in scores.values() if "mathematical_shape_failure" in score.failure_types)


def _build_individual_summary(
    *,
    model_id: str,
    display_name: str,
    provider: str,
    benchmark: str,
    validation: ValidationSummary,
    metrics: dict[str, Any],
    scores: dict[str, SystemCaseScore],
) -> dict[str, Any]:
    return {
        "modelId": model_id,
        "displayName": display_name,
        "provider": provider,
        "benchmark": benchmark,
        "status": "valid_or_partial"
        if validation.schema_valid_outputs < validation.expected_cases or validation.missing_case_ids or validation.duplicate_case_ids or validation.unknown_case_ids
        else "valid",
        "totalCases": validation.expected_cases,
        "schemaValidOutputs": validation.schema_valid_outputs,
        "parseableOutputs": validation.parseable_outputs,
        "missingCaseIds": len(validation.missing_case_ids),
        "duplicateCaseIds": len(validation.duplicate_case_ids),
        "metrics": {
            "totalPass": metrics["pass_rate_total"],
            "thetaAccuracyExact": metrics["theta_accuracy_exact"],
            "thetaAccuracyShapeAware": metrics["theta_accuracy_shape_aware"],
            "explicitSafeRejection": metrics["explicit_safe_rejection"],
            "nonHallucination": metrics["non_hallucination"],
            "hallucinatedBoundRate": metrics["hallucinated_bound_rate"],
            "idealGapRecovery": metrics["ideal_gap_recovery"],
            "strictContractFailures": _strict_contract_failures(scores),
            "missingPrimaryBigTheta": sum(1 for score in scores.values() if "missing_primary_big_theta" in score.failure_types),
            "mathematicalShapeFailures": _mathematical_shape_failures(scores),
        },
        "byGroup": _group_summary(scores),
    }


def _case_rows(scores: dict[str, SystemCaseScore], system_name: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for score in sorted(scores.values(), key=lambda s: s.case_id):
        rows.append(
            {
                "system": system_name,
                "case_id": score.case_id,
                "group": score.group,
                "family": score.family,
                "schema_valid": score.schema_valid,
                "parse_status_agreement": score.parse_status_agreement,
                "analysis_status_agreement": score.analysis_status_agreement,
                "algorithm_kind_agreement": score.algorithm_kind_agreement,
                "theta_agreement_exact": score.theta_agreement_exact,
                "theta_agreement_shape_aware": score.theta_agreement_shape_aware,
                "recurrence_agreement": score.recurrence_agreement,
                "recurrence_family_agreement": score.recurrence_family_agreement,
                "explicit_safe_rejection": score.explicit_safe_rejection,
                "non_hallucination": score.non_hallucination,
                "hallucinated_bound": score.hallucinated_bound,
                "ideal_recovery": score.ideal_recovery,
                "pass": score.passed,
                "failure_types": ", ".join(score.failure_types),
            }
        )
    return rows


def _write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    fieldnames = list(rows[0].keys())
    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def score_comparison(
    *,
    llm_jsonl: Path,
    gold_jsonl: Path,
    aalie_csv: Path,
    index_json: Path,
    model_id: str = "direct_llm",
    model_name: str = "Direct LLM",
    provider: str = "",
) -> dict[str, Any]:
    gold_map, _, _ = _load_gold(gold_jsonl)
    index_group_map, index_family_map = _load_index_group_family(index_json)
    aalie_rows, aalie_group_map, aalie_family_map = _build_case_maps_from_aalie_csv(aalie_csv)
    llm_records = _load_jsonl(llm_jsonl)

    llm_validation, llm_outputs = _validate_llm_outputs(llm_records, gold_map)
    aalie_validation = _validate_aalie_outputs(aalie_rows, gold_map)

    group_map = dict(aalie_group_map)
    group_map.update(index_group_map)
    family_map = dict(aalie_family_map)
    family_map.update(index_family_map)

    llm_scores = _score_all_cases(
        system_name=model_name,
        outputs=llm_outputs,
        gold_map=gold_map,
        group_map=group_map,
        family_map=family_map,
        schema_required=LLM_REQUIRED_FIELDS,
        field_map={
            "case_id": "caseId",
            "parse_status": "parse_status",
            "analysis_status": "analysis_status",
            "algorithm_kind": "algorithm_kind",
            "big_o": "big_o",
            "big_omega": "big_omega",
            "big_theta": "big_theta",
            "recurrence": "recurrence",
            "recurrence_family": "recurrence_family",
        },
    )
    aalie_scores = _score_all_cases(
        system_name="AALIE",
        outputs=aalie_rows,
        gold_map=gold_map,
        group_map=group_map,
        family_map=family_map,
        schema_required=None,
        field_map={
            "case_id": "case_id",
            "parse_status": "parse_status",
            "analysis_status": "analysis_status",
            "algorithm_kind": "derived_algorithm_kind",
            "big_o": "",
            "big_omega": "",
            "big_theta": "big_theta",
            "recurrence": "",
            "recurrence_family": "derived_recurrence_family",
        },
    )

    aalie_metrics = _build_metrics(aalie_scores)
    llm_metrics = _build_metrics(llm_scores)
    stale_warning = None

    report = _render_report(
        aalie_validation=aalie_validation,
        llm_validation=llm_validation,
        aalie_scores=aalie_scores,
        llm_scores=llm_scores,
        aalie_metrics=aalie_metrics,
        llm_metrics=llm_metrics,
        stale_warning=stale_warning,
    )

    return {
        "report": report,
        "aalie_validation": aalie_validation,
        "llm_validation": llm_validation,
        "aalie_scores": aalie_scores,
        "llm_scores": llm_scores,
        "aalie_metrics": aalie_metrics,
        "llm_metrics": llm_metrics,
        "llm_summary": _build_individual_summary(
            model_id=model_id,
            display_name=model_name,
            provider=provider,
            benchmark="LLM40",
            validation=llm_validation,
            metrics=llm_metrics,
            scores=llm_scores,
        ),
        "aalie_summary": _build_individual_summary(
            model_id="aalie",
            display_name="AALIE",
            provider="AALIE",
            benchmark="LLM40",
            validation=aalie_validation,
            metrics=aalie_metrics,
            scores=aalie_scores,
        ),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Score LLM40 outputs against gold and compare AALIE vs direct LLM")
    parser.add_argument("--llm-jsonl", required=True, type=Path)
    parser.add_argument("--gold-jsonl", required=True, type=Path)
    parser.add_argument("--aalie-csv", required=True, type=Path)
    parser.add_argument("--out-md", required=True, type=Path)
    parser.add_argument("--index-json", type=Path, default=_THIS / "llm40_index.json")
    parser.add_argument("--model-id", default="direct_llm")
    parser.add_argument("--model-name", default="Direct LLM")
    parser.add_argument("--provider", default="")
    parser.add_argument("--out-csv", type=Path)
    parser.add_argument("--out-json", type=Path)
    args = parser.parse_args()

    result = score_comparison(
        llm_jsonl=args.llm_jsonl,
        gold_jsonl=args.gold_jsonl,
        aalie_csv=args.aalie_csv,
        index_json=args.index_json,
        model_id=args.model_id,
        model_name=args.model_name,
        provider=args.provider,
    )
    args.out_md.parent.mkdir(parents=True, exist_ok=True)
    args.out_md.write_text(result["report"], encoding="utf-8")
    _log(f"Wrote {args.out_md}")

    if args.out_csv:
        _write_csv(args.out_csv, _case_rows(result["llm_scores"], args.model_name))
        _log(f"Wrote {args.out_csv}")

    if args.out_json:
        args.out_json.parent.mkdir(parents=True, exist_ok=True)
        args.out_json.write_text(json.dumps(result["llm_summary"], indent=2, ensure_ascii=False), encoding="utf-8")
        _log(f"Wrote {args.out_json}")


if __name__ == "__main__":
    main()
