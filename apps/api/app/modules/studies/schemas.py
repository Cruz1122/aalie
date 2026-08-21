from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

StudyStatus = Literal["DRAFT", "ACTIVE", "PAUSED", "CLOSED"]
StudyCondition = Literal["AALIE", "CONTROL"]


class StudyCreateRequest(BaseModel):
    slug: str = Field(min_length=3, max_length=96, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    title: str = Field(min_length=3, max_length=240)
    protocolVersion: str = Field(min_length=1, max_length=64)
    consentVersion: str = Field(min_length=1, max_length=64)
    consentSha256: str = Field(pattern=r"^[0-9a-f]{64}$")
    retentionUntil: datetime | None = None


class StudyStatusRequest(BaseModel):
    status: StudyStatus
    telemetryEnabled: bool | None = None


class StudyConditionRequest(BaseModel):
    condition: StudyCondition


class StudyMeasurementRequest(BaseModel):
    metricKey: str
    metricVersion: str = Field(min_length=1, max_length=32)
    phase: str = Field(min_length=1, max_length=32)
    numericValue: float
    unit: str | None = Field(default=None, max_length=32)


class StudyPublic(BaseModel):
    id: UUID
    slug: str
    title: str
    protocolVersion: str
    consentVersion: str
    consentSha256: str
    status: StudyStatus
    telemetryEnabled: bool


class ParticipantPublic(BaseModel):
    id: UUID
    participantCode: str
    condition: StudyCondition | None
    enrolledAt: datetime
    withdrawnAt: datetime | None
    excludedAt: datetime | None


class StudyMeResponse(BaseModel):
    study: StudyPublic
    participant: ParticipantPublic | None
    consented: bool


class StudySummaryResponse(BaseModel):
    study: StudyPublic
    participants: int
    activeParticipants: int
    withdrawn: int
    excluded: int
    aalie: int
    control: int
    unassigned: int
    quizAttempts: int
    completedQuizAttempts: int
    meanAccuracy: float | None


class ParticipantAdminRow(BaseModel):
    participantId: UUID
    participantCode: str
    condition: StudyCondition | None
    enrolledAt: datetime
    withdrawnAt: datetime | None
    excludedAt: datetime | None
    attempts: int
    averageAccuracy: float | None
