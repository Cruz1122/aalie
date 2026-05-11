from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.modules.quizzes.repository import get_validated_dataset  # noqa: E402


def main() -> int:
    _, report = get_validated_dataset()

    if report.errors:
        print("Quiz dataset validation: FAIL")
        for item in report.errors:
            print(
                f"- ERROR questionId={item.questionId or '-'} path={item.path} reason={item.reason}"
            )
    else:
        print("Quiz dataset validation: OK")

    if report.warnings:
        for item in report.warnings:
            print(
                f"- WARNING questionId={item.questionId or '-'} path={item.path} reason={item.reason}"
            )

    return 1 if report.errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
