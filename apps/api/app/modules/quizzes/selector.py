from __future__ import annotations

from dataclasses import dataclass

from .schemas import QuizQuestion, QuizSelectionItem, QuizSelectionRequest, QuizSelectionResult


@dataclass(frozen=True)
class _Candidate:
    question: QuizQuestion
    reason: dict[str, object]


def _difficulty_rank(value: str) -> int:
    order = {"basic": 0, "intermediate": 1, "advanced": 2}
    return order.get(value, 0)


def _difficulty_from_rank(rank: int) -> str:
    order = ["basic", "intermediate", "advanced"]
    return order[max(0, min(len(order) - 1, rank))]


def _next_difficulty(recent_results: list[dict[str, object]]) -> tuple[str, str]:
    last = recent_results[-3:]
    if len(last) < 3:
        return "basic", "initial_question"

    correct = sum(1 for item in last if bool(item.get("wasCorrect")))
    accuracy = correct / len(last)
    current = str(last[-1].get("difficulty", "basic"))
    rank = _difficulty_rank(current)

    if accuracy >= 0.8:
        return _difficulty_from_rank(rank + 1), "increase_difficulty"
    if accuracy < 0.5:
        return _difficulty_from_rank(rank - 1), "decrease_difficulty"
    return current, "maintain_difficulty"


def _pick_priority_topic(request: QuizSelectionRequest) -> str | None:
    if request.weakTopics:
        return sorted(request.weakTopics)[0]

    for item in reversed(request.recentResults):
        if not bool(item.get("wasCorrect")) and isinstance(item.get("topic"), str):
            return str(item["topic"])

    return None


def _recent_topic_streak(recent_results: list[dict[str, object]]) -> str | None:
    if len(recent_results) < 2:
        return None
    tail = recent_results[-2:]
    topics = [str(item.get("topic", "")) for item in tail]
    if topics[0] and topics[0] == topics[1]:
        return topics[0]
    return None


def _recent_type_streak(recent_results: list[dict[str, object]]) -> str | None:
    if len(recent_results) < 2:
        return None
    tail = recent_results[-2:]
    types = [str(item.get("type", "")) for item in tail]
    if types[0] and types[0] == types[1]:
        return types[0]
    return None


def _build_reason(code: str, question: QuizQuestion) -> dict[str, object]:
    messages = {
        "initial_question": "Se eligió una pregunta inicial de dificultad básica.",
        "reinforce_failed_topic": "Se eligió esta pregunta porque el estudiante falló una pregunta previa del mismo tema.",
        "increase_difficulty": "Se incrementó la dificultad por buen desempeño reciente.",
        "decrease_difficulty": "Se redujo la dificultad para reforzar fundamentos.",
        "maintain_difficulty": "Se mantiene la dificultad por desempeño reciente estable.",
        "cover_pending_topic": "Se eligió este tema para cubrir contenido pendiente.",
        "avoid_repetition": "Se eligió esta pregunta para evitar repetición de tema o tipo.",
        "fallback_available_question": "Se eligió la mejor pregunta disponible por fallback determinista.",
    }
    return {
        "code": code,
        "message": messages.get(code, messages["fallback_available_question"]),
        "topic": question.topic,
        "difficulty": question.difficulty,
    }


def _deterministic_pick(items: list[QuizQuestion]) -> QuizQuestion | None:
    if not items:
        return None
    return sorted(items, key=lambda q: q.questionId)[0]


def _matches_studied(question: QuizQuestion, studied: set[tuple[str, str]]) -> bool:
    if not studied:
        return True
    refs = {(ref.moduleId, ref.chapterId) for ref in question.contentRefs}
    return bool(refs & studied)


def _normalize_module_id(value: str) -> str:
    normalized = value.strip()
    if normalized.startswith("mod-"):
        return normalized[4:]
    return normalized


def _module_matches(question: QuizQuestion, module_id: str) -> bool:
    normalized_target = _normalize_module_id(module_id)
    for ref in question.contentRefs:
        if ref.moduleId == module_id:
            return True
        if _normalize_module_id(ref.moduleId) == normalized_target:
            return True
    return False


def select_questions(
    questions: list[QuizQuestion],
    request: QuizSelectionRequest,
    include_trace: bool = False,
) -> QuizSelectionResult:
    warnings: list[str] = []
    desired_count = max(1, request.sessionPreferences.questionCount)

    active = [question for question in questions if question.status == "active"]
    
    prefs = request.sessionPreferences
    filtered_active = active
    has_explicit_filters = False

    if prefs.moduleId:
        has_explicit_filters = True
        filtered_active = [q for q in filtered_active if _module_matches(q, prefs.moduleId)]
    
    if prefs.topicIds:
        has_explicit_filters = True
        filtered_active = [q for q in filtered_active if q.topic in prefs.topicIds]
        
    if prefs.skillIds:
        has_explicit_filters = True
        filtered_active = [q for q in filtered_active if set(q.skillIds) & set(prefs.skillIds)]

    if has_explicit_filters and not filtered_active:
        warnings.append("explicit_filters_no_match")
        active = []
    else:
        active = filtered_active
    studied = {(ref.moduleId, ref.chapterId) for ref in request.studiedContentRefs}
    seen = set(request.recentQuestionIds)
    recent = request.recentResults

    priority_topic = _pick_priority_topic(request)
    desired_difficulty, difficulty_code = _next_difficulty(recent)

    selected: list[_Candidate] = []
    used_ids: set[str] = set()

    while len(selected) < desired_count:
        available = [
            q
            for q in active
            if q.questionId not in seen
            and q.questionId not in used_ids
            and _matches_studied(q, studied)
        ]
        if not available:
            fallback_available = [
                q for q in active if q.questionId not in used_ids and _matches_studied(q, studied)
            ]
            if not fallback_available:
                fallback_available = [q for q in active if q.questionId not in used_ids]
                warnings.append("studied_content_relaxed")
                if not fallback_available:
                    warnings.append("insufficient_questions")
                    break
            available = fallback_available
            warnings.append("reused_questions_due_to_shortage")

        topic_pool = available
        reason_code = "fallback_available_question"

        if priority_topic:
            same_topic = [q for q in topic_pool if q.topic == priority_topic]
            if same_topic:
                topic_pool = same_topic
                reason_code = "reinforce_failed_topic"

        diff_pool = [q for q in topic_pool if q.difficulty == desired_difficulty]
        if diff_pool:
            topic_pool = diff_pool
            if reason_code == "fallback_available_question":
                reason_code = difficulty_code

        # Coverage: avoid >2 same topic/type in a row when alternatives exist
        topic_streak = _recent_topic_streak(recent)
        type_streak = _recent_type_streak(recent)

        alternatives = topic_pool
        if topic_streak:
            alt_topic = [q for q in alternatives if q.topic != topic_streak]
            if alt_topic:
                alternatives = alt_topic
                reason_code = "avoid_repetition"

        if type_streak:
            alt_type = [q for q in alternatives if q.type != type_streak]
            if alt_type:
                alternatives = alt_type
                reason_code = "avoid_repetition"

        # Cover pending topic when there is no failed-topic pressure
        if not priority_topic:
            seen_topics = {str(item.get("topic", "")) for item in recent if item.get("topic")}
            pending_pool = [q for q in alternatives if q.topic not in seen_topics]
            if pending_pool:
                alternatives = pending_pool
                reason_code = "cover_pending_topic"

        choice = _deterministic_pick(alternatives)
        if choice is None:
            warnings.append("insufficient_questions")
            break

        selected.append(_Candidate(question=choice, reason=_build_reason(reason_code, choice)))
        used_ids.add(choice.questionId)

        recent = [
            *recent,
            {
                "questionId": choice.questionId,
                "topic": choice.topic,
                "difficulty": choice.difficulty,
                "type": choice.type,
                "wasCorrect": True,
            },
        ]

    trace = (
        [
            QuizSelectionItem(
                questionId=item.question.questionId,
                score=0.0,
                reasons=[str(item.reason.get("code", "fallback_available_question"))],
                selectionReason=item.reason,
            )
            for item in selected
        ]
        if include_trace
        else []
    )

    return QuizSelectionResult(
        questions=[item.question for item in selected],
        warnings=warnings,
        selectionTrace=trace,
    )
