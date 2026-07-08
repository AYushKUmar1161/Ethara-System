from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.auth import LoginRequest, TokenResponse, RefreshTokenRequest, RegisterRequest
from app.schemas.user import UserRead
from app.services.user_service import UserService
from app.services.security import get_current_user
from app.models.rbac import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate credentials and return JWT access and refresh tokens."""
    user_service = UserService(db)
    user = await user_service.authenticate_user(payload.username, payload.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password"
        )
        
    # Get user agent and IP address
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    access_token = user_service.create_access_token(user)
    session = await user_service.create_session(
        user.id, ip_address=ip_address, user_agent=user_agent
    )
    
    # Commit transaction
    await db.commit()

    return {
        "access_token": access_token,
        "refresh_token": session.refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """Generate a new access token using a refresh token."""
    user_service = UserService(db)
    result = await user_service.refresh_session(payload.refresh_token)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
        
    access_token, refresh_token = result
    await db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """Revoke a refresh token session."""
    user_service = UserService(db)
    success = await user_service.revoke_session(payload.refresh_token)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token already revoked or not found"
        )
    await db.commit()


@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)):
    """Fetch profile details of the currently authenticated user."""
    return current_user


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user account with default Employee permissions."""
    from sqlalchemy.orm import selectinload
    user_service = UserService(db)
    try:
        user = await user_service.register_user(
            username=payload.username,
            email=payload.email,
            password=payload.password
        )
        await db.commit()
        
        # Eagerly load the role relationship for UserRead validation serialization
        stmt = (
            select(User)
            .options(selectinload(User.role))
            .filter(User.id == user.id)
        )
        user_loaded = (await db.execute(stmt)).scalar_one()
        return user_loaded
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
