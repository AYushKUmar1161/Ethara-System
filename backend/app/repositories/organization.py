from typing import Optional, List, Any, Dict
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.organization import Department, Project, Employee
from app.repositories.base import BaseRepository


class DepartmentRepository(BaseRepository[Department]):
    def __init__(self, db: AsyncSession):
        super().__init__(Department, db)

    async def get_by_code(self, code: str) -> Optional[Department]:
        result = await self.db.execute(select(Department).filter(Department.code == code))
        return result.scalar_one_or_none()


class ProjectRepository(BaseRepository[Project]):
    def __init__(self, db: AsyncSession):
        super().__init__(Project, db)

    async def get_by_code(self, code: str) -> Optional[Project]:
        result = await self.db.execute(select(Project).filter(Project.code == code))
        return result.scalar_one_or_none()

    async def get_active_projects(self) -> List[Project]:
        result = await self.db.execute(select(Project).filter(Project.status == "Active"))
        return list(result.scalars().all())


class EmployeeRepository(BaseRepository[Employee]):
    def __init__(self, db: AsyncSession):
        super().__init__(Employee, db)

    async def get_by_employee_id(self, employee_id: str) -> Optional[Employee]:
        result = await self.db.execute(select(Employee).filter(Employee.employee_id == employee_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[Employee]:
        result = await self.db.execute(select(Employee).filter(Employee.email == email))
        return result.scalar_one_or_none()

    async def search_employees(
        self, 
        query: str, 
        skip: int = 0, 
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Employee]:
        """Perform text search on first_name, last_name, email, or employee_id."""
        stmt = select(Employee)
        
        # Apply search filter
        if query:
            search_pattern = f"%{query}%"
            stmt = stmt.filter(
                or_(
                    Employee.first_name.ilike(search_pattern),
                    Employee.last_name.ilike(search_pattern),
                    Employee.email.ilike(search_pattern),
                    Employee.employee_id.ilike(search_pattern)
                )
            )

        # Apply specific field filters (e.g. department_id, project_id, status)
        if filters:
            for field, val in filters.items():
                if hasattr(Employee, field) and val is not None:
                    stmt = stmt.filter(getattr(Employee, field) == val)

        stmt = stmt.order_by(Employee.id.asc()).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def count_search(self, query: str, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count employees matching search criteria."""
        stmt = select(func.count(Employee.id))
        
        if query:
            search_pattern = f"%{query}%"
            stmt = stmt.filter(
                or_(
                    Employee.first_name.ilike(search_pattern),
                    Employee.last_name.ilike(search_pattern),
                    Employee.email.ilike(search_pattern),
                    Employee.employee_id.ilike(search_pattern)
                )
            )

        if filters:
            for field, val in filters.items():
                if hasattr(Employee, field) and val is not None:
                    stmt = stmt.filter(getattr(Employee, field) == val)

        result = await self.db.execute(stmt)
        return result.scalar() or 0
