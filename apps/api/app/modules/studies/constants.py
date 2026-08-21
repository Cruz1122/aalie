from __future__ import annotations

STUDY_STATUSES = {"DRAFT", "ACTIVE", "PAUSED", "CLOSED"}
STUDY_CONDITIONS = {"AALIE", "CONTROL"}
STUDY_EVENT_NAMES = {
    "analysis_run",
    "trace_run",
    "export_run",
    "llm_run",
}
MEASUREMENT_KEYS = {
    "pretest_score",
    "posttest_score",
    "task_completion_seconds",
}

QUIZ_SELECTOR_VERSION = "adaptive-selector-v2"
QUIZ_GRADING_VERSION = "grading-v1"
QUIZ_PROGRESS_VERSION = "mastery-v1"
STUDY_EXPORT_SCHEMA_VERSION = "1.0.0"
