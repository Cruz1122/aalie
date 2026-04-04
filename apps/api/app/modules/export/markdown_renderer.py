"""
Markdown renderer for export reports.
"""

from __future__ import annotations

from typing import Dict, List

from .format_utils import to_markdown_inline_math, to_markdown_text_with_inline_math
from .i18n import get_export_i18n
from .models import DocumentModel, DocumentTable
from .trace_diagram import render_trace_diagram_mermaid


def _escape_pipes(value: str) -> str:
    return str(value).replace("|", r"\|")


def _preserve_line_breaks(value: str) -> str:
    return str(value).replace("\n", "  \n")


def _render_table(table: DocumentTable) -> str:
    lines: List[str] = []
    if table.title:
        lines.append(f"**{table.title}**")
    headers = [_escape_pipes(header) for header in table.headers]
    lines.append(f"| {' | '.join(headers)} |")
    align_markers = []
    for index, _header in enumerate(headers):
        align = (
            (table.align or [])[index]
            if table.align and index < len(table.align)
            else "left"
        )
        align_markers.append(
            ":---:" if align == "center" else "---:" if align == "right" else "---"
        )
    lines.append(f"| {' | '.join(align_markers)} |")
    for row in table.rows:
        safe_row = [_escape_pipes(to_markdown_inline_math(str(cell))) for cell in row]
        lines.append(f"| {' | '.join(safe_row)} |")
    return "\n".join(lines)


def _render_institutional_code(block: Dict[str, object]) -> str:
    lines = []
    for line in block.get("lines") or []:
        prefix = (
            f"{line['lineNumber']}: "
            if isinstance(line, dict) and line.get("lineNumber") is not None
            else ""
        )
        lines.append(prefix + str((line or {}).get("text") or ""))
    code_block = "```text\n" + "\n".join(lines) + "\n```"
    title = block.get("title")
    return f"**{title}**\n\n{code_block}" if title else code_block


def _render_status(status: Dict[str, object], i18n: Dict[str, object]) -> str:
    lines = [
        f"> {status.get('label')}",
        f"> {status.get('message') or status.get('status')}",
    ]
    todos = status.get("todos") or []
    if todos:
        lines.append(
            f"> {i18n['todoPrefix']}: {'; '.join(str(todo) for todo in todos)}"
        )
    return "\n".join(lines)


def _render_block(block: Dict[str, object], i18n: Dict[str, object]) -> str:
    kind = block.get("kind")
    if kind == "heading":
        return f"**{block.get('text')}**"
    if kind == "emphasis":
        return f"***{block.get('text')}***"
    if kind == "paragraph":
        return _preserve_line_breaks(
            to_markdown_text_with_inline_math(str(block.get("text") or ""))
        )
    if kind == "list":
        return "\n".join(
            f"- {_preserve_line_breaks(to_markdown_text_with_inline_math(str(item)))}"
            for item in (block.get("items") or [])
        )
    if kind == "subsection":
        return f"### {block.get('title')}"
    if kind == "centeredParagraph":
        return f"<p align=\"center\">{_preserve_line_breaks(to_markdown_text_with_inline_math(str(block.get('text') or '')))}</p>"
    if kind == "code":
        return f"```{block.get('language') or 'text'}\n{block.get('code') or ''}\n```"
    if kind == "institutionalCode":
        return _render_institutional_code(block)
    if kind == "formula":
        label = block.get("label")
        if label:
            return f"**{label}**\n\n$$\n{block.get('formula') or ''}\n$$"
        return f"$$\n{block.get('formula') or ''}\n$$"
    if kind == "pedagogicalStep":
        step = block.get("step") or {}
        parts = [f"**{step.get('index')}. {step.get('title')}**"]
        if step.get("formula"):
            parts.append(f"$$\n{step.get('formula')}\n$$")
        parts.append(
            f"*{_preserve_line_breaks(to_markdown_text_with_inline_math(str(step.get('explanation') or '')))}*"
        )
        if step.get("warning"):
            parts.append(
                f"*Warning: {_preserve_line_breaks(to_markdown_text_with_inline_math(str(step.get('warning') or '')))}*"
            )
        if step.get("supportReason"):
            parts.append(
                f"*Support: {_preserve_line_breaks(to_markdown_text_with_inline_math(str(step.get('supportReason') or '')))}*"
            )
        return "\n\n".join(parts)
    if kind == "table":
        return _render_table(block.get("table"))
    if kind == "keyValue":
        return "\n".join(
            f"- **{entry.get('label')}:** {_preserve_line_breaks(to_markdown_text_with_inline_math(str(entry.get('value') or '')))}"
            for entry in (block.get("entries") or [])
            if isinstance(entry, dict)
        )
    if kind == "executionTraceDiagram":
        diagram = block.get("diagram") or {}
        rendered = render_trace_diagram_mermaid(
            diagram.get("graph") or {},
            summary=diagram.get("summary"),
            diagnostics=diagram.get("diagnostics"),
        )
        lines = [
            f"**{diagram.get('title')}**",
            rendered["mermaid"],
            f"**{i18n['caseHeaderLabel']}:** {i18n['caseLabels'][diagram.get('caseName')]}",
            f"**{i18n['pedagogicalTraceTitle']}:** {rendered['stats']['totalCalls']} {'llamadas' if i18n['locale'] == 'es' else 'calls'}, {'profundidad máxima' if i18n['locale'] == 'es' else 'max depth'} {rendered['stats']['maxDepth']}",
        ]
        if rendered["stats"].get("collapsedNodes") or rendered["stats"].get(
            "reductionNote"
        ):
            lines.append(
                f"**{'Reducción visual' if i18n['locale'] == 'es' else 'Visual reduction'}:** "
                + (
                    rendered["stats"].get("reductionNote")
                    or (
                        f"{rendered['stats']['collapsedNodes']} nodos colapsados"
                        if i18n["locale"] == "es"
                        else f"{rendered['stats']['collapsedNodes']} collapsed nodes"
                    )
                )
            )
        if rendered["stats"].get("truncated"):
            lines.append(
                "> "
                + (
                    "Advertencia: la traza se truncó por límites de ejecución."
                    if i18n["locale"] == "es"
                    else "Warning: trace was truncated by execution limits."
                )
            )
        return "\n\n".join(lines)
    return _render_status(block.get("status") or {}, i18n)


def render_markdown_report(snapshot: Dict[str, object], model: DocumentModel) -> str:
    i18n = get_export_i18n(model.locale)
    hidden_meta = (
        f"<!-- snapshotId: {model.snapshotId}; contentHash: {model.contentHash}; "
        f"analysisId: {model.analysisId} -->"
    )
    front = [f"# {model.title}", "", f"> {model.disclaimer}", "", hidden_meta]
    rendered_sections = []
    for section in model.sections:
        blocks = "\n\n".join(_render_block(block, i18n) for block in section.blocks)
        rendered_sections.append(f"## {section.title}\n\n{blocks}")
    return "\n\n".join(front + rendered_sections) + "\n"
