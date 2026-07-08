from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


# Department Schemas
class DepartmentBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentRead(DepartmentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Project Schemas
class ProjectBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    department_id: Optional[int] = None
    status: str = "Active"
    start_date: date
    end_date: Optional[date] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectRead(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Employee Schemas
class EmployeeBase(BaseModel):
    employee_id: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    department_id: int
    project_id: Optional[int] = None
    status: str = "Active"


class EmployeeCreate(EmployeeBase):
    user_id: Optional[int] = None


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None
    project_id: Optional[int] = None
    status: Optional[str] = None


class EmployeeRead(EmployeeBase):
    id: int
    user_id: Optional[int] = None
    department: DepartmentRead
    project: Optional[ProjectRead] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
