from __future__ import annotations

from fastapi import APIRouter, Depends

from ...core.auth import IdentityClaims, get_identity, require_admin

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/whoami")
def whoami(identity: IdentityClaims = Depends(get_identity)) -> dict[str, str]:
    return {"userId": identity.user_id, "role": identity.role}


@router.get("/admin/ping")
def admin_ping(_: IdentityClaims = Depends(require_admin)) -> dict[str, bool]:
    return {"ok": True}
