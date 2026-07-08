from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_db
from app.services.ai_service import AIService
from app.services.security import get_current_user
from app.models.rbac import User

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


class AIQueryRequest(BaseModel):
    query: str


class AIQueryResponse(BaseModel):
    response: str


@router.post("/query", response_model=AIQueryResponse)
async def ask_ai_assistant(
    payload: AIQueryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit a query prompt to the AI Seat Allocation Assistant."""
    if not payload.query.strip():
        raise HTTPException(status_code=400, detail="Query prompt cannot be empty.")
        
    ai_service = AIService(db)
    response_text = await ai_service.process_query(payload.query, current_user.id)
    return AIQueryResponse(response=response_text)
