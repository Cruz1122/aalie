from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Callable, TypeVar

T = TypeVar("T")


@dataclass
class TimedResult:
    value: T
    elapsed_s: float


def timed_call(fn: Callable[[], T]) -> TimedResult:
    start = time.perf_counter()
    value = fn()
    return TimedResult(value=value, elapsed_s=time.perf_counter() - start)
