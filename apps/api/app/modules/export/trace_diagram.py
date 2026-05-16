"""
Recursive trace diagram layout and renderers.
"""

from __future__ import annotations

import math
import re
from collections import deque
from io import BytesIO
from typing import Any, Dict, List, Optional

from reportlab.lib import colors
from reportlab.pdfgen import canvas


def _as_number(value: Any, fallback: float = 0.0) -> float:
    if isinstance(value, (int, float)) and math.isfinite(value):
        return float(value)
    if isinstance(value, str) and value.strip():
        try:
            parsed = float(value)
        except ValueError:
            return fallback
        return parsed if math.isfinite(parsed) else fallback
    return fallback


def _sanitize_node(node: Dict[str, Any]) -> Dict[str, Any]:
    data = node.get("data") if isinstance(node.get("data"), dict) else {}
    return {
        "id": str(node.get("id")),
        "type": str(node.get("type") or "default"),
        "position": {
            "x": _as_number((node.get("position") or {}).get("x"), 0.0),
            "y": _as_number((node.get("position") or {}).get("y"), 0.0),
        },
        "data": {
            "label": str(data.get("label") or node.get("id")),
            "microseconds": (
                data.get("microseconds")
                if isinstance(data.get("microseconds"), (int, float))
                else None
            ),
            "tokens": (
                data.get("tokens") if isinstance(data.get("tokens"), (int, float)) else None
            ),
        },
        "parentId": (node.get("parentId") if isinstance(node.get("parentId"), str) else None),
    }


def _sanitize_edge(edge: Dict[str, Any], index: int) -> Dict[str, Any]:
    raw_type = str(edge.get("type") or "smoothstep")
    label = str(edge.get("label") or "")
    edge_id = str(edge.get("id") or f"edge_{index}")
    if raw_type != "return" and (
        label.strip().lower() == "return"
        or edge_id.startswith("e_ret_")
        or edge_id.startswith("return_")
    ):
        raw_type = "return"
    return {
        "id": edge_id,
        "source": str(edge.get("source")),
        "target": str(edge.get("target")),
        "label": label,
        "type": raw_type,
    }


def _detect_roots(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> List[str]:
    incoming = {node["id"]: 0 for node in nodes}
    for edge in edges:
        incoming[edge["target"]] = incoming.get(edge["target"], 0) + 1
    roots = sorted(node_id for node_id, degree in incoming.items() if degree == 0)
    return roots or sorted(node["id"] for node in nodes)[:1]


def build_depth_index(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> Dict[str, int]:
    by_source: Dict[str, List[str]] = {}
    for edge in edges:
        if edge.get("type") == "return":
            continue
        by_source.setdefault(edge["source"], []).append(edge["target"])
    for children in by_source.values():
        children.sort()
    depth: Dict[str, int] = {}
    queue = deque((root, 0) for root in _detect_roots(nodes, edges))
    for node_id, value in queue:
        depth[node_id] = value
    while queue:
        node_id, current_depth = queue.popleft()
        for child in by_source.get(node_id, []):
            next_depth = current_depth + 1
            known = depth.get(child)
            if known is None or next_depth < known:
                depth[child] = next_depth
                queue.append((child, next_depth))
    for node in nodes:
        depth.setdefault(node["id"], 0)
    return depth


def compact_label(label: str, max_chars_per_line: int, max_lines: int) -> str:
    compacted: List[str] = []
    for raw_line in str(label or "").split("\n"):
        line = raw_line.strip()
        if not line:
            continue
        if len(line) <= max_chars_per_line:
            compacted.append(line)
        else:
            compacted.append(f"{line[: max(1, max_chars_per_line - 1)]}…")
    if not compacted:
        return "call"
    if len(compacted) <= max_lines:
        return "\n".join(compacted)
    return "\n".join(compacted[: max(1, max_lines - 1)] + ["…"])


def synthesize_return_edges(
    nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    node_by_id = {node["id"]: node for node in nodes}
    synthetic: List[Dict[str, Any]] = []
    for edge in edges:
        child = node_by_id.get(edge["target"])
        label = str((((child or {}).get("data") or {}).get("label")) or "")
        match = re.search(r"(?:\n|^)→\s*(.+?)(?:\n|$)", label)
        if not match:
            continue
        synthetic.append(
            {
                "id": f"return_{edge['target']}_to_{edge['source']}",
                "source": edge["target"],
                "target": edge["source"],
                "label": (match.group(1) or "").strip() or "ret",
                "type": "return",
            }
        )
    return synthetic


def build_reduction(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> Dict[str, Any]:
    count = len(nodes)
    if count <= 25:
        return {
            "nodes": nodes,
            "edges": edges,
            "labelMode": "full",
            "collapsedNodes": 0,
        }
    if count <= 60:
        return {
            "nodes": [
                {
                    **node,
                    "data": {
                        **node["data"],
                        "label": compact_label(node["data"].get("label") or "", 54, 3),
                    },
                }
                for node in nodes
            ],
            "edges": edges,
            "labelMode": "compact",
            "collapsedNodes": 0,
            "reductionNote": "Render completo con etiquetas compactas por volumen de nodos.",
        }
    depth_index = build_depth_index(nodes, edges)
    max_visible_depth = 4
    visible_ids = {node_id for node_id, depth in depth_index.items() if depth <= max_visible_depth}
    reduced_nodes = [
        {
            **node,
            "data": {
                **node["data"],
                "label": compact_label(node["data"].get("label") or "", 48, 3),
            },
        }
        for node in nodes
        if node["id"] in visible_ids
    ]
    reduced_edges = [
        edge for edge in edges if edge["source"] in visible_ids and edge["target"] in visible_ids
    ]
    collapsed_nodes = max(0, len(nodes) - len(reduced_nodes))
    reduction_note = (
        f"Se colapsaron {collapsed_nodes} nodos por límite de profundidad visible (>{max_visible_depth})."
        if collapsed_nodes > 0
        else None
    )
    return {
        "nodes": reduced_nodes,
        "edges": reduced_edges,
        "labelMode": "compact",
        "collapsedNodes": collapsed_nodes,
        "reductionNote": reduction_note,
    }


def _tree_layout(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> Dict[str, Any]:
    depth_index = build_depth_index(nodes, edges)
    by_source: Dict[str, List[str]] = {}
    for edge in edges:
        if edge["type"] == "return":
            continue
        by_source.setdefault(edge["source"], []).append(edge["target"])
    for children in by_source.values():
        children.sort()
    roots = _detect_roots(nodes, [edge for edge in edges if edge["type"] != "return"])
    order: List[str] = []

    def visit(node_id: str) -> None:
        order.append(node_id)
        for child in by_source.get(node_id, []):
            visit(child)

    for root in roots:
        visit(root)
    ordered_nodes = sorted(
        nodes,
        key=lambda node: (
            depth_index.get(node["id"], 0),
            order.index(node["id"]) if node["id"] in order else 10**6,
            node["id"],
        ),
    )
    siblings_by_depth: Dict[int, List[Dict[str, Any]]] = {}
    for node in ordered_nodes:
        siblings_by_depth.setdefault(depth_index[node["id"]], []).append(node)

    node_width = 300
    node_height = 108
    nodesep = 120
    ranksep = 170
    margin = 30

    positioned: List[Dict[str, Any]] = []
    max_x = 0.0
    max_y = 0.0
    for depth, depth_nodes in sorted(siblings_by_depth.items()):
        for index, node in enumerate(depth_nodes):
            x = margin + depth * (node_width + ranksep)
            y = margin + index * (node_height + nodesep)
            positioned.append({**node, "position": {"x": x, "y": y}})
            max_x = max(max_x, x + node_width)
            max_y = max(max_y, y + node_height)
    return {
        "nodes": sorted(positioned, key=lambda node: node["id"]),
        "width": math.ceil(max_x + 40),
        "height": math.ceil(max_y + 80),
    }


def build_trace_diagram_layout(
    input_graph: Dict[str, Any], options: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    options = options or {}
    nodes = sorted(
        (
            _sanitize_node(node)
            for node in (input_graph.get("nodes") or [])
            if isinstance(node, dict)
        ),
        key=lambda node: node["id"],
    )
    edges = sorted(
        (
            _sanitize_edge(edge, index)
            for index, edge in enumerate(input_graph.get("edges") or [])
            if isinstance(edge, dict)
        ),
        key=lambda edge: edge["id"],
    )
    edges = [edge for edge in edges if edge["source"] and edge["target"]]
    reduction = build_reduction(nodes, edges)
    with_return_edges = reduction["edges"] + synthesize_return_edges(
        reduction["nodes"], reduction["edges"]
    )
    layouted = _tree_layout(reduction["nodes"], with_return_edges)
    depth_index = build_depth_index(layouted["nodes"], with_return_edges)
    summary = options.get("summary") or {}
    diagnostics = options.get("diagnostics") or {}
    max_depth = max(
        int(_as_number(summary.get("maxRecursionDepth"), 0)),
        *(depth_index.values() or [0]),
    )
    return {
        "graph": {"nodes": layouted["nodes"], "edges": with_return_edges},
        "width": layouted["width"],
        "height": layouted["height"],
        "stats": {
            "totalCalls": int(_as_number(summary.get("totalCalls"), len(layouted["nodes"]))),
            "maxDepth": max_depth,
            "totalEdges": len(with_return_edges),
            "truncated": bool(diagnostics.get("truncated")),
            "labelMode": reduction["labelMode"],
            "collapsedNodes": reduction["collapsedNodes"],
            "renderNodeCount": len(layouted["nodes"]),
            "reductionNote": reduction.get("reductionNote"),
        },
    }


def render_trace_diagram_mermaid(
    graph: Dict[str, Any],
    summary: Optional[Dict[str, Any]] = None,
    diagnostics: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    layouted = build_trace_diagram_layout(
        graph,
        {"summary": summary or {}, "diagnostics": diagnostics or {}},
    )

    def sanitize_id(node_id: str) -> str:
        clean = re.sub(r"[^A-Za-z0-9_]", "_", node_id)
        if re.match(r"^[0-9]", clean):
            return f"n_{clean}"
        return clean or "n_unknown"

    def escape_label(label: str) -> str:
        return str(label).replace('"', "'").replace("\n", "<br/>")

    node_lines = [
        f'  {sanitize_id(node["id"])}["{escape_label(node["data"].get("label") or node["id"])}"]'
        for node in layouted["graph"]["nodes"]
    ]
    edge_lines = []
    for edge in layouted["graph"]["edges"]:
        if edge["source"] == edge["target"]:
            continue
        source = sanitize_id(edge["source"])
        target = sanitize_id(edge["target"])
        label = str(edge.get("label") or "").strip()
        if edge["type"] == "return":
            edge_lines.append(
                f'  {source} -. "{escape_label(label)}" .-> {target}'
                if label
                else f"  {source} -.-> {target}"
            )
        else:
            edge_lines.append(
                f'  {source} -- "{escape_label(label)}" --> {target}'
                if label
                else f"  {source} --> {target}"
            )
    mermaid = "\n".join(["```mermaid", "flowchart LR", *node_lines, *edge_lines, "```"])
    return {
        "mermaid": mermaid,
        "stats": {
            "totalCalls": layouted["stats"]["totalCalls"],
            "maxDepth": layouted["stats"]["maxDepth"],
            "truncated": layouted["stats"]["truncated"],
            "collapsedNodes": layouted["stats"]["collapsedNodes"],
            "renderNodeCount": layouted["stats"]["renderNodeCount"],
            "reductionNote": layouted["stats"].get("reductionNote"),
        },
    }


def _escape_xml(text: str) -> str:
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


def _wrap_line(line: str, max_chars: int) -> List[str]:
    text = str(line).strip()
    if not text:
        return []
    if len(text) <= max_chars:
        return [text]
    words = text.split()
    lines: List[str] = []
    current = ""
    for word in words:
        if not current:
            current = word
            continue
        if len(current + " " + word) <= max_chars:
            current = current + " " + word
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def _build_node_text_lines(label: str) -> List[str]:
    base_lines = [line.strip() for line in str(label).split("\n") if line.strip()]
    wrapped: List[str] = []
    for line in base_lines:
        wrapped.extend(_wrap_line(line, 30))
    if len(wrapped) <= 5:
        return wrapped
    clipped = wrapped[:5]
    clipped[4] = clipped[4][:27] + "..."
    return clipped


def _parse_label_parts(label: str) -> Dict[str, str]:
    lines = [line.strip() for line in str(label).split("\n") if line.strip()]
    signature = lines[0] if lines else ""
    final_line = next(
        (line for line in lines if re.match(r"^(estado final|final)\s*:", line, re.I)),
        "",
    )
    return_line = next((line for line in lines if line.startswith("→")), "")
    return {
        "signature": signature,
        "finalState": re.sub(r"^(estado final|final)\s*:\s*", "", final_line, flags=re.I).strip(),
        "returnValue": re.sub(r"^→\s*", "", return_line).strip(),
    }


def _extract_state_summary(graph: Dict[str, Any]) -> Dict[str, str]:
    nodes = graph.get("nodes") or []
    edges = graph.get("edges") or []
    incoming = {node["id"]: 0 for node in nodes}
    for edge in edges:
        incoming[edge["target"]] = incoming.get(edge["target"], 0) + 1
    roots = [node for node in nodes if incoming.get(node["id"], 0) == 0]
    ordered = sorted((roots or nodes), key=lambda node: node["id"])
    if not ordered:
        return {"initial": "N/A", "final": "N/A"}
    parts = _parse_label_parts((((ordered[0] or {}).get("data") or {}).get("label")) or "")
    return {
        "initial": parts["signature"] or "N/A",
        "final": parts["finalState"] or parts["returnValue"] or "N/A",
    }


def render_trace_diagram_svg(
    graph: Dict[str, Any],
    *,
    title: str,
    case_name: str,
    locale: str = "en",
    summary: Optional[Dict[str, Any]] = None,
    diagnostics: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    layouted = build_trace_diagram_layout(
        graph,
        {"summary": summary or {}, "diagnostics": diagnostics or {}},
    )
    node_width = 300
    node_height = 108
    footer_height = 198
    width = max(680, int(layouted["width"]))
    height = max(260, int(layouted["height"])) + footer_height
    node_index = {node["id"]: node for node in layouted["graph"]["nodes"]}
    edges_svg: List[str] = []
    for edge in layouted["graph"]["edges"]:
        source = node_index.get(edge["source"])
        target = node_index.get(edge["target"])
        if not source or not target:
            continue
        is_return = edge["type"] == "return"
        x1 = source["position"]["x"] + (node_width / 2 if is_return else node_width)
        y1 = source["position"]["y"] + (10 if is_return else node_height / 2)
        x2 = target["position"]["x"] + node_width / 2 if is_return else target["position"]["x"]
        y2 = target["position"]["y"] + (10 if is_return else node_height / 2)
        mx = (x1 + x2) / 2
        arch_lift = max(56, abs(x2 - x1) * 0.12) if is_return else 0
        c1y = y1 - arch_lift if is_return else y1
        c2y = y2 - arch_lift if is_return else y2
        path = f"M {x1} {y1} C {mx} {c1y}, {mx} {c2y}, {x2} {y2}"
        label = str(edge.get("label") or "").strip()
        if not label and is_return:
            label = _parse_label_parts((source["data"] or {}).get("label") or "")["returnValue"]
        label_y = max(32, min(c1y, c2y) - 8 if is_return else (y1 + y2) / 2 - 8)
        label_svg = (
            f'<text x="{mx}" y="{label_y}" text-anchor="middle" font-size="14" font-weight="600" fill="#0f172a">{_escape_xml(label)}</text>'
            if label
            else ""
        )
        edges_svg.append(
            f'<path d="{path}" fill="none" stroke="{"#b45309" if is_return else "#0f172a"}" stroke-width="{"2.2" if is_return else "1.9"}" stroke-dasharray="{"6 4" if is_return else ""}" marker-end="url(#arrowhead)" />\n{label_svg}'
        )
    nodes_svg: List[str] = []
    for node in layouted["graph"]["nodes"]:
        x = node["position"]["x"]
        y = node["position"]["y"]
        tspans = "\n".join(
            f'<tspan x="{x + node_width / 2}" y="{y + 34 + index * 19}" text-anchor="middle">{_escape_xml(line)}</tspan>'
            for index, line in enumerate(
                _build_node_text_lines((node["data"] or {}).get("label") or node["id"])
            )
        )
        nodes_svg.append(
            f'<rect x="{x}" y="{y}" width="{node_width}" height="{node_height}" rx="14" ry="14" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5" />\n'
            f'<text font-family="Helvetica, Arial, sans-serif" font-size="14" fill="#0f172a">{tspans}</text>'
        )
    state_summary = _extract_state_summary(layouted["graph"])
    footer_note = (
        "Advertencia: el trace original fue truncado."
        if locale == "es" and layouted["stats"]["truncated"]
        else (
            "Warning: the original trace was truncated."
            if layouted["stats"]["truncated"]
            else layouted["stats"].get("reductionNote") or ""
        )
    )
    footer_title = "Resumen de ejecución" if locale == "es" else "Execution summary"
    footer = f"""
  <rect x="24" y="{height - footer_height + 16}" width="{max(520, width - 48)}" height="168" rx="14" ry="14" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.2" />
  <text x="40" y="{height - footer_height + 44}" font-size="18" font-weight="700" fill="#0f172a">{_escape_xml(footer_title)}</text>
  <text x="40" y="{height - footer_height + 76}" font-size="15" fill="#1e293b">{_escape_xml(('Caso' if locale == 'es' else 'Case') + ': ' + case_name)}</text>
  <text x="40" y="{height - footer_height + 100}" font-size="15" fill="#1e293b">{_escape_xml(('Llamadas' if locale == 'es' else 'Calls') + ': ' + str(layouted['stats']['totalCalls']) + ' | ' + ('Profundidad' if locale == 'es' else 'Depth') + ': ' + str(layouted['stats']['maxDepth']) + ' | ' + ('Nodos visibles' if locale == 'es' else 'Visible nodes') + ': ' + str(layouted['stats']['renderNodeCount']))}</text>
  <text x="40" y="{height - footer_height + 126}" font-size="14.5" fill="#0f172a" font-weight="600">{_escape_xml('Estado inicial' if locale == 'es' else 'Initial state')}</text>
  <text x="40" y="{height - footer_height + 148}" font-size="14" fill="#334155">{_escape_xml(state_summary['initial'])}</text>
  <text x="{24 + max(520, width - 48) * 0.53}" y="{height - footer_height + 126}" font-size="14.5" fill="#0f172a" font-weight="600">{_escape_xml('Estado final' if locale == 'es' else 'Final state')}</text>
  <text x="{24 + max(520, width - 48) * 0.53}" y="{height - footer_height + 148}" font-size="14" fill="#334155">{_escape_xml(state_summary['final'])}</text>
  <text x="40" y="{height - footer_height + 174}" font-size="13.5" fill="#7c2d12">{_escape_xml(footer_note)}</text>
"""
    svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#334155" />
    </marker>
  </defs>
  <rect x="0" y="0" width="{width}" height="{height}" fill="#ffffff" />
  <text x="24" y="30" font-family="Helvetica, Arial, sans-serif" font-size="18" font-weight="700" fill="#0f172a">{_escape_xml(title)}</text>
  <g transform="translate(0, 16)">
{chr(10).join(edges_svg)}
{chr(10).join(nodes_svg)}
  </g>
{footer}
</svg>"""
    return {
        "svg": svg,
        "width": width,
        "height": height,
        "stats": {
            "totalCalls": layouted["stats"]["totalCalls"],
            "maxDepth": layouted["stats"]["maxDepth"],
            "truncated": layouted["stats"]["truncated"],
            "collapsedNodes": layouted["stats"]["collapsedNodes"],
            "renderNodeCount": layouted["stats"]["renderNodeCount"],
            "reductionNote": layouted["stats"].get("reductionNote"),
        },
    }


def render_trace_diagram_pdf(
    graph: Dict[str, Any],
    *,
    title: str,
    case_name: str,
    locale: str = "en",
    summary: Optional[Dict[str, Any]] = None,
    diagnostics: Optional[Dict[str, Any]] = None,
) -> bytes:
    layouted = build_trace_diagram_layout(
        graph,
        {"summary": summary or {}, "diagnostics": diagnostics or {}},
    )
    node_width = 300
    node_height = 108
    footer_height = 198
    width = max(680, int(layouted["width"]))
    height = max(260, int(layouted["height"])) + footer_height
    buffer = BytesIO()
    # Preserve the real canvas size for wide recursion traces. Using portrait()
    # swaps width/height when width > height and clips horizontal content.
    pdf = canvas.Canvas(buffer, pagesize=(width, height))
    pdf.setTitle("AALIE Recursive Trace Diagram")
    pdf.setCreator("AALIE Export Backend")
    pdf.setLineJoin(1)
    pdf.setLineCap(1)
    pdf.setStrokeColor(colors.HexColor("#334155"))
    pdf.setFillColor(colors.white)
    pdf.rect(0, 0, width, height, stroke=0, fill=1)
    pdf.setFillColor(colors.HexColor("#0f172a"))
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(24, height - 30, title)

    node_index = {node["id"]: node for node in layouted["graph"]["nodes"]}
    for edge in layouted["graph"]["edges"]:
        source = node_index.get(edge["source"])
        target = node_index.get(edge["target"])
        if not source or not target:
            continue
        is_return = edge["type"] == "return"
        x1 = source["position"]["x"] + (node_width / 2 if is_return else node_width)
        y1 = height - 16 - (source["position"]["y"] + (10 if is_return else node_height / 2))
        x2 = target["position"]["x"] + (node_width / 2 if is_return else 0)
        y2 = height - 16 - (target["position"]["y"] + (10 if is_return else node_height / 2))
        mx = (x1 + x2) / 2
        arch_lift = max(56, abs(x2 - x1) * 0.12) if is_return else 0
        c1y = y1 + arch_lift if is_return else y1
        c2y = y2 + arch_lift if is_return else y2
        path = pdf.beginPath()
        path.moveTo(x1, y1)
        path.curveTo(mx, c1y, mx, c2y, x2, y2)
        pdf.setStrokeColor(colors.HexColor("#b45309" if is_return else "#0f172a"))
        if is_return:
            pdf.setDash(6, 4)
            pdf.setLineWidth(2.2)
        else:
            pdf.setDash()
            pdf.setLineWidth(1.9)
        pdf.drawPath(path, stroke=1, fill=0)
        label = str(edge.get("label") or "").strip()
        if not label and is_return:
            label = _parse_label_parts((source["data"] or {}).get("label") or "")["returnValue"]
        if label:
            pdf.setDash()
            pdf.setFillColor(colors.HexColor("#0f172a"))
            pdf.setFont("Helvetica-Bold", 14)
            pdf.drawCentredString(
                mx,
                max(32, min(c1y, c2y) + 8 if is_return else (y1 + y2) / 2 + 8),
                label,
            )
    pdf.setDash()
    for node in layouted["graph"]["nodes"]:
        x = node["position"]["x"]
        y = height - 16 - node["position"]["y"] - node_height
        pdf.setStrokeColor(colors.HexColor("#1e293b"))
        pdf.setFillColor(colors.HexColor("#f8fafc"))
        pdf.roundRect(x, y, node_width, node_height, 14, stroke=1, fill=1)
        pdf.setFillColor(colors.HexColor("#0f172a"))
        pdf.setFont("Helvetica", 14)
        for index, line in enumerate(
            _build_node_text_lines((node["data"] or {}).get("label") or node["id"])
        ):
            pdf.drawCentredString(x + node_width / 2, y + node_height - 32 - index * 18, line)
    panel_width = max(520, width - 48)
    panel_y = 16
    pdf.setFillColor(colors.HexColor("#f8fafc"))
    pdf.setStrokeColor(colors.HexColor("#94a3b8"))
    pdf.roundRect(24, panel_y, panel_width, 168, 14, stroke=1, fill=1)
    state_summary = _extract_state_summary(layouted["graph"])
    footer_note = (
        "Advertencia: el trace original fue truncado."
        if locale == "es" and layouted["stats"]["truncated"]
        else (
            "Warning: the original trace was truncated."
            if layouted["stats"]["truncated"]
            else layouted["stats"].get("reductionNote") or ""
        )
    )
    pdf.setFillColor(colors.HexColor("#0f172a"))
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(
        40,
        panel_y + 140,
        "Resumen de ejecución" if locale == "es" else "Execution summary",
    )
    pdf.setFont("Helvetica", 15)
    pdf.setFillColor(colors.HexColor("#1e293b"))
    pdf.drawString(40, panel_y + 108, f"{'Caso' if locale == 'es' else 'Case'}: {case_name}")
    pdf.drawString(
        40,
        panel_y + 84,
        f"{'Llamadas' if locale == 'es' else 'Calls'}: {layouted['stats']['totalCalls']} | "
        f"{'Profundidad' if locale == 'es' else 'Depth'}: {layouted['stats']['maxDepth']} | "
        f"{'Nodos visibles' if locale == 'es' else 'Visible nodes'}: {layouted['stats']['renderNodeCount']}",
    )
    pdf.setFillColor(colors.HexColor("#0f172a"))
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(40, panel_y + 58, "Estado inicial" if locale == "es" else "Initial state")
    pdf.drawString(
        24 + panel_width * 0.53,
        panel_y + 58,
        "Estado final" if locale == "es" else "Final state",
    )
    pdf.setFillColor(colors.HexColor("#334155"))
    pdf.setFont("Helvetica", 14)
    pdf.drawString(40, panel_y + 36, state_summary["initial"])
    pdf.drawString(24 + panel_width * 0.53, panel_y + 36, state_summary["final"])
    if footer_note:
        pdf.setFillColor(colors.HexColor("#7c2d12"))
        pdf.setFont("Helvetica", 13)
        pdf.drawString(40, panel_y + 14, footer_note[:120])
    pdf.showPage()
    pdf.save()
    return buffer.getvalue()
