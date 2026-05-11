from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path
from typing import Any

from pydantic import ValidationError

ROOT = Path(__file__).resolve().parents[1]
BANK_PATH = ROOT / "packages" / "content-data" / "quizzes" / "ada-quiz-bank.json"


def _load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _load_bank() -> dict[str, Any]:
    data = _load_json(BANK_PATH)
    if not isinstance(data, dict) or not isinstance(data.get("questions"), list):
        raise ValueError(f"Formato inválido en {BANK_PATH}")
    return data


def _parse_input_questions(path: Path) -> list[dict[str, Any]]:
    data = _load_json(path)
    if isinstance(data, list):
        items = data
    elif isinstance(data, dict) and isinstance(data.get("questions"), list):
        items = data["questions"]
    else:
        raise ValueError("El JSON de entrada debe ser array de preguntas o un objeto con `questions`.")

    if not all(isinstance(item, dict) for item in items):
        raise ValueError("Todas las entradas deben ser objetos pregunta.")
    return items


def _validate_bank(bank: dict[str, Any]) -> None:
    # Import tardío para no exigir path del backend en comandos que no validen.
    import sys

    api_root = ROOT / "apps" / "api"
    if str(api_root) not in sys.path:
        sys.path.insert(0, str(api_root))

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


def cmd_insert(input_path: Path) -> None:
    bank = _load_bank()
    count_before = len(bank["questions"])

    incoming = _parse_input_questions(input_path)
    incoming_ids = [item.get("questionId") for item in incoming]
    if any(not qid for qid in incoming_ids):
        raise ValueError("Todas las preguntas de entrada deben tener `questionId`.")
    if len(set(incoming_ids)) != len(incoming_ids):
        raise ValueError("El JSON de entrada trae questionId duplicados.")

    existing_ids = {q["questionId"] for q in bank["questions"]}
    duplicates = [qid for qid in incoming_ids if qid in existing_ids]
    if duplicates:
        raise ValueError(f"Ya existen questionId en banco: {duplicates}")

    updated = copy.deepcopy(bank)
    updated["questions"].extend(incoming)
    count_after = len(updated["questions"])
    print(f"Total preguntas: antes={count_before} despues_proyectado={count_after}")

    _validate_bank(updated)

    _write_json(BANK_PATH, updated)
    print(f"OK insertadas {len(incoming)} preguntas desde {input_path}")
    print(f"Total preguntas: antes={count_before} despues={count_after}")


def cmd_remove(ids_path: Path, validate: bool) -> None:
    bank = _load_bank()

    ids_data = _load_json(ids_path)
    if isinstance(ids_data, dict) and isinstance(ids_data.get("questionIds"), list):
        ids = ids_data["questionIds"]
    elif isinstance(ids_data, list):
        ids = ids_data
    else:
        raise ValueError("El archivo de borrado debe ser array de IDs o {\"questionIds\": [...]} ")

    if not all(isinstance(x, str) and x for x in ids):
        raise ValueError("Todos los IDs a borrar deben ser string no vacío.")

    original_len = len(bank["questions"])
    updated_questions = [q for q in bank["questions"] if q.get("questionId") not in set(ids)]
    removed = original_len - len(updated_questions)

    updated = copy.deepcopy(bank)
    updated["questions"] = updated_questions

    if validate:
        _validate_bank(updated)

    _write_json(BANK_PATH, updated)
    print(f"OK borradas {removed} preguntas")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Gestiona inserción/borrado de preguntas en ada-quiz-bank")
    sub = parser.add_subparsers(dest="command", required=True)

    insert = sub.add_parser("insert", help="Inserta preguntas desde JSON")
    insert.add_argument("--input", type=Path, required=True)
    remove = sub.add_parser("remove", help="Borra preguntas por IDs")
    remove.add_argument("--ids", type=Path, required=True)
    remove.add_argument("--skip-validate", action="store_true")

    return parser


def main() -> int:
    args = build_parser().parse_args()
    if args.command == "insert":
        cmd_insert(input_path=args.input)
    elif args.command == "remove":
        cmd_remove(ids_path=args.ids, validate=not args.skip_validate)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
