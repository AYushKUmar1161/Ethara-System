from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.audit import AuditLogRead, NotificationRead
from app.repositories.audit import AuditLogRepository, NotificationRepository
from app.services.security import get_current_user, PermissionChecker
from app.models.rbac import User

router = APIRouter(prefix="/audit", tags=["Security & Notifications"])


@router.get("/logs", response_model=List[AuditLogRead])
async def list_audit_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["read:all"]))
):
    """Retrieve history of security and seat allocation actions."""
    repo = AuditLogRepository(db)
    return await repo.get_latest_logs(limit=100)


@router.get("/notifications", response_model=List[NotificationRead])
async def get_my_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch unread notifications for the currently logged in user."""
    repo = NotificationRepository(db)
    return await repo.get_unread_by_user(current_user.id)


@router.post("/notifications/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def read_all_my_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all current notifications for the logged in user as read."""
    repo = NotificationRepository(db)
    await repo.mark_all_as_read_for_user(current_user.id)
    await db.commit()
