"""Traduce los strings markdown de ada-quiz-bank.json (es-CO) a inglés.

Uso típico:

    pip install -r scripts/requirements-translate.txt
    python scripts/translate_quiz_bank.py \
        --input packages/content-data/quizzes/ada-quiz-bank.json \
        --output packages/content-data/quizzes/ada-quiz-bank.en.json \
        --validate

Detalles:
- Backend: deep-translator (Google), sin API key.
- Empaca strings en batches <=4000 chars por defecto (longitud tras protect_tokens + separadores).
- Rate limit: <=3 req/s (token bucket).
- Cachea por sha1(original) en scripts/.cache/quiz-bank-translation-cache.json.
- Flush incremental del .en.json y de la caché cada N batches.
- Blinda backticks inline con tokens ZK<n>ZK para que Google no los toque.
- Valida el resultado con QuizDataset + validate_dataset al final.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
import re
import sys
import time
from collections import deque
from collections.abc import Callable, Iterable
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = Path(__file__).resolve().parent
DEFAULT_INPUT = ROOT / "packages" / "content-data" / "quizzes" / "ada-quiz-bank.json"
DEFAULT_OUTPUT = ROOT / "packages" / "content-data" / "quizzes" / "ada-quiz-bank.en.json"
DEFAULT_CACHE = SCRIPTS_DIR / ".cache" / "quiz-bank-translation-cache.json"

BATCH_SEPARATOR = "\n@@@SEP@@@\n"
SEPARATOR_SPLIT_RE = re.compile(r"\s*@+\s*SEP\s*@+\s*")

BACKTICK_RE = re.compile(r"`[^`\n]+`")
TOKEN_FORMAT = "ZK{}ZK"
TOKEN_RESTORE_RE = re.compile(r"Z\s*K\s*(\d+)\s*Z\s*K", re.IGNORECASE)


# ---------------------------------------------------------------------------
# IO helpers
# ---------------------------------------------------------------------------

def _load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


# ---------------------------------------------------------------------------
# Token shielding for inline backticks
# ---------------------------------------------------------------------------

def protect_tokens(text: str) -> tuple[str, list[str]]:
    """Reemplaza segmentos `code` por tokens ZK<n>ZK ASCII puros.

    Devuelve (texto_protegido, mapping) donde mapping[i] es el segmento original.
    """
    mapping: list[str] = []

    def _sub(match: re.Match[str]) -> str:
        idx = len(mapping)
        mapping.append(match.group(0))
        return TOKEN_FORMAT.format(idx)

    return BACKTICK_RE.sub(_sub, text), mapping


def restore_tokens(text: str, mapping: list[str]) -> str:
    """Restaura tokens ZK<n>ZK al segmento original. Tolerante a espaciado."""
    if not mapping:
        return text

    def _sub(match: re.Match[str]) -> str:
        idx = int(match.group(1))
        if 0 <= idx < len(mapping):
            return mapping[idx]
        return match.group(0)

    return TOKEN_RESTORE_RE.sub(_sub, text)


# ---------------------------------------------------------------------------
# Cache backed by a JSON file: sha1(src) -> {"src": ..., "tgt": ...}
# ---------------------------------------------------------------------------

@dataclass
class TranslationCache:
    path: Path
    data: dict[str, dict[str, str]] = field(default_factory=dict)

    @classmethod
    def load(cls, path: Path) -> "TranslationCache":
        if path.exists():
            try:
                raw = _load_json(path)
                if isinstance(raw, dict):
                    cleaned = {
                        k: v
                        for k, v in raw.items()
                        if isinstance(v, dict) and "tgt" in v and "src" in v
                    }
                    return cls(path=path, data=cleaned)
            except json.JSONDecodeError:
                print(f"[cache] aviso: caché ilegible en {path}, empezando vacía")
        return cls(path=path, data={})

    @staticmethod
    def key(text: str) -> str:
        return hashlib.sha1(text.encode("utf-8")).hexdigest()

    def get(self, text: str) -> str | None:
        entry = self.data.get(self.key(text))
        if entry is None:
            return None
        return entry.get("tgt")

    def put(self, src: str, tgt: str) -> None:
        self.data[self.key(src)] = {"src": src, "tgt": tgt}

    def flush(self) -> None:
        _write_json(self.path, self.data)


# ---------------------------------------------------------------------------
# Token-bucket rate limiter
# ---------------------------------------------------------------------------

class RateLimiter:
    """Permite a lo más `max_rps` peticiones por ventana de 1 s."""

    def __init__(self, max_rps: int) -> None:
        if max_rps <= 0:
            raise ValueError("max_rps debe ser > 0")
        self.max_rps = max_rps
        self._calls: deque[float] = deque(maxlen=max_rps)

    def acquire(self) -> None:
        now = time.monotonic()
        if len(self._calls) == self.max_rps:
            earliest = self._calls[0]
            wait = 1.0 - (now - earliest)
            if wait > 0:
                time.sleep(wait)
                now = time.monotonic()
        self._calls.append(now)


# ---------------------------------------------------------------------------
# Visitor: recolecta y aplica traducciones sobre bloques markdown
# ---------------------------------------------------------------------------

def _iter_markdown_blocks(question: dict[str, Any]) -> Iterable[dict[str, Any]]:
    """Itera bloques type=='markdown' dentro de una pregunta (yield del block dict)."""

    def _emit(content: dict[str, Any] | None) -> Iterable[dict[str, Any]]:
        if not isinstance(content, dict):
            return
        for blk in content.get("blocks") or []:
            if isinstance(blk, dict) and blk.get("type") == "markdown" and isinstance(blk.get("content"), str):
                yield blk

    yield from _emit(question.get("prompt"))
    yield from _emit(question.get("explanation"))
    for option in question.get("options") or []:
        if not isinstance(option, dict):
            continue
        yield from _emit(option.get("content"))
        yield from _emit(option.get("feedback"))
    for item in question.get("leftItems") or []:
        if isinstance(item, dict):
            yield from _emit(item.get("content"))
    for item in question.get("rightItems") or []:
        if isinstance(item, dict):
            yield from _emit(item.get("content"))


def collect_unique_strings(bank: dict[str, Any]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for q in bank.get("questions") or []:
        if not isinstance(q, dict):
            continue
        for blk in _iter_markdown_blocks(q):
            text = blk["content"]
            if text and text not in seen:
                seen.add(text)
                ordered.append(text)
    return ordered


def apply_translations(bank: dict[str, Any], mapping: dict[str, str]) -> dict[str, Any]:
    out = copy.deepcopy(bank)
    for q in out.get("questions") or []:
        if not isinstance(q, dict):
            continue
        for blk in _iter_markdown_blocks(q):
            translated = mapping.get(blk["content"])
            if translated is not None:
                blk["content"] = translated
    return out


# ---------------------------------------------------------------------------
# Greedy batch packer (<=max_chars including separators)
# ---------------------------------------------------------------------------

def pack_batches(lengths: list[int], max_chars: int, separator: str) -> list[list[int]]:
    """Devuelve batches de índices. `lengths[i]` debe ser la longitud real del i-ésimo
    segmento en el payload (p. ej. `len(protect_tokens(s)[0])`), no `len(s)` en crudo:
    los tokens ZK<n>ZK alargan el texto; el límite del servicio es estricto.
    """
    sep_len = len(separator)
    batches: list[list[int]] = []
    current: list[int] = []
    current_len = 0

    for idx, text_len in enumerate(lengths):
        if text_len > max_chars:
            if current:
                batches.append(current)
                current = []
                current_len = 0
            batches.append([idx])
            continue
        projected = current_len + (sep_len if current else 0) + text_len
        if current and projected > max_chars:
            batches.append(current)
            current = [idx]
            current_len = text_len
        else:
            if current:
                current_len += sep_len
            current.append(idx)
            current_len += text_len

    if current:
        batches.append(current)
    return batches


# ---------------------------------------------------------------------------
# Translator wrapper with retry
# ---------------------------------------------------------------------------

class Translator:
    def __init__(self, source: str, target: str) -> None:
        try:
            from deep_translator import GoogleTranslator  # type: ignore
        except ImportError as exc:
            raise SystemExit(
                "Falta deep-translator. Instala con: pip install -r scripts/requirements-translate.txt"
            ) from exc
        self._client = GoogleTranslator(source=source, target=target)

    def translate(self, text: str, *, retries: int = 3) -> str:
        delay = 1.0
        last_err: Exception | None = None
        for attempt in range(retries):
            try:
                result = self._client.translate(text)
                if result is None:
                    raise RuntimeError("traductor devolvió None")
                return result
            except Exception as exc:  # noqa: BLE001 - errores de red variados
                last_err = exc
                if attempt < retries - 1:
                    time.sleep(delay)
                    delay *= 2
        raise RuntimeError(f"falló traducción tras {retries} intentos: {last_err}")


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

@dataclass
class Config:
    input_path: Path
    output_path: Path
    source: str
    target: str
    max_batch_chars: int
    max_rps: int
    cache_path: Path
    flush_every: int
    new_dataset_id: str | None
    new_locale: str
    validate: bool
    dry_run: bool


def _translate_one(text: str, translator: Translator, limiter: RateLimiter) -> str:
    protected, mapping = protect_tokens(text)
    limiter.acquire()
    raw = translator.translate(protected)
    return restore_tokens(raw, mapping)


def _translate_batch(
    batch: list[int],
    strings: list[str],
    translator: Translator,
    limiter: RateLimiter,
    separator: str,
) -> list[str] | None:
    """Devuelve traducciones por índice o None si la cuenta no coincide."""
    if not batch:
        return []

    protected_parts: list[str] = []
    mappings: list[list[str]] = []
    for idx in batch:
        prot, mapping = protect_tokens(strings[idx])
        protected_parts.append(prot)
        mappings.append(mapping)

    payload = separator.join(protected_parts)
    limiter.acquire()
    raw = translator.translate(payload)

    parts = SEPARATOR_SPLIT_RE.split(raw)
    if len(parts) != len(batch):
        return None

    return [restore_tokens(part.strip(), mapping) for part, mapping in zip(parts, mappings)]


def translate_strings(
    pending: list[str],
    *,
    translator: Translator,
    limiter: RateLimiter,
    cache: TranslationCache,
    max_batch_chars: int,
    flush_every: int,
    on_progress: Callable[[dict[str, str]], None] | None = None,
) -> dict[str, str]:
    """Traduce strings nuevos y actualiza la caché incrementalmente."""
    result: dict[str, str] = {}
    protected_lens = [len(protect_tokens(s)[0]) for s in pending]
    batches = pack_batches(protected_lens, max_batch_chars, BATCH_SEPARATOR)
    total_batches = len(batches)
    print(f"[trans] strings nuevos={len(pending)} batches={total_batches}")

    for batch_idx, batch in enumerate(batches, start=1):
        translations = _translate_batch(batch, pending, translator, limiter, BATCH_SEPARATOR)
        if translations is None:
            print(f"[trans] batch {batch_idx}/{total_batches} mismatch separador → fallback 1x1 ({len(batch)} strings)")
            translations = []
            for idx in batch:
                translations.append(_translate_one(pending[idx], translator, limiter))

        for idx_in_batch, idx in enumerate(batch):
            src = pending[idx]
            tgt = translations[idx_in_batch]
            result[src] = tgt
            cache.put(src, tgt)

        if batch_idx % flush_every == 0 or batch_idx == total_batches:
            cache.flush()
            if on_progress is not None:
                on_progress(result)
            print(f"[trans] progreso {batch_idx}/{total_batches} batches | acumulado {len(result)} strings")

    return result


# ---------------------------------------------------------------------------
# Validación final (reusa lógica de manage_quiz_bank.py)
# ---------------------------------------------------------------------------

def validate_bank(bank: dict[str, Any]) -> None:
    api_root = ROOT / "apps" / "api"
    if str(api_root) not in sys.path:
        sys.path.insert(0, str(api_root))

    from pydantic import ValidationError

    from app.modules.quizzes.schemas import QuizDataset
    from app.modules.quizzes.validator import validate_dataset

    try:
        dataset = QuizDataset.model_validate(bank)
    except ValidationError as exc:
        raise RuntimeError(f"Error de schema: {exc}") from exc

    report = validate_dataset(dataset)
    if report.errors:
        lines = [
            f"- questionId={item.questionId or '-'} path={item.path} reason={item.reason}"
            for item in report.errors
        ]
        raise RuntimeError("Validación de negocio falló:\n" + "\n".join(lines))


# ---------------------------------------------------------------------------
# Orquestación
# ---------------------------------------------------------------------------

def run(cfg: Config) -> int:
    bank = _load_json(cfg.input_path)
    if not isinstance(bank, dict) or not isinstance(bank.get("questions"), list):
        raise SystemExit(f"Formato inválido en {cfg.input_path}")

    unique = collect_unique_strings(bank)
    print(f"[scan] preguntas={len(bank['questions'])} strings_unicos={len(unique)}")

    cache = TranslationCache.load(cfg.cache_path)
    print(f"[cache] entradas previas={len(cache.data)} ({cfg.cache_path})")

    cached: dict[str, str] = {}
    pending: list[str] = []
    for text in unique:
        hit = cache.get(text)
        if hit is None:
            pending.append(text)
        else:
            cached[text] = hit
    print(f"[cache] hits={len(cached)} misses={len(pending)}")

    if cfg.dry_run:
        print("[dry-run] no se llamará al traductor; saliendo.")
        return 0

    new_translations: dict[str, str] = {}
    if pending:
        translator = Translator(source=cfg.source, target=cfg.target)
        limiter = RateLimiter(max_rps=cfg.max_rps)

        def _flush_partial(progress_map: dict[str, str]) -> None:
            partial = {**cached, **progress_map}
            partial_bank = apply_translations(bank, partial)
            partial_bank["locale"] = cfg.new_locale
            if cfg.new_dataset_id:
                partial_bank["datasetId"] = cfg.new_dataset_id
            _write_json(cfg.output_path, partial_bank)

        new_translations = translate_strings(
            pending,
            translator=translator,
            limiter=limiter,
            cache=cache,
            max_batch_chars=cfg.max_batch_chars,
            flush_every=cfg.flush_every,
            on_progress=_flush_partial,
        )
    else:
        print("[trans] todo en caché; no se llamará al traductor.")

    full_mapping: dict[str, str] = {**cached, **new_translations}
    out_bank = apply_translations(bank, full_mapping)
    out_bank["locale"] = cfg.new_locale
    if cfg.new_dataset_id:
        out_bank["datasetId"] = cfg.new_dataset_id

    _write_json(cfg.output_path, out_bank)
    cache.flush()
    print(f"[write] {cfg.output_path} ({len(out_bank['questions'])} preguntas)")

    if cfg.validate:
        print("[validate] corriendo schema + validate_dataset...")
        validate_bank(out_bank)
        print("[validate] OK")

    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Traduce ada-quiz-bank.json a inglés vía deep-translator.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--source", default="es")
    parser.add_argument("--target", default="en")
    parser.add_argument("--max-batch-chars", type=int, default=4000)
    parser.add_argument("--max-rps", type=int, default=3)
    parser.add_argument("--cache", type=Path, default=DEFAULT_CACHE, dest="cache_path")
    parser.add_argument("--flush-every", type=int, default=25)
    parser.add_argument("--new-dataset-id", default="ada-quiz-bank-en")
    parser.add_argument("--new-locale", default="en")
    parser.add_argument("--validate", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    cfg = Config(
        input_path=args.input,
        output_path=args.output,
        source=args.source,
        target=args.target,
        max_batch_chars=args.max_batch_chars,
        max_rps=args.max_rps,
        cache_path=args.cache_path,
        flush_every=args.flush_every,
        new_dataset_id=args.new_dataset_id or None,
        new_locale=args.new_locale,
        validate=args.validate,
        dry_run=args.dry_run,
    )
    return run(cfg)


if __name__ == "__main__":
    raise SystemExit(main())
