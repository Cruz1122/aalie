# LLM40 Comparison

LLM40 is a balanced 40-case subset derived from the 80-oracle dataset. It is designed to
compare AALIE against a direct LLM baseline over representative algorithmic families:
iterative algorithms, recursive algorithms, WHILE loops, expected unsupported cases,
parser-negative cases, and selected known gaps.

This folder does not replace `apps/api/tests/oracles/`. It uses the oracle dataset as the
source of truth and produces comparable artifacts:

- `llm40_index.json` — selected cases with metadata and gold targets.
- `llm40_prompt_dataset.jsonl` — prompt-only dataset with minimal metadata, safe to send to an LLM.
- `llm40_gold.jsonl` — expected answers, isolated from the prompt dataset.
- `out/aalie40_outputs.jsonl` — normalized AALIE outputs.
- `out/aalie40_results.csv` — AALIE baseline results.
- `out/aalie40_summary.json` — balanced benchmark summary metrics.

Gold targets remain isolated from the prompt dataset and are used only for automatic scoring.

## Scoring report

To score direct LLM outputs against gold and compare them with the AALIE baseline:

`python tests/llm_comparison/score_llm40_outputs.py --llm-jsonl tests/llm_comparison/models/gpt_5_5_extended_thinking/llm40_llm_outputs.jsonl --gold-jsonl tests/llm_comparison/llm40_gold.jsonl --aalie-csv tests/llm_comparison/out/aalie40_results.csv --out-md tests/llm_comparison/out/models/gpt_5_5_extended_thinking/llm40_aalie_vs_llm_report.md --out-csv tests/llm_comparison/out/models/gpt_5_5_extended_thinking/llm40_results.csv --out-json tests/llm_comparison/out/models/gpt_5_5_extended_thinking/llm40_summary.json --model-id gpt_5_5_extended_thinking --model-name "GPT-5.5 Extended Thinking" --provider OpenAI`

The scorer is deterministic:

- gold is the source of truth
- AALIE is scored against gold
- the direct LLM is scored against gold
- the final comparison uses the same metrics for both systems

## Multi-model comparison

The benchmark currently compares AALIE against:

- GPT-5.5 Extended Thinking
- Gemini 3.1 Pro High
- Claude Opus 4.7 XHigh

DeepSeekMath-V2 is not included in the current run.

Run the consolidated multi-model comparison with:

`python tests/llm_comparison/score_all_llm40_models.py --models-json tests/llm_comparison/llm40_models.json --gold-jsonl tests/llm_comparison/llm40_gold.jsonl --aalie-csv tests/llm_comparison/out/aalie40_results.csv --index-json tests/llm_comparison/llm40_index.json --out-dir tests/llm_comparison/out`
