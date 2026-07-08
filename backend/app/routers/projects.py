from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.organization import ProjectRead, ProjectCreate
from app.repositories.organization import ProjectRepository
from app.services.security import PermissionChecker
from app.models.rbac import User

router = APIRouter(prefix="/projects", tags=["Project Management"])


@router.get("", response_model=List[ProjectRead])
async def list_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["read:all"]))
):
    """Retrieve list of projects, with status filtering."""
    repo = ProjectRepository(db)
    filters = {}
    if status:
        filters["status"] = status
    return await repo.get_all(skip=skip, limit=limit, filters=filters)


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["read:all"]))
):
    """Fetch details of a single project by ID."""
    repo = ProjectRepository(db)
    proj = await repo.get_by_id(project_id)
    if not proj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return proj


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["write:projects"]))
):
    """Create a new project profile."""
    repo = ProjectRepository(db)
    
    # Check duplicate project code
    exist = await repo.get_by_code(payload.code)
    if exist:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project with this code already exists"
        )
        
    proj = await repo.create(payload.model_dump())
    await db.commit()
    return proj


@router.patch("/{project_id}", response_model=ProjectRead)
async def update_project(
    project_id: int,
    payload: ProjectCreate,  # Can use full payload for updating fields
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["write:projects"]))
):
    """Update details of an existing project."""
    repo = ProjectRepository(db)
    proj = await repo.get_by_id(project_id)
    if not proj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    updated = await repo.update(proj, payload.model_dump(exclude_unset=True))
    await db.commit()
    return updated


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["write:projects"]))
):
    """Delete a project record."""
    repo = ProjectRepository(db)
    proj = await repo.get_by_id(project_id)
    if not proj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    await repo.delete(project_id)
    await db.commit()
