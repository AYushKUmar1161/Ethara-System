from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.allocation import (
    AllocationCreate, BulkAllocationCreate, BulkReleaseRequest,
    TransferRequest, MaintenanceBlockRequest, SeatAllocationRead
)
from app.schemas.facility import SeatRead
from app.services.seat_engine import SeatEngineService
from app.services.security import PermissionChecker
from app.models.rbac import User
from app.repositories import SeatAllocationRepository

router = APIRouter(prefix="/allocations", tags=["Seat Allocation Engine"])


@router.get("", response_model=List[SeatAllocationRead])
async def list_allocations(
    status: Optional[str] = Query(None, description="Active, Released, Reserved"),
    employee_id: Optional[int] = Query(None),
    project_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["read:all"]))
):
    """Retrieve list of allocations, with optional filtering and pagination."""
    repo = SeatAllocationRepository(db)
    filters = {}
    if status:
        filters["status"] = status
    if employee_id:
        filters["employee_id"] = employee_id
    if project_id:
        filters["project_id"] = project_id
    return await repo.get_all(skip=skip, limit=limit, filters=filters)


@router.post("", response_model=SeatAllocationRead, status_code=status.HTTP_201_CREATED)
async def manual_allocate(
    payload: AllocationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["write:allocations"]))
):
    """Manually allocate a seat to an employee."""
    service = SeatEngineService(db)
    try:
        alloc = await service.allocate_seat(
            seat_id=payload.seat_id,
            employee_id=payload.employee_id,
            allocated_by_id=current_user.id
        )
        await db.commit()
        return alloc
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/auto/{employee_id}", response_model=SeatAllocationRead, status_code=status.HTTP_201_CREATED)
async def auto_allocate(
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["write:allocations"]))
):
    """Intelligently match and auto-allocate an available seat to an employee."""
    service = SeatEngineService(db)
    try:
        alloc = await service.auto_allocate_seat(
            employee_id=employee_id,
            allocated_by_id=current_user.id
        )
        await db.commit()
        return alloc
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{allocation_id}/release", response_model=SeatAllocationRead)
async def release_seat_allocation(
    allocation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["write:allocations"]))
):
    """Release an active seat allocation."""
    service = SeatEngineService(db)
    try:
        alloc = await service.release_seat(
            allocation_id=allocation_id,
            released_by_id=current_user.id
        )
        await db.commit()
        return alloc
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{allocation_id}/transfer", response_model=SeatAllocationRead)
async def transfer_seat_allocation(
    allocation_id: int,
    payload: TransferRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["write:allocations"]))
):
    """Transfer an employee from their current seat to a target seat."""
    service = SeatEngineService(db)
    try:
        alloc = await service.transfer_seat(
            current_alloc_id=allocation_id,
            target_seat_id=payload.target_seat_id,
            transferred_by_id=current_user.id
        )
        await db.commit()
        return alloc
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/bulk-allocate", response_model=List[SeatAllocationRead])
async def bulk_allocate_seats(
    payload: BulkAllocationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["write:allocations"]))
):
    """Intelligently allocate seats to a list of employees in bulk."""
    service = SeatEngineService(db)
    allocations = await service.bulk_allocate(
        employee_ids=payload.employee_ids,
        allocated_by_id=current_user.id
    )
    await db.commit()
    return allocations


@router.post("/bulk-release", response_model=List[SeatAllocationRead])
async def bulk_release_seats(
    payload: BulkReleaseRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["write:allocations"]))
):
    """Release a list of allocations in bulk."""
    service = SeatEngineService(db)
    released = await service.bulk_release(
        allocation_ids=payload.allocation_ids,
        released_by_id=current_user.id
    )
    await db.commit()
    return released


@router.post("/seats/{seat_id}/maintenance", response_model=SeatRead)
async def block_seat_for_maintenance(
    seat_id: int,
    payload: MaintenanceBlockRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["write:allocations"]))
):
    """Block a seat and mark its status as Maintenance, releasing any active allocations."""
    service = SeatEngineService(db)
    try:
        seat = await service.maintenance_block(
            seat_id=seat_id,
            blocked_by_id=current_user.id,
            reason=payload.reason
        )
        await db.commit()
        return seat
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
