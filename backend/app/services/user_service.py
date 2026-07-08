from datetime import datetime, timedelta
from typing import Optional, Tuple
import jwt
from bcrypt import hashpw, gensalt, checkpw
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.rbac import User, Session, Role
from app.repositories.rbac import UserRepository, SessionRepository


class UserService:
    """Authentication and User management service handling password hashing and tokens."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.session_repo = SessionRepository(db)

    def hash_password(self, password: str) -> str:
        """Hash password securely using bcrypt."""
        return hashpw(password.encode("utf-8"), gensalt()).decode("utf-8")

    def verify_password(self, password: str, hashed_password: str) -> bool:
        """Verify plain text password against secure hash."""
        return checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))

    def create_access_token(self, user: User) -> str:
        """Generate JWT access token containing identity, username, and role."""
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        permissions = [p.name for p in user.role.permissions]
        to_encode = {
            "sub": str(user.id),
            "username": user.username,
            "email": user.email,
            "role": user.role.name,
            "permissions": permissions,
            "exp": expire
        }
        return jwt.encode(to_encode, settings.JWT_SECRET, algorithm="HS256")

    async def create_session(
        self, 
        user_id: int, 
        ip_address: Optional[str] = None, 
        user_agent: Optional[str] = None
    ) -> Session:
        """Generate and store a JWT refresh token session."""
        expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
        # Create unique refresh token using jwt
        payload = {
            "sub": str(user_id),
            "type": "refresh",
            "exp": expires_at
        }
        refresh_token = jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

        session = Session(
            user_id=user_id,
            refresh_token=refresh_token,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=datetime.utcnow()
        )
        self.db.add(session)
        await self.db.flush()
        return session

    async def authenticate_user(self, username_or_email: str, password: str) -> Optional[User]:
        """Authenticate user by credentials."""
        # Find user by username or email
        user = await self.user_repo.get_by_username(username_or_email)
        if not user:
            user = await self.user_repo.get_by_email(username_or_email)
            
        if not user or not user.is_active:
            return None
            
        if not self.verify_password(password, user.hashed_password):
            return None
            
        return user

    async def refresh_session(self, refresh_token: str) -> Optional[Tuple[str, str]]:
        """Validate refresh token and issue new access & refresh tokens."""
        session = await self.session_repo.get_by_refresh_token(refresh_token)
        if not session or session.expires_at < datetime.utcnow():
            return None

        # Revoke current session
        session.is_revoked = True
        self.db.add(session)

        # Create new tokens
        user_stmt = select(User).filter(User.id == session.user_id)
        user = (await self.db.execute(user_stmt)).scalar_one_or_none()
        if not user or not user.is_active:
            await self.db.flush()
            return None

        new_access = self.create_access_token(user)
        new_session = await self.create_session(
            user.id, ip_address=session.ip_address, user_agent=session.user_agent
        )
        
        return new_access, new_session.refresh_token

    async def revoke_session(self, refresh_token: str) -> bool:
        """Revoke a refresh token session."""
        session = await self.session_repo.get_by_refresh_token(refresh_token)
        if session:
            session.is_revoked = True
            self.db.add(session)
            return True
        return False

    async def register_user(self, username: str, email: str, password: str) -> User:
        """Create a new user with the default Employee role."""
        # Check if username exists
        existing_user = await self.user_repo.get_by_username(username)
        if existing_user:
            raise ValueError("Username already taken.")

        # Check if email exists
        existing_email = await self.user_repo.get_by_email(email)
        if existing_email:
            raise ValueError("Email already registered.")

        # Resolve the default 'Employee' role
        role_stmt = select(Role).filter(Role.name == "Employee")
        role = (await self.db.execute(role_stmt)).scalar_one_or_none()
        if not role:
            # Fallback to first role
            role_stmt = select(Role)
            role = (await self.db.execute(role_stmt)).scalars().first()
            if not role:
                # If no roles exist at all, raise error
                raise ValueError("No roles found in system database.")

        hashed_password = self.hash_password(password)
        new_user = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            role_id=role.id,
            is_active=True
        )
        self.db.add(new_user)
        await self.db.flush()
        return new_user
