from datetime import datetime, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.dashboard import (
    DashboardAnalyticsResponse, DashboardStats, FloorUtilization,
    ProjectUtilization, ZoneUtilization, DepartmentDistribution, MonthlyJoiningTrend
)
from app.models.organization import Employee, Project, Department
from app.models.facility import Floor, Zone, Bay, Seat
from app.models.allocation import SeatAllocation
from app.services.security import PermissionChecker
from app.models.rbac import User

router = APIRouter(prefix="/dashboard", tags=["Analytics Dashboard"])


@router.get("/analytics", response_model=DashboardAnalyticsResponse)
async def get_dashboard_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(PermissionChecker(["read:all"]))
):
    """Retrieve full analytics payload for rendering dashboard indicators, heatmaps, and charts."""
    
    # 1. Total Counts
    total_emp = (await db.execute(select(func.count(Employee.id)).filter(Employee.status == "Active"))).scalar() or 0
    total_proj = (await db.execute(select(func.count(Project.id)).filter(Project.status == "Active"))).scalar() or 0
    
    # Seat breakdown
    occupied_seats = (await db.execute(select(func.count(Seat.id)).filter(Seat.status == "Occupied"))).scalar() or 0
    available_seats = (await db.execute(select(func.count(Seat.id)).filter(Seat.status == "Available"))).scalar() or 0
    reserved_seats = (await db.execute(select(func.count(Seat.id)).filter(Seat.status == "Reserved"))).scalar() or 0
    
    # Seated employees count = active allocations
    active_allocs_count = (await db.execute(select(func.count(SeatAllocation.id)).filter(SeatAllocation.status == "Active"))).scalar() or 0
    
    # Pending allocation: Active employees who do not have an active or reserved seat allocation
    allocated_emp_ids_stmt = select(SeatAllocation.employee_id).filter(SeatAllocation.status.in_(["Active", "Reserved"]))
    pending_allocs = (await db.execute(
        select(func.count(Employee.id))
        .filter(Employee.status == "Active", ~Employee.id.in_(allocated_emp_ids_stmt))
    )).scalar() or 0

    stats = DashboardStats(
        total_employees=total_emp,
        occupied_seats=occupied_seats,
        available_seats=available_seats,
        reserved_seats=reserved_seats,
        pending_allocations=pending_allocs,
        total_projects=total_proj
    )

    # 2. Floor Utilization
    floor_util_data = []
    floors = (await db.execute(select(Floor))).scalars().all()
    for f in floors:
        total_f_seats = (await db.execute(
            select(func.count(Seat.id))
            .join(Bay).join(Zone)
            .filter(Zone.floor_id == f.id)
        )).scalar() or 0
        
        occupied_f_seats = (await db.execute(
            select(func.count(Seat.id))
            .join(Bay).join(Zone)
            .filter(Zone.floor_id == f.id, Seat.status == "Occupied")
        )).scalar() or 0
        
        rate = (occupied_f_seats / total_f_seats * 100) if total_f_seats > 0 else 0.0
        floor_util_data.append(
            FloorUtilization(
                floor_number=f.number,
                floor_name=f.name,
                total_seats=total_f_seats,
                occupied_seats=occupied_f_seats,
                utilization_rate=round(rate, 2)
            )
        )

    # 3. Project Utilization (seated counts)
    proj_util_data = []
    projects = (await db.execute(select(Project).filter(Project.status == "Active"))).scalars().all()
    for p in projects:
        allocated_seats = (await db.execute(
            select(func.count(SeatAllocation.id))
            .filter(SeatAllocation.project_id == p.id, SeatAllocation.status == "Active")
        )).scalar() or 0
        proj_util_data.append(
            ProjectUtilization(
                project_id=p.id,
                project_name=p.name,
                allocated_seats=allocated_seats
            )
        )

    # 4. Zone Utilization
    zone_util_data = []
    zones = (await db.execute(select(Zone))).scalars().all()
    for z in zones:
        total_z_seats = (await db.execute(
            select(func.count(Seat.id))
            .join(Bay)
            .filter(Bay.zone_id == z.id)
        )).scalar() or 0
        
        occupied_z_seats = (await db.execute(
            select(func.count(Seat.id))
            .join(Bay)
            .filter(Bay.zone_id == z.id, Seat.status == "Occupied")
        )).scalar() or 0
        
        rate = (occupied_z_seats / total_z_seats * 100) if total_z_seats > 0 else 0.0
        zone_util_data.append(
            ZoneUtilization(
                zone_code=z.code,
                total_seats=total_z_seats,
                occupied_seats=occupied_z_seats,
                utilization_rate=round(rate, 2)
            )
        )

    # 5. Department Distribution
    dept_dist_data = []
    departments = (await db.execute(select(Department))).scalars().all()
    for d in departments:
        emp_count = (await db.execute(
            select(func.count(Employee.id))
            .filter(Employee.department_id == d.id, Employee.status == "Active")
        )).scalar() or 0
        dept_dist_data.append(
            DepartmentDistribution(
                department_name=d.name,
                employee_count=emp_count
            )
        )

    # 6. Monthly Joining Trend (last 6 months)
    joining_trend = []
    today = datetime.today()
    # Mocking standard monthly joining distribution based on employee registration date
    for i in range(5, -1, -1):
        m_start = (today - timedelta(days=i*30)).replace(day=1)
        # Fetch month string (e.g. "Jan", "Feb")
        m_str = m_start.strftime("%b")
        # Count employees created in this month
        m_next = (m_start + timedelta(days=32)).replace(day=1)
        
        count = (await db.execute(
            select(func.count(Employee.id))
            .filter(
                Employee.created_at >= m_start,
                Employee.created_at < m_next
            )
        )).scalar() or 0
        
        joining_trend.append(
            MonthlyJoiningTrend(
                month=m_str,
                joining_count=count
            )
        )

    return DashboardAnalyticsResponse(
        stats=stats,
        floor_utilization=floor_util_data,
        project_utilization=proj_util_data,
        zone_utilization=zone_util_data,
        department_distribution=dept_dist_data,
        monthly_joining_trend=joining_trend
    )
