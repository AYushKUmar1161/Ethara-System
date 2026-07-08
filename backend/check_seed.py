import asyncio
from app.database import async_session_factory
from app.models import Employee, Seat, Project, Floor, Zone
from sqlalchemy import select, func

async def check():
    async with async_session_factory() as session:
        emp_count = (await session.execute(select(func.count(Employee.id)))).scalar()
        seat_count = (await session.execute(select(func.count(Seat.id)))).scalar()
        proj_count = (await session.execute(select(func.count(Project.id)))).scalar()
        floor_count = (await session.execute(select(func.count(Floor.id)))).scalar()
        zone_count = (await session.execute(select(func.count(Zone.id)))).scalar()
        
        avail_count = (await session.execute(select(func.count(Seat.id)).filter(Seat.status == "Available"))).scalar()
        res_count = (await session.execute(select(func.count(Seat.id)).filter(Seat.status == "Reserved"))).scalar()
        
        # Pending allocations are active employees who do not have an active or reserved seat allocation
        from app.models import SeatAllocation
        allocated_emp_ids = select(SeatAllocation.employee_id).filter(SeatAllocation.status.in_(["Active", "Reserved"]))
        pending_stmt = select(func.count(Employee.id)).filter(
            Employee.status == "Active",
            ~Employee.id.in_(allocated_emp_ids)
        )
        pending_count = (await session.execute(pending_stmt)) .scalar()
        
        print(f"EMPLOYEES: {emp_count}")
        print(f"SEATS: {seat_count}")
        print(f"PROJECTS: {proj_count}")
        print(f"FLOORS: {floor_count}")
        print(f"ZONES: {zone_count}")
        print(f"AVAILABLE: {avail_count}")
        print(f"RESERVED: {res_count}")
        print(f"PENDING: {pending_count}")

if __name__ == "__main__":
    asyncio.run(check())
