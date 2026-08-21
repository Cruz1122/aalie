from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from threading import Event

import pytest

from app.modules.export.pdf_concurrency import PdfCompilerBusy, PdfCompilerGate

pytestmark = [pytest.mark.fast, pytest.mark.unit]


def test_pdf_gate_allows_only_one_compiler() -> None:
    gate = PdfCompilerGate(1)
    entered = Event()
    release = Event()

    def hold_slot() -> None:
        with gate.slot():
            entered.set()
            release.wait(timeout=2)

    with ThreadPoolExecutor(max_workers=2) as pool:
        first = pool.submit(hold_slot)
        assert entered.wait(timeout=1)
        with pytest.raises(PdfCompilerBusy):
            with gate.slot():
                pass
        release.set()
        first.result(timeout=2)


def test_pdf_gate_releases_after_failure() -> None:
    gate = PdfCompilerGate(1)

    with pytest.raises(RuntimeError):
        with gate.slot():
            raise RuntimeError("compiler failed")

    with gate.slot():
        pass
