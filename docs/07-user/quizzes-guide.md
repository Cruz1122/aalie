# Quizzes Guide

**Tipo:** guía
**Estado:** final
**Audiencia:** estudiante
**Fuente de verdad:** `apps/web/src/app/[locale]/quizzes/`, `apps/web/src/features/quizzes/`, `apps/api/app/quizzes/`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** sección 4.4 (sistema de quizzes)

## Overview

The quiz system lets you test your knowledge of algorithm analysis through structured question sessions. Quizzes are tied to course modules and use a deterministic evaluation backend.

## Accessing Quizzes

| Route | Purpose |
|-------|---------|
| `/{locale}/quizzes` | Quiz dashboard — start new sessions, review past attempts |
| `/{locale}/quizzes/session` | Redirect (passes query params to dashboard) |

From the dashboard, you can also navigate to quizzes from:
- The **course** page: each module may have a "Start Quiz" option.
- The **user guide**: checkpoint sections can link to related quizzes.

## Starting a Quiz Session

1. Go to `/{locale}/quizzes`.
2. Review the dashboard:
   - **Cards**: one per course module with quiz availability.
   - **Recent attempts**: compact list of your past sessions.
   - **Half-roulette wheel**: visual summary of overall accuracy.
3. Click **Start Quiz** on a module card.
4. (Optional) Configure quiz options in the **Start Quiz Modal**:
   - `moduleId`: which module the questions come from.
   - `questionCount`: number of questions (default 5).
   - `topics` / `skills`: filter questions to specific topics or skills.
   - `difficultyMix`: distribution across basic/intermediate/advanced.
5. Click **Start**. The session begins immediately.

If you navigate from the course module page with `?start=1&moduleId=...`, the quiz auto-starts with the module's default settings.

## Question Types

### Single Choice

Select one correct answer from a list of options. Used for:
- Identifying complexity classes
- Choosing the correct method
- Recognizing algorithm properties

### Multiple Choice

Select all correct answers. Used for:
- Identifying multiple valid complexities
- Recognizing all properties of an algorithm
- Selecting all applicable methods

### True / False

Evaluate a statement as true or false. Used for:
- Verifying complexity claims
- Checking understanding of definitions

### Ordering

Arrange items in the correct sequence. Used for:
- Ordering algorithms by growth rate
- Sequencing steps of an analysis procedure
- Ordering recurrence solution steps

### Match Pairs

Connect items from two columns. Used for:
- Matching algorithm names to their complexity
- Matching recurrence forms to solution methods
- Connecting terms to definitions

### Definitions / Concepts

A hybrid type combining definition matching with concept identification. Used for testing terminology understanding.

## Answering Questions

1. Each question appears one at a time.
2. Select your answer(s) using the UI controls:
   - Radio buttons for single choice
   - Checkboxes for multiple choice
   - Toggle for true/false
   - Drag-and-drop or click-to-order for ordering
   - Dropdown or click-to-match for match pairs
3. Navigate between questions using **Previous** / **Next** buttons.
4. A **progress bar** at the top shows how many questions you've completed.
5. You must answer all questions before submitting. Incomplete questions show a warning indicator.

## Submitting Answers

1. After answering all questions, click **Finish** (or **Submit**).
2. The answers are sent to the backend for evaluation.
3. A loading indicator shows while evaluation is in progress (typically 1-3 seconds).

## Understanding Results

After submission, the result screen shows:

### Summary

- **Score**: X out of maxScore (e.g., "7 / 10").
- **Accuracy**: percentage (e.g., "70%").
- **Strengths**: skill areas where you performed well (e.g., "Master Theorem application").
- **Areas to Improve**: skill areas where you made mistakes (e.g., "Characteristic Equation").
- **Emotion icon**: AALIE's face reflects your performance (worried → confused → thinking → focused → curious → happy).

### Review

After the summary, you can review each question:

- **Your answer**: what you selected.
- **Correct answer**: the expected answer.
- **Feedback**: explanation for each option (why it was right or wrong).
- **Score per question**: whether you got it right, wrong, or partial credit (for multiple choice).

Navigate the review with **Previous** / **Next** buttons.

### Finish

Click **Finish** to return to the quiz dashboard. Your results are saved locally.

## Progress Tracking

Progress is stored in the browser using `localStorage` under the key `aalie.quiz.progress.v1`. This includes:

- **Mastery by skill**: a score (0.0 to 1.0) for each skill area, updated after each attempt.
- **Recent question IDs**: the last 50 questions you've seen (to avoid repeats).
- **Weak skill IDs**: skills where you performed poorly (from the most recent attempt).
- **Last failed topic IDs**: topics where you got questions wrong.

**Important**: This is local-only progress. Clearing your browser data or switching devices will reset this data. There is no server-side persistence yet.

### Content Progress

Sections you've studied in the course or user guide are also tracked (`aalie.content.progress.v1`). Quiz progress and content progress are independent.

## Connection to Course Content

Quizzes are linked to course modules through:

- **moduleId**: each quiz is associated with a course module.
- **Topics**: questions are tagged with topic IDs that match course sections.
- **Skills**: questions test specific skills (e.g., "apply_master_theorem", "identify_complexity_class").
- **Difficulty**: questions are tagged as basic, intermediate, or advanced.

This means quiz results reflect your understanding of specific course content. The "areas to improve" list points you back to relevant sections.

## Bank Activation Status

The quiz question bank is bilingual (Spanish and English). The bank exists and the evaluation pipeline works, but:

- The **bank maturity** depends on content curation effort.
- Some modules may have more questions than others.
- Questions are validated against schemas before being loaded.
- The bank is subject to continuous improvement — more questions are added over time.

If a module has no questions available, the dashboard will show an empty state ("No questions available for this module").

## Assistant in Quizzes

After completing a quiz, you can click the **assistant launcher** (floating button in the bottom-right corner) to ask questions about your results, such as:

- "Why was this answer wrong?"
- "Explain the Master Theorem case for question 3."
- "What should I review to improve my score?"

This requires a configured API key. Without it, the assistant is not available.

## Known Limits

- Progress is local-only (browser localStorage). No cross-device sync.
- The question bank size depends on curation. Some modules may have limited questions.
- There is no timed mode — quizzes are self-paced.
- Questions are evaluated deterministically; partial credit is only available for multiple-choice questions.
