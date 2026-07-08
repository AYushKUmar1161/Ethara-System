from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.schemas.facility import FloorRead, ZoneRead, BayRead, SeatRead, SeatUpdate
from app.repositories.facility import FloorRepository, ZoneRepository, BayRepository, SeatRepository
from app.services.security import PermissionChecker
from app.models.rbac import User
from app.models.facility import Floor, Zone, Bay, Seat

router = APIRouter(prefix="/facility", tags=["Office Facility Layout"])


@router.get("/floors", response_model=List[FloorRead])
async def list_floors(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["read:all"]))
):
    """Retrieve list of all office floors."""
    repo = FloorRepository(db)
    return await repo.get_all(limit=100)


@router.get("/zones", response_model=List[ZoneRead])
async def list_zones(
    floor_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["read:all"]))
):
    """Retrieve list of zones, with optional floor filtering."""
    repo = ZoneRepository(db)
    filters = {}
    if floor_id:
        filters["floor_id"] = floor_id
    return await repo.get_all(limit=200, filters=filters)


@router.get("/bays", response_model=List[BayRead])
async def list_bays(
    zone_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["read:all"]))
):
    """Retrieve list of bays, with optional zone filtering."""
    repo = BayRepository(db)
    filters = {}
    if zone_id:
        filters["zone_id"] = zone_id
    return await repo.get_all(limit=500, filters=filters)


@router.get("/seats", response_model=List[SeatRead])
async def list_seats(
    bay_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["read:all"]))
):
    """Retrieve list of seats with filtering options and pagination."""
    repo = SeatRepository(db)
    filters = {}
    if bay_id:
        filters["bay_id"] = bay_id
    if status:
        filters["status"] = status
    if type:
        filters["type"] = type
    return await repo.get_all(skip=skip, limit=limit, filters=filters)


@router.get("/seats/floor/{floor_id}", response_model=List[SeatRead])
async def list_seats_by_floor(
    floor_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["read:all"]))
):
    """Retrieve all seats on a specific floor."""
    stmt = (
        select(Seat)
        .join(Seat.bay)
        .join(Bay.zone)
        .filter(Zone.floor_id == floor_id)
        .order_by(Seat.number.asc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/seats/{seat_id}", response_model=SeatRead)
async def get_seat(
    seat_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["read:all"]))
):
    """Fetch details of a single seat by ID."""
    repo = SeatRepository(db)
    seat = await repo.get_by_id(seat_id)
    if not seat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seat not found")
    return seat


@router.patch("/seats/{seat_id}", response_model=SeatRead)
async def update_seat(
    seat_id: int,
    payload: SeatUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["write:allocations"]))
):
    """Update seat properties (e.g. status, type)."""
    repo = SeatRepository(db)
    seat = await repo.get_by_id(seat_id)
    if not seat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seat not found")
        
    updated = await repo.update(seat, payload.model_dump(exclude_unset=True))
    await db.commit()
    return updated
