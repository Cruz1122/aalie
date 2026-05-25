from __future__ import annotations

import json

from benchmarks.run_pipeline_benchmark import render_markdown as render_pipeline_markdown
from benchmarks.run_pipeline_benchmark import theta_matches
from benchmarks.run_trace_benchmark import render_markdown as render_trace_markdown


def test_theta_matches_supports_canonical_cases() -> None:
    assert theta_matches("\\Theta(n)", "\\Theta(n)")
    assert theta_matches("\\Theta(n \\log n)", "\\Theta(n \\log n)")
    assert theta_matches("\\Theta(\\log n)", "\\Theta(\\log(n))")
    assert theta_matches("No concluyente", "")


def test_pipeline_markdown_includes_expected_columns() -> None:
    markdown = render_pipeline_markdown([
        {
            "caseName": "FOR lineal",
            "family": "Iterativo",
            "symbolicSize": "n=1000",
            "parseMsMedian": 1.0,
            "classifyMsMedian": 2.0,
            "analyzeMsMedian": 3.0,
            "analyzeSharePctMedian": 50.0,
            "totalMsMedian": 6.0,
            "totalMsP95": 7.0,
            "expectedTheta": "\\Theta(n)",
            "obtainedTheta": "\\Theta(n)",
            "status": "OK",
        }
    ])
    assert "| Caso | Familia | Tamaño simbolico |" in markdown
    assert "FOR lineal" in markdown


def test_trace_markdown_includes_expected_columns() -> None:
    markdown = render_trace_markdown([
        {
            "caseName": "Factorial",
            "family": "Recursivo lineal",
            "inputSize": 8,
            "traceCase": "worst",
            "traceMsMedian": 12.0,
            "traceMsP95": 14.0,
            "stepCountMedian": 20,
            "algorithmKind": "recursive",
            "status": "OK",
        }
    ])
    assert "| Caso | Familia | inputSize | Case |" in markdown
    assert "Factorial" in markdown


def test_generate_outputs_write_json_and_markdown(monkeypatch, tmp_path) -> None:
    monkeypatch.setenv("AALIE_BENCH_WARMUP", "1")
    monkeypatch.setenv("AALIE_BENCH_RUNS", "1")

    import benchmarks.run_pipeline_benchmark as pipeline
    import benchmarks.run_trace_benchmark as trace

    monkeypatch.setattr(pipeline, "WARMUP_RUNS", 1)
    monkeypatch.setattr(pipeline, "MEASURED_RUNS", 1)
    monkeypatch.setattr(pipeline, "OUTPUT_JSON", tmp_path / "benchmark-results.json")
    monkeypatch.setattr(pipeline, "OUTPUT_MD", tmp_path / "benchmark-results.md")

    monkeypatch.setattr(trace, "WARMUP_RUNS", 1)
    monkeypatch.setattr(trace, "MEASURED_RUNS", 1)
    monkeypatch.setattr(trace, "OUTPUT_JSON", tmp_path / "trace-benchmark-results.json")
    monkeypatch.setattr(trace, "OUTPUT_MD", tmp_path / "trace-benchmark-results.md")

    pipeline_output = pipeline.generate_outputs()
    trace_output = trace.generate_outputs()

    assert pipeline_output["results"]
    assert trace_output["results"]
    assert len(pipeline_output["results"]) >= 14
    assert len(trace_output["results"]) >= 4
    assert json.loads((tmp_path / "benchmark-results.json").read_text(encoding="utf-8"))["results"]
    assert json.loads((tmp_path / "trace-benchmark-results.json").read_text(encoding="utf-8"))["results"]
