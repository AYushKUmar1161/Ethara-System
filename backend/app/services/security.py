from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.rbac import User
from app.repositories.rbac import UserRepository

security_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Dependency to extract, decode, and verify the current user from JWT access token."""
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except (jwt.PyJWTError, ValueError):
        raise credentials_exception

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if user is None or not user.is_active:
        raise credentials_exception
        
    return user


class PermissionChecker:
    """RBAC Permission verification dependency."""

    def __init__(self, allowed_permissions: List[str]):
        self.allowed_permissions = allowed_permissions

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        user_permissions = [p.name for p in current_user.role.permissions]
        
        # Check if user has at least one of the allowed permissions (or matches a wildcard 'read:all' / 'write:all')
        # Admin gets full access automatically
        if current_user.role.name == "Admin":
            return current_user
            
        for perm in self.allowed_permissions:
            if perm in user_permissions:
                return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource"
        )
