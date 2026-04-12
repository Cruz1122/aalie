"""Configuracion del subsistema LLM en backend."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any, Dict


def _env_str(name: str, default: str) -> str:
    value = os.getenv(name, "").strip()
    return value or default


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        parsed = int(raw)
    except ValueError:
        return default
    return parsed if parsed > 0 else default


def _env_float(name: str, default: float) -> float:
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name, "").strip().lower()
    if not raw:
        return default
    if raw in {"1", "true", "yes", "on"}:
        return True
    if raw in {"0", "false", "no", "off"}:
        return False
    return default


def _normalize_locale(locale: str | None) -> str:
    if not locale:
        return "es"
    normalized = locale.lower().strip()[:2]
    return normalized if normalized in {"es", "en"} else "es"


@dataclass(frozen=True)
class JobConfig:
    job: str
    model: str
    temperature: float
    max_tokens: int
    system_prompt: str
    disable_thinking: bool = False
    schema: Dict[str, Any] | None = None


REPAIR_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "properties": {
        "code": {"type": "string"},
        "removedLines": {"type": "array", "items": {"type": "number"}},
        "addedLines": {"type": "array", "items": {"type": "number"}},
    },
    "required": ["code", "removedLines", "addedLines"],
}


COMPARE_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "properties": {
        "analysis": {"type": "object"},
        "note": {"type": "string"},
    },
    "required": ["analysis", "note"],
}


GRAMMAR_RULES_ES = (
    "Usa EXCLUSIVAMENTE la gramatica del proyecto. "
    "Todo algoritmo debe tener forma nombre(params) BEGIN ... END. "
    "No uses prefijos ALGORITHM/PROCEDURE/FUNCTION ni END IF/END WHILE/END FOR. "
    "Para cerrar bloques usa solo END. "
    "IF debe ser IF (condicion) THEN BEGIN ... END y ELSE BEGIN ... END. "
    "WHILE y FOR requieren DO antes del bloque: WHILE (...) DO BEGIN ... END, FOR ... DO BEGIN ... END. "
    "Usa asignacion <-, modulo MOD, division entera DIV, y ; al final de cada sentencia interna. "
    "No uses tipos en variables ni sintaxis de otros lenguajes. "
    "Si entregas codigo, debe ser parseable por la gramatica del proyecto sin ambiguedad."
)


GRAMMAR_RULES_EN = (
    "Use EXCLUSIVELY the project's grammar. "
    "Every algorithm must use name(params) BEGIN ... END. "
    "Do not use ALGORITHM/PROCEDURE/FUNCTION prefixes nor END IF/END WHILE/END FOR. "
    "Close control blocks with END only. "
    "IF must be IF (condition) THEN BEGIN ... END and ELSE BEGIN ... END. "
    "WHILE and FOR require DO before the block: WHILE (...) DO BEGIN ... END, FOR ... DO BEGIN ... END. "
    "Use <- assignment, MOD for modulo, DIV for integer division, and ; at the end of internal statements. "
    "Do not use typed variables or syntax from other languages. "
    "If you output code, it must be parseable by the project grammar."
)


SYSTEM_PROMPTS = {
    "es": {
        "parser_assist": (
            "Eres un asistente experto en pseudocodigo academico para analisis de algoritmos. "
            f"{GRAMMAR_RULES_ES} "
            "Cuando el usuario pida codigo, responde con UN solo bloque de pseudocodigo valido y una explicacion breve."
        ),
        "general": (
            "Eres un asistente tecnico para analisis de algoritmos. "
            f"{GRAMMAR_RULES_ES} "
            "Responde de forma clara, didactica y verificable. "
            "Si el usuario pide implementacion, entrega codigo en esa gramatica."
        ),
        "repair": (
            "Corrige pseudocodigo con errores para que sea parseable por la gramatica del proyecto. "
            f"{GRAMMAR_RULES_ES} "
            "Devuelve SOLO JSON valido con estructura exacta: "
            '{"code":"...","removedLines":[],"addedLines":[]} sin texto extra.'
        ),
        "compare": (
            "Compara el analisis formal recibido con tu estimacion independiente. "
            "Responde solo JSON valido con analysis y note."
        ),
        "explain": (
            "Explica conceptos de analisis de complejidad con enfoque pedagico."
        ),
    },
    "en": {
        "parser_assist": (
            "You are an expert academic pseudocode assistant for algorithm analysis. "
            f"{GRAMMAR_RULES_EN} "
            "When the user asks for code, return exactly one valid pseudocode block plus a brief explanation."
        ),
        "general": (
            "You are a technical assistant for algorithm analysis. "
            f"{GRAMMAR_RULES_EN} "
            "Answer clearly, didactically, and with verifiable claims. "
            "If code is requested, output code in that grammar."
        ),
        "repair": (
            "Fix pseudocode with syntax errors so it is parseable by the project grammar. "
            f"{GRAMMAR_RULES_EN} "
            "Return ONLY valid JSON with exact shape: "
            '{"code":"...","removedLines":[],"addedLines":[]} and no extra text.'
        ),
        "compare": (
            "Compare the provided formal analysis with an independent estimate. "
            "Return only valid JSON with analysis and note."
        ),
        "explain": "Explain complexity-analysis concepts with a teaching-first style.",
    },
}


def get_job_config(job: str, locale: str | None) -> JobConfig:
    locale_code = _normalize_locale(locale)
    prompts = SYSTEM_PROMPTS[locale_code]
    selected_job = job if job in {"parser_assist", "general", "repair", "compare", "explain"} else "general"

    model_env = {
        "parser_assist": "LLM_MODEL_PARSER_ASSIST",
        "general": "LLM_MODEL_GENERAL",
        "repair": "LLM_MODEL_REPAIR",
        "compare": "LLM_MODEL_COMPARE",
        "explain": "LLM_MODEL_EXPLAIN",
    }[selected_job]

    default_model = {
        "parser_assist": "gemini-2.5-flash",
        "general": "gemini-2.5-flash",
        "repair": "gemini-2.5-flash",
        "compare": "gemini-2.5-flash",
        "explain": "gemini-2.5-flash",
    }[selected_job]

    default_temperature = {
        "parser_assist": 0.7,
        "general": 0.7,
        "repair": 0.5,
        "compare": 0.1,
        "explain": 0.35,
    }[selected_job]

    default_max_tokens = {
        "parser_assist": 4000,
        "general": 5000,
        "repair": 2500,
        "compare": 3500,
        "explain": 1800,
    }[selected_job]

    default_disable_thinking = {
        "parser_assist": True,
        "general": False,
        "repair": True,
        "compare": True,
        "explain": True,
    }[selected_job]

    schema = None
    if selected_job == "repair":
        schema = REPAIR_SCHEMA
    elif selected_job == "compare":
        schema = COMPARE_SCHEMA

    return JobConfig(
        job=selected_job,
        model=_env_str(model_env, default_model),
        temperature=_env_float(f"LLM_TEMPERATURE_{selected_job.upper()}", default_temperature),
        max_tokens=_env_int(f"LLM_MAX_TOKENS_{selected_job.upper()}", default_max_tokens),
        system_prompt=prompts[selected_job],
        disable_thinking=_env_bool(
            f"LLM_DISABLE_THINKING_{selected_job.upper()}",
            default_disable_thinking,
        ),
        schema=schema,
    )


def get_backend_llm_status() -> Dict[str, Any]:
    jobs = ["parser_assist", "general", "repair", "compare", "explain"]
    models = {job: get_job_config(job, "es").model for job in jobs}
    timeout_seconds = _env_int("LLM_TIMEOUT_SECONDS", 30)

    return {
        "provider": _env_str("LLM_PROVIDER", "gemini"),
        "timeouts": {"requestSeconds": timeout_seconds},
        "jobs": models,
    }


def get_provider_name() -> str:
    return _env_str("LLM_PROVIDER", "gemini").lower()


def get_timeout_seconds() -> int:
    return _env_int("LLM_TIMEOUT_SECONDS", 30)


def get_gemini_endpoint_base() -> str:
    return _env_str(
        "GEMINI_ENDPOINT_BASE",
        "https://generativelanguage.googleapis.com/v1beta/models",
    )


def get_openai_compatible_endpoint_base() -> str:
    return _env_str(
        "OPENAI_COMPATIBLE_ENDPOINT_BASE",
        "https://api.openai.com/v1/chat/completions",
    )
