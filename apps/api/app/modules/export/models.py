"""
Dataclasses used by the export engine.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass(frozen=True)
class DocumentTable:
    headers: List[str]
    rows: List[List[str]]
    title: Optional[str] = None
    align: Optional[List[str]] = None


@dataclass(frozen=True)
class DocumentKeyValueEntry:
    label: str
    value: str


@dataclass(frozen=True)
class DocumentInstitutionalCodeLine:
    text: str
    lineNumber: Optional[int] = None


@dataclass(frozen=True)
class DocumentBlockStatus:
    label: str
    status: str
    message: Optional[str] = None
    todos: List[str] = field(default_factory=list)


@dataclass(frozen=True)
class DocumentPedagogicalStep:
    index: int
    title: str
    status: str
    explanation: str
    formula: Optional[str] = None
    warning: Optional[str] = None
    supportReason: Optional[str] = None


@dataclass(frozen=True)
class DocumentExecutionTraceDiagram:
    title: str
    caseName: str
    graph: Dict[str, Any]
    stats: Dict[str, Any]
    renderMode: str
    assetBasename: str
    assetSvgPath: str
    assetPdfPath: str
    patternKind: Optional[str] = None
    classification: Optional[Dict[str, Any]] = None
    summary: Optional[Dict[str, Any]] = None
    diagnostics: Optional[Dict[str, Any]] = None


@dataclass(frozen=True)
class DocumentSection:
    id: str
    title: str
    blocks: List[Dict[str, Any]]


@dataclass(frozen=True)
class DocumentInstitutionInfo:
    institutionLineA: str
    institutionLineB: str
    institutionLineC: str
    reportCode: str
    reportVersion: str
    reportDate: str


@dataclass(frozen=True)
class DocumentModel:
    title: str
    locale: str
    snapshotId: str
    contentHash: str
    analysisId: str
    createdAt: str
    disclaimer: str
    institution: DocumentInstitutionInfo
    sections: List[DocumentSection]


@dataclass(frozen=True)
class ExportArtifact:
    format: str
    filename: str
    mimeType: str
    content: bytes | str


@dataclass(frozen=True)
class AssetManifestEntry:
    filename: str
    mimeType: str
    size: int


@dataclass(frozen=True)
class ExportBundleResult:
    filename: str
    content: bytes


@dataclass(frozen=True)
class LatexAssetRegistry:
    asset_root: str
    style_file_path: str
    template_path: str
    logos_dir: str
    ucaldas_logo_path: str
    aalie_logo_path: str


class LatexCompilationError(Exception):
    def __init__(
        self,
        kind: str,
        message: str,
        logs: str = "",
        asset_manifest: Optional[List[Dict[str, Any]]] = None,
        work_dir: Optional[str] = None,
    ) -> None:
        super().__init__(message)
        self.kind = kind
        self.logs = logs
        self.asset_manifest = asset_manifest or []
        self.work_dir = work_dir
