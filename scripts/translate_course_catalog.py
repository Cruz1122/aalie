"""Traduce catálogo de curso ES -> EN (mirror en .../course/en/).

    pip install -r scripts/requirements-translate.txt
    python scripts/translate_course_catalog.py

Reutiliza batches, cache y rate-limit de translate_quiz_bank.py (--max-batch-chars 4000 por defecto vía tqb).

Logs: [scan], [file], [trans], [apply], [write], [warn], [done].
"""

from __future__ import annotations

import argparse
import copy
import json
import sys
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = Path(__file__).resolve().parent
DEFAULT_SRC = ROOT / "packages" / "content-catalog" / "catalog" / "spaces" / "course" / "es"
DEFAULT_DST = ROOT / "packages" / "content-catalog" / "catalog" / "spaces" / "course" / "en"
DEFAULT_CACHE = SCRIPTS_DIR / ".cache" / "course-catalog-translation-cache.json"

# Import shared translation machinery (mismo directorio que este script)
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

import translate_quiz_bank as tqb  # noqa: E402

# Claves cuyos valores string son prosa traducible (no IDs ni enums).
PROSE_STRING_KEYS = frozenset(
    {
        "title",
        "summary",
        "description",
        "shortTitle",
        "text",
        "label",
        "definition",
        "attribution",
        "caption",
        "tooltip",
        "edgeLabel",
    }
)

# Arrays de strings enteramente traducibles (bajo su clave en el padre).
STRING_LIST_KEYS = frozenset({"aliases", "keywords", "tags", "references"})

# Nunca traducir estos nombres de campo aunque el valor sea string.
SKIP_STRING_KEYS = frozenset(
    {
        "schema",
        "schemaVersion",
        "spaceId",
        "moduleId",
        "slug",
        "chapterId",
        "sectionId",
        "objectiveId",
        "termId",
        "termRef",
        "refId",
        "quizId",
        "solutionRef",
        "resourceRef",
        "language",
        "code",
        "latex",
        "kind",
        "ref",
        "version",
        "status",
        "type",
        "icon",
        "variant",
        "style",
        "width",
        "align",
        "captionPosition",
        "token",
        "path",
        "url",
        "assetId",
        "partner",
        "key",
        "nodeId",
        "edgeId",
        "stepId",
        "blockId",
        "quizId",
    }
)


def _load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _should_translate_dict_field(key: str, parent: dict[str, Any]) -> bool:
    if key in SKIP_STRING_KEYS:
        return False
    if key not in PROSE_STRING_KEYS:
        return False
    if key == "text" and parent.get("type") == "inlineMath":
        return False
    return True


def collect_string_refs(obj: Any, path: str) -> list[tuple[Any, str | int, str]]:
    """Lista de (contenedor, clave_o_índice, path_log) para cada string a traducir."""
    refs: list[tuple[Any, str | int, str]] = []

    def walk(node: Any, p: str) -> None:
        if isinstance(node, dict):
            for k, v in node.items():
                np = f"{p}.{k}" if p else k
                if isinstance(v, str) and v.strip() and _should_translate_dict_field(k, node):
                    refs.append((node, k, np))
                elif isinstance(v, list):
                    list_string_ctx = k if k in STRING_LIST_KEYS else None
                    for i, item in enumerate(v):
                        ip = f"{np}[{i}]"
                        if isinstance(item, str) and item.strip() and list_string_ctx:
                            refs.append((v, i, ip))
                        elif isinstance(item, (dict, list)):
                            walk(item, ip)
                elif isinstance(v, dict):
                    walk(v, np)
        elif isinstance(node, list):
            for i, item in enumerate(node):
                ip = f"{p}[{i}]"
                if isinstance(item, (dict, list)):
                    walk(item, ip)

    walk(obj, path)
    return refs


def ordered_unique_strings(refs: list[tuple[Any, str | int, str]]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for parent, key, _ in refs:
        s = parent[key]
        if isinstance(s, str) and s and s not in seen:
            seen.add(s)
            out.append(s)
    return out


def apply_translation_map(
    refs: list[tuple[Any, str | int, str]], mapping: dict[str, str], log_path: str
) -> None:
    for parent, key, path in refs:
        src = parent[key]
        if not isinstance(src, str):
            continue
        if src in mapping:
            parent[key] = mapping[src]
        else:
            print(f"[warn] sin traduccion en cache para {log_path} :: {path}")


def set_locale_en(doc: dict[str, Any]) -> None:
    if "locale" in doc:
        doc["locale"] = "en"


def discover_json_files(src_root: Path) -> list[Path]:
    return sorted(src_root.rglob("*.json"))


def mirror_path(src_root: Path, dst_root: Path, file_path: Path) -> Path:
    rel = file_path.relative_to(src_root)
    return dst_root / rel


def run(args: argparse.Namespace) -> int:
    src = Path(args.src).resolve()
    dst = Path(args.dst).resolve()
    cache_path = Path(args.cache).resolve()

    if not src.is_dir():
        print(f"[fatal] no existe directorio fuente: {src}")
        return 1

    files = discover_json_files(src)
    print(f"[scan] raiz es={src}")
    print(f"[scan] raiz en={dst}")
    print(f"[scan] archivos json={len(files)}")

    cache = tqb.TranslationCache.load(cache_path)
    print(f"[cache] {cache_path} entradas={len(cache.data)}")

    all_misses: list[str] = []
    miss_seen: set[str] = set()
    per_file: list[tuple[Path, list[tuple[Any, str | int, str]], dict[str, Any]]] = []

    t0 = time.monotonic()
    for fp in files:
        rel = fp.relative_to(src)
        print(f"[file] leyendo {rel}")
        doc = _load_json(fp)
        if not isinstance(doc, dict):
            print(f"[file] omitido (no es objeto raíz): {rel}")
            continue
        out = copy.deepcopy(doc)
        refs = collect_string_refs(out, "")
        n_refs = len(refs)
        uniq = ordered_unique_strings(refs)
        print(f"[file] refs traducibles={n_refs} strings_unicos_en_archivo={len(uniq)}")
        per_file.append((fp, refs, out))
        for s in uniq:
            if cache.get(s) is None and s not in miss_seen:
                miss_seen.add(s)
                all_misses.append(s)

    print(f"[trans] total strings_unicos sin cache={len(all_misses)}")

    if args.dry_run:
        print("[dry-run] fin.")
        return 0

    def _flush_cache_partial(_: dict[str, str]) -> None:
        cache.flush()

    if all_misses:
        translator = tqb.Translator(source=args.source, target=args.target)
        limiter = tqb.RateLimiter(max_rps=args.max_rps)
        print(f"[trans] llamando API: {len(all_misses)} strings en batches de ≤{args.max_batch_chars}")
        tqb.translate_strings(
            all_misses,
            translator=translator,
            limiter=limiter,
            cache=cache,
            max_batch_chars=args.max_batch_chars,
            flush_every=args.flush_every,
            on_progress=_flush_cache_partial,
        )
        cache.flush()
        print(f"[trans] hecho en {time.monotonic() - t0:.1f}s")

    full_map: dict[str, str] = {v["src"]: v["tgt"] for v in cache.data.values()}

    for fp, refs, out in per_file:
        rel = fp.relative_to(src)
        print(f"[apply] {rel} ({len(refs)} refs)")
        apply_translation_map(refs, full_map, str(rel))
        set_locale_en(out)
        outp = mirror_path(src, dst, fp)
        print(f"[write] {outp.relative_to(ROOT)}")
        _write_json(outp, out)

    cache.flush()
    print(f"[done] {len(per_file)} archivos escritos bajo {dst}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Traduce catálogo course/es -> course/en.")
    p.add_argument("--src", type=Path, default=DEFAULT_SRC)
    p.add_argument("--dst", type=Path, default=DEFAULT_DST)
    p.add_argument("--cache", type=Path, default=DEFAULT_CACHE)
    p.add_argument("--source", default="es")
    p.add_argument("--target", default="en")
    p.add_argument("--max-batch-chars", type=int, default=4000)
    p.add_argument("--max-rps", type=int, default=3)
    p.add_argument("--flush-every", type=int, default=25)
    p.add_argument("--dry-run", action="store_true")
    return p


def main(argv: list[str] | None = None) -> int:
    return run(build_parser().parse_args(argv))


if __name__ == "__main__":
    raise SystemExit(main())
