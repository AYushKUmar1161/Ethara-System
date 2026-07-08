from typing import Dict, List, Any
from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_employees: int
    occupied_seats: int
    available_seats: int
    reserved_seats: int
    pending_allocations: int
    total_projects: int


class FloorUtilization(BaseModel):
    floor_number: int
    floor_name: str
    total_seats: int
    occupied_seats: int
    utilization_rate: float


class ProjectUtilization(BaseModel):
    project_id: int
    project_name: str
    allocated_seats: int


class ZoneUtilization(BaseModel):
    zone_code: str
    total_seats: int
    occupied_seats: int
    utilization_rate: float


class DepartmentDistribution(BaseModel):
    department_name: str
    employee_count: int


class MonthlyJoiningTrend(BaseModel):
    month: str
    joining_count: int


class DashboardAnalyticsResponse(BaseModel):
    stats: DashboardStats
    floor_utilization: List[FloorUtilization]
    project_utilization: List[ProjectUtilization]
    zone_utilization: List[ZoneUtilization]
    department_distribution: List[DepartmentDistribution]
    monthly_joining_trend: List[MonthlyJoiningTrend]
