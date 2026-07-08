from typing import Optional, List, Dict, Any
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.facility import Floor, Zone, Bay, Seat
from app.repositories.base import BaseRepository


class FloorRepository(BaseRepository[Floor]):
    def __init__(self, db: AsyncSession):
        super().__init__(Floor, db)

    async def get_by_number(self, number: int) -> Optional[Floor]:
        result = await self.db.execute(select(Floor).filter(Floor.number == number))
        return result.scalar_one_or_none()


class ZoneRepository(BaseRepository[Zone]):
    def __init__(self, db: AsyncSession):
        super().__init__(Zone, db)

    async def get_by_code(self, code: str) -> Optional[Zone]:
        result = await self.db.execute(select(Zone).filter(Zone.code == code))
        return result.scalar_one_or_none()


class BayRepository(BaseRepository[Bay]):
    def __init__(self, db: AsyncSession):
        super().__init__(Bay, db)

    async def get_by_code(self, code: str) -> Optional[Bay]:
        result = await self.db.execute(select(Bay).filter(Bay.code == code))
        return result.scalar_one_or_none()


class SeatRepository(BaseRepository[Seat]):
    def __init__(self, db: AsyncSession):
        super().__init__(Seat, db)

    async def get_by_number(self, number: str) -> Optional[Seat]:
        result = await self.db.execute(select(Seat).filter(Seat.number == number))
        return result.scalar_one_or_none()

    async def get_seats_by_bay(self, bay_id: int) -> List[Seat]:
        result = await self.db.execute(select(Seat).filter(Seat.bay_id == bay_id).order_by(Seat.number.asc()))
        return list(result.scalars().all())

    async def get_seats_by_status(self, status: str) -> List[Seat]:
        result = await self.db.execute(select(Seat).filter(Seat.status == status))
        return list(result.scalars().all())

    async def get_available_seats_by_floor(self, floor_id: int) -> List[Seat]:
        """Fetch all available seats on a specific floor."""
        stmt = (
            select(Seat)
            .join(Bay)
            .join(Zone)
            .filter(Zone.floor_id == floor_id, Seat.status == "Available")
            .order_by(Seat.number.asc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def count_seats_by_status_summary(self) -> Dict[str, int]:
        """Get count summary of seats by their current status."""
        stmt = select(Seat.status, func.count(Seat.id)).group_by(Seat.status)
        result = await self.db.execute(stmt)
        return {status: count for status, count in result.all()}
