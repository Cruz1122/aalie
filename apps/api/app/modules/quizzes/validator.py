from __future__ import annotations

import re
from collections import Counter

from .content_refs import content_ref_exists
from .schemas import QuizDataset, QuizQuestion, ValidationIssue, ValidationReport
from .taxonomy import validate_skill, validate_tag, validate_topic

HTML_RE = re.compile(r"<[^>]+>")
AALIE_RE = re.compile(r"\baalie\b", re.IGNORECASE)


def _issue(question_id: str | None, path: str, reason: str) -> ValidationIssue:
    return ValidationIssue(questionId=question_id, path=path, reason=reason)


def _markdown_has_html(question_id: str, path: str, content: str, report: ValidationReport) -> None:
    if HTML_RE.search(content):
        report.errors.append(
            _issue(question_id, path, "Markdown incluye HTML arbitrario no permitido")
        )


def _contains_aalie_eval(question: QuizQuestion) -> bool:
    buckets: list[str] = []
    for block in question.prompt.blocks + question.explanation.blocks:
        buckets.append(block.content)
    for option in question.options:
        buckets.extend([block.content for block in option.content.blocks])
        buckets.extend([block.content for block in option.feedback.blocks])
    for item in question.leftItems:
        buckets.extend([block.content for block in item.content.blocks])
    for item in question.rightItems:
        buckets.extend([block.content for block in item.content.blocks])
    return any(AALIE_RE.search(text or "") for text in buckets)


def _validate_grading_policy(question: QuizQuestion, report: ValidationReport) -> None:
    compat: dict[str, set[str]] = {
        "single_choice": {"all_or_nothing"},
        "true_false": {"all_or_nothing"},
        "multiple_choice": {"all_or_nothing", "exact_set", "partial_credit"},
        "ordering": {"ordered_exact", "partial_credit"},
        "match_pairs": {"pairwise", "all_or_nothing"},
    }
    if question.gradingPolicy.mode not in compat[question.type]:
        report.errors.append(
            _issue(
                question.questionId,
                "gradingPolicy.mode",
                f"Modo {question.gradingPolicy.mode} incompatible con type={question.type}",
            )
        )


def _validate_question_answer(question: QuizQuestion, report: ValidationReport) -> None:
    option_ids = [opt.optionId for opt in question.options]
    if len(option_ids) != len(set(option_ids)):
        report.errors.append(_issue(question.questionId, "options", "optionId duplicado"))

    for idx, option in enumerate(question.options):
        if not option.feedback.blocks:
            report.errors.append(
                _issue(question.questionId, f"options[{idx}].feedback", "Toda opcion requiere feedback")
            )

    if question.type in {"single_choice", "multiple_choice", "true_false"}:
        answers = question.answer.correctOptionIds or []
        missing = [answer for answer in answers if answer not in set(option_ids)]
        if missing:
            report.errors.append(
                _issue(
                    question.questionId,
                    "answer.correctOptionIds",
                    f"IDs de respuesta inexistentes: {missing}",
                )
            )

    if question.type == "single_choice" and len(question.answer.correctOptionIds or []) != 1:
        report.errors.append(
            _issue(
                question.questionId,
                "answer.correctOptionIds",
                "single_choice debe tener exactamente una respuesta correcta",
            )
        )

    if question.type == "true_false":
        if set(option_ids) != {"true", "false"}:
            report.errors.append(
                _issue(question.questionId, "options", "true_false requiere options true/false")
            )
        if len(question.answer.correctOptionIds or []) != 1:
            report.errors.append(
                _issue(
                    question.questionId,
                    "answer.correctOptionIds",
                    "true_false debe tener exactamente una correcta",
                )
            )

    if question.type == "multiple_choice" and len(question.answer.correctOptionIds or []) < 1:
        report.errors.append(
            _issue(
                question.questionId,
                "answer.correctOptionIds",
                "multiple_choice requiere al menos una respuesta correcta",
            )
        )

    if question.type == "ordering":
        expected = set(option_ids)
        answered = set(question.answer.orderedOptionIds or [])
        if expected != answered:
            report.errors.append(
                _issue(
                    question.questionId,
                    "answer.orderedOptionIds",
                    "ordering debe incluir todos los itemIds exactamente una vez",
                )
            )

    if question.type == "match_pairs":
        left_ids = [item.leftId for item in question.leftItems if item.leftId]
        right_ids = [item.rightId for item in question.rightItems if item.rightId]
        if len(left_ids) != len(set(left_ids)):
            report.errors.append(_issue(question.questionId, "leftItems", "leftId duplicado"))
        if len(right_ids) != len(set(right_ids)):
            report.errors.append(_issue(question.questionId, "rightItems", "rightId duplicado"))
        for pair in question.answer.pairs or []:
            if pair.leftId not in set(left_ids) or pair.rightId not in set(right_ids):
                report.errors.append(
                    _issue(
                        question.questionId,
                        "answer.pairs",
                        f"Par referencia IDs inexistentes: ({pair.leftId}, {pair.rightId})",
                    )
                )


def validate_dataset(dataset: QuizDataset) -> ValidationReport:
    report = ValidationReport()

    total_questions = len(dataset.questions)
    if total_questions > 500:
        report.errors.append(
            _issue(None, "questions", f"Dataset excede alcance: {total_questions} > 500")
        )
    if total_questions < 5:
        report.errors.append(
            _issue(None, "questions", f"Dataset insuficiente para MVP: {total_questions} < 5")
        )

    question_ids = [q.questionId for q in dataset.questions]
    duplicated = [qid for qid, count in Counter(question_ids).items() if count > 1]
    for qid in duplicated:
        report.errors.append(_issue(qid, "questionId", "questionId duplicado"))

    topic_counter: Counter[str] = Counter()
    skill_counter: Counter[str] = Counter()

    for question in dataset.questions:
        topic_counter[question.topic] += 1
        for skill in question.skillIds:
            skill_counter[skill] += 1

        if question.questionVersion < 1:
            report.errors.append(
                _issue(question.questionId, "questionVersion", "Debe ser entero positivo")
            )

        if not validate_topic(question.topic):
            report.errors.append(_issue(question.questionId, "topic", f"Topic invalido: {question.topic}"))

        for idx, tag in enumerate(question.tags):
            if not validate_tag(tag):
                report.errors.append(
                    _issue(question.questionId, f"tags[{idx}]", f"Tag invalido: {tag}")
                )

        if not question.skillIds:
            report.errors.append(_issue(question.questionId, "skillIds", "No puede estar vacio"))
        for idx, skill in enumerate(question.skillIds):
            if not validate_skill(skill):
                report.errors.append(
                    _issue(question.questionId, f"skillIds[{idx}]", f"Skill invalida: {skill}")
                )

        if not question.prompt.blocks:
            report.errors.append(_issue(question.questionId, "prompt.blocks", "No puede estar vacio"))

        if not question.explanation.blocks:
            report.errors.append(_issue(question.questionId, "explanation.blocks", "No puede estar vacio"))

        if question.status == "active" and not question.contentRefs:
            report.errors.append(_issue(question.questionId, "contentRefs", "No puede estar vacio"))

        for idx, ref in enumerate(question.contentRefs):
            if not content_ref_exists(ref):
                report.errors.append(
                    _issue(
                        question.questionId,
                        f"contentRefs[{idx}]",
                        "Referencia de contenido no resoluble",
                    )
                )

        for block_idx, block in enumerate(question.prompt.blocks):
            if block.type == "markdown":
                _markdown_has_html(
                    question.questionId,
                    f"prompt.blocks[{block_idx}]",
                    block.content,
                    report,
                )
        for block_idx, block in enumerate(question.explanation.blocks):
            if block.type == "markdown":
                _markdown_has_html(
                    question.questionId,
                    f"explanation.blocks[{block_idx}]",
                    block.content,
                    report,
                )

        if _contains_aalie_eval(question):
            report.errors.append(
                _issue(
                    question.questionId,
                    "prompt",
                    "Pregunta no debe evaluar uso de AALIE",
                )
            )

        _validate_question_answer(question, report)
        _validate_grading_policy(question, report)

        # Warnings no bloqueantes
        tags_len = len(question.tags)
        if tags_len < 2:
            report.warnings.append(_issue(question.questionId, "tags", "Menos de 2 tags"))
        if tags_len > 8:
            report.warnings.append(_issue(question.questionId, "tags", "Mas de 8 tags"))

        est = question.selectionMeta.estimatedTimeSec
        if est is not None:
            if question.difficulty == "basic" and est > 120:
                report.warnings.append(
                    _issue(question.questionId, "selectionMeta.estimatedTimeSec", "Tiempo alto para dificultad basic")
                )
            if question.difficulty == "advanced" and est < 30:
                report.warnings.append(
                    _issue(question.questionId, "selectionMeta.estimatedTimeSec", "Tiempo bajo para dificultad advanced")
                )

        explanation_text_len = sum(len(block.content.strip()) for block in question.explanation.blocks)
        if explanation_text_len < 20:
            report.warnings.append(
                _issue(question.questionId, "explanation.blocks", "Explicacion demasiado corta")
            )

        for idx, option in enumerate(question.options):
            if not option.feedback.contentRefs:
                report.warnings.append(
                    _issue(
                        question.questionId,
                        f"options[{idx}].feedback.contentRefs",
                        "Feedback sin contentRefs",
                    )
                )

    for topic, count in topic_counter.items():
        if count >= max(1, len(dataset.questions) * 0.7):
            report.warnings.append(
                _issue(None, "distribution.topic", f"Sobreconcentracion por topic: {topic}")
            )

    for skill, count in skill_counter.items():
        if count >= max(1, len(dataset.questions) * 0.7):
            report.warnings.append(
                _issue(None, "distribution.skill", f"Sobreconcentracion por skill: {skill}")
            )

    return report
