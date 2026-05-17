from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class SeedEntry:
    case_id: str
    group: str


@dataclass
class GoldTarget:
    parse_status: str
    analysis_status: str
    algorithm_kind: str | None = None
    big_theta: str | None = None
    big_o: str | None = None
    big_omega: str | None = None
    recurrence: str | None = None
    recurrence_family: str | None = None
    should_reject: bool = False
    must_not_invent_theta: bool = False
    unsupported_reason: str | None = None
    cases: dict[str, Any] | None = None


@dataclass
class ScoringSpec:
    primary: str = "theta"
    accept_safe_rejection: bool = False
    notes: str | None = None


@dataclass
class Llm40Case:
    case_id: str
    oracle_id: str
    group: str
    family: str
    expectation_kind: str
    source_file: str
    source: str
    gold: GoldTarget
    scoring: ScoringSpec


@dataclass
class Llm40Index:
    version: str
    description: str
    cases: list[Llm40Case]


@dataclass
class AalieNormalizedOutput:
    case_id: str
    system: str = "AALIE"
    parse_status: str = "valid"
    analysis_status: str = "available"
    algorithm_kind: str | None = None
    big_o: str | None = None
    big_omega: str | None = None
    big_theta: str | None = None
    recurrence: str | None = None
    recurrence_family: str | None = None
    while_pattern: str | None = None
    diagnostics: list[str] = field(default_factory=list)
    raw_result_hash: str | None = None


@dataclass
class ResultRow:
    case_id: str
    oracle_id: str
    group: str
    family: str
    expectation_kind: str
    system: str
    parse_status: str
    analysis_status: str
    big_theta: str | None
    expected_big_theta: str | None
    should_reject: bool
    must_not_invent_theta: bool
    theta_agreement: bool
    safe_rejection: bool
    hallucinated_bound: bool
    ideal_recovery: bool
    pass_: bool
    runtime_ms: float | None
    diagnostics: str
