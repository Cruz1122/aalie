from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from ...core.auth import IdentityClaims, get_identity, require_admin
from ...core.database import get_db
from .export_service import build_study_export, record_export_audit
from .schemas import (
    ParticipantAdminRow,
    ParticipantPublic,
    StudyConditionRequest,
    StudyCreateRequest,
    StudyMeResponse,
    StudyMeasurementRequest,
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


@router.patch("/admin/studies/{slug}/status", response_model=StudyPublic)
def admin_update_status(
    slug: str,
    payload: StudyStatusRequest,
    _: IdentityClaims = Depends(require_admin),
    db: Session = Depends(get_db),
) -> StudyPublic:
    study = get_study_or_404(db, slug)
    return public_study(
        update_study_status(
            db,
            study=study,
            new_status=payload.status,
            telemetry_enabled=payload.telemetryEnabled,
        )
    )


@router.get("/admin/studies/{slug}/summary", response_model=StudySummaryResponse)
def admin_summary(
    slug: str,
    _: IdentityClaims = Depends(require_admin),
    db: Session = Depends(get_db),
) -> StudySummaryResponse:
    return study_summary(db, get_study_or_404(db, slug))


@router.get("/admin/studies/{slug}/participants", response_model=list[ParticipantAdminRow])
def admin_participants(
    slug: str,
    _: IdentityClaims = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[ParticipantAdminRow]:
    return participant_rows(db, get_study_or_404(db, slug))


@router.patch(
    "/admin/studies/{slug}/participants/{participant_id}/condition",
    response_model=ParticipantPublic,
)
def admin_assign_condition(
    slug: str,
    participant_id: UUID,
    payload: StudyConditionRequest,
    _: IdentityClaims = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ParticipantPublic:
    study = get_study_or_404(db, slug)
    return public_participant(
        assign_condition(
            db,
            study=study,
            participant_id=participant_id,
            condition=payload.condition,
        )
    )


@router.get("/admin/studies/{slug}/export")
def admin_export(
    slug: str,
    identity: IdentityClaims = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Response:
    study = get_study_or_404(db, slug)
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
