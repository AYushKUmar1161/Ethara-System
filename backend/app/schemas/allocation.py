from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.facility import SeatRead
from app.schemas.organization import EmployeeRead, ProjectRead
from app.schemas.user import UserRead


class AllocationCreate(BaseModel):
    seat_id: int
    employee_id: int


class BulkAllocationCreate(BaseModel):
    employee_ids: List[int]


class BulkReleaseRequest(BaseModel):
    allocation_ids: List[int]


class TransferRequest(BaseModel):
    target_seat_id: int


class MaintenanceBlockRequest(BaseModel):
    reason: str = "Maintenance"


class SeatAllocationRead(BaseModel):
    id: int
    seat_id: int
    employee_id: int
    project_id: Optional[int] = None
    allocated_by_id: Optional[int] = None
    status: str
    start_date: datetime
    end_date: Optional[datetime] = None
    
    seat: SeatRead
    employee: EmployeeRead
    project: Optional[ProjectRead] = None

    class Config:
        from_attributes = True
