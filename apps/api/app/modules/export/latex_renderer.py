"""
LaTeX renderer for export reports.
"""

from __future__ import annotations

from typing import Dict, List

from .asset_registry import read_latex_template
from .format_utils import (
    escape_latex_text,
    render_latex_cell_value,
    render_latex_text_with_embedded_math,
    render_latex_text_with_inline_math,
)
from .i18n import get_export_i18n
from .models import DocumentModel, DocumentTable


def _replace_token(template: str, token: str, value: str) -> str:
    return template.replace(token, value)


def _language_package(locale: str) -> str:
    return "spanish,es-tabla" if locale == "es" else "english"


def _render_institutional_code(block: Dict[str, object]) -> str:
    rendered_lines = []
    for index, line in enumerate(block.get("lines") or []):
        tone = "ucaldasBlue" if index % 2 == 0 else "ingColor"
        prefix = (
            f"{line.get('lineNumber')}: "
            if isinstance(line, dict) and line.get("lineNumber") is not None
            else ""
        )
        rendered_lines.append(
            rf"\textcolor{{{tone}}}{{{escape_latex_text(prefix + str(line.get('text') or ''))}}}\\"
        )
    output = []
    if block.get("title"):
        output.append(rf"\GraySubsection{{{escape_latex_text(str(block.get('title')))}}}")
    output.extend(
        [
            r"\begin{center}",
            r"\begin{minipage}{0.90\linewidth}",
            r"\begingroup",
            r"\setlength{\fboxsep}{6pt}",
            r"\fcolorbox{aalieCodeFrame}{aalieCodeBg}{%",
            r"\parbox{\dimexpr\linewidth-2\fboxsep-2\fboxrule\relax}{%",
            r"\ttfamily\small",
            *rendered_lines,
            r"}%",
            r"}",
            r"\endgroup",
            r"\end{minipage}",
            r"\end{center}",
        ]
    )
    return "\n".join(output)


def _is_trace_table(headers: List[str]) -> bool:
    normalized = [header.lower() for header in headers]
    return (
        len(headers) == 7
        and any("paso" in item or "step" in item for item in normalized)
        and any("contexto" in item or "context" in item for item in normalized)
        and any("costo" in item or "cost" in item for item in normalized)
    )


def _build_column_spec(headers: List[str], align: List[str] | None) -> str:
    if _is_trace_table(headers):
        return "".join(
            [
                r">{\raggedright\arraybackslash}p{0.055\linewidth}",
                r">{\raggedright\arraybackslash}p{0.06\linewidth}",
                r">{\raggedright\arraybackslash}p{0.125\linewidth}",
                r">{\raggedright\arraybackslash}p{0.185\linewidth}",
                r">{\raggedright\arraybackslash}p{0.16\linewidth}",
                r">{\raggedright\arraybackslash}p{0.205\linewidth}",
                r">{\raggedright\arraybackslash}p{0.095\linewidth}",
            ]
        )
    columns = []
    for index, _ in enumerate(headers):
        target = (align or [])[index] if align and index < len(align) else "left"
        columns.append(
            r">{\centering\arraybackslash}X"
            if target == "center"
            else (
                r">{\raggedleft\arraybackslash}X"
                if target == "right"
                else r">{\raggedright\arraybackslash}X"
            )
        )
    return "".join(columns)


def _render_table(table: DocumentTable, i18n: Dict[str, object]) -> str:
    lines: List[str] = []
    if table.title:
        lines.append(rf"\GraySubsection{{{escape_latex_text(table.title)}}}")
    headers = [rf"\textbf{{{escape_latex_text(header)}}}" for header in table.headers]
    spec = _build_column_spec(table.headers, table.align)
    column_count = max(1, len(table.headers))
    if _is_trace_table(table.headers):
        continued_label = (
            "Continúa en la siguiente página"
            if i18n["locale"] == "es"
            else "Continued on next page"
        )
        lines.extend(
            [
                r"\begingroup",
                r"\footnotesize",
                r"\setlength{\tabcolsep}{3pt}",
                r"\renewcommand{\arraystretch}{1.15}",
                rf"\begin{{longtable}}{{{spec}}}",
                r"\toprule",
                rf"\rowcolor{{aalieSubsectionBg}}{' & '.join(headers)} \\",
                r"\midrule",
                r"\endfirsthead",
                r"\toprule",
                rf"\rowcolor{{aalieSubsectionBg}}{' & '.join(headers)} \\",
                r"\midrule",
                r"\endhead",
                r"\midrule",
                rf"\multicolumn{{{column_count}}}{{r}}{{\footnotesize\color{{aalieGray}}{escape_latex_text(continued_label)}}} \\",
                r"\endfoot",
                r"\bottomrule",
                r"\endlastfoot",
            ]
        )
        if not table.rows:
            lines.append(
                rf"\multicolumn{{{column_count}}}{{>{{\raggedright\arraybackslash}}p{{0.95\linewidth}}}}{{{escape_latex_text(str(i18n['notAvailable']))}}} \\"
            )
        else:
            for row in table.rows:
                lines.append(
                    " & ".join(render_latex_cell_value(str(cell)) for cell in row) + r" \\"
                )
        lines.extend([r"\end{longtable}", r"\endgroup"])
        return "\n".join(lines)
    lines.extend(
        [
            r"\begin{center}",
            r"\begingroup",
            r"\footnotesize",
            r"\setlength{\tabcolsep}{5pt}",
            r"\renewcommand{\arraystretch}{1.15}",
            rf"\begin{{tabularx}}{{0.98\linewidth}}{{{spec}}}",
            r"\toprule",
            rf"\rowcolor{{aalieSubsectionBg}}{' & '.join(headers)} \\",
            r"\midrule",
        ]
    )
    if not table.rows:
        lines.append(
            rf"\multicolumn{{{column_count}}}{{>{{\raggedright\arraybackslash}}p{{0.95\linewidth}}}}{{{escape_latex_text(str(i18n['notAvailable']))}}} \\"
        )
    else:
        for row in table.rows:
            lines.append(" & ".join(render_latex_cell_value(str(cell)) for cell in row) + r" \\")
    lines.extend([r"\bottomrule", r"\end{tabularx}", r"\endgroup", r"\end{center}"])
    return "\n".join(lines)


def _render_status(status: Dict[str, object], i18n: Dict[str, object]) -> str:
    lines = [
        rf"\paragraph{{{escape_latex_text(str(status.get('label') or ''))}}}",
        rf"\textbf{{{escape_latex_text(str(i18n['statusPrefix']))}}}: {escape_latex_text(str(status.get('message') or status.get('status') or ''))}",
    ]
    todos = status.get("todos") or []
    if todos:
        lines.append(r"\begin{itemize}")
        for todo in todos:
            lines.append(rf"\item {escape_latex_text(str(todo))}")
        lines.append(r"\end{itemize}")
    return "\n\n".join(lines)


def _render_block(block: Dict[str, object], i18n: Dict[str, object]) -> str:
    kind = block.get("kind")
    if kind == "heading":
        return rf"\paragraph{{{escape_latex_text(str(block.get('text') or ''))}}}"
    if kind == "emphasis":
        return rf"\textbf{{\textit{{{escape_latex_text(str(block.get('text') or ''))}}}}}"
    if kind == "paragraph":
        return render_latex_text_with_inline_math(str(block.get("text") or ""))
    if kind == "list":
        return "\n".join(
            [
                r"\begin{itemize}",
                *[
                    rf"\item {render_latex_text_with_inline_math(str(item))}"
                    for item in (block.get("items") or [])
                ],
                r"\end{itemize}",
            ]
        )
    if kind == "code":
        return "\n".join(
            [
                r"\begin{center}",
                r"\begin{minipage}{0.90\linewidth}",
                r"\begin{aaliecodeblock}",
                str(block.get("code") or ""),
                r"\end{aaliecodeblock}",
                r"\end{minipage}",
                r"\end{center}",
            ]
        )
    if kind == "subsection":
        return rf"\GraySubsection{{{escape_latex_text(str(block.get('title') or ''))}}}"
    if kind == "centeredParagraph":
        return "\n".join(
            [
                r"\begin{center}",
                render_latex_text_with_embedded_math(str(block.get("text") or "")),
                r"\end{center}",
            ]
        )
    if kind == "institutionalCode":
        return _render_institutional_code(block)
    if kind == "formula":
        lines = []
        if block.get("label"):
            lines.append(rf"\paragraph{{{escape_latex_text(str(block.get('label')))}}}")
        lines.append(rf"\AALIEDisplayMath{{{block.get('formula') or ''}}}")
        return "\n".join(lines)
    if kind == "pedagogicalStep":
        step = block.get("step") or {}
        lines = [
            rf"\paragraph{{{escape_latex_text(str(step.get('index')) + '. ' + str(step.get('title') or ''))}}}"
        ]
        if step.get("formula"):
            lines.append(rf"\AALIEDisplayMath{{{step.get('formula')}}}")
        lines.append(
            r"{\footnotesize\textit{"
            + render_latex_text_with_embedded_math(str(step.get("explanation") or ""))
            + "}}"
        )
        if step.get("warning"):
            lines.append(
                r"{\footnotesize\textit{"
                + escape_latex_text("Advertencia" if i18n["locale"] == "es" else "Warning")
                + ": "
                + render_latex_text_with_embedded_math(str(step.get("warning") or ""))
                + "}}"
            )
        if step.get("supportReason"):
            lines.append(
                r"{\footnotesize\textit{"
                + escape_latex_text("Soporte" if i18n["locale"] == "es" else "Support")
                + ": "
                + render_latex_text_with_embedded_math(str(step.get("supportReason") or ""))
                + "}}"
            )
        return "\n".join(lines)
    if kind == "table":
        return _render_table(block.get("table"), i18n)
    if kind == "keyValue":
        return "\n".join(
            [
                r"\begin{itemize}",
                *[
                    rf"\item \textbf{{{escape_latex_text(str(entry.get('label') or ''))}}}: {render_latex_text_with_inline_math(str(entry.get('value') or ''))}"
                    for entry in (block.get("entries") or [])
                    if isinstance(entry, dict)
                ],
                r"\end{itemize}",
            ]
        )
    if kind == "executionTraceDiagram":
        diagram = block.get("diagram") or {}
        caption = (
            f"Seguimiento de ejecución recursiva ({escape_latex_text(i18n['caseLabels'][diagram.get('caseName')])})."
            if i18n["locale"] == "es"
            else f"Recursive execution trace tracking ({escape_latex_text(i18n['caseLabels'][diagram.get('caseName')])})."
        )
        summary_line = (
            f"Llamadas: {diagram.get('stats', {}).get('totalCalls')}; profundidad máxima: {diagram.get('stats', {}).get('maxDepth')}."
            if i18n["locale"] == "es"
            else f"Calls: {diagram.get('stats', {}).get('totalCalls')}; max depth: {diagram.get('stats', {}).get('maxDepth')}."
        )
        lines = [
            r"\FloatBarrier",
            r"\begin{figure}[H]",
            r"\centering",
            rf"\includegraphics[width=0.98\linewidth,height=0.72\textheight,keepaspectratio]{{{escape_latex_text(str(diagram.get('assetPdfPath') or ''))}}}",
            rf"\caption{{{caption}}}",
            r"\end{figure}",
            r"\FloatBarrier",
            rf"\textbf{{{escape_latex_text(summary_line)}}}",
        ]
        if (diagram.get("diagnostics") or {}).get("truncated"):
            lines.append(
                escape_latex_text(
                    "Advertencia: la traza fue truncada por límites de ejecución."
                    if i18n["locale"] == "es"
                    else "Warning: trace was truncated by execution limits."
                )
            )
        return "\n".join(lines)
    return _render_status(block.get("status") or {}, i18n)


def render_latex_report(
    snapshot: Dict[str, object], model: DocumentModel, template: str | None = None
) -> str:
    i18n = get_export_i18n(model.locale)
    source_template = template or read_latex_template()
    executive_section = next(
        (section for section in model.sections if section.id == "executive-summary"),
        None,
    )
    executive_body = "\n\n".join(
        _render_block(block, i18n)
        for block in (executive_section.blocks if executive_section else [])
    )
    content_sections = []
    for section in model.sections:
        if section.id == "executive-summary":
            continue
        content_sections.append(
            "\n\n".join(
                [rf"\section{{{escape_latex_text(section.title)}}}"]
                + [_render_block(block, i18n) for block in section.blocks]
            )
        )
    replacements = {
        "%%__LANGUAGE_PACKAGE__%%": _language_package(model.locale),
        "%%__INSTITUTION_A__%%": escape_latex_text(model.institution.institutionLineA),
        "%%__INSTITUTION_B__%%": escape_latex_text(model.institution.institutionLineB),
        "%%__INSTITUTION_C__%%": escape_latex_text(model.institution.institutionLineC),
        "%%__REPORT_CODE__%%": escape_latex_text(model.institution.reportCode),
        "%%__REPORT_VERSION__%%": escape_latex_text(model.institution.reportVersion),
        "%%__REPORT_DATE__%%": escape_latex_text(model.institution.reportDate),
        "%%__VERSION_LABEL__%%": escape_latex_text(str(i18n["versionLabel"])),
        "%%__DATE_LABEL__%%": escape_latex_text(str(i18n["dateLabel"])),
        "%%__DISCLAIMER__%%": escape_latex_text(model.disclaimer),
        "%%__EXECUTIVE_SUMMARY_TITLE__%%": escape_latex_text(str(i18n["executiveSummaryTitle"])),
        "%%__EXECUTIVE_SUMMARY_BODY__%%": executive_body,
        "%%__CONTENT_SECTIONS__%%": "\n\n".join(content_sections),
    }
    for token, value in replacements.items():
        source_template = _replace_token(source_template, token, value)
    meta_comment = "\n".join(
        [
            f"% snapshotId: {model.snapshotId}",
            f"% contentHash: {model.contentHash}",
            f"% analysisId: {model.analysisId}",
            f"% createdAt: {model.createdAt}",
        ]
    )
    return meta_comment + "\n" + source_template
