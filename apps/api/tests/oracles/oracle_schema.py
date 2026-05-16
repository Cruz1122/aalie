from __future__ import annotations

import json
import re
from enum import Enum
from pathlib import Path
from typing import Any, Optional

from pydantic import BaseModel

from app.modules.analysis.service import analyze_algorithm
from tests._support.assertions import (
    get_notation_from_totals,
    has_asymptotic_notation,
    infer_complexity_class,
)


class Family(str, Enum):
    for_simple = "for_simple"
    for_nested = "for_nested"
    conditional = "conditional"
    while_supported = "while_supported"
    while_unsupported = "while_unsupported"
    recursive_divide_conquer = "recursive_divide_conquer"
    recursive_linear_shift = "recursive_linear_shift"
    snapshot_export = "snapshot_export"
    parser_negative = "parser_negative"


class AlgorithmKind(str, Enum):
    iterative = "iterative"
    recursive = "recursive"
    hybrid = "hybrid"
    unknown = "unknown"


class Status(str, Enum):
    available = "available"
    partial = "partial"
    unsupported = "unsupported"
    unknown = "unknown"
    not_proven = "not_proven"
    parse_error = "parse_error"


class CompareStrategy(str, Enum):
    exact = "exact"
    symbolic_equivalence = "symbolic_equivalence"
    asymptotic_class = "asymptotic_class"
    contract_shape = "contract_shape"
    expected_failure = "expected_failure"


class CaseSpec(BaseModel):
    bigO: Optional[str] = None
    bigOmega: Optional[str] = None
    bigTheta: Optional[str] = None


class ExpectationKind(str, Enum):
    strict_math = "strict_math"
    expected_unsupported = "expected_unsupported"
    regression_characterization = "regression_characterization"
    pending_integration = "pending_integration"


class AalieExpected(BaseModel):
    parseOk: bool
    algorithmKind: Optional[AlgorithmKind] = None
    status: Optional[Status] = None
    expectationKind: ExpectationKind = ExpectationKind.strict_math

    cases: Optional[dict[str, Any]] = None
    hasCaseVariability: Optional[bool] = None

    bigO: Optional[str] = None
    bigOmega: Optional[str] = None
    bigTheta: Optional[str] = None

    expectedMathTheta: Optional[str] = None
    expectedEngineTheta: Optional[str] = None
    expectedMathRecurrence: Optional[str] = None
    expectedEngineRecurrence: Optional[str] = None

    whilePattern: Optional[str] = None
    allowedWhilePatterns: Optional[list[str]] = None
    evidenceLevel: Optional[str] = None
    patternEvidenceLevel: Optional[str] = None
    boundConfidence: Optional[str] = None
    minimumEvidenceLevel: Optional[str] = None

    recurrenceFamily: Optional[str] = None
    defaultMethod: Optional[str] = None
    iterationsExpr: Optional[str] = None
    recurrence: Optional[str] = None
    applicableMethods: Optional[list[str]] = None
    allowedMethods: Optional[list[str]] = None
    termination: Optional[str] = None

    mustHaveByLine: Optional[bool] = None
    mustHaveTotals: Optional[bool] = None
    mustHaveTOpen: Optional[bool] = None
    mustHaveAsymptoticNotation: Optional[bool] = None
    mustHaveTrace: Optional[bool] = None
    mustHaveSnapshot: Optional[bool] = None
    mustExportConsistently: Optional[bool] = None
    mustHaveWhileBlock: Optional[bool] = None
    mustHaveEvidenceLevel: Optional[bool] = None
    mustHavePatternUsed: Optional[bool] = None
    mustNotInventTheta: Optional[bool] = None
    mustHaveDiagnostic: Optional[bool] = None
    allowPartialBundle: Optional[bool] = None
    mustNotAnalyze: Optional[bool] = None
    mustHaveParseErrors: Optional[bool] = None
    mustHaveSnapshotId: Optional[bool] = None
    mustHaveContentHash: Optional[bool] = None

    best: Optional[str] = None
    avg: Optional[str] = None
    dominantTerm: Optional[str] = None
    expectedLoopCount: Optional[str] = None
    expectedLoopCounts: Optional[list[str]] = None
    expectedSummationShape: Optional[str] = None
    expectedComponents: Optional[list[str]] = None


class AalieValidation(BaseModel):
    compare: CompareStrategy
    notes: str = ""


class AalieOracle(BaseModel):
    id: str
    title: str
    family: Family
    sourceFile: str
    expected: AalieExpected
    validation: AalieValidation
    request: Optional[dict[str, Any]] = None


_ORACLE_DIR = Path(__file__).resolve().parent


def load_oracle_source(source_file: str) -> str:
    path = _ORACLE_DIR / source_file
    if not path.exists():
        raise FileNotFoundError(f"Oracle source not found: {path}")
    return path.read_text(encoding="utf-8")


def load_oracle_index(family_filter: Optional[str] = None) -> list[AalieOracle]:
    all_entries: list[dict] = []
    for fname in ["oracle_index.json", "oracle_index.for.json", "oracle_index.if_while.json", "oracle_index.while_u_recursive.json", "oracle_index.export_parser.json"]:
        p = _ORACLE_DIR / fname
        if p.exists():
            all_entries.extend(json.loads(p.read_text(encoding="utf-8")))
    if not all_entries:
        raise FileNotFoundError(f"No oracle index files found in {_ORACLE_DIR}")
    entries = [AalieOracle(**item) for item in all_entries]
    if family_filter:
        return [e for e in entries if e.family == family_filter]
    return entries


def _normalize_notation(raw: str) -> str:
    s = raw.strip().lower()
    s = s.replace("\\", "").replace(" ", "").replace("θ", "theta").replace("ω", "omega")
    s = s.replace("^{", "^").replace("}", "")
    return s


_SLOPPY_PROD = re.compile(r"\b([a-z])\s*\*?\s*([a-z])\b")


def _sort_product_terms(expr: str) -> str:
    def sort_match(m: re.Match) -> str:
        a, b = m.group(1), m.group(2)
        return "*".join(sorted([a, b]))

    return _SLOPPY_PROD.sub(sort_match, expr)


def _notation_matches(expected: str, actual: str) -> bool:
    if not actual:
        return False
    exp_norm = _normalize_notation(expected)
    act_norm = _normalize_notation(actual)
    if exp_norm == act_norm:
        return True
    exp_inner = re.sub(r"^[a-z]+\((.+)\)$", r"\1", exp_norm)
    act_inner = re.sub(r"^[a-z]+\((.+)\)$", r"\1", act_norm)
    if exp_inner == act_inner:
        return True
    exp_sorted = _sort_product_terms(exp_inner)
    act_sorted = _sort_product_terms(act_inner)
    if exp_sorted == act_sorted:
        return True
    exp_terms = sorted(exp_sorted.replace("+", " + ").split("+"))
    act_terms = sorted(act_sorted.replace("+", " + ").split("+"))
    exp_terms = [t.strip() for t in exp_terms if t.strip()]
    act_terms = [t.strip() for t in act_terms if t.strip()]
    return exp_terms == act_terms


def _check_notation_field(
    field: str,
    expected_str: Optional[str],
    case_totals: dict,
    errors: list[str],
    prefix: str,
    case_label: str = "",
):
    if not expected_str:
        return
    mapping = {
        "bigO": "big_o",
        "bigOmega": "big_omega",
        "bigTheta": "big_theta",
    }
    key = mapping.get(field)
    if not key:
        return
    actual = case_totals.get(key, "")
    if not actual:
        errors.append(
            f"{prefix}: {case_label}expected {field}={expected_str}, "
            f"but key {key!r} missing in totals"
        )
        return
    if _notation_matches(expected_str, actual):
        return
    exp_class = infer_complexity_class(expected_str)
    act_class = infer_complexity_class(actual)
    if exp_class != "unknown" and exp_class == act_class:
        return
    act_norm = _normalize_notation(actual)
    exp_norm = _normalize_notation(expected_str)
    errors.append(
        f"{prefix}: {case_label}{field} mismatch: expected {expected_str} "
        f"(norm={exp_norm}, class={exp_class}), "
        f"got {actual} (norm={act_norm}, class={act_class})"
    )


def _validate_case(
    case_key: str,
    case_val: Any,
    result_case: dict,
    errors: list[str],
    prefix: str,
):
    label = f"{case_key}."
    if case_val == "same_as_worst":
        return
    if not isinstance(case_val, dict):
        return
    spec = CaseSpec(**case_val)
    if not spec.bigO and not spec.bigTheta and not spec.bigOmega:
        return
    case_totals = (result_case or {}).get("totals", {})
    _check_notation_field("bigO", spec.bigO, case_totals, errors, prefix, label)
    _check_notation_field("bigOmega", spec.bigOmega, case_totals, errors, prefix, label)
    _check_notation_field("bigTheta", spec.bigTheta, case_totals, errors, prefix, label)


def _validate_cases_dict(
    cases: dict[str, Any],
    result: dict[str, Any],
    errors: list[str],
    prefix: str,
):
    for case_key in ("worst", "best", "avg"):
        case_val = cases.get(case_key)
        if case_val is None:
            continue
        if case_val == "same_as_worst":
            continue
        result_case = result.get(case_key)
        if not isinstance(result_case, dict):
            continue
        _validate_case(case_key, case_val, result_case, errors, prefix)


def _get_while_block_info(while_blocks: list) -> list[dict]:
    if not while_blocks or not isinstance(while_blocks, list):
        return []
    return [wb for wb in while_blocks if isinstance(wb, dict)]


def assert_oracle(
    result: dict[str, Any],
    oracle: AalieOracle,
    *,
    mode: str = "all",
) -> None:
    expected = oracle.expected
    prefix = f"[{oracle.id}] {oracle.title}"

    ok = result.get("ok", False)
    if expected.parseOk:
        assert ok, f"{prefix}: expected parseOk=True, but got ok=False: {result.get('errors', [])}"
    else:
        return

    kind = expected.expectationKind

    if kind == ExpectationKind.expected_unsupported:
        return

    worst = result.get("worst", {})
    worst_totals = worst.get("totals", {})

    _notational_theta = expected.expectedMathTheta if kind == ExpectationKind.strict_math else expected.expectedEngineTheta
    _notational_o = None
    _notational_omega = None

    if expected.status:
        actual_status = worst_totals.get("status", "available")
        assert actual_status == expected.status.value, (
            f"{prefix}: expected status={expected.status.value}, got {actual_status}"
        )

    is_available = worst_totals.get("status", "available") == "available"

    if expected.hasCaseVariability is not None:
        actual_var = result.get("has_case_variability", False)
        assert actual_var == expected.hasCaseVariability, (
            f"{prefix}: expected has_case_variability={expected.hasCaseVariability}, "
            f"got {actual_var}"
        )

    if expected.best == "same_as_worst":
        best_val = result.get("best")
        assert best_val == "same_as_worst" or (
            isinstance(best_val, dict)
            and best_val.get("totals", {}).get("T_open")
            == worst_totals.get("T_open")
        ), f"{prefix}: expected best=same_as_worst, got {best_val}"

    if expected.avg == "same_as_worst":
        avg_val = result.get("avg")
        if avg_val is not None:
            assert avg_val == "same_as_worst" or (
                isinstance(avg_val, dict)
                and avg_val.get("totals", {}).get("T_open")
                == worst_totals.get("T_open")
            ), f"{prefix}: expected avg=same_as_worst, got {avg_val}"

    if expected.mustHaveByLine:
        by_line = worst.get("byLine", [])
        assert by_line, f"{prefix}: expected non-empty byLine"
        for i, row in enumerate(by_line):
            assert "count" in row, f"{prefix}: byLine[{i}] missing 'count'"

    if expected.mustHaveTotals:
        assert worst_totals, f"{prefix}: expected non-empty totals"

    if expected.mustHaveTOpen:
        t_open = worst_totals.get("T_open", "")
        assert t_open, f"{prefix}: expected T_open in totals, got empty"

    if expected.mustHaveAsymptoticNotation:
        has_notation = has_asymptotic_notation(worst_totals) or bool(
            get_notation_from_totals(worst_totals)
        )
        assert has_notation, f"{prefix}: expected asymptotic notation in totals"

    if expected.mustHaveEvidenceLevel:
        while_blocks = _get_while_block_info(worst_totals.get("whileBlocks", []))
        has_evidence = any(
            wb.get("evidenceLevel") for wb in while_blocks
        )
        assert has_evidence, f"{prefix}: expected evidenceLevel in whileBlocks"

    if expected.mustHavePatternUsed:
        while_blocks = _get_while_block_info(worst_totals.get("whileBlocks", []))
        has_pattern = any(
            wb.get("patternUsed") for wb in while_blocks
        )
        assert has_pattern, f"{prefix}: expected patternUsed in whileBlocks"

    errors: list[str] = []

    if is_available:
        if expected.cases:
            _validate_cases_dict(expected.cases, result, errors, prefix)
        else:
            if expected.expectedEngineTheta:
                _check_notation_field("bigTheta", expected.expectedEngineTheta, worst_totals, errors, prefix)
            elif expected.expectedMathTheta:
                _check_notation_field("bigTheta", expected.expectedMathTheta, worst_totals, errors, prefix)
            elif expected.bigTheta:
                _check_notation_field("bigTheta", expected.bigTheta, worst_totals, errors, prefix)
            _check_notation_field("bigO", expected.bigO, worst_totals, errors, prefix)
            _check_notation_field("bigOmega", expected.bigOmega, worst_totals, errors, prefix)

    if expected.whilePattern:
        while_blocks = _get_while_block_info(worst_totals.get("whileBlocks", []))
        actual_patterns = [wb.get("patternUsed", "") for wb in while_blocks]
        if expected.whilePattern not in actual_patterns:
            errors.append(
                f"{prefix}: expected whilePattern={expected.whilePattern!r}, "
                f"got patterns {actual_patterns}"
            )

    if expected.allowedWhilePatterns:
        while_blocks = _get_while_block_info(worst_totals.get("whileBlocks", []))
        actual_patterns = [wb.get("patternUsed", "") for wb in while_blocks]
        if not any(p in expected.allowedWhilePatterns for p in actual_patterns):
            errors.append(
                f"{prefix}: expected allowedWhilePatterns={expected.allowedWhilePatterns}, "
                f"got patterns {actual_patterns}"
            )

    if expected.evidenceLevel:
        while_blocks = _get_while_block_info(worst_totals.get("whileBlocks", []))
        actual_levels = [wb.get("evidenceLevel", "") for wb in while_blocks]
        if expected.evidenceLevel not in actual_levels:
            errors.append(
                f"{prefix}: expected evidenceLevel={expected.evidenceLevel!r}, "
                f"got levels {actual_levels}"
            )

    if expected.minimumEvidenceLevel:
        level_rank = {"weak": 0, "medium": 1, "strong": 2, "contradictory": -1}
        min_rank = level_rank.get(expected.minimumEvidenceLevel, 0)
        while_blocks = _get_while_block_info(worst_totals.get("whileBlocks", []))
        actual_levels = [wb.get("evidenceLevel", "weak") for wb in while_blocks]
        if not actual_levels:
            errors.append(
                f"{prefix}: expected minimumEvidenceLevel={expected.minimumEvidenceLevel}, "
                f"but no whileBlocks found"
            )
        else:
            max_rank = max(level_rank.get(lvl, -1) for lvl in actual_levels)
            if max_rank < min_rank:
                errors.append(
                    f"{prefix}: expected minimumEvidenceLevel={expected.minimumEvidenceLevel}, "
                    f"got levels {actual_levels}"
                )

    if expected.iterationsExpr:
        while_blocks = _get_while_block_info(worst_totals.get("whileBlocks", []))
        actual_exprs = [wb.get("iterationsExpr", "") for wb in while_blocks]
        if not actual_exprs:
            errors.append(
                f"{prefix}: expected iterationsExpr but no whileBlocks found"
            )
        else:
            ie = expected.iterationsExpr.lower().replace(" ", "").replace("\\", "")
            match = any(
                ie in e.lower().replace(" ", "").replace("\\", "")
                for e in actual_exprs
            )
            if not match:
                errors.append(
                    f"{prefix}: expected iterationsExpr={expected.iterationsExpr!r} "
                    f"not found in {actual_exprs}"
                )

    if expected.dominantTerm:
        t_open = worst_totals.get("T_open", "")
        is_poly = worst_totals.get("t_polynomial", "")
        source_expr = t_open or is_poly or ""
        if source_expr:
            dom = expected.dominantTerm.lower().replace(" ", "")
            src = source_expr.lower()
            src = src.replace("\\", "").replace(" ", "")
            src = src.replace("cdot", "").replace("left", "").replace("right", "")
            src = src.replace("^{", "^").replace("}", "").replace("*", "")
            dom_clean = dom.replace("*", "")
            dom_vars = set(re.findall(r"[a-z]", dom_clean))
            src_vars = set(re.findall(r"[a-z]", src))
            if expected.bigTheta:
                exp_class = infer_complexity_class(expected.bigTheta)
                if exp_class == "constant":
                    if src_vars:
                        errors.append(
                            f"{prefix}: dominantTerm {expected.dominantTerm!r} suggests constant, "
                            f"but expression contains variables in {source_expr!r}"
                        )
                elif dom_vars:
                    missing = dom_vars - src_vars
                    if missing:
                        errors.append(
                            f"{prefix}: dominantTerm expects variables {missing} "
                            f"but they are absent from expression {source_expr!r}"
                        )

    if expected.expectedLoopCount:
        counts = worst_totals.get("counts", {})
        if counts:
            found = any(
                str(expected.expectedLoopCount) in str(v) for v in counts.values()
            )
            if not found:
                errors.append(
                    f"{prefix}: expectedLoopCount {expected.expectedLoopCount!r} "
                    f"not found in counts {counts}"
                )

    if expected.expectedLoopCounts:
        counts = worst_totals.get("counts", {})
        if counts:
            actual_counts = list(counts.values())
            for i, exp_count in enumerate(expected.expectedLoopCounts):
                if i < len(actual_counts):
                    if str(exp_count) not in str(actual_counts[i]):
                        errors.append(
                            f"{prefix}: expectedLoopCounts[{i}]={exp_count!r} "
                            f"not in actual {actual_counts[i]}"
                        )

    if expected.mustNotInventTheta:
        has_theta = bool(worst_totals.get("big_theta") or worst_totals.get("big_o"))
        if has_theta:
            errors.append(
                f"{prefix}: expected no invented theta, but found "
                f"big_theta={worst_totals.get('big_theta')!r}"
            )

    if expected.mustHaveDiagnostic:
        while_blocks = _get_while_block_info(worst_totals.get("whileBlocks", []))
        has_diag = any(
            wb.get("diagnostics") for wb in while_blocks
        )
        if not has_diag:
            rec = worst_totals.get("recurrence", {})
            has_recurrence_note = bool(rec.get("notes")) if isinstance(rec, dict) else False
            if not has_recurrence_note:
                errors.append(f"{prefix}: expected diagnostic but none found in whileBlocks or recurrence")

    if expected.mustHaveParseErrors:
        parse_errors = result.get("errors", [])
        if not parse_errors:
            errors.append(f"{prefix}: expected parse errors but got none")

    if expected.recurrence:
        rec = worst_totals.get("recurrence", {})
        if isinstance(rec, dict):
            actual_form = rec.get("form", "")
            f_val = rec.get("f") or rec.get("g(n)") or rec.get("g") or ""
            if f_val and "f(n)" in actual_form:
                actual_form = actual_form.replace("f(n)", str(f_val))
            if f_val and "g(n)" in actual_form:
                actual_form = actual_form.replace("g(n)", str(f_val))
            exp_clean = expected.recurrence.lower().replace(" ", "").replace("\\", "").replace("cdot", "")
            act_clean = actual_form.lower().replace(" ", "").replace("\\", "").replace("cdot", "")
            if exp_clean != act_clean:
                import difflib
                ratio = difflib.SequenceMatcher(None, exp_clean, act_clean).ratio()
                if ratio < 0.5:
                    errors.append(
                        f"{prefix}: expected recurrence {expected.recurrence!r}, "
                        f"got resolved form {actual_form!r}"
                    )

    if expected.applicableMethods:
        rec = worst_totals.get("recurrence", {})
        if isinstance(rec, dict):
            actual_method = rec.get("method", "")
            if actual_method and actual_method not in expected.applicableMethods:
                rt = worst_totals.get("recursion_tree", {})
                if isinstance(rt, dict):
                    alt_method = rt.get("method", "")
                    if alt_method and alt_method not in expected.applicableMethods:
                        errors.append(
                            f"{prefix}: expected applicableMethods={expected.applicableMethods}, "
                            f"got method={actual_method!r} / rec_tree={alt_method!r}"
                        )

    if expected.termination:
        while_blocks = _get_while_block_info(worst_totals.get("whileBlocks", []))
        for wb in while_blocks:
            actual_term = wb.get("status", "")
            if actual_term == "unknown":
                actual_term = "unknown"
            if actual_term == "available":
                actual_term = "available"

    if expected.mustHaveSnapshotId:
        sid = result.get("_snapshotId") or result.get("snapshotId") or worst.get("snapshotId")
        if not sid:
            errors.append(f"{prefix}: expected snapshotId in result")

    if expected.mustHaveContentHash:
        ch = result.get("_contentHash") or result.get("contentHash") or worst.get("contentHash")
        if not ch:
            errors.append(f"{prefix}: expected contentHash in result")

    if errors:
        raise AssertionError("\n".join(errors))


def assert_oracle_parse_fails(
    result: dict[str, Any],
    oracle: AalieOracle,
) -> None:
    prefix = f"[{oracle.id}] {oracle.title}"
    assert not result.get("ok", True), f"{prefix}: expected parse failure, but got ok=True"
    errors = result.get("errors", [])
    assert errors, f"{prefix}: expected parse errors, got none"


def run_oracle_with_metrics(
    oracle: AalieOracle,
    mode: str = "all",
    locale: str = "en",
) -> dict[str, Any]:
    result = run_oracle(oracle, mode=mode, locale=locale)
    metrics: dict[str, Any] = {
        "oracle_id": oracle.id,
        "family": oracle.family.value,
        "expectation_kind": oracle.expected.expectationKind.value,
        "assertion_pass": False,
        "theta_agreement": False,
        "recurrence_agreement": None,
        "method_agreement": None,
        "pattern_agreement": None,
        "pattern_evidence_level": None,
        "bound_confidence": None,
        "export_metadata_pass": False,
        "export_contract_pass": False,
        "runtime_ms": None,
        "diagnostics": [],
    }
    worst = result.get("worst", {})
    totals = worst.get("totals", {})
    kind = oracle.expected.expectationKind

    try:
        assert_oracle(result, oracle)
        metrics["assertion_pass"] = True
    except AssertionError as e:
        metrics["assertion_pass"] = False
        metrics["diagnostics"].append(str(e))
        return metrics

    if kind == ExpectationKind.strict_math:
        target_theta = None
        if oracle.expected.bigTheta:
            target_theta = oracle.expected.bigTheta
        elif oracle.expected.expectedMathTheta:
            target_theta = oracle.expected.expectedMathTheta
        elif oracle.expected.cases:
            worst_case = oracle.expected.cases.get("worst")
            if isinstance(worst_case, dict):
                target_theta = worst_case.get("bigTheta") or worst_case.get("bigO") or worst_case.get("bigOmega")
        if target_theta:
            actual = totals.get("big_theta", "") or totals.get("big_o", "")
            if actual:
                metrics["theta_agreement"] = _notation_matches(target_theta, actual) or \
                    infer_complexity_class(target_theta) == infer_complexity_class(actual)
        else:
            metrics["theta_agreement"] = True

        rec = totals.get("recurrence", {})
        act_form = rec.get("form", "")
        if act_form:
            exp_rec = oracle.expected.expectedMathRecurrence or oracle.expected.recurrence or ""
            if exp_rec:
                exp_clean = exp_rec.lower().replace(" ", "").replace("\\", "").replace("cdot", "")
                act_clean = act_form.lower().replace(" ", "").replace("\\", "").replace("cdot", "")
                f_val = rec.get("f") or rec.get("g(n)") or rec.get("g") or ""
                if f_val and "f(n)" in act_clean:
                    act_clean = act_clean.replace("f(n)", str(f_val).lower())
                if f_val and "g(n)" in act_clean:
                    act_clean = act_clean.replace("g(n)", str(f_val).lower())
                metrics["recurrence_agreement"] = exp_clean in act_clean or act_clean in exp_clean
            metrics["recurrence_agreement"] = metrics.get("recurrence_agreement") or False
        if oracle.expected.defaultMethod:
            actual_method = rec.get("method", "")
            rt = totals.get("recursion_tree", {})
            alt_method = rt.get("method", "") if isinstance(rt, dict) else ""
            metrics["method_agreement"] = actual_method == oracle.expected.defaultMethod or alt_method == oracle.expected.defaultMethod

    if kind in (ExpectationKind.strict_math, ExpectationKind.regression_characterization) and oracle.family.value.startswith("while_"):
        wb = _get_while_block_info(totals.get("whileBlocks", []))
        if wb:
            metrics["pattern_evidence_level"] = wb[0].get("evidenceLevel")
            metrics["pattern_agreement"] = oracle.expected.whilePattern == wb[0].get("patternUsed") if oracle.expected.whilePattern else None
            metrics["bound_confidence"] = oracle.expected.boundConfidence

    if kind == ExpectationKind.pending_integration:
        has_sid = bool(result.get("_snapshotId"))
        has_ch = bool(result.get("_contentHash"))
        metrics["export_metadata_pass"] = has_sid and has_ch
        metrics["export_contract_pass"] = False

    return metrics


def run_oracle(
    oracle: AalieOracle,
    mode: str = "all",
    locale: str = "en",
) -> dict[str, Any]:
    source = load_oracle_source(oracle.sourceFile)
    kwargs: dict[str, Any] = dict(source=source, mode=mode, locale=locale)
    if oracle.expected.algorithmKind:
        kwargs["algorithm_kind"] = oracle.expected.algorithmKind.value
    if oracle.request:
        if "mode" in oracle.request:
            kwargs["mode"] = oracle.request["mode"]
        if "avgModel" in oracle.request:
            kwargs["avg_model"] = oracle.request["avgModel"]
    result = analyze_algorithm(**kwargs)

    if oracle.family == Family.snapshot_export and result.get("ok"):
        try:
            from app.modules.export.service import ExportService
            export_payload = {
                "source": source,
                "formats": ["markdown"],
                "locale": locale,
            }
            if oracle.request:
                if "formats" in oracle.request:
                    export_payload["formats"] = oracle.request["formats"]
                if "bundle" in oracle.request:
                    export_payload["bundle"] = oracle.request["bundle"]
            svc = ExportService()
            export_result = svc.render_report(export_payload)
            if export_result.get("ok"):
                result["_exportOk"] = True
                result["_snapshotId"] = export_result.get("snapshotId")
                result["_contentHash"] = export_result.get("contentHash")
            else:
                result["_exportOk"] = False
                result["_exportError"] = export_result.get("error")
        except Exception as exc:
            result["_exportOk"] = False
            result["_exportError"] = str(exc)

    return result



