import pytest

from pathlib import Path

from app.modules.export.asset_registry import (
    read_latex_template,
    resolve_latex_asset_registry,
)


pytestmark = [pytest.mark.unit, pytest.mark.fast, pytest.mark.export]



def test_asset_registry_resolves_backend_owned_export_assets():
    registry = resolve_latex_asset_registry()

    asset_root = Path(registry.asset_root)
    expected_root = (
        Path(__file__).resolve().parents[3]
        / "app"
        / "modules"
        / "export"
        / "assets"
        / "latex"
    )
    assert asset_root.samefile(expected_root)
    assert "packages/report-export-engine" not in registry.asset_root
    assert asset_root.joinpath("aalie-report.sty").exists()
    assert asset_root.joinpath("logos", "aalie.pdf").exists()
    assert asset_root.joinpath("logos", "ucaldas.pdf").exists()


def test_asset_registry_reads_backend_template():
    template = read_latex_template()

    assert "\\documentclass" in template
    assert "aalie-report" in template
