from typing import List, Optional, Any
from pydantic import BaseModel
from app.schemas.organization import EmployeeRead, ProjectRead
from app.schemas.facility import SeatRead


class SearchResult(BaseModel):
    employees: List[EmployeeRead]
    projects: List[ProjectRead]
    seats: List[SeatRead]
    total_employees: int
    total_projects: int
    total_seats: int
