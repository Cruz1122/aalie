"""Simple catalog that maps repo areas to contractual context."""

from __future__ import annotations

from dataclasses import dataclass

from .common import dedupe, max_risk, normalize_repo_path


@dataclass(frozen=True)
class AreaEntry:
    """Catalog entry for a repo area."""

    area: str
    risk: str
    recommended_skill: str
    path_prefixes: tuple[str, ...]
    feature_aliases: tuple[str, ...]
    required_docs: tuple[str, ...]
    related_tests: tuple[str, ...]
    must_review: tuple[str, ...]
    path_contains: tuple[str, ...] = ()


AREAS: tuple[AreaEntry, ...] = (
    AreaEntry(
        area="while_engine",
        risk="high",
        recommended_skill="debug-while-analysis",
        path_prefixes=(
            "apps/api/app/modules/analysis/while_engine/",
            "apps/api/tests/contract/test_while_algorithms.py",
            "apps/api/tests/contract/test_while_loop_notation.py",
            "apps/api/tests/contract/test_while_metamorphic.py",
            "apps/api/tests/benchmark_while_algorithms.py",
            "docs/03-specs/while-heuristics-spec.md",
            "docs/09-decisions/adr-003-conservative-while-heuristics.md",
        ),
        feature_aliases=(
            "while",
            "while engine",
            "while heuristics",
            "while loop",
            "two variables",
            "metamorphic while",
        ),
        required_docs=(
            "docs/03-specs/analysis-engine-spec.md",
            "docs/03-specs/while-heuristics-spec.md",
            "docs/09-decisions/adr-003-conservative-while-heuristics.md",
        ),
        related_tests=(
            "apps/api/tests/contract/test_while_algorithms.py",
            "apps/api/tests/contract/test_while_loop_notation.py",
            "apps/api/tests/contract/test_while_metamorphic.py",
            "apps/api/tests/benchmark_while_algorithms.py",
        ),
        must_review=(
            "supported pattern coverage",
            "evidence level justification",
            "strong-pattern tiebreak rules",
            "no guessing on inconclusive loops",
        ),
    ),
    AreaEntry(
        area="export_snapshot",
        risk="high",
        recommended_skill="implement-export-feature",
        path_prefixes=(
            "apps/api/app/modules/export/",
            "packages/types/src/export-snapshot.ts",
            "apps/api/tests/unit/export/",
            "apps/api/tests/system/test_export_endpoint.py",
            "docs/03-specs/report-snapshot-spec.md",
            "docs/03-specs/export-engine-spec.md",
            "docs/04-api/execution-api.md",
            "docs/04-api/schemas/snapshot-schema.md",
            "docs/09-decisions/adr-002-single-snapshot-for-exports.md",
            "docs/09-decisions/adr-007-versioned-schemas.md",
        ),
        feature_aliases=(
            "export",
            "snapshot",
            "pdf",
            "markdown",
            "latex",
            "zip",
            "renderer",
        ),
        required_docs=(
            "docs/03-specs/report-snapshot-spec.md",
            "docs/03-specs/export-engine-spec.md",
            "docs/04-api/execution-api.md",
            "docs/04-api/schemas/snapshot-schema.md",
            "docs/09-decisions/adr-002-single-snapshot-for-exports.md",
            "docs/09-decisions/adr-007-versioned-schemas.md",
        ),
        related_tests=(
            "apps/api/tests/unit/export/test_snapshot_builder.py",
            "apps/api/tests/system/test_export_endpoint.py",
        ),
        must_review=(
            "single-snapshot source of truth",
            "no export recalculation",
            "public schema compatibility",
            "template minimum contractual blocks",
        ),
    ),
    AreaEntry(
        area="recursive_analysis",
        risk="high",
        recommended_skill="add-recursive-method-support",
        path_prefixes=(
            "apps/api/app/modules/analysis/analyzers/recursive.py",
            "apps/api/app/modules/analysis/analyzers/master_steps.py",
            "apps/api/app/modules/analysis/analyzers/iteration_steps.py",
            "apps/api/app/modules/analysis/analyzers/recursion_tree_steps.py",
            "apps/api/app/modules/analysis/analyzers/characteristic_steps.py",
            "apps/api/tests/contract/test_recursive_algorithms.py",
            "apps/api/tests/contract/test_recursion_tree_structure.py",
            "apps/api/tests/contract/test_iteration_method.py",
            "docs/03-specs/recurrence-methods-spec.md",
            "docs/04-api/analysis-api.md",
            "docs/04-api/schemas/analysis-schema.md",
        ),
        feature_aliases=(
            "recursive",
            "recurrence",
            "master theorem",
            "recursion tree",
            "characteristic equation",
            "detect methods",
        ),
        required_docs=(
            "docs/03-specs/recurrence-methods-spec.md",
            "docs/03-specs/analysis-engine-spec.md",
            "docs/04-api/analysis-api.md",
            "docs/04-api/schemas/analysis-schema.md",
        ),
        related_tests=(
            "apps/api/tests/contract/test_recursive_algorithms.py",
            "apps/api/tests/contract/test_recursion_tree_structure.py",
            "apps/api/tests/contract/test_iteration_method.py",
            "apps/api/tests/unit/analysis/test_recursive_analyzer.py",
        ),
        must_review=(
            "detect family before choosing method",
            "default-method contractual priority",
            "partial and unsupported states",
            "bundle compatibility with analysis API",
        ),
    ),
    AreaEntry(
        area="core_analysis",
        risk="high",
        recommended_skill="change-core-analysis",
        path_prefixes=(
            "packages/grammar/",
            "apps/api/app/modules/parsing/",
            "apps/api/app/modules/classification/",
            "apps/api/app/modules/analysis/",
            "docs/03-specs/pseudocode-grammar-spec.md",
            "docs/03-specs/ast-schema.md",
            "docs/03-specs/analysis-engine-spec.md",
            "docs/04-api/parse-api.md",
            "docs/04-api/classification-api.md",
            "docs/04-api/analysis-api.md",
        ),
        feature_aliases=(
            "parser",
            "parsing",
            "grammar",
            "ast",
            "classification",
            "analysis engine",
            "simplification",
        ),
        required_docs=(
            "docs/03-specs/pseudocode-grammar-spec.md",
            "docs/03-specs/ast-schema.md",
            "docs/03-specs/analysis-engine-spec.md",
            "docs/04-api/parse-api.md",
            "docs/04-api/classification-api.md",
            "docs/04-api/analysis-api.md",
        ),
        related_tests=(
            "apps/api/tests/unit/parsing/test_parsing_service.py",
            "apps/api/tests/unit/classification/test_classifier.py",
            "apps/api/tests/unit/analysis/test_analysis_service.py",
            "apps/api/tests/system/test_parse_endpoint.py",
            "apps/api/tests/system/test_classify_endpoint.py",
            "apps/api/tests/system/test_analyze_endpoint.py",
        ),
        must_review=(
            "core contract changes",
            "api and schema impact",
            "trace/export downstream impact",
            "expected output drift in oracles",
        ),
    ),
    AreaEntry(
        area="testing",
        risk="medium",
        recommended_skill="write-authentic-tests",
        path_prefixes=(
            "apps/api/tests/",
            "apps/web/src/lib/__tests__/",
            "apps/web/src/components/examples/__tests__/",
            "docs/05-quality/testing-strategy.md",
            "docs/05-quality/algorithm-oracles.md",
            "docs/05-quality/coverage-policy.md",
            "docs/09-decisions/adr-004-tests-as-oracles.md",
        ),
        path_contains=("/__tests__/",),
        feature_aliases=(
            "test",
            "oracle",
            "coverage",
            "regression",
            "expected output",
        ),
        required_docs=(
            "docs/05-quality/testing-strategy.md",
            "docs/05-quality/algorithm-oracles.md",
            "docs/05-quality/coverage-policy.md",
            "docs/09-decisions/adr-004-tests-as-oracles.md",
        ),
        related_tests=(
            "apps/api/tests/contract/test_algorithms_contract.py",
            "apps/api/tests/contract/test_while_algorithms.py",
            "apps/api/tests/contract/test_recursive_algorithms.py",
            "apps/web/src/lib/examples/__tests__/catalog.test.ts",
        ),
        must_review=(
            "authentic structured expected values",
            "symbolic versus exact comparison mode",
            "partial and unsupported as valid outcomes",
            "oracles over status-code-only tests",
        ),
    ),
    AreaEntry(
        area="content_modules",
        risk="medium",
        recommended_skill="add-content-module",
        path_prefixes=(
            "docs/03-specs/content-modules-spec.md",
            "docs/03-specs/quizzes-spec.md",
            "docs/08-content/",
            "apps/web/src/lib/examples/",
            "apps/web/src/components/examples/",
        ),
        feature_aliases=(
            "content",
            "course",
            "quiz",
            "curriculum",
            "examples catalog",
        ),
        required_docs=(
            "docs/03-specs/content-modules-spec.md",
            "docs/03-specs/quizzes-spec.md",
            "docs/08-content/content-model.md",
            "docs/08-content/course-json-schema.md",
            "docs/08-content/quiz-json-schema.md",
            "docs/08-content/authoring-guide.md",
        ),
        related_tests=(
            "apps/web/src/lib/examples/__tests__/catalog.test.ts",
            "apps/web/src/components/examples/__tests__/examples-views.test.tsx",
        ),
        must_review=(
            "course schema compatibility",
            "quiz schema compatibility",
            "content structure kept out of ad hoc UI logic",
        ),
    ),
    AreaEntry(
        area="llm_jobs",
        risk="medium",
        recommended_skill="introduce-llm-job",
        path_prefixes=(
            "apps/web/src/app/api/llm/",
            "apps/web/LLM_CONFIG.md",
            "docs/02-architecture/llm-integration.md",
            "docs/04-api/llm-api.md",
            "docs/06-operations/environment-variables.md",
            "docs/09-decisions/adr-005-frontend-llm-configuration.md",
        ),
        feature_aliases=(
            "llm",
            "parser assist",
            "compare",
            "explain",
            "diagram",
            "repair",
        ),
        required_docs=(
            "docs/02-architecture/llm-integration.md",
            "docs/04-api/llm-api.md",
            "docs/06-operations/environment-variables.md",
            "docs/09-decisions/adr-005-frontend-llm-configuration.md",
        ),
        related_tests=(),
        must_review=(
            "llm remains optional to deterministic analysis",
            "centralized env-var configuration",
            "no backend contract redefinition",
        ),
    ),
)


def _matches_prefix(path: str, prefix: str) -> bool:
    normalized_prefix = prefix.lower()
    return path.startswith(normalized_prefix)


def _matches_contains(path: str, needle: str) -> bool:
    return needle.lower() in path


def match_areas_for_path(path: str) -> list[AreaEntry]:
    """Return matching areas for a changed path."""

    normalized = normalize_repo_path(path).lower()
    matches: list[AreaEntry] = []
    for entry in AREAS:
        if any(_matches_prefix(normalized, prefix) for prefix in entry.path_prefixes):
            matches.append(entry)
            continue
        if any(_matches_contains(normalized, needle) for needle in entry.path_contains):
            matches.append(entry)
    return matches


def match_areas_for_feature(feature: str) -> list[AreaEntry]:
    """Return best matching areas for a feature name."""

    token = feature.strip().lower()
    ranked: list[tuple[int, AreaEntry]] = []
    for entry in AREAS:
        score = 0
        for alias in entry.feature_aliases:
            alias_token = alias.lower()
            if alias_token in token:
                score += len(alias_token)
        if score:
            ranked.append((score, entry))
    ranked.sort(key=lambda item: item[0], reverse=True)
    return [entry for _, entry in ranked]


def build_change_context(path: str | None = None, feature: str | None = None) -> dict:
    """Build the change-context payload for one path or feature."""

    if path:
        matches = match_areas_for_path(path)
        basis = normalize_repo_path(path)
    elif feature:
        matches = match_areas_for_feature(feature)
        basis = feature.strip()
    else:
        return {
            "ok": False,
            "errors": [{"code": "missing_input", "message": "Provide path or feature."}],
        }

    if not matches:
        return {
            "ok": True,
            "basis": basis,
            "area": "unknown",
            "risk": "low",
            "required_docs": [],
            "related_tests": [],
            "must_review": ["manual contract triage"],
            "recommended_skill": "pre-change-review",
            "related_areas": [],
        }

    primary = matches[0]
    return {
        "ok": True,
        "basis": basis,
        "area": primary.area,
        "risk": max_risk([entry.risk for entry in matches]),
        "required_docs": dedupe(
            doc for entry in matches for doc in entry.required_docs
        ),
        "related_tests": dedupe(
            test for entry in matches for test in entry.related_tests
        ),
        "must_review": dedupe(
            item for entry in matches for item in entry.must_review
        ),
        "recommended_skill": primary.recommended_skill,
        "related_areas": [entry.area for entry in matches[1:]],
    }


def build_contract_impact(changed_paths: list[str]) -> dict:
    """Build the contract-impact payload for a list of changed paths."""

    if not changed_paths:
        return {
            "ok": False,
            "errors": [
                {"code": "missing_changed_paths", "message": "Provide changed_paths."}
            ],
        }

    matched_entries: list[AreaEntry] = []
    unmatched_paths: list[str] = []
    for path in changed_paths:
        matches = match_areas_for_path(path)
        if not matches:
            unmatched_paths.append(normalize_repo_path(path))
            continue
        matched_entries.extend(matches)

    unique_entries = dedupe(matched_entries)
    if not unique_entries:
        return {
            "ok": True,
            "areas": [],
            "contracts_impacted": [],
            "risk": "low",
            "must_review": ["manual contract triage"],
            "tests_to_run": [],
            "recommended_skills": ["pre-change-review"],
            "unmatched_paths": unmatched_paths,
        }

    return {
        "ok": True,
        "areas": [entry.area for entry in unique_entries],
        "contracts_impacted": dedupe(
            doc for entry in unique_entries for doc in entry.required_docs
        ),
        "risk": max_risk([entry.risk for entry in unique_entries]),
        "must_review": dedupe(
            item for entry in unique_entries for item in entry.must_review
        ),
        "tests_to_run": dedupe(
            test for entry in unique_entries for test in entry.related_tests
        ),
        "recommended_skills": dedupe(
            entry.recommended_skill for entry in unique_entries
        ),
        "unmatched_paths": unmatched_paths,
    }
