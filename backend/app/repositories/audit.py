from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog, Notification
from app.repositories.base import BaseRepository


class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self, db: AsyncSession):
        super().__init__(AuditLog, db)

    async def get_latest_logs(self, limit: int = 100) -> List[AuditLog]:
        """Fetch latest audit logs."""
        result = await self.db.execute(
            select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, db: AsyncSession):
        super().__init__(Notification, db)

    async def get_unread_by_user(self, user_id: int) -> List[Notification]:
        """Fetch all unread notifications for a user."""
        result = await self.db.execute(
            select(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read == False)
            .order_by(Notification.created_at.desc())
        )
        return list(result.scalars().all())

    async def mark_all_as_read_for_user(self, user_id: int) -> None:
        """Mark all notifications as read for a user."""
        await self.db.execute(
            Notification.__table__.update()
            .where(Notification.user_id == user_id)
            .values(is_read=True)
        )
