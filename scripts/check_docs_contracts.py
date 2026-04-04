from __future__ import annotations

import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"

REQUIRED_FILES = [
    "README.md",
    "index.md",
    "01-product/vision.md",
    "01-product/glossary.md",
    "01-product/roadmap.md",
    "01-product/known-limitations.md",
    "02-architecture/system-architecture.md",
    "02-architecture/frontend-architecture.md",
    "02-architecture/backend-architecture.md",
    "02-architecture/llm-integration.md",
    "02-architecture/execution-trace-architecture.md",
    "02-architecture/analysis-engine-overview.md",
    "03-specs/pseudocode-grammar-spec.md",
    "03-specs/ast-schema.md",
    "03-specs/analysis-engine-spec.md",
    "03-specs/while-heuristics-spec.md",
    "03-specs/recurrence-methods-spec.md",
    "03-specs/execution-trace-spec.md",
    "03-specs/report-snapshot-spec.md",
    "03-specs/export-engine-spec.md",
    "03-specs/examples-catalog-spec.md",
    "03-specs/quizzes-spec.md",
    "03-specs/content-modules-spec.md",
    "04-api/endpoints-overview.md",
    "04-api/parse-api.md",
    "04-api/analysis-api.md",
    "04-api/classification-api.md",
    "04-api/execution-api.md",
    "04-api/llm-api.md",
    "04-api/schemas/parse-schema.md",
    "04-api/schemas/analysis-schema.md",
    "04-api/schemas/classification-schema.md",
    "04-api/schemas/execution-schema.md",
    "04-api/schemas/llm-schema.md",
    "04-api/schemas/snapshot-schema.md",
    "04-api/schemas/export-report-schema.md",
    "05-quality/testing-strategy.md",
    "05-quality/algorithm-oracles.md",
    "05-quality/coverage-policy.md",
    "05-quality/ci-cd.md",
    "05-quality/benchmarking.md",
    "05-quality/performance.md",
    "06-operations/local-development.md",
    "06-operations/environment-variables.md",
    "06-operations/deployment.md",
    "06-operations/troubleshooting.md",
    "06-operations/release-process.md",
    "07-user/user-guide.md",
    "07-user/analyzer-workflows.md",
    "07-user/recursive-analysis-guide.md",
    "07-user/exports-guide.md",
    "07-user/examples-guide.md",
    "07-user/faq.md",
    "08-content/content-model.md",
    "08-content/course-json-schema.md",
    "08-content/quiz-json-schema.md",
    "08-content/authoring-guide.md",
    "09-decisions/adr-001-docs-restructure.md",
    "09-decisions/adr-002-single-snapshot-for-exports.md",
    "09-decisions/adr-003-conservative-while-heuristics.md",
    "09-decisions/adr-004-tests-as-oracles.md",
    "09-decisions/adr-005-frontend-llm-configuration.md",
    "09-decisions/adr-006-no-fallback-ui-for-inconclusive-main-path.md",
    "09-decisions/adr-007-versioned-schemas.md",
]

REMOVED_LEGACY_PATHS = [
    "api",
    "app",
    "development",
    "llm",
    "analisis-complejidad-analizador.md",
    "informe-final.md",
    "informe-tecnico.md",
    "pruebas-algoritmos.md",
    "recursion-tree-edge-cases.md",
    "reports-export-infrastructure.md",
]

REQUIRED_SECTION_HEADINGS = [
    "proposito",
    "alcance",
    "fuente de verdad",
    "estructura",
    "ejemplos",
    "limites conocidos",
    "archivos relacionados",
]

CRITICAL_SPECS = [
    "03-specs/pseudocode-grammar-spec.md",
    "03-specs/ast-schema.md",
    "03-specs/analysis-engine-spec.md",
    "03-specs/while-heuristics-spec.md",
    "03-specs/recurrence-methods-spec.md",
    "03-specs/execution-trace-spec.md",
    "03-specs/report-snapshot-spec.md",
    "03-specs/export-engine-spec.md",
]

DETAIL_DOC_EXPECTATIONS = {
    "04-api/parse-api.md": ["/grammar/parse"],
    "04-api/analysis-api.md": ["/analyze/open", "/analyze/detect-methods"],
    "04-api/classification-api.md": ["/classify", "/api/llm/classify"],
    "04-api/execution-api.md": ["/analyze/trace", "/export/report"],
    "04-api/llm-api.md": ["/api/llm", "/api/llm/status", "/api/llm/classify"],
}


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFD", text)
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return text.lower()


def read(rel_path: str) -> str:
    return (DOCS / rel_path).read_text(encoding="utf-8")


def error(message: str, errors: list[str]) -> None:
    errors.append(message)


def extract_backend_routes() -> set[tuple[str, str]]:
    routes: set[tuple[str, str]] = set()
    for path in (ROOT / "apps/api/app/modules").rglob("router.py"):
        text = path.read_text(encoding="utf-8")
        prefix_match = re.search(r'APIRouter\(prefix="([^"]*)"', text)
        prefix = prefix_match.group(1) if prefix_match else ""
        for method, suffix in re.findall(
            r'@router\.(get|post|put|delete|patch)\("([^"]*)"\)', text
        ):
            full = prefix + suffix
            full = full or "/"
            routes.add((method.upper(), full))

    main_text = (ROOT / "apps/api/app/main.py").read_text(encoding="utf-8")
    for method, route in re.findall(r'@app\.(get|post)\("([^"]*)"\)', main_text):
        routes.add((method.upper(), route))
    return routes


def extract_next_routes() -> set[tuple[str, str]]:
    routes: set[tuple[str, str]] = set()
    api_root = ROOT / "apps/web/src/app/api"
    for route_file in api_root.rglob("route.ts"):
        rel = route_file.relative_to(api_root).parent
        parts = [part for part in rel.parts if part]
        route_path = "/api/" + "/".join(parts)
        text = route_file.read_text(encoding="utf-8")
        for method in re.findall(
            r"export async function (GET|POST|PUT|DELETE|PATCH)\(", text
        ):
            routes.add((method, route_path.rstrip("/")))
    return routes


def extract_env_vars() -> set[str]:
    env_vars: set[str] = set()
    regexes = [
        re.compile(r"process\.env\.([A-Z0-9_]+)"),
        re.compile(r'os\.getenv\("([A-Z0-9_]+)"'),
        re.compile(r'getEnvOrDefault\("([A-Z0-9_]+)"'),
        re.compile(r"^([A-Z0-9_]+)=", re.MULTILINE),
    ]
    for path in [
        ROOT / "apps/api",
        ROOT / "apps/web",
        ROOT / "infra",
    ]:
        for file in path.rglob("*"):
            if not file.is_file():
                continue
            if any(part in {"node_modules", ".next", ".venv"} for part in file.parts):
                continue
            if file.suffix.lower() not in {
                ".py",
                ".ts",
                ".tsx",
                ".js",
                ".mjs",
                ".yml",
                ".yaml",
                ".env",
                ".example",
            } and file.name not in {".env", ".env.example"}:
                continue
            try:
                text = file.read_text(encoding="utf-8")
            except Exception:
                continue
            for regex in regexes:
                env_vars.update(regex.findall(text))
    # LM_STUDIO vars no son parte del contrato actual centralizado
    env_vars.discard("LM_STUDIO_ENDPOINT")
    env_vars.discard("LM_STUDIO_API_KEY")
    return env_vars


def extract_snapshot_versions() -> tuple[str | None, str | None]:
    ts_text = (ROOT / "packages/types/src/export-snapshot.ts").read_text(
        encoding="utf-8"
    )
    py_text = (ROOT / "apps/api/app/modules/export/constants.py").read_text(
        encoding="utf-8"
    )
    ts_match = re.search(r'SNAPSHOT_SCHEMA_VERSION = "([^"]+)"', ts_text)
    py_match = re.search(r'SNAPSHOT_SCHEMA_VERSION = "([^"]+)"', py_text)
    return (
        ts_match.group(1) if ts_match else None,
        py_match.group(1) if py_match else None,
    )


def main() -> int:
    errors: list[str] = []

    for rel_path in REQUIRED_FILES:
        if not (DOCS / rel_path).exists():
            error(f"Falta archivo requerido: docs/{rel_path}", errors)

    for rel_path in REMOVED_LEGACY_PATHS:
        if (DOCS / rel_path).exists():
            error(f"Debe eliminarse contenido legacy: docs/{rel_path}", errors)

    for file in DOCS.rglob("*.md"):
        rel = str(file.relative_to(DOCS))
        text = file.read_text(encoding="utf-8")
        normalized = normalize(text)
        if not re.search(
            r"\*\*tipo:\*\*\s*(normativa|descriptiva|legacy)", normalize(text)
        ):
            error(f"Falta etiqueta de tipo en docs/{rel}", errors)
        for heading in REQUIRED_SECTION_HEADINGS:
            if f"## {heading}" not in normalized:
                error(f"Falta seccion obligatoria '{heading}' en docs/{rel}", errors)

    for rel_path in CRITICAL_SPECS:
        normalized = normalize(read(rel_path))
        for heading in [
            "## inputs",
            "## outputs",
            "## invariantes",
            "## errores esperables",
            "### ejemplos validos",
            "### ejemplos no soportados",
        ]:
            if heading not in normalized:
                error(f"Falta heading critico '{heading}' en docs/{rel_path}", errors)

    backend_routes = extract_backend_routes()
    next_routes = extract_next_routes()
    overview = read("04-api/endpoints-overview.md")
    for _method, route in sorted(backend_routes | next_routes):
        if route not in overview:
            error(f"El overview no menciona la ruta {route}", errors)

    for doc, routes in DETAIL_DOC_EXPECTATIONS.items():
        text = read(doc)
        for route in routes:
            if route not in text:
                error(f"docs/{doc} no documenta la ruta esperada {route}", errors)

    env_doc = read("06-operations/environment-variables.md")
    for env_var in sorted(extract_env_vars()):
        if env_var not in env_doc:
            error(
                f"La variable {env_var} no esta documentada en environment-variables.md",
                errors,
            )

    ts_version, py_version = extract_snapshot_versions()
    if not ts_version or not py_version:
        error("No se pudo extraer SNAPSHOT_SCHEMA_VERSION desde codigo", errors)
    elif ts_version != py_version:
        error(
            f"Version de snapshot inconsistente entre TS ({ts_version}) y Python ({py_version})",
            errors,
        )
    else:
        for doc in [
            "03-specs/report-snapshot-spec.md",
            "04-api/schemas/snapshot-schema.md",
        ]:
            if ts_version not in read(doc):
                error(
                    f"docs/{doc} no menciona la version de snapshot {ts_version}",
                    errors,
                )

    if errors:
        print("docs-contracts: FAIL")
        for issue in errors:
            print(f"- {issue}")
        return 1

    print("docs-contracts: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
