"""Validate real snapshots against AALIE snapshot contract rules."""

from __future__ import annotations

from typing import Any

from .common import (
    extract_types_snapshot_schema_version,
    read_json_file,
    section_data,
    section_status,
)

ROOT_REQUIRED_FIELDS = (
    "schemaVersion",
    "snapshotId",
    "contentHash",
    "createdAt",
    "locale",
    "meta",
    "input",
    "internal",
    "globalResult",
    "comparative",
    "institutional",
    "algorithmType",
    "iterative",
    "recursive",
)


def _check(name: str, ok: bool, detail: str) -> dict[str, Any]:
    return {"name": name, "ok": ok, "detail": detail}


def _error(code: str, message: str) -> dict[str, str]:
    return {"code": code, "message": message}


def _warning(code: str, message: str) -> dict[str, str]:
    return {"code": code, "message": message}


def _load_snapshot(
    snapshot: dict[str, Any] | None, snapshot_path: str | None
) -> dict[str, Any]:
    if snapshot is not None:
        return snapshot
    if snapshot_path:
        return read_json_file(snapshot_path)
    raise ValueError("Provide snapshot or snapshot_path.")


def _case_presence_count(cases: dict[str, Any]) -> int:
    return sum(value is not None for value in cases.values())


def _iterative_has_public_payload(iterative: dict[str, Any]) -> bool:
    data = section_data(iterative)
    if not isinstance(data, dict):
        return False
    line_cost_table = data.get("lineCostTable")
    summations = data.get("summations")
    if isinstance(line_cost_table, dict) and any(
        value is not None for value in line_cost_table.values()
    ):
        return True
    if isinstance(summations, dict) and any(
        value is not None for value in summations.values()
    ):
        return True
    return False


def _recursive_has_public_payload(recursive: dict[str, Any]) -> bool:
    data = section_data(recursive)
    if not isinstance(data, dict):
        return False
    recurrence = data.get("recurrence")
    methods_available = data.get("methodsAvailable")
    return section_status(recurrence) == "available" and section_status(
        methods_available
    ) in {
        "available",
        "missing_data",
    }


def _section_has_meaningful_public_data(section: dict[str, Any]) -> bool:
    if section_status(section) != "available":
        return False
    data = section_data(section)
    if isinstance(data, dict):
        for value in data.values():
            if isinstance(value, dict) and section_status(value) in {
                "not_requested",
                "not_supported",
                "not_implemented",
                "missing_data",
            }:
                continue
            if value not in (None, [], {}):
                return True
        return False
    return data not in (None, [], {})


def validate_snapshot_contract(
    snapshot: dict[str, Any] | None = None,
    snapshot_path: str | None = None,
) -> dict[str, Any]:
    """Validate a snapshot JSON object or file path against repo contracts."""

    try:
        loaded_snapshot = _load_snapshot(snapshot=snapshot, snapshot_path=snapshot_path)
    except Exception as exc:
        return {
            "valid": False,
            "errors": [_error("snapshot_load_failed", str(exc))],
            "warnings": [],
            "checks": [],
        }

    from app.modules.export.constants import SNAPSHOT_SCHEMA_VERSION

    checks: list[dict[str, Any]] = []
    errors: list[dict[str, str]] = []
    warnings: list[dict[str, str]] = []

    missing_fields = [
        field for field in ROOT_REQUIRED_FIELDS if field not in loaded_snapshot
    ]
    if missing_fields:
        errors.append(
            _error(
                "missing_root_fields",
                "Missing required root fields: " + ", ".join(missing_fields),
            )
        )
    checks.append(
        _check(
            "root_required_fields",
            not missing_fields,
            (
                "All required snapshot root fields are present."
                if not missing_fields
                else "Missing fields: " + ", ".join(missing_fields)
            ),
        )
    )

    shared_version = extract_types_snapshot_schema_version()
    snapshot_version = loaded_snapshot.get("schemaVersion")
    version_ok = (
        snapshot_version == SNAPSHOT_SCHEMA_VERSION
        and shared_version is not None
        and snapshot_version == shared_version
    )
    if shared_version is None:
        warnings.append(
            _warning(
                "shared_types_schema_version_unreadable",
                "Could not read the snapshot schema version from packages/types.",
            )
        )
    if snapshot_version != SNAPSHOT_SCHEMA_VERSION:
        errors.append(
            _error(
                "schema_version_mismatch",
                f"Snapshot schemaVersion '{snapshot_version}' does not match backend '{SNAPSHOT_SCHEMA_VERSION}'.",
            )
        )
    if shared_version is not None and snapshot_version != shared_version:
        errors.append(
            _error(
                "shared_types_schema_version_mismatch",
                f"Snapshot schemaVersion '{snapshot_version}' does not match shared types '{shared_version}'.",
            )
        )
    checks.append(
        _check(
            "schema_version_alignment",
            version_ok,
            (
                "Snapshot, backend and shared types agree on schemaVersion."
                if version_ok
                else "Schema versions are not aligned."
            ),
        )
    )

    global_result = loaded_snapshot.get("globalResult")
    cases = (global_result or {}).get("cases")
    required_cases = {"worst", "best", "avg"}
    cases_ok = isinstance(cases, dict) and required_cases.issubset(cases.keys())
    if not cases_ok:
        errors.append(
            _error(
                "global_result_cases_missing",
                "globalResult.cases must include worst, best and avg.",
            )
        )
    checks.append(
        _check(
            "global_result_cases",
            cases_ok,
            (
                "globalResult.cases includes worst/best/avg."
                if cases_ok
                else "globalResult.cases is missing required entries."
            ),
        )
    )

    iterative = loaded_snapshot.get("iterative") or {}
    recursive = loaded_snapshot.get("recursive") or {}
    iterative_status = section_status(iterative)
    recursive_status = section_status(recursive)
    if iterative_status is None:
        errors.append(
            _error("iterative_section_missing_status", "iterative.status is required.")
        )
    if recursive_status is None:
        errors.append(
            _error("recursive_section_missing_status", "recursive.status is required.")
        )
    checks.append(
        _check(
            "section_status_presence",
            iterative_status is not None and recursive_status is not None,
            (
                "iterative and recursive expose contract statuses."
                if iterative_status is not None and recursive_status is not None
                else "A section status is missing."
            ),
        )
    )

    algorithm_type = loaded_snapshot.get("algorithmType")
    case_presence = _case_presence_count(cases or {})

    if algorithm_type == "iterative":
        iterative_ok = (
            iterative_status == "available" and _iterative_has_public_payload(iterative)
        )
        recursive_contradiction = (
            recursive_status == "available"
            and _section_has_meaningful_public_data(recursive)
        )
        if not iterative_ok:
            errors.append(
                _error(
                    "iterative_public_payload_missing",
                    "Iterative snapshots must expose iterative public payload.",
                )
            )
        if recursive_contradiction:
            errors.append(
                _error(
                    "iterative_recursive_contradiction",
                    "algorithmType=iterative cannot expose active recursive public data.",
                )
            )
        if case_presence == 0:
            errors.append(
                _error(
                    "global_result_contradiction",
                    "Iterative snapshot cannot have all globalResult cases empty.",
                )
            )
        checks.append(
            _check(
                "iterative_type_consistency",
                iterative_ok and not recursive_contradiction and case_presence > 0,
                (
                    "Iterative sections align with algorithmType."
                    if iterative_ok
                    and not recursive_contradiction
                    and case_presence > 0
                    else "Iterative sections contradict the public contract."
                ),
            )
        )

    if algorithm_type == "recursive":
        recursive_ok = (
            recursive_status == "available" and _recursive_has_public_payload(recursive)
        )
        if not recursive_ok:
            errors.append(
                _error(
                    "recursive_public_payload_missing",
                    "Recursive snapshots must expose recurrence and method metadata publicly.",
                )
            )
        if case_presence == 0:
            errors.append(
                _error(
                    "global_result_contradiction",
                    "Recursive snapshot cannot have all globalResult cases empty.",
                )
            )
        checks.append(
            _check(
                "recursive_type_consistency",
                recursive_ok and case_presence > 0,
                (
                    "Recursive sections align with algorithmType."
                    if recursive_ok and case_presence > 0
                    else "Recursive sections contradict the public contract."
                ),
            )
        )

    if algorithm_type == "hybrid":
        hybrid_ok = _section_has_meaningful_public_data(
            iterative
        ) or _section_has_meaningful_public_data(recursive)
        if not hybrid_ok:
            errors.append(
                _error(
                    "hybrid_public_payload_missing",
                    "Hybrid snapshots must expose at least one public analytical section.",
                )
            )
        checks.append(
            _check(
                "hybrid_type_consistency",
                hybrid_ok,
                (
                    "Hybrid snapshot exposes public analytical sections."
                    if hybrid_ok
                    else "Hybrid snapshot lacks public analytical sections."
                ),
            )
        )

    internal = loaded_snapshot.get("internal") or {}
    internal_recurrence = (
        internal.get("recurrence") if isinstance(internal, dict) else None
    )
    if (
        algorithm_type in {"recursive", "hybrid"}
        and section_status(internal_recurrence) == "available"
        and recursive_status != "available"
    ):
        errors.append(
            _error(
                "public_contract_hidden_in_internal",
                "Recursive contract data exists only in internal while public recursive section is unavailable.",
            )
        )
    if (
        case_presence == 0
        and isinstance(internal, dict)
        and any(
            section_status(value) == "available"
            for value in internal.values()
            if isinstance(value, dict)
        )
    ):
        warnings.append(
            _warning(
                "public_sections_thin_internal_rich",
                "Internal data is populated while public result sections are empty; avoid relying on internal as public contract.",
            )
        )
    checks.append(
        _check(
            "internal_not_public_dependency",
            not any(
                error["code"] == "public_contract_hidden_in_internal"
                for error in errors
            ),
            (
                "Public sections do not appear to depend solely on internal data."
                if not any(
                    error["code"] == "public_contract_hidden_in_internal"
                    for error in errors
                )
                else "Public contract is hidden inside internal fields."
            ),
        )
    )

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "checks": checks,
        "schema_versions": {
            "snapshot": snapshot_version,
            "backend": SNAPSHOT_SCHEMA_VERSION,
            "shared_types": shared_version,
        },
    }
