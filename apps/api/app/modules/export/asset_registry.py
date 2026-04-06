"""
Asset registry resolution for backend-owned LaTeX assets.
"""

from __future__ import annotations

import os
from pathlib import Path

from .models import LatexAssetRegistry


def _is_valid_asset_root(root: Path) -> bool:
    return (
        (root / "aalie-report.sty").exists()
        and (root / "templates" / "main.template.tex").exists()
        and (root / "logos" / "ucaldas.pdf").exists()
        and (root / "logos" / "aalie.pdf").exists()
    )


def _candidate_roots() -> list[Path]:
    env_root = os.getenv("AALIE_EXPORTER_ASSETS_DIR")
    candidates: list[Path] = []
    if env_root:
        candidates.append(Path(env_root).expanduser().resolve())
    candidates.append((Path(__file__).resolve().parent / "assets" / "latex").resolve())
    unique: list[Path] = []
    seen: set[str] = set()
    for candidate in candidates:
        key = str(candidate)
        if key not in seen:
            seen.add(key)
            unique.append(candidate)
    return unique


def resolve_latex_asset_registry() -> LatexAssetRegistry:
    candidates = _candidate_roots()
    for candidate in candidates:
        if not _is_valid_asset_root(candidate):
            continue
        return LatexAssetRegistry(
            asset_root=str(candidate),
            style_file_path=str(candidate / "aalie-report.sty"),
            template_path=str(candidate / "templates" / "main.template.tex"),
            logos_dir=str(candidate / "logos"),
            ucaldas_logo_path=str(candidate / "logos" / "ucaldas.pdf"),
            aalie_logo_path=str(candidate / "logos" / "aalie.pdf"),
        )
    checked = ", ".join(str(path) for path in candidates)
    raise RuntimeError(
        "Unable to resolve LaTeX assets for exporter. "
        "Expected files: aalie-report.sty, templates/main.template.tex, "
        f"logos/ucaldas.pdf, logos/aalie.pdf. Checked candidates: {checked}"
    )


def read_latex_template(registry: LatexAssetRegistry | None = None) -> str:
    resolved = registry or resolve_latex_asset_registry()
    return Path(resolved.template_path).read_text(encoding="utf-8")
