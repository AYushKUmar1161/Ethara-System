from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.user import UserRead


class AuditLogRead(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime
    user: Optional[UserRead] = None

    class Config:
        from_attributes = True


class NotificationRead(BaseModel):
    id: int
    user_id: int
    message: str
    is_read: bool
    type: str
    created_at: datetime

    class Config:
        from_attributes = True
