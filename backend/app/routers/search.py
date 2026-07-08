from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func

from app.database import get_db
from app.schemas.search import SearchResult
from app.models.organization import Employee, Project
from app.models.facility import Seat
from app.repositories.organization import EmployeeRepository
from app.repositories.organization import ProjectRepository
from app.repositories.facility import SeatRepository
from app.services.security import PermissionChecker
from app.models.rbac import User

router = APIRouter(prefix="/search", tags=["Global Search"])


@router.get("", response_model=SearchResult)
async def global_search(
    query: str = Query(..., min_length=1, description="Search term for employees, projects, or seats"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["read:all"]))
):
    """Perform a global search matching employees (name/email/id), projects (name/code), and seats (number)."""
    search_pattern = f"%{query}%"

    # 1. Search Employees
    emp_stmt = (
        select(Employee)
        .filter(
            or_(
                Employee.first_name.ilike(search_pattern),
                Employee.last_name.ilike(search_pattern),
                Employee.email.ilike(search_pattern),
                Employee.employee_id.ilike(search_pattern)
            )
        )
        .limit(10)
    )
    employees = (await db.execute(emp_stmt)).scalars().all()

    # 2. Search Projects
    proj_stmt = (
        select(Project)
        .filter(
            or_(
                Project.name.ilike(search_pattern),
                Project.code.ilike(search_pattern)
            )
        )
        .limit(10)
    )
    projects = (await db.execute(proj_stmt)).scalars().all()

    # 3. Search Seats
    seat_stmt = (
        select(Seat)
        .filter(Seat.number.ilike(search_pattern))
        .limit(10)
    )
    seats = (await db.execute(seat_stmt)).scalars().all()

    # Counts
    emp_count = (await db.execute(
        select(func.count(Employee.id)).filter(
            or_(
                Employee.first_name.ilike(search_pattern),
                Employee.last_name.ilike(search_pattern),
                Employee.email.ilike(search_pattern),
                Employee.employee_id.ilike(search_pattern)
            )
        )
    )).scalar() or 0

    proj_count = (await db.execute(
        select(func.count(Project.id)).filter(
            or_(
                Project.name.ilike(search_pattern),
                Project.code.ilike(search_pattern)
            )
        )
    )).scalar() or 0

    seat_count = (await db.execute(
        select(func.count(Seat.id)).filter(Seat.number.ilike(search_pattern))
    )).scalar() or 0

    return SearchResult(
        employees=list(employees),
        projects=list(projects),
        seats=list(seats),
        total_employees=emp_count,
        total_projects=proj_count,
        total_seats=seat_count
    )
