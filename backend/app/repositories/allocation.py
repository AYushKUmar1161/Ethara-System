from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.allocation import SeatAllocation
from app.repositories.base import BaseRepository


class SeatAllocationRepository(BaseRepository[SeatAllocation]):
    def __init__(self, db: AsyncSession):
        super().__init__(SeatAllocation, db)

    async def get_active_allocation_by_employee(self, employee_id: int) -> Optional[SeatAllocation]:
        """Fetch the active seat allocation for an employee."""
        result = await self.db.execute(
            select(SeatAllocation).filter(
                SeatAllocation.employee_id == employee_id,
                SeatAllocation.status == "Active"
            )
        )
        return result.scalar_one_or_none()

    async def get_active_allocation_by_seat(self, seat_id: int) -> Optional[SeatAllocation]:
        """Fetch the active seat allocation for a seat."""
        result = await self.db.execute(
            select(SeatAllocation).filter(
                SeatAllocation.seat_id == seat_id,
                SeatAllocation.status == "Active"
            )
        )
        return result.scalar_one_or_none()

    async def get_allocation_history_by_employee(self, employee_id: int) -> List[SeatAllocation]:
        """Fetch all historical allocations for an employee."""
        result = await self.db.execute(
            select(SeatAllocation)
            .filter(SeatAllocation.employee_id == employee_id)
            .order_by(SeatAllocation.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_allocation_history_by_seat(self, seat_id: int) -> List[SeatAllocation]:
        """Fetch all historical allocations for a seat."""
        result = await self.db.execute(
            select(SeatAllocation)
            .filter(SeatAllocation.seat_id == seat_id)
            .order_by(SeatAllocation.created_at.desc())
        )
        return list(result.scalars().all())
