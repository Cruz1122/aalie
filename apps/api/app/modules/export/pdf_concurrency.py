from __future__ import annotations

import os
from contextlib import contextmanager
from threading import BoundedSemaphore
from typing import Iterator


class PdfCompilerBusy(RuntimeError):
    pass


class PdfCompilerGate:
    def __init__(self, max_concurrency: int) -> None:
        self.max_concurrency = max(1, max_concurrency)
        self._semaphore = BoundedSemaphore(self.max_concurrency)

    @contextmanager
    def slot(self) -> Iterator[None]:
        if not self._semaphore.acquire(blocking=False):
            raise PdfCompilerBusy("PDF compiler is busy")
        try:
            yield
        finally:
            self._semaphore.release()


def _configured_limit() -> int:
    raw = os.getenv("PDF_EXPORT_MAX_CONCURRENCY", "1").strip()
    try:
        return max(1, int(raw))
    except ValueError:
        return 1


pdf_compiler_gate = PdfCompilerGate(_configured_limit())
