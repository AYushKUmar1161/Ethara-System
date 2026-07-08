from datetime import date, datetime
from typing import List, Optional
from sqlalchemy import Integer, String, ForeignKey, Date, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin


class Department(Base, TimestampMixin):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    projects: Mapped[List["Project"]] = relationship("Project", back_populates="department")
    employees: Mapped[List["Employee"]] = relationship("Employee", back_populates="department")


class Project(Base, TimestampMixin):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    department_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(20), default="Active", nullable=False)  # Active, Inactive, Completed
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Relationships
    department: Mapped[Optional[Department]] = relationship("Department", back_populates="projects", lazy="selectin")
    employees: Mapped[List["Employee"]] = relationship("Employee", back_populates="project")
    seat_allocations: Mapped[List["SeatAllocation"]] = relationship("SeatAllocation", back_populates="project")


class Employee(Base, TimestampMixin):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), unique=True, nullable=True
    )
    employee_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    department_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False
    )
    project_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(20), default="Active", nullable=False)  # Active, Inactive, Terminated

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="employee")
    department: Mapped[Department] = relationship("Department", back_populates="employees", lazy="selectin")
    project: Mapped[Optional[Project]] = relationship("Project", back_populates="employees", lazy="selectin")
    seat_allocations: Mapped[List["SeatAllocation"]] = relationship("SeatAllocation", back_populates="employee", cascade="all, delete-orphan")
