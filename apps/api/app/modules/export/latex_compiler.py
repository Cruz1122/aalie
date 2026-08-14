"""
PDF compilation via pdflatex with rich diagnostics.
"""

from __future__ import annotations

import shutil
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Dict, Iterable, List

from .asset_builder import build_asset_manifest
from .asset_registry import resolve_latex_asset_registry
from .models import LatexCompilationError


def is_pdflatex_available() -> bool:
    return shutil.which("pdflatex") is not None


def compile_latex_to_pdf(
    tex_content: str,
    *,
    timeout_ms: int | None = None,
    job_name: str | None = None,
    cleanup: bool = True,
    extra_files: Iterable[Dict[str, bytes | str]] | None = None,
    preserve_workdir_on_error: bool = False,
    passes: int = 2,
) -> Dict[str, object]:
    timeout = (timeout_ms or 120_000) / 1000.0
    name = job_name or "report"
    if passes not in {1, 2}:
        raise ValueError("passes must be 1 or 2")

    if not is_pdflatex_available():
        raise LatexCompilationError(
            "compiler_missing",
            "pdflatex is not available in the current environment.",
        )

    assets = resolve_latex_asset_registry()
    profile: Dict[str, float] = {}
    setup_started = time.perf_counter()
    work_dir = Path(tempfile.mkdtemp(prefix="aalie-export-"))
    profile["temp_setup_ms"] = (time.perf_counter() - setup_started) * 1000
    tex_path = work_dir / f"{name}.tex"
    pdf_path = work_dir / f"{name}.pdf"
    logos_dir = work_dir / "logos"
    logs: List[str] = []
    asset_entries: List[Dict[str, object]] = []

    def _copy_file(src: str, dest: Path) -> None:
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, dest)
        asset_entries.append(
            {
                "filename": str(dest.relative_to(work_dir)),
                "mimeType": ("application/pdf" if dest.suffix.lower() == ".pdf" else "text/plain"),
                "size": dest.stat().st_size,
            }
        )

    try:
        logos_dir.mkdir(parents=True, exist_ok=True)
        _copy_file(assets.style_file_path, work_dir / "aalie-report.sty")
        _copy_file(assets.ucaldas_logo_path, logos_dir / "ucaldas.pdf")
        _copy_file(assets.aalie_logo_path, logos_dir / "aalie.pdf")

        for extra in extra_files or []:
            rel = str(extra.get("relativePath") or "").lstrip("/").strip()
            if not rel:
                continue
            dest = work_dir / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            content = extra.get("content") or b""
            if isinstance(content, bytes):
                dest.write_bytes(content)
            else:
                dest.write_text(str(content), encoding="utf-8")
            asset_entries.append(
                {
                    "filename": rel,
                    "mimeType": (
                        "application/pdf"
                        if dest.suffix.lower() == ".pdf"
                        else "application/octet-stream"
                    ),
                    "size": dest.stat().st_size,
                }
            )

        tex_path.write_text(tex_content, encoding="utf-8")
        asset_entries.append(
            {
                "filename": tex_path.name,
                "mimeType": "application/x-tex; charset=utf-8",
                "size": tex_path.stat().st_size,
            }
        )

        for current_pass in range(1, passes + 1):
            pass_started = time.perf_counter()
            cmd = [
                "pdflatex",
                "-interaction=nonstopmode",
                "-halt-on-error",
                "-file-line-error",
            ]
            # In the two-pass pipeline the first pass prepares auxiliary references.
            if passes == 2 and current_pass == 1:
                cmd.append("-draftmode")
            cmd.append(tex_path.name)
            run = subprocess.run(
                cmd,
                cwd=work_dir,
                capture_output=True,
                text=True,
                timeout=timeout,
                check=False,
            )
            output = f"{run.stdout or ''}\n{run.stderr or ''}"
            logs.append(f"--- pdflatex pass {current_pass} ---\n{output}")
            profile[f"pdflatex_pass_{current_pass}_ms"] = (time.perf_counter() - pass_started) * 1000
            if run.returncode != 0:
                raise LatexCompilationError(
                    "compilation_failed",
                    f"pdflatex failed on pass {current_pass} with status {run.returncode}.",
                    logs="\n".join(logs),
                    asset_manifest=build_asset_manifest(asset_entries),
                    work_dir=str(work_dir) if preserve_workdir_on_error else None,
                )

        if not pdf_path.exists():
            raise LatexCompilationError(
                "output_missing",
                f"Expected PDF output was not generated at {pdf_path}.",
                logs="\n".join(logs),
                asset_manifest=build_asset_manifest(asset_entries),
                work_dir=str(work_dir) if preserve_workdir_on_error else None,
            )

        read_started = time.perf_counter()
        pdf_buffer = pdf_path.read_bytes()
        profile["read_pdf_ms"] = (time.perf_counter() - read_started) * 1000
        return {
            "pdfBuffer": pdf_buffer,
            "logs": "\n".join(logs),
            "profile": profile,
            "workDir": str(work_dir),
            "assetManifest": build_asset_manifest(asset_entries),
        }
    finally:
        cleanup_started = time.perf_counter()
        if cleanup and not preserve_workdir_on_error:
            shutil.rmtree(work_dir, ignore_errors=True)
        profile["cleanup_ms"] = (time.perf_counter() - cleanup_started) * 1000
