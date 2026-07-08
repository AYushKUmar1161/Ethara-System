from datetime import datetime
from typing import Optional
from sqlalchemy import Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin


class SeatAllocation(Base, TimestampMixin):
    __tablename__ = "seat_allocations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    seat_id: Mapped[int] = mapped_column(Integer, ForeignKey("seats.id", ondelete="CASCADE"), nullable=False)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    allocated_by_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    status: Mapped[str] = mapped_column(String(20), default="Active", nullable=False)  # Active, Released, Reserved
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    seat: Mapped["Seat"] = relationship("Seat", back_populates="allocations", lazy="selectin")
    employee: Mapped["Employee"] = relationship("Employee", back_populates="seat_allocations", lazy="selectin")
    project: Mapped[Optional["Project"]] = relationship("Project", back_populates="seat_allocations", lazy="selectin")
    allocated_by: Mapped[Optional["User"]] = relationship("User", lazy="selectin")
