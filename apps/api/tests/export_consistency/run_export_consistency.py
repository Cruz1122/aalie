#!/usr/bin/env python3
"""
Export Consistency Checker

Checks cross-format export consistency for the 12 cases in export_cases.json.
Uses FastAPI TestClient for HTTP-level consistency testing of the export pipeline.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import sys
import time
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

API_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(API_ROOT))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import create_app  # noqa: E402
from benchmarks.common import _run_cmd, theta_matches  # noqa: E402


def load_cases(path: Path) -> list[dict[str, Any]]:
    return json.loads(path.read_text(encoding="utf-8"))


def _do_export(
    client: TestClient, case_dir: Path, source: str, formats: list[str]
) -> dict[str, Any]:
    start = time.perf_counter()
    payload: dict[str, Any] = {
        "source": source,
        "formats": formats,
        "locale": "es",
        "pdfTimeoutMs": 300000,
        "includeZipBundle": True,
    }
    response = client.post("/export/report", json=payload)
    elapsed_ms = (time.perf_counter() - start) * 1000

    result: dict[str, Any] = {
        "ok": response.status_code == 200,
        "status_code": response.status_code,
        "elapsed_ms": round(elapsed_ms, 1),
    }

    headers = dict(response.headers)
    (case_dir / "export_response_headers.json").write_text(
        json.dumps(headers, indent=2, ensure_ascii=False)
    )

    if response.status_code == 200:
        zip_bytes = response.content
        (case_dir / "export_bundle.zip").write_bytes(zip_bytes)

        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
            zf.extractall(str(case_dir))

        for key, filename in [("snapshot", "snapshot.json"), ("manifest", "manifest.json")]:
            fp = case_dir / filename
            if fp.exists():
                result[key] = json.loads(fp.read_text(encoding="utf-8"))

        md_path = case_dir / "report.md"
        tex_path = case_dir / "report.tex"
        pdf_path = case_dir / "report.pdf"

        result["md_content"] = md_path.read_text(encoding="utf-8") if md_path.exists() else None
        result["tex_content"] = tex_path.read_text(encoding="utf-8") if tex_path.exists() else None
        result["pdf_exists"] = pdf_path.exists()
        result["pdf_bytes"] = len(pdf_path.read_bytes()) if pdf_path.exists() else 0
        result["response_snapshot_id"] = (
            headers.get("x-snapshot-id") or headers.get("X-Snapshot-Id")
        )
        result["response_content_hash"] = (
            headers.get("x-content-hash") or headers.get("X-Content-Hash")
        )
        result["response_filename"] = str(
            headers.get("content-disposition") or headers.get("Content-Disposition") or ""
        )
    else:
        try:
            error_body = response.json()
        except Exception:
            error_body = {"error": response.text[:4000]}
        result["error"] = error_body
        (case_dir / "export_error.json").write_text(
            json.dumps(error_body, indent=2, ensure_ascii=False)
        )

    return result


def run_single_case(
    client: TestClient,
    case: dict[str, Any],
    case_dir: Path,
    formats: list[str],
) -> dict[str, Any]:
    source_path = API_ROOT / case["sourcePath"]
    source = source_path.read_text(encoding="utf-8")

    result = _do_export(client, case_dir, source, formats)

    # Fallback: if PDF compilation is unavailable (e.g. missing pdflatex),
    # retry without PDF to collect markdown/latex/snapshot artifacts
    if not result["ok"] and "pdf" in formats:
        error = result.get("error") or {}
        if error.get("kind") == "compiler_missing":
            no_pdf_formats = [f for f in formats if f != "pdf"]
            if no_pdf_formats:
                fallback_dir = case_dir / "_fallback"
                fallback_dir.mkdir(parents=True, exist_ok=True)
                fallback = _do_export(client, fallback_dir, source, no_pdf_formats)

                if fallback["ok"]:
                    fallback.update({"pdf_skipped": True, "pdf_skip_reason": "pdflatex not available"})
                    for fname in ["report.md", "report.tex", "snapshot.json", "manifest.json", "export_bundle.zip"]:
                        src = fallback_dir / fname
                        dst = case_dir / fname
                        if src.exists():
                            dst.write_bytes(src.read_bytes())
                    hdr_src = fallback_dir / "export_response_headers.json"
                    if hdr_src.exists():
                        (case_dir / "export_response_headers.json").write_bytes(hdr_src.read_bytes())

                    # Clean up fallback dir
                    import shutil
                    if fallback_dir.exists():
                        shutil.rmtree(str(fallback_dir), ignore_errors=True)

                    result["ok"] = True
                    result["status_code"] = fallback["status_code"]
                    result["elapsed_ms"] = result.get("elapsed_ms", 0) + fallback.get("elapsed_ms", 0)
                    result["snapshot"] = fallback.get("snapshot")
                    result["manifest"] = fallback.get("manifest")
                    result["md_content"] = fallback.get("md_content")
                    result["tex_content"] = fallback.get("tex_content")
                    result["pdf_exists"] = False
                    result["pdf_bytes"] = 0
                    result["response_snapshot_id"] = fallback.get("response_snapshot_id")
                    result["response_content_hash"] = fallback.get("response_content_hash")
                    result["response_filename"] = fallback.get("response_filename", "")

    return result


def run_checks(case: dict[str, Any], result: dict[str, Any]) -> dict[str, Any]:
    snapshot = result.get("snapshot")
    manifest = result.get("manifest")
    md = result.get("md_content")
    tex = result.get("tex_content")
    pdf_exists = result.get("pdf_exists", False)

    expected_status = case.get("expectedStatus", "available")
    expected_theta = case.get("expectedTheta", "")
    expected_kind = case.get("expectedAlgorithmKind")
    is_parse_failure = expected_status == "parse_failed"

    checks: dict[str, Any] = {}

    if not result["ok"]:
        checks["overall_status"] = "pass" if is_parse_failure else "fail"
        checks["error_kind"] = (result.get("error") or {}).get("kind", "")
        checks["error_message"] = (result.get("error") or {}).get("error", str(result.get("error", "")))
        return checks

    if snapshot is None:
        return {"overall_status": "fail", "error_message": "snapshot.json not found in ZIP",
                "error_kind": "missing_snapshot"}

    sid = snapshot.get("snapshotId", "")
    ch = snapshot.get("contentHash", "")

    checks["snapshot_schema_version"] = snapshot.get("schemaVersion", "")
    checks["snapshot_schema_version_valid"] = bool(checks["snapshot_schema_version"])
    checks["snapshot_id"] = sid
    checks["snapshot_id_valid"] = bool(sid)
    checks["content_hash"] = ch
    checks["content_hash_valid"] = bool(ch)
    checks["created_at"] = snapshot.get("createdAt", "")
    checks["algorithm_type"] = snapshot.get("algorithmType", "")
    checks["global_result_exists"] = bool(snapshot.get("globalResult"))

    global_theta = ""
    global_result = snapshot.get("globalResult", {})
    if isinstance(global_result, dict):
        worst = (global_result.get("cases") or {}).get("worst") if isinstance(global_result.get("cases"), dict) else None
        if isinstance(worst, dict):
            global_theta = worst.get("big_theta") or worst.get("big_o") or ""
    checks["global_theta"] = global_theta

    if expected_kind == "iterative":
        iterative = snapshot.get("iterative", {})
        if isinstance(iterative, dict):
            checks["iterative_status"] = iterative.get("status", "")
        checks["algo_type_coherent"] = checks["algorithm_type"] == "iterative"
    elif expected_kind == "recursive":
        recursive = snapshot.get("recursive", {})
        if isinstance(recursive, dict):
            checks["recursive_status"] = recursive.get("status", "")
        checks["algo_type_coherent"] = checks["algorithm_type"] == "recursive"
    else:
        checks["algo_type_coherent"] = True

    # Parse failure specifics
    if is_parse_failure:
        meta = snapshot.get("meta", {})
        validity = meta.get("validity", {}) if isinstance(meta, dict) else {}
        checks["parse_ok"] = validity.get("parseOk", True) if isinstance(validity, dict) else True
        checks["parse_failure_detected"] = not checks["parse_ok"]

    # Manifest checks
    checks["manifest_exists"] = manifest is not None
    if manifest:
        checks["manifest_snapshot_id_match"] = manifest.get("snapshotId") == sid
        checks["manifest_content_hash_match"] = manifest.get("contentHash") == ch
        checks["manifest_created_at"] = manifest.get("createdAt", "")
        checks["manifest_formats"] = manifest.get("formats", [])
    else:
        checks["manifest_snapshot_id_match"] = False
        checks["manifest_content_hash_match"] = False

    # Artifact existence
    checks["md_exists"] = md is not None
    checks["tex_exists"] = tex is not None
    checks["pdf_exists"] = pdf_exists

    # MD content checks
    if md:
        checks["md_has_snapshot_id"] = sid in md
        checks["md_has_content_hash"] = ch in md
        theta_stripped = global_theta.replace("\\", "")
        md_stripped = md.replace("\\", "")
        if global_theta and expected_status == "available":
            checks["md_has_theta"] = theta_stripped in md_stripped
        else:
            checks["md_has_theta"] = None
    else:
        checks["md_has_snapshot_id"] = False
        checks["md_has_content_hash"] = False
        checks["md_has_theta"] = False

    # TEX content checks
    if tex:
        checks["tex_has_snapshot_id"] = sid in tex
        theta_stripped = global_theta.replace("\\", "")
        tex_stripped = tex.replace("\\", "")
        if global_theta and expected_status == "available":
            checks["tex_has_theta"] = theta_stripped in tex_stripped
        else:
            checks["tex_has_theta"] = None
    else:
        checks["tex_has_snapshot_id"] = False
        checks["tex_has_theta"] = False

    # Response headers match
    resp_sid = result.get("response_snapshot_id")
    resp_ch = result.get("response_content_hash")
    checks["headers_snapshot_id_match"] = resp_sid == sid if resp_sid else None
    checks["headers_content_hash_match"] = resp_ch == ch if resp_ch else None
    checks["headers_content_disposition"] = bool(result.get("response_filename", ""))

    # Warnings inspection
    meta = snapshot.get("meta", {})
    warnings = meta.get("warnings", []) if isinstance(meta, dict) else []
    checks["warnings_count"] = len(warnings) if isinstance(warnings, list) else 0
    checks["warnings_preserved"] = True
    if isinstance(warnings, list):
        for w in warnings:
            if isinstance(w, dict):
                msg = w.get("message", "")
                if msg:
                    in_md = md and msg in md
                    in_tex = tex and msg in tex
                    if not in_md and not in_tex:
                        checks["warnings_preserved"] = False
                        checks["warning_not_found"] = msg[:120]
                        break

    # No recalculation: manifest IDs match snapshot IDs (same render call)
    if manifest:
        checks["no_recalculation_detected"] = (
            manifest.get("snapshotId") == sid and manifest.get("contentHash") == ch
        )
    else:
        checks["no_recalculation_detected"] = False

    # Theta match
    if expected_theta and global_theta:
        checks["theta_match"] = theta_matches(expected_theta, global_theta)
    else:
        checks["theta_match"] = None

    # SHA256 of assets for consistency
    checks["md_sha256"] = hashlib.sha256((md or "").encode()).hexdigest() if md else None
    checks["tex_sha256"] = hashlib.sha256((tex or "").encode()).hexdigest() if tex else None

    # Overall pass/fail
    mandatory = [
        checks.get("snapshot_id_valid", False),
        checks.get("content_hash_valid", False),
        checks.get("manifest_exists", False),
        checks.get("manifest_snapshot_id_match", False),
        checks.get("manifest_content_hash_match", False),
        checks.get("headers_snapshot_id_match", False),
    ]
    # Remove None checks (where header was not present)
    mandatory = [c for c in mandatory if c is not None]

    if is_parse_failure:
        mandatory.append(checks.get("parse_failure_detected", True))

    if all(c for c in mandatory):
        checks["overall_status"] = "pass"
    elif any(c for c in mandatory if c):
        checks["overall_status"] = "partial"
    else:
        checks["overall_status"] = "fail"

    return checks


def build_detail_entry(
    case: dict[str, Any], result: dict[str, Any], checks: dict[str, Any]
) -> dict[str, Any]:
    snapshot = result.get("snapshot")
    return {
        "caseId": case["caseId"],
        "family": case["family"],
        "expectedTheta": case.get("expectedTheta", ""),
        "expectedStatus": case.get("expectedStatus", "available"),
        "expectedAlgorithmKind": case.get("expectedAlgorithmKind", ""),
        "notes": case.get("notes", ""),
        "sourcePath": case["sourcePath"],
        "exportOk": result.get("ok", False),
        "statusCode": result.get("status_code"),
        "elapsedMs": result.get("elapsed_ms"),
        "snapshotId": snapshot.get("snapshotId", "") if snapshot else None,
        "contentHash": snapshot.get("contentHash", "") if snapshot else None,
        "algorithmType": snapshot.get("algorithmType", "") if snapshot else None,
        "error": result.get("error"),
        "artifacts": {
            "markdown": {
                "exists": result.get("md_content") is not None,
                "sha256": checks.get("md_sha256"),
                "hasSnapshotId": checks.get("md_has_snapshot_id"),
                "hasContentHash": checks.get("md_has_content_hash"),
                "hasTheta": checks.get("md_has_theta"),
            },
            "latex": {
                "exists": result.get("tex_content") is not None,
                "sha256": checks.get("tex_sha256"),
                "hasSnapshotId": checks.get("tex_has_snapshot_id"),
                "hasTheta": checks.get("tex_has_theta"),
            },
            "pdf": {
                "exists": checks.get("pdf_exists", False),
                "size": result.get("pdf_bytes", 0),
            },
            "snapshot": {
                "exists": snapshot is not None,
                "schemaVersion": checks.get("snapshot_schema_version"),
                "createdAt": checks.get("created_at"),
            },
            "manifest": {
                "exists": checks.get("manifest_exists", False),
                "snapshotIdMatch": checks.get("manifest_snapshot_id_match"),
                "contentHashMatch": checks.get("manifest_content_hash_match"),
            },
        },
        "checks": {
            "snapshotIdExists": checks.get("snapshot_id_valid", False),
            "contentHashExists": checks.get("content_hash_valid", False),
            "globalResultExists": checks.get("global_result_exists", False),
            "algoTypeCoherent": checks.get("algo_type_coherent"),
            "mdGenerated": checks.get("md_exists", False),
            "texGenerated": checks.get("tex_exists", False),
            "pdfGenerated": checks.get("pdf_exists", False),
            "warningsPreserved": checks.get("warnings_preserved"),
            "warningsCount": checks.get("warnings_count", 0),
            "thetaMatch": checks.get("theta_match"),
            "globalTheta": checks.get("global_theta", ""),
            "noRecalculationDetected": checks.get("no_recalculation_detected", False),
            "errorKind": checks.get("error_kind"),
            "errorMessage": checks.get("error_message"),
        },
        "overallStatus": checks.get("overall_status", "unknown"),
    }


def render_summary_table(results: list[dict[str, Any]]) -> str:
    lines = [
        "| Case ID | Family | Global Theta | MD | TEX | PDF | Warn | NoRecalc | Status |",
        "|---------|--------|-------------|----|-----|-----|------|----------|--------|",
    ]
    def _tick(v: Any) -> str:
        return "Y" if v else ("N" if v is False else "?")
    for r in results:
        lines.append(
            f"| {r['caseId']:<10} | {r.get('family',''):<20} "
            f"| {r.get('global_theta',''):<20} "
            f"| {_tick(r.get('md_exists')):>4} "
            f"| {_tick(r.get('tex_exists')):>4} "
            f"| {_tick(r.get('pdf_exists')):>4} "
            f"| {_tick(r.get('warnings_preserved')):>4} "
            f"| {_tick(r.get('no_recalculation_detected')):>4} "
            f"| {r.get('overall_status','unknown'):>8} |"
        )
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Export consistency checker")
    parser.add_argument(
        "--cases",
        default="tests/export_consistency/export_cases.json",
        help="Path to export cases JSON (relative to api root)",
    )
    parser.add_argument(
        "--out",
        default="tests/export_consistency/out",
        help="Output directory (relative to api root)",
    )
    parser.add_argument(
        "--formats",
        default="markdown,latex,pdf",
        help="Comma-separated list of export formats",
    )
    args = parser.parse_args()

    formats = [f.strip() for f in args.formats.split(",") if f.strip() in {"markdown", "latex", "pdf"}]
    if not formats:
        formats = ["markdown", "latex", "pdf"]

    cases_path = API_ROOT / args.cases
    if not cases_path.exists():
        print(f"ERROR: Cases file not found: {cases_path}")
        sys.exit(1)

    out_dir = API_ROOT / args.out
    out_dir.mkdir(parents=True, exist_ok=True)

    cases = load_cases(cases_path)
    client = TestClient(create_app())

    all_results: list[dict[str, Any]] = []
    detail: list[dict[str, Any]] = []

    print(f"\nExport Consistency Check — {len(cases)} cases, formats={formats}")
    print(f"  Cases: {cases_path}")
    print(f"  Out:   {out_dir}\n")

    for idx, case in enumerate(cases, 1):
        case_id = case["caseId"]
        case_dir = out_dir / case_id
        case_dir.mkdir(parents=True, exist_ok=True)

        print(f"  [{idx:>2}/{len(cases)}] {case_id:<12} ", end="", flush=True)

        try:
            case_result = run_single_case(client, case, case_dir, formats)
            checks = run_checks(case, case_result)
        except Exception as e:
            checks = {"overall_status": "error", "error_message": str(e), "error_kind": type(e).__name__}
            case_result = {"ok": False, "error": {"error": str(e)}}
            print(f"EXCEPTION: {e}", flush=True)
            (case_dir / "export_error.json").write_text(
                json.dumps({"error": str(e), "kind": type(e).__name__}, indent=2),
                encoding="utf-8",
            )

        status = checks.get("overall_status", "unknown")
        checks["caseId"] = case_id
        checks["family"] = case.get("family", "")
        checks["global_theta"] = checks.get("global_theta", case.get("expectedTheta", ""))

        all_results.append(checks)
        detail.append(build_detail_entry(case, case_result, checks))

        if status == "pass":
            print("PASS")
        elif status == "partial":
            print("PARTIAL")
        elif status == "fail":
            print("FAIL")
        else:
            print(status.upper())

    client.close()

    # CSV summary
    csv_path = out_dir / "export_consistency_summary.csv"
    csv_fields = [
        "caseId", "family", "algorithm_type", "expectedTheta", "expectedStatus",
        "global_theta", "snapshot_id", "content_hash", "snapshot_schema_version",
        "snapshot_id_valid", "content_hash_valid", "global_result_exists",
        "algo_type_coherent", "iterative_status", "recursive_status",
        "md_exists", "tex_exists", "pdf_exists",
        "md_has_snapshot_id", "md_has_content_hash", "md_has_theta",
        "tex_has_snapshot_id", "tex_has_theta",
        "manifest_exists", "manifest_snapshot_id_match", "manifest_content_hash_match",
        "headers_snapshot_id_match", "headers_content_hash_match",
        "warnings_count", "warnings_preserved",
        "no_recalculation_detected", "theta_match",
        "overall_status", "error_kind", "error_message",
    ]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=csv_fields, extrasaction="ignore")
        writer.writeheader()
        for r in all_results:
            row = {k: r.get(k, "") for k in csv_fields}
            for k, v in row.items():
                if isinstance(v, bool):
                    row[k] = str(v)
                elif v is None:
                    row[k] = ""
            writer.writerow(row)

    # Details JSON
    detail_path = out_dir / "export_consistency_details.json"
    detail_doc = {
        "metadata": {
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "git_commit": _run_cmd("git rev-parse HEAD"),
            "pdflatex_version": _run_cmd("pdflatex --version"),
            "python_version": sys.version.split()[0],
            "platform": sys.platform,
            "total_cases": len(cases),
            "formats": formats,
            "cases_file": str(cases_path),
            "out_dir": str(out_dir),
        },
        "cases": detail,
    }
    detail_path.write_text(json.dumps(detail_doc, indent=2, ensure_ascii=False), encoding="utf-8")

    # Validation printout
    pass_count = sum(1 for r in all_results if r.get("overall_status") == "pass")
    partial_count = sum(1 for r in all_results if r.get("overall_status") == "partial")
    fail_count = sum(1 for r in all_results if r.get("overall_status") == "fail")
    error_count = sum(1 for r in all_results if r.get("overall_status") == "error")

    def _tick(v: Any) -> str:
        return "Y" if v else ("N" if v is False else "?")

    print(f"\n{'Case ID':<12} {'Global Theta':<24} {'MD':>4} {'TEX':>4} {'PDF':>4} {'Warn':>5} {'NoRecalc':>9} {'Status':>8}")
    print("-" * 75)
    for r in all_results:
        sid = r.get("caseId", "")
        gt = (r.get("global_theta") or "")[:22]
        md = _tick(r.get("md_exists"))
        tex = _tick(r.get("tex_exists"))
        pdf = _tick(r.get("pdf_exists"))
        warn = _tick(r.get("warnings_preserved"))
        nr = _tick(r.get("no_recalculation_detected"))
        st = r.get("overall_status", "?")
        print(f"{sid:<12} {gt:<24} {md:>4} {tex:>4} {pdf:>4} {warn:>5} {nr:>9} {st:>8}")

    print("-" * 75)
    parts = []
    if pass_count:
        parts.append(f"Pass: {pass_count}")
    if partial_count:
        parts.append(f"Partial: {partial_count}")
    if fail_count:
        parts.append(f"FAIL: {fail_count}")
    if error_count:
        parts.append(f"ERROR: {error_count}")
    print("  ".join(parts))
    print(f"\n  CSV:  {csv_path}")
    print(f"  JSON: {detail_path}")

    if fail_count or error_count:
        print("\n  NOTE: Some cases have non-passing status. Review details JSON for check-level info.")
        print("  PDF failures may indicate missing pdflatex — this is expected in some environments.")


if __name__ == "__main__":
    main()
