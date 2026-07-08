from typing import List
from sqlalchemy import Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class Floor(Base):
    __tablename__ = "floors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    number: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)

    # Relationships
    zones: Mapped[List["Zone"]] = relationship("Zone", back_populates="floor", cascade="all, delete-orphan")


class Zone(Base):
    __tablename__ = "zones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    floor_id: Mapped[int] = mapped_column(Integer, ForeignKey("floors.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    code: Mapped[str] = mapped_column(String(20), nullable=False)

    # Constraints: name/code must be unique per floor
    __table_args__ = (
        UniqueConstraint("floor_id", "name", name="uq_floor_zone_name"),
        UniqueConstraint("floor_id", "code", name="uq_floor_zone_code"),
    )

    # Relationships
    floor: Mapped[Floor] = relationship("Floor", back_populates="zones", lazy="selectin")
    bays: Mapped[List["Bay"]] = relationship("Bay", back_populates="zone", cascade="all, delete-orphan")


class Bay(Base):
    __tablename__ = "bays"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    zone_id: Mapped[int] = mapped_column(Integer, ForeignKey("zones.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    code: Mapped[str] = mapped_column(String(20), nullable=False)

    # Constraints: name/code must be unique per zone
    __table_args__ = (
        UniqueConstraint("zone_id", "name", name="uq_zone_bay_name"),
        UniqueConstraint("zone_id", "code", name="uq_zone_bay_code"),
    )

    # Relationships
    zone: Mapped[Zone] = relationship("Zone", back_populates="bays", lazy="selectin")
    seats: Mapped[List["Seat"]] = relationship("Seat", back_populates="bay", cascade="all, delete-orphan")


class Seat(Base):
    __tablename__ = "seats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    bay_id: Mapped[int] = mapped_column(Integer, ForeignKey("bays.id", ondelete="CASCADE"), nullable=False)
    number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="Available", nullable=False)  # Available, Occupied, Reserved, Maintenance, Pending
    type: Mapped[str] = mapped_column(String(20), default="Standard", nullable=False)  # Standard, HotDesk, Ergonomic

    # Relationships
    bay: Mapped[Bay] = relationship("Bay", back_populates="seats", lazy="selectin")
    allocations: Mapped[List["SeatAllocation"]] = relationship("SeatAllocation", back_populates="seat")
