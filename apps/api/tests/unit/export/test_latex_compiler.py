from pathlib import Path

import pytest

from app.modules.export.latex_compiler import compile_latex_to_pdf
from app.modules.export.models import LatexAssetRegistry, LatexCompilationError


class _RunResult:
    def __init__(self, returncode=0, stdout="", stderr=""):
        self.returncode = returncode
        self.stdout = stdout
        self.stderr = stderr


def _make_assets(tmp_path: Path) -> LatexAssetRegistry:
    (tmp_path / "logos").mkdir(parents=True, exist_ok=True)
    (tmp_path / "aalie-report.sty").write_text("% style", encoding="utf-8")
    (tmp_path / "logos" / "ucaldas.pdf").write_bytes(b"ucaldas")
    (tmp_path / "logos" / "aalie.pdf").write_bytes(b"aalie")
    return LatexAssetRegistry(
        asset_root=str(tmp_path),
        style_file_path=str(tmp_path / "aalie-report.sty"),
        template_path=str(tmp_path / "template.tex"),
        logos_dir=str(tmp_path / "logos"),
        ucaldas_logo_path=str(tmp_path / "logos" / "ucaldas.pdf"),
        aalie_logo_path=str(tmp_path / "logos" / "aalie.pdf"),
    )


def test_compile_latex_raises_when_compiler_missing(monkeypatch):
    monkeypatch.setattr("app.modules.export.latex_compiler.is_pdflatex_available", lambda: False)

    with pytest.raises(LatexCompilationError) as exc_info:
        compile_latex_to_pdf("\\documentclass{article}\\begin{document}x\\end{document}")

    assert exc_info.value.kind == "compiler_missing"


def test_compile_latex_success_with_extra_files(monkeypatch, tmp_path):
    workdir = tmp_path / "work"
    workdir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr("app.modules.export.latex_compiler.is_pdflatex_available", lambda: True)
    monkeypatch.setattr(
        "app.modules.export.latex_compiler.resolve_latex_asset_registry",
        lambda: _make_assets(tmp_path / "assets"),
    )
    monkeypatch.setattr(
        "app.modules.export.latex_compiler.tempfile.mkdtemp", lambda prefix: str(workdir)
    )

    calls = {"count": 0}

    def _fake_run(*args, **kwargs):
        calls["count"] += 1
        if calls["count"] == 2:
            (workdir / "report.pdf").write_bytes(b"PDF-DATA")
        return _RunResult(returncode=0, stdout="ok", stderr="")

    monkeypatch.setattr("app.modules.export.latex_compiler.subprocess.run", _fake_run)

    result = compile_latex_to_pdf(
        "\\documentclass{article}\\begin{document}ok\\end{document}",
        extra_files=[
            {"relativePath": "data/input.txt", "content": "hello"},
            {"relativePath": "bin/blob.bin", "content": b"\\x01\\x02"},
            {"relativePath": "", "content": "skip"},
        ],
        cleanup=False,
    )

    assert calls["count"] == 2
    assert result["pdfBuffer"] == b"PDF-DATA"
    filenames = [entry["filename"] for entry in result["assetManifest"]]
    assert "report.tex" in filenames
    assert "data/input.txt" in filenames
    assert "bin/blob.bin" in filenames


def test_compile_latex_returns_compilation_failed_with_logs(monkeypatch, tmp_path):
    workdir = tmp_path / "work-fail"
    workdir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr("app.modules.export.latex_compiler.is_pdflatex_available", lambda: True)
    monkeypatch.setattr(
        "app.modules.export.latex_compiler.resolve_latex_asset_registry",
        lambda: _make_assets(tmp_path / "assets-fail"),
    )
    monkeypatch.setattr(
        "app.modules.export.latex_compiler.tempfile.mkdtemp", lambda prefix: str(workdir)
    )
    monkeypatch.setattr(
        "app.modules.export.latex_compiler.subprocess.run",
        lambda *args, **kwargs: _RunResult(returncode=1, stdout="bad", stderr="err"),
    )

    with pytest.raises(LatexCompilationError) as exc_info:
        compile_latex_to_pdf(
            "\\documentclass{article}\\begin{document}boom\\end{document}",
            cleanup=False,
            preserve_workdir_on_error=True,
        )

    error = exc_info.value
    assert error.kind == "compilation_failed"
    assert "pass 1" in error.logs
    assert error.work_dir == str(workdir)
    assert any(item["filename"] == "report.tex" for item in error.asset_manifest)


def test_compile_latex_raises_output_missing_when_pdf_not_generated(monkeypatch, tmp_path):
    workdir = tmp_path / "work-missing"
    workdir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setattr("app.modules.export.latex_compiler.is_pdflatex_available", lambda: True)
    monkeypatch.setattr(
        "app.modules.export.latex_compiler.resolve_latex_asset_registry",
        lambda: _make_assets(tmp_path / "assets-missing"),
    )
    monkeypatch.setattr(
        "app.modules.export.latex_compiler.tempfile.mkdtemp", lambda prefix: str(workdir)
    )
    monkeypatch.setattr(
        "app.modules.export.latex_compiler.subprocess.run",
        lambda *args, **kwargs: _RunResult(returncode=0, stdout="ok", stderr=""),
    )

    with pytest.raises(LatexCompilationError) as exc_info:
        compile_latex_to_pdf(
            "\\documentclass{article}\\begin{document}ok\\end{document}", cleanup=False
        )

    assert exc_info.value.kind == "output_missing"
