from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

QuizQuestionType = Literal[
    "single_choice",
    "multiple_choice",
    "true_false",
    "ordering",
    "match_pairs",
]
QuizDifficulty = Literal["basic", "intermediate", "advanced"]
QuizCognitiveLevel = Literal["recall", "understand", "apply", "analyze"]
QuizQuestionStatus = Literal["draft", "active", "deprecated", "archived"]
QuizGradingMode = Literal[
    "all_or_nothing",
    "exact_set",
    "partial_credit",
    "ordered_exact",
    "pairwise",
]


class ContentRef(BaseModel):
    courseId: str
    moduleId: str
    chapterId: str
    blockId: str | None = None


class RenderableBlock(BaseModel):
    type: Literal["markdown", "code"]
    content: str
    language: Literal["aalie-pseudocode", "text"] | None = None


class RenderableContent(BaseModel):
    blocks: list[RenderableBlock]


class OptionFeedback(BaseModel):
    blocks: list[RenderableBlock]
    contentRefs: list[ContentRef] = Field(default_factory=list)


class QuizOption(BaseModel):
    optionId: str
    content: RenderableContent
    feedback: OptionFeedback


class MatchItem(BaseModel):
    leftId: str | None = None
    rightId: str | None = None
    content: RenderableContent


class Pair(BaseModel):
    leftId: str
    rightId: str


class QuizAnswer(BaseModel):
    correctOptionIds: list[str] | None = None
    orderedOptionIds: list[str] | None = None
    pairs: list[Pair] | None = None


class GradingPolicy(BaseModel):
    mode: QuizGradingMode
    maxScore: float = 1
    penalty: float = 0
    minScore: float = 0


class SelectionMeta(BaseModel):
    weight: float = 1
    estimatedTimeSec: int | None = None
    targetMastery: float | None = None
    prerequisiteSkillIds: list[str] = Field(default_factory=list)
    reinforcesSkillIds: list[str] = Field(default_factory=list)
    exposureLimit: int | None = None
    cooldownSessions: int = 0
    discrimination: Literal["low", "medium", "high"] | None = None


class QuizQuestion(BaseModel):
    questionId: str
    questionVersion: int
    status: QuizQuestionStatus
    type: QuizQuestionType
    difficulty: QuizDifficulty
    cognitiveLevel: QuizCognitiveLevel
    topic: str
    tags: list[str]
    skillIds: list[str]
    prompt: RenderableContent
    options: list[QuizOption] = Field(default_factory=list)
    leftItems: list[MatchItem] = Field(default_factory=list)
    rightItems: list[MatchItem] = Field(default_factory=list)
    answer: QuizAnswer
    gradingPolicy: GradingPolicy
    explanation: RenderableContent
    contentRefs: list[ContentRef]
    selectionMeta: SelectionMeta = Field(default_factory=SelectionMeta)


class QuizDataset(BaseModel):
    schemaVersion: str
    datasetId: str
    locale: str
    courseId: str
    taxonomyVersion: str
    questions: list[QuizQuestion]


class QuizSessionPreferences(BaseModel):
    questionCount: int = 5
    difficultyMix: dict[QuizDifficulty, float] = Field(default_factory=dict)
    moduleId: str | None = None
    topicIds: list[str] = Field(default_factory=list)
    skillIds: list[str] = Field(default_factory=list)


class QuizSelectionRequest(BaseModel):
    studentId: str | None = None
    studiedContentRefs: list[ContentRef] = Field(default_factory=list)
    masteryBySkill: dict[str, float] = Field(default_factory=dict)
    weakSkillIds: list[str] = Field(default_factory=list)
    weakTopics: list[str] = Field(default_factory=list)
    recentResults: list[dict[str, object]] = Field(default_factory=list)
    recentQuestionIds: list[str] = Field(default_factory=list)
    sessionPreferences: QuizSessionPreferences = Field(default_factory=QuizSessionPreferences)
    locale: str | None = None


class QuizSession(BaseModel):
    sessionId: str
    schemaVersion: str
    locale: str
    courseId: str
    questions: list[QuizQuestion]
    metadata: dict[str, object]


class QuizAttempt(QuizSession):
    pass


class StudentAnswer(BaseModel):
    questionId: str
    selectedOptionIds: list[str] | None = None
    orderedOptionIds: list[str] | None = None
    pairs: list[Pair] | None = None


class QuizAnswerSubmission(BaseModel):
    sessionId: str
    questionIds: list[str]
    answers: list[StudentAnswer]
    locale: str | None = None


class QuizAttemptSubmission(QuizAnswerSubmission):
    pass


class QuizQuestionResult(BaseModel):
    questionId: str
    isCorrect: bool
    score: float
    maxScore: float
    studentAnswer: StudentAnswer
    correctAnswer: QuizAnswer | None = None
    optionFeedback: list[OptionFeedback]
    explanation: RenderableContent
    contentRefs: list[ContentRef]
    skillIds: list[str]


class QuizSessionResult(BaseModel):
    sessionId: str
    score: float
    maxScore: float
    accuracy: float
    results: list[QuizQuestionResult]
    strengths: list[str]
    areasToImprove: list[str]
    masteryDeltaBySkill: dict[str, float]


class QuizAttemptResult(QuizSessionResult):
    pass


class QuizSelectionItem(BaseModel):
    questionId: str
    score: float
    reasons: list[str]
    selectionReason: dict[str, object] | None = None


class QuizSelectionResult(BaseModel):
    questions: list[QuizQuestion]
    warnings: list[str] = Field(default_factory=list)
    selectionTrace: list[QuizSelectionItem] = Field(default_factory=list)


class ValidationIssue(BaseModel):
    questionId: str | None = None
    path: str
    reason: str


class ValidationReport(BaseModel):
    errors: list[ValidationIssue] = Field(default_factory=list)
    warnings: list[ValidationIssue] = Field(default_factory=list)


class TaxonomyModel(BaseModel):
    taxonomyVersion: str
    courseId: str
    topics: list[str]
    tags: list[str]
    skills: list[str]
