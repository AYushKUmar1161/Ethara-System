import pytest
from datetime import datetime
from sqlalchemy import select

from app.models import Role, Permission, User, Department, Project, Employee, Floor, Zone, Bay, Seat, SeatAllocation
from app.services.seat_engine import SeatEngineService


@pytest.mark.asyncio
async def test_manual_allocation(test_db):
    # 1. Create base records
    role = Role(name="Employee")
    test_db.add(role)
    await test_db.flush()

    user = User(username="johndoe", email="john@example.com", hashed_password="pwd", role_id=role.id)
    test_db.add(user)
    await test_db.flush()

    dept = Department(name="Engineering", code="ENG")
    test_db.add(dept)
    await test_db.flush()

    project = Project(name="Project X", code="PROJ_X", start_date=datetime.utcnow().date())
    test_db.add(project)
    await test_db.flush()

    employee = Employee(
        employee_id="EMP101",
        first_name="John",
        last_name="Doe",
        email="john@example.com",
        department_id=dept.id,
        project_id=project.id
    )
    test_db.add(employee)
    await test_db.flush()

    floor = Floor(name="Floor 1", number=1)
    test_db.add(floor)
    await test_db.flush()

    zone = Zone(floor_id=floor.id, name="Zone A", code="F1ZA")
    test_db.add(zone)
    await test_db.flush()

    bay = Bay(zone_id=zone.id, name="Bay 1", code="F1ZAB01")
    test_db.add(bay)
    await test_db.flush()

    seat = Seat(bay_id=bay.id, number="S-F1ZAB01-01", status="Available")
    test_db.add(seat)
    await test_db.flush()

    # 2. Run allocation
    service = SeatEngineService(test_db)
    alloc = await service.allocate_seat(seat.id, employee.id, user.id)
    
    assert alloc.status == "Active"
    assert alloc.seat_id == seat.id
    assert alloc.employee_id == employee.id
    assert seat.status == "Occupied"


@pytest.mark.asyncio
async def test_maintenance_block(test_db):
    # 1. Create mock seat
    floor = Floor(name="Floor 1", number=1)
    test_db.add(floor)
    await test_db.flush()

    zone = Zone(floor_id=floor.id, name="Zone A", code="F1ZA")
    test_db.add(zone)
    await test_db.flush()

    bay = Bay(zone_id=zone.id, name="Bay 1", code="F1ZAB01")
    test_db.add(bay)
    await test_db.flush()

    seat = Seat(bay_id=bay.id, number="S-F1ZAB01-02", status="Available")
    test_db.add(seat)
    await test_db.flush()

    # 2. Run block
    service = SeatEngineService(test_db)
    blocked_seat = await service.maintenance_block(seat.id, blocked_by_id=1, reason="Cleaning")
    
    assert blocked_seat.status == "Maintenance"
