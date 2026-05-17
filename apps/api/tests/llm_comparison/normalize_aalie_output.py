from __future__ import annotations

import hashlib
import json
import re
from typing import Any

from .schemas import AalieNormalizedOutput

BIG_THETA_PATHS = [
    "globalResult.bigTheta",
    "globalResult.theta",
    "totals.bigTheta",
    "totals.theta",
    "result.bigTheta",
    "bigTheta",
    "worst.totals.big_theta",
    "worst.totals.big_o",
]

BIG_O_PATHS = [
    "globalResult.bigO",
    "totals.bigO",
    "totals.big_o",
    "result.bigO",
    "bigO",
    "worst.totals.big_o",
]

BIG_OMEGA_PATHS = [
    "globalResult.bigOmega",
    "totals.bigOmega",
    "totals.big_omega",
    "result.bigOmega",
    "bigOmega",
    "worst.totals.big_omega",
]

RECURRENCE_PATHS = [
    "recursive.recurrence",
    "recursive.recurrenceInfo.recurrence",
    "totals.recurrence",
    "totals.recurrence.form",
    "recurrence",
    "recurrence.form",
    "worst.totals.recurrence.form",
    "worst.totals.recurrence",
]

RECURRENCE_FAMILY_PATHS = [
    "recursive.recurrenceFamily",
    "totals.recurrenceFamily",
    "recurrenceFamily",
    "worst.totals.recurrenceFamily",
]

WHILE_PATTERN_PATHS = [
    "while.pattern_used",
    "while.patternUsed",
    "while.pattern",
    "diagnostics.whilePattern",
    "worst.totals.whileBlocks",
]

ALGORITHM_KIND_PATHS = [
    "algorithmKind",
    "globalResult.algorithmKind",
    "worst.algorithmKind",
]

ANALYSIS_STATUS_PATHS = [
    "status",
    "globalResult.status",
    "worst.status",
    "worst.totals.status",
]


def get_path(obj: dict[str, Any], path: str) -> Any:
    parts = path.split(".")
    current: Any = obj
    for part in parts:
        if isinstance(current, dict):
            current = current.get(part)
        elif isinstance(current, list):
            try:
                idx = int(part)
                if 0 <= idx < len(current):
                    current = current[idx]
                else:
                    return None
            except (ValueError, IndexError):
                return None
        else:
            return None
    return current


def first_present(obj: dict[str, Any], paths: list[str]) -> Any:
    for path in paths:
        value = get_path(obj, path)
        if value not in (None, "", [], {}):
            return value
    return None


_FUNC_RE = re.compile(r"(?:log|sqrt|sin|cos|tan|exp|max|min|inf|left|right|infty|infinity|frac)")


def _sort_commutative(expr: str) -> str:
    placeholders: dict[str, str] = {}

    def _protect(m: re.Match) -> str:
        token = m.group(0)
        ph = f"\x00P{len(placeholders)}\x00"
        placeholders[ph] = token
        return ph

    expr = _FUNC_RE.sub(_protect, expr)

    expr = re.sub(r"(?<=[a-z])(?=[a-z])", "*", expr)

    for ph, token in placeholders.items():
        expr = expr.replace(ph, token)

    terms = re.split(r"\s*\+\s*", expr)
    sorted_terms: list[str] = []
    for term in terms:
        factors = re.split(r"\s*\*\s*", term)
        factors = [f.strip() for f in factors if f.strip()]
        factors.sort()
        sorted_terms.append("*".join(factors))
    sorted_terms.sort()
    return "+".join(sorted_terms)


def _parse_braced(s: str, i: int) -> tuple[str, int]:
    assert s[i] == "{"
    i += 1
    depth = 1
    start = i
    while i < len(s) and depth > 0:
        if s[i] == "{":
            depth += 1
        elif s[i] == "}":
            depth -= 1
        i += 1
    return s[start : i - 1], i


def _replace_frac(s: str) -> str:
    parts: list[str] = []
    i = 0
    while i < len(s):
        if s[i : i + 5] == "\\frac":
            i += 5
            while i < len(s) and s[i].isspace():
                i += 1
            if i < len(s) and s[i] == "{":
                num, i = _parse_braced(s, i)
            else:
                parts.append("\\frac")
                continue
            while i < len(s) and s[i].isspace():
                i += 1
            if i < len(s) and s[i] == "{":
                den, i = _parse_braced(s, i)
            else:
                parts.append(f"\\frac{{{num}}}")
                continue
            parts.append(f"{num}/{den}")
        else:
            parts.append(s[i])
            i += 1
    return "".join(parts)


def _strip_latex(s: str) -> str:
    s = re.sub(r"\\left|\\right", "", s)
    s = _replace_frac(s)
    s = re.sub(r"\\sqrt\s*\{([^}]*)\}", r"sqrt(\1)", s)
    s = re.sub(r"\\sqrt\[(\d+)\]\s*\{([^}]*)\}", r"cbrt(\1,\2)", s)
    s = re.sub(r"\\(?:cdot|times|\*)", "*", s)
    s = re.sub(r"\\(?:operatorname|mathrm|mathbf|mathit)\{([^}]*)\}", r"\1", s)
    s = re.sub(r"\\(?:log|lg|ln|sin|cos|tan)", "log", s)
    s = re.sub(r"\\(?:Theta|theta|Omega|omega|O)\b", "", s)
    s = re.sub(r"\\(?:[a-zA-Z]+)", "", s)
    return s


def normalize_theta(value: str | None) -> str | None:
    if value is None:
        return None
    s = value.strip()
    s = s.replace("Θ", "Theta")
    s = s.replace("θ", "Theta")
    s = s.replace("φ", "phi")
    s = s.replace("²", "^2")
    s = s.replace("∞", "infinity")
    s = s.replace("infty", "infinity")
    s = s.replace("\\Theta", "Theta")
    s = s.replace("\\Omega", "Omega")
    s = s.replace("\\log", "log")
    s = s.replace("log_2", "log")
    s = s.replace("log₂", "log")
    s = s.replace(" ", "")

    prefix = ""
    wrapper = ""
    if s.startswith("Theta(") and s.endswith(")"):
        prefix = "Theta("
        inner = s[6:-1]
    elif s.startswith("Omega(") and s.endswith(")"):
        prefix = "Omega("
        inner = s[6:-1]
    elif s.startswith("O(") and s.endswith(")"):
        prefix = "O("
        inner = s[2:-1]
    else:
        prefix = ""
        inner = s

    inner = _strip_latex(inner)
    inner = inner.replace("{", "").replace("}", "")
    inner = _sort_commutative(inner)

    if prefix:
        s = f"{prefix}{inner})"
    else:
        s = f"Theta({inner})"

    aliases = {
        "Theta(nlogn)": "Theta(nlogn)",
        "Theta(n*logn)": "Theta(nlogn)",
        "Theta(logn)": "Theta(logn)",
        "Theta(n^2)": "Theta(n^2)",
        "Theta(n^3)": "Theta(n^3)",
        "Theta(phi^n)": "Theta(phi^n)",
    }

    s = aliases.get(s, s)
    if s == "Theta()":
        return None
    return s or None


def _extract_from_while_blocks(result: dict) -> str | None:
    wb = first_present(result, ["worst.totals.whileBlocks", "totals.whileBlocks", "whileBlocks"])
    if isinstance(wb, list) and len(wb) > 0:
        patterns = [b.get("patternUsed") or b.get("pattern_used") for b in wb if isinstance(b, dict)]
        patterns = [p for p in patterns if p]
        if patterns:
            return patterns[0]
    return None


def _extract_diagnostics(result: dict) -> list[str]:
    diags: list[str] = []
    if not isinstance(result, dict):
        return diags

    errors = result.get("errors") or result.get("diagnostics") or []
    if isinstance(errors, list):
        diags.extend(str(e) for e in errors)

    wb = first_present(result, ["worst.totals.whileBlocks", "totals.whileBlocks"])
    if isinstance(wb, list):
        for block in wb:
            if isinstance(block, dict):
                block_diags = block.get("diagnostics") or block.get("notes") or block.get("status")
                if block_diags and isinstance(block_diags, str):
                    diags.append(block_diags)

    rec = first_present(result, ["worst.totals.recurrence", "totals.recurrence"])
    if isinstance(rec, dict):
        notes = rec.get("notes") or rec.get("method")
        if notes and isinstance(notes, str):
            if notes not in diags:
                diags.append(notes)

    if not diags and not result.get("ok", True):
        errors = result.get("errors", [])
        if errors:
            diags.extend(str(e) for e in errors)
        else:
            diags.append("No analysis result available.")

    return diags


def compute_raw_result_hash(raw: dict[str, Any]) -> str:
    raw_str = json.dumps(raw, sort_keys=True, ensure_ascii=False, default=str)
    return "sha256:" + hashlib.sha256(raw_str.encode("utf-8")).hexdigest()


def _map_algorithm_kind(raw_kind: str | None) -> str | None:
    if raw_kind is None:
        return None
    rk = raw_kind.lower().replace("-", "_").replace(" ", "_")
    if rk in ("iterative", "recursive", "hybrid", "unknown"):
        return rk
    return raw_kind


def _camelize(norm: dict[str, Any]) -> dict[str, Any]:
    return {
        "caseId": norm["case_id"],
        "system": norm["system"],
        "parseStatus": norm["parse_status"],
        "analysisStatus": norm["analysis_status"],
        "algorithmKind": norm["algorithm_kind"],
        "bigO": norm["big_o"],
        "bigOmega": norm["big_omega"],
        "bigTheta": norm["big_theta"],
        "recurrence": norm["recurrence"],
        "recurrenceFamily": norm["recurrence_family"],
        "whilePattern": norm["while_pattern"],
        "diagnostics": norm["diagnostics"],
        "rawResultHash": norm["raw_result_hash"],
    }


def normalize_aalie_output(case_id: str, raw: dict[str, Any]) -> dict[str, Any]:
    ok = raw.get("ok", False)
    parse_error = not ok

    parse_status: str
    if parse_error:
        parse_status = "invalid"
    else:
        parse_status = "valid"

    analysis_status_raw = first_present(raw, ANALYSIS_STATUS_PATHS) or "available"
    analysis_status = str(analysis_status_raw) if analysis_status_raw else "available"

    algorithm_kind_raw = first_present(raw, ALGORITHM_KIND_PATHS) or "unknown"
    algorithm_kind = _map_algorithm_kind(str(algorithm_kind_raw) if algorithm_kind_raw else "unknown")

    if parse_status == "invalid":
        norm = AalieNormalizedOutput(
            case_id=case_id,
            parse_status="invalid",
            analysis_status="unsupported",
            algorithm_kind="unknown",
            diagnostics=_extract_diagnostics(raw) or ["Parse error."],
            raw_result_hash=compute_raw_result_hash(raw),
        ).__dict__
        return _camelize(norm)

    big_theta_raw = first_present(raw, BIG_THETA_PATHS)
    big_theta = normalize_theta(str(big_theta_raw) if big_theta_raw else None)

    big_o_raw = first_present(raw, BIG_O_PATHS)
    big_o = normalize_theta(str(big_o_raw) if big_o_raw else None)

    big_omega_raw = first_present(raw, BIG_OMEGA_PATHS)
    big_omega = normalize_theta(str(big_omega_raw) if big_omega_raw else None)

    big_theta = big_theta or big_o or big_omega

    recurrence = first_present(raw, RECURRENCE_PATHS)
    if isinstance(recurrence, dict):
        recurrence = recurrence.get("form") or recurrence.get("recurrence") or json.dumps(recurrence)
    elif not isinstance(recurrence, str):
        recurrence = None

    recurrence_family = first_present(raw, RECURRENCE_FAMILY_PATHS)
    if isinstance(recurrence_family, str):
        recurrence_family = recurrence_family
    else:
        recurrence_family = None

    while_pattern = _extract_from_while_blocks(raw)

    diagnostics = _extract_diagnostics(raw)

    if not big_theta and not big_o and not big_omega:
        if analysis_status in ("unsupported", "unknown", "not_proven"):
            pass
        elif recurrence is not None:
            pass
        else:
            if not diagnostics:
                diagnostics.append("No asymptotic notation inferred.")

    norm = AalieNormalizedOutput(
        case_id=case_id,
        parse_status=parse_status,
        analysis_status=analysis_status,
        algorithm_kind=algorithm_kind,
        big_o=big_o,
        big_omega=big_omega,
        big_theta=big_theta,
        recurrence=str(recurrence) if recurrence else None,
        recurrence_family=recurrence_family,
        while_pattern=while_pattern,
        diagnostics=diagnostics,
        raw_result_hash=compute_raw_result_hash(raw),
    ).__dict__

    return _camelize(norm)
