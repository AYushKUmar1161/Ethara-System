from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.rbac import User, Role, Permission, Session
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_username(self, username: str) -> Optional[User]:
        """Fetch user by username."""
        result = await self.db.execute(select(User).filter(User.username == username))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        """Fetch user by email."""
        result = await self.db.execute(select(User).filter(User.email == email))
        return result.scalar_one_or_none()


class RoleRepository(BaseRepository[Role]):
    def __init__(self, db: AsyncSession):
        super().__init__(Role, db)

    async def get_by_name(self, name: str) -> Optional[Role]:
        """Fetch role by name."""
        result = await self.db.execute(select(Role).filter(Role.name == name))
        return result.scalar_one_or_none()


class PermissionRepository(BaseRepository[Permission]):
    def __init__(self, db: AsyncSession):
        super().__init__(Permission, db)

    async def get_by_name(self, name: str) -> Optional[Permission]:
        """Fetch permission by name."""
        result = await self.db.execute(select(Permission).filter(Permission.name == name))
        return result.scalar_one_or_none()


class SessionRepository(BaseRepository[Session]):
    def __init__(self, db: AsyncSession):
        super().__init__(Session, db)

    async def get_by_refresh_token(self, token: str) -> Optional[Session]:
        """Fetch active session by refresh token."""
        result = await self.db.execute(
            select(Session).filter(Session.refresh_token == token, Session.is_revoked == False)
        )
        return result.scalar_one_or_none()
