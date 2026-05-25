# Assistant Guide

**Tipo:** guía
**Estado:** final
**Audiencia:** estudiante
**Fuente de verdad:** `apps/web/src/components/assistant/`, `apps/web/src/lib/assistant/`, `apps/api/app/llm/`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** sección 3.7 (asistente LLM)

## Overview

The LLM assistant is an optional feature that provides contextual help within the application. It can explain analysis results, compare outputs, help repair pseudocode, and guide you through the interface. The assistant is **not** the source of truth — the deterministic analysis engine is.

## What the Assistant Can Do

### Explain

Ask the assistant to explain any visible analysis result:
- "What does T(n) = 3n + 5 mean?"
- "Why is the by-line cost for line 7 so high?"
- "Explain the Master Theorem applied here."
- "What does Θ(n log n) mean in practice?"

The assistant uses the current context (visible modal, selected line, active case) to tailor its explanation.

### Compare

After running an analysis, you can click **Compare with LLM** (requires API key). The assistant:
1. Receives your analysis results.
2. Analyzes the same algorithm independently.
3. Returns its own complexity assessment.
4. Provides a brief comparison note: where the results agree or differ.

The comparison is pedagogical — it helps you think about algorithm analysis critically.

### Repair

If you import a `.txt` file with syntax errors, the assistant can help fix them:
1. Import the `.txt` file.
2. If parsing fails, a **Repair** button appears in the import modal.
3. Click **Repair** to send the broken code to the LLM.
4. The assistant returns a corrected version.
5. Review the changes and load the repaired code.

**Warning**: Always verify the repaired code manually. The LLM may introduce logical errors even while fixing syntax.

### Guide

The assistant understands the current page and view context:
- On the **analyzer**: knows which case (worst/best/avg) is visible, the selected line, and the analysis method.
- In **quizzes**: knows the quiz results, which question you're reviewing, and your answers.
- In the **course**: knows which module and section you're viewing.

Examples:
- "What should I do next?" → based on the current view.
- "What does this button do?" → based on the active panel.

## How to Use the Assistant

### Launcher

The assistant is accessed via a **floating launcher button** in the bottom-right corner of most pages:
- Analyzer page
- Quizzes page (after completing a quiz)
- Course pages
- Examples pages

Click the button to open a chat panel. Type your question and press Enter.

### Context-Aware Responses

The assistant automatically includes context from:
- **Analyzer page**: visible case, selected line, algorithm type, method used.
- **Quizzes**: current question (in review), score summary.
- **Course**: current module and section.
- **Examples**: which example is loaded or being viewed.

Ambiguous questions like "what is this?" or "what happened here?" are resolved using the current context.

### Follow-Up Questions

The assistant maintains conversation context within the current session. It remembers:
- The current analysis parameters (case, `n`, initial variables).
- Previous questions and answers within the same chat.
- The active view and panel.

This allows natural follow-ups like "And what about the best case?" without re-specifying the algorithm.

## Requirements

| Requirement | Details |
|-------------|---------|
| API Key | The backend must have a valid API key configured for the LLM provider |
| Backend | The API must be running and accessible |
| Provider | Currently configured for Google Gemini (configurable via environment variables) |
| Network | The backend must have outbound internet access to the LLM provider |

### Without API Key

- The assistant launcher is **hidden** from most pages.
- The **Compare with LLM** button does not appear.
- The **Repair** option in TXT import is not shown.
- **All deterministic features** work normally: analysis, trace, export, quizzes, course content.
- The application never attempts to contact external services without a key.

## Limitations

| Limitation | Explanation |
|------------|-------------|
| **Not source of truth** | The LLM can make mistakes. Always trust the deterministic analysis engine for formal results. |
| **Availability** | Depends on the LLM provider's uptime and the backend's network connectivity. |
| **Latency** | Responses can take 5–30 seconds depending on the request complexity and provider. |
| **Context window** | Very long conversations or large algorithms may exceed the model's context limit. |
| **Model differences** | Different models may produce different analyses. The configured model affects quality. |
| **No offline mode** | The assistant requires network access to the LLM provider. |

## Privacy Note

When you use the assistant:

1. Your pseudocode and analysis results are sent to the backend.
2. The backend sends them to the configured LLM provider (e.g., Google Gemini).
3. The provider processes and stores the data according to their privacy policy.
4. The application does not store LLM responses beyond the current session.

**Do not use the assistant with proprietary or sensitive code** if you are concerned about data leaving your environment. The analysis engine itself is fully local/deterministic and does not send data externally.

## Configuration (for Administrators)

The LLM provider is configured via environment variables:

| Variable | Purpose |
|----------|---------|
| `API_KEY` | API key for the LLM provider |
| `GEMINI_ENDPOINT_BASE` | Base URL for the Gemini API |
| `LLM_MODEL_GENERAL` | Model for general chat (default: gemini-2.5-pro) |
| `LLM_MODEL_REPAIR` | Model for repair tasks |
| `LLM_MODEL_COMPARE` | Model for comparison tasks |

These must be set before starting the backend for the assistant to function.

## Known Limits

- The assistant's explanations are generated by an LLM and may contain inaccuracies.
- The assistant does not have access to the full codebase or documentation — only the current context.
- Very complex or ambiguous questions may produce vague responses.
- The repair feature may not fix all syntax errors correctly. Manual review is required.
