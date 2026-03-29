from app.modules.export.trace_diagram import (
    _as_number,
    _build_node_text_lines,
    _escape_xml,
    _extract_state_summary,
    _parse_label_parts,
    _wrap_line,
    build_reduction,
    build_trace_diagram_layout,
    compact_label,
    render_trace_diagram_mermaid,
    render_trace_diagram_pdf,
    render_trace_diagram_svg,
    synthesize_return_edges,
)


def _small_graph():
    return {
        "nodes": [
            {
                "id": "root",
                "data": {"label": "f(n)\nestado final: done"},
                "position": {"x": 0, "y": 0},
            },
            {
                "id": "child",
                "data": {"label": "g(n)\n→ ret"},
                "position": {"x": "bad", "y": "7"},
            },
        ],
        "edges": [
            {"id": "e1", "source": "root", "target": "child", "label": "call"},
            {"id": "self", "source": "root", "target": "root", "label": "self"},
        ],
    }


def test_numeric_and_text_helpers_cover_fallback_and_wrapping():
    assert _as_number("4.5") == 4.5
    assert _as_number("NaN", 9.0) == 9.0
    assert _as_number(None, 3.0) == 3.0

    assert _escape_xml('<x "y" & z>') == "&lt;x &quot;y&quot; &amp; z&gt;"
    assert _wrap_line("", 5) == []
    assert _wrap_line("one two three", 7) == ["one two", "three"]

    lines = _build_node_text_lines("alpha beta gamma delta epsilon zeta eta theta iota")
    assert len(lines) >= 1


def test_parse_and_summary_helpers_extract_signature_final_and_return():
    label = "solve(n)\nestado final: n=0\n→ 42"
    parts = _parse_label_parts(label)
    assert parts["signature"] == "solve(n)"
    assert parts["finalState"] == "n=0"
    assert parts["returnValue"] == "42"

    graph = {
        "nodes": [{"id": "n0", "data": {"label": label}}],
        "edges": [],
    }
    assert _extract_state_summary(graph) == {"initial": "solve(n)", "final": "n=0"}


def test_layout_and_mermaid_include_synthetic_return_edges_and_stats():
    graph = _small_graph()

    layout = build_trace_diagram_layout(
        graph,
        {
            "summary": {"totalCalls": 10, "maxRecursionDepth": 5},
            "diagnostics": {"truncated": True},
        },
    )
    mermaid = render_trace_diagram_mermaid(
        graph, summary={"totalCalls": 10}, diagnostics={"truncated": True}
    )

    assert layout["stats"]["totalCalls"] == 10
    assert layout["stats"]["truncated"] is True
    assert any(edge["type"] == "return" for edge in layout["graph"]["edges"])
    assert "flowchart LR" in mermaid["mermaid"]
    assert "-." in mermaid["mermaid"]


def test_reduction_modes_cover_full_compact_and_collapsed_paths():
    nodes_small = [
        {"id": f"n{i}", "data": {"label": "x"}, "position": {"x": 0, "y": 0}}
        for i in range(10)
    ]
    edges_small = [
        {
            "id": f"e{i}",
            "source": f"n{i}",
            "target": f"n{i+1}",
            "type": "smoothstep",
            "label": "",
        }
        for i in range(9)
    ]
    reduced_small = build_reduction(nodes_small, edges_small)
    assert reduced_small["labelMode"] == "full"

    nodes_mid = [
        {
            "id": f"m{i}",
            "data": {"label": "long label" * 20},
            "position": {"x": 0, "y": 0},
        }
        for i in range(30)
    ]
    edges_mid = [
        {
            "id": f"em{i}",
            "source": f"m{i}",
            "target": f"m{i+1}",
            "type": "smoothstep",
            "label": "",
        }
        for i in range(29)
    ]
    reduced_mid = build_reduction(nodes_mid, edges_mid)
    assert reduced_mid["labelMode"] == "compact"
    assert reduced_mid["collapsedNodes"] == 0

    nodes_large = [
        {
            "id": f"l{i}",
            "data": {"label": "line one\nline two"},
            "position": {"x": 0, "y": 0},
        }
        for i in range(70)
    ]
    edges_large = [
        {
            "id": f"el{i}",
            "source": f"l{i}",
            "target": f"l{i+1}",
            "type": "smoothstep",
            "label": "",
        }
        for i in range(69)
    ]
    reduced_large = build_reduction(nodes_large, edges_large)
    assert reduced_large["collapsedNodes"] > 0
    assert reduced_large["labelMode"] == "compact"


def test_svg_and_pdf_renderers_return_expected_outputs():
    graph = _small_graph()

    svg = render_trace_diagram_svg(
        graph,
        title="Recursive Trace",
        case_name="worst",
        locale="es",
        summary={"totalCalls": 2},
        diagnostics={"truncated": True},
    )
    pdf_bytes = render_trace_diagram_pdf(
        graph,
        title="Recursive Trace",
        case_name="worst",
        locale="en",
        summary={"totalCalls": 2},
        diagnostics={"truncated": False},
    )

    assert svg["width"] >= 680
    assert "<svg" in svg["svg"]
    assert "Resumen de ejecución" in svg["svg"]
    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(b"%PDF")


def test_label_compaction_and_return_edge_synthesis_helpers():
    label = compact_label(
        "line-1\nline-2\nline-3\nline-4", max_chars_per_line=6, max_lines=2
    )
    assert "…" in label

    nodes = [
        {"id": "a", "data": {"label": "f"}},
        {"id": "b", "data": {"label": "g\n→ n-1"}},
    ]
    edges = [
        {"id": "ab", "source": "a", "target": "b", "label": "", "type": "smoothstep"}
    ]
    synthetic = synthesize_return_edges(nodes, edges)
    assert synthetic[0]["source"] == "b"
    assert synthetic[0]["target"] == "a"
