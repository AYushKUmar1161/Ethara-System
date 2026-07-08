from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.organization import EmployeeRead, EmployeeCreate, EmployeeUpdate
from app.repositories.organization import EmployeeRepository
from app.services.security import PermissionChecker
from app.models.rbac import User

router = APIRouter(prefix="/employees", tags=["Employee Management"])


@router.get("", response_model=List[EmployeeRead])
async def list_employees(
    query: Optional[str] = Query(None, description="Search by name, email or employee ID"),
    department_id: Optional[int] = Query(None),
    project_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["read:all"]))
):
    """Retrieve list of employees with search queries and department/project filtering."""
    repo = EmployeeRepository(db)
    filters = {}
    if department_id:
        filters["department_id"] = department_id
    if project_id:
        filters["project_id"] = project_id
    if status:
        filters["status"] = status

    if query:
        return await repo.search_employees(query, skip=skip, limit=limit, filters=filters)
    return await repo.get_all(skip=skip, limit=limit, filters=filters)


@router.get("/{employee_id}", response_model=EmployeeRead)
async def get_employee(
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["read:all"]))
):
    """Fetch details of a single employee by their database ID."""
    repo = EmployeeRepository(db)
    emp = await repo.get_by_id(employee_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return emp


@router.post("", response_model=EmployeeRead, status_code=status.HTTP_201_CREATED)
async def create_employee(
    payload: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["write:employees"]))
):
    """Create a new employee profile in the registry."""
    repo = EmployeeRepository(db)
    
    # Check if code or email unique
    exist_id = await repo.get_by_employee_id(payload.employee_id)
    if exist_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Employee ID already exists"
        )
        
    exist_email = await repo.get_by_email(payload.email)
    if exist_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Employee email already exists"
        )
        
    emp = await repo.create(payload.model_dump())
    await db.commit()
    return emp


@router.patch("/{employee_id}", response_model=EmployeeRead)
async def update_employee(
    employee_id: int,
    payload: EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["write:employees"]))
):
    """Update details of an existing employee."""
    repo = EmployeeRepository(db)
    emp = await repo.get_by_id(employee_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
        
    updated = await repo.update(emp, payload.model_dump(exclude_unset=True))
    await db.commit()
    return updated


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["write:employees"]))
):
    """Delete an employee from the system."""
    repo = EmployeeRepository(db)
    emp = await repo.get_by_id(employee_id)
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
        
    await repo.delete(employee_id)
    await db.commit()
