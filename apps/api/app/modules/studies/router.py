from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from ...core.auth import IdentityClaims, get_identity, require_admin
from ...core.database import get_db
from ...db.models.mf3 import Study
from .export_service import build_study_export, record_export_audit
from .schemas import (
    ParticipantAdminRow,
    ParticipantPublic,
    StudyConditionRequest,
    StudyCreateRequest,
    StudyMeasurementRequest,
    StudyMeResponse,
    StudyPublic,
    StudyStatusRequest,
    StudySummaryResponse,
)
from .service import (
    add_measurement,
    assign_condition,
    consent_to_study,
    create_study,
    get_participant_for_user,
    get_study_or_404,
    list_studies,
    participant_rows,
    public_participant,
    public_study,
    require_recording_participant,
    study_summary,
    update_study_status,
    withdraw_from_study,
)

router = APIRouter(tags=["studies"])


def _admin_study(db: Session, study_id: UUID) -> Study:
    study = db.get(Study, study_id)
    if study is None:
        raise HTTPException(status_code=404, detail="Study not found")
    return study


@router.get("/studies/{slug}", response_model=StudyPublic)
def get_public_study(slug: str, db: Session = Depends(get_db)) -> StudyPublic:
    return public_study(get_study_or_404(db, slug))


@router.get("/studies/{slug}/me", response_model=StudyMeResponse)
def get_study_me(
    slug: str,
    identity: IdentityClaims = Depends(get_identity),
    db: Session = Depends(get_db),
) -> StudyMeResponse:
    study = get_study_or_404(db, slug)
    participant = get_participant_for_user(db, study_id=study.id, user_id=identity.user_id)
    return StudyMeResponse(
        study=public_study(study),
        participant=public_participant(participant) if participant else None,
        consented=participant is not None and participant.withdrawn_at is None,
    )


@router.post("/studies/{slug}/consent", response_model=ParticipantPublic)
def consent(
    slug: str,
    identity: IdentityClaims = Depends(get_identity),
    db: Session = Depends(get_db),
) -> ParticipantPublic:
    study = get_study_or_404(db, slug)
    return public_participant(consent_to_study(db, study=study, user_id=identity.user_id))


@router.post("/studies/{slug}/withdraw", response_model=ParticipantPublic)
def withdraw(
    slug: str,
    identity: IdentityClaims = Depends(get_identity),
    db: Session = Depends(get_db),
) -> ParticipantPublic:
    study = get_study_or_404(db, slug)
    return public_participant(withdraw_from_study(db, study=study, user_id=identity.user_id))


@router.post("/studies/{slug}/measurements", status_code=201)
def record_measurement(
    slug: str,
    payload: StudyMeasurementRequest,
    identity: IdentityClaims = Depends(get_identity),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    _, participant = require_recording_participant(
        db, study_slug=slug, user_id=identity.user_id
    )
    measurement = add_measurement(db, participant=participant, payload=payload)
    return {"id": str(measurement.id)}


@router.get("/admin/studies", response_model=list[StudyPublic])
def admin_list_studies(
    _: IdentityClaims = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[StudyPublic]:
    return list_studies(db)


@router.post("/admin/studies", response_model=StudyPublic, status_code=201)
def admin_create_study(
    payload: StudyCreateRequest,
    _: IdentityClaims = Depends(require_admin),
    db: Session = Depends(get_db),
) -> StudyPublic:
    return public_study(create_study(db, payload))


@router.patch("/admin/studies/{study_id}/status", response_model=StudyPublic)
def admin_update_status(
    study_id: UUID,
    payload: StudyStatusRequest,
    _: IdentityClaims = Depends(require_admin),
    db: Session = Depends(get_db),
) -> StudyPublic:
    study = _admin_study(db, study_id)
    return public_study(
        update_study_status(
            db,
            study=study,
            new_status=payload.status,
            telemetry_enabled=payload.telemetryEnabled,
        )
    )


@router.get("/admin/studies/{study_id}/summary", response_model=StudySummaryResponse)
def admin_summary(
    study_id: UUID,
    _: IdentityClaims = Depends(require_admin),
    db: Session = Depends(get_db),
) -> StudySummaryResponse:
    return study_summary(db, _admin_study(db, study_id))


@router.get("/admin/studies/{study_id}/participants", response_model=list[ParticipantAdminRow])
def admin_participants(
    study_id: UUID,
    _: IdentityClaims = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[ParticipantAdminRow]:
    return participant_rows(db, _admin_study(db, study_id))


@router.patch(
    "/admin/studies/{study_id}/participants/{participant_id}/condition",
    response_model=ParticipantPublic,
)
def admin_assign_condition(
    study_id: UUID,
    participant_id: UUID,
    payload: StudyConditionRequest,
    _: IdentityClaims = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ParticipantPublic:
    study = _admin_study(db, study_id)
    return public_participant(
        assign_condition(
            db,
            study=study,
            participant_id=participant_id,
            condition=payload.condition,
        )
    )


@router.get("/admin/studies/{study_id}/export")
def admin_export(
    study_id: UUID,
    identity: IdentityClaims = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Response:
    study = _admin_study(db, study_id)
    export = build_study_export(study.id)
    record_export_audit(
        db,
        study_id=study.id,
        admin_user_id=identity.user_id,
        export=export,
    )
    return Response(
        content=export.archive,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{export.filename}"',
            "Cache-Control": "private, no-store",
            "X-Content-Hash": export.sha256,
        },
    )
