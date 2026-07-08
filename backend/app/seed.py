import asyncio
import random
from datetime import datetime, date, timedelta
from faker import Faker
from sqlalchemy import insert, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import engine, async_session_factory
from app.models import (
    Base, Role, Permission, User, Session, Department, Project,
    Employee, Floor, Zone, Bay, Seat, SeatAllocation, AuditLog
)
from bcrypt import hashpw, gensalt

fake = Faker()


async def clean_database(session: AsyncSession):
    """Clean all tables before seeding."""
    print("Cleaning existing database records...")
    for table in reversed(Base.metadata.sorted_tables):
        await session.execute(table.delete())
    await session.commit()


async def seed_roles_and_permissions(session: AsyncSession):
    """Seed default roles and permissions."""
    print("Seeding roles and permissions...")
    
    # Define permissions
    permissions_data = [
        {"name": "read:all", "description": "Read all data"},
        {"name": "write:employees", "description": "Create, update, delete employees"},
        {"name": "write:projects", "description": "Create, update, delete projects"},
        {"name": "write:allocations", "description": "Allocate, release, and transfer seats"},
        {"name": "read:self", "description": "Read own employee profile"},
    ]
    
    await session.execute(insert(Permission), permissions_data)
    
    # Retrieve permissions
    perms_result = await session.execute(select(Permission))
    perms = {p.name: p for p in perms_result.scalars().all()}
    
    # Create roles
    admin_role = Role(name="Admin", description="System Administrator")
    hr_role = Role(name="HR", description="Human Resources Manager")
    pm_role = Role(name="Project Manager", description="Project Manager")
    emp_role = Role(name="Employee", description="Standard Employee")
    
    # Assign permissions
    admin_role.permissions = list(perms.values())
    hr_role.permissions = [perms["read:all"], perms["write:employees"], perms["write:allocations"]]
    pm_role.permissions = [perms["read:all"], perms["write:projects"], perms["write:allocations"]]
    emp_role.permissions = [perms["read:self"]]
    
    session.add_all([admin_role, hr_role, pm_role, emp_role])
    await session.commit()
    
    # Fetch roles for reference
    roles_result = await session.execute(select(Role))
    return {r.name: r for r in roles_result.scalars().all()}


async def seed_departments_and_projects(session: AsyncSession):
    """Seed departments and projects."""
    print("Seeding departments and projects...")
    
    depts_data = [
        {"name": "Engineering", "code": "ENG", "description": "Software development and infrastructure"},
        {"name": "Product Management", "code": "PDT", "description": "Product strategy and roadmap"},
        {"name": "Design", "code": "DSN", "description": "UI/UX and product design"},
        {"name": "Sales", "code": "SLS", "description": "Direct sales and accounts"},
        {"name": "Marketing", "code": "MKT", "description": "Growth, branding, and campaigns"},
        {"name": "Human Resources", "code": "HR", "description": "Talent acquisition and operations"},
        {"name": "Finance", "code": "FIN", "description": "Accounting and strategic planning"},
        {"name": "Operations", "code": "OPS", "description": "Facilities and daily operations"},
    ]
    
    await session.execute(insert(Department), depts_data)
    depts_result = await session.execute(select(Department))
    departments = depts_result.scalars().all()
    
    projects_data = []
    project_names = [
        "Project Apollo", "Project Gemini", "Project Titan", "Project Orion", 
        "Project Athena", "Project Artemis", "Project Ares", "Project Phoenix", 
        "Project Hermes", "Project Kronos"
    ]
    
    for i, name in enumerate(project_names):
        code = name.upper().replace(" ", "_")
        dept = random.choice(departments)
        start_date = date.today() - timedelta(days=random.randint(100, 500))
        projects_data.append({
            "name": name,
            "code": code,
            "description": f"Strategic initiative for {dept.name} department",
            "department_id": dept.id,
            "status": "Active",
            "start_date": start_date,
            "end_date": None
        })
        
    await session.execute(insert(Project), projects_data)
    projects_result = await session.execute(select(Project))
    
    return departments, projects_result.scalars().all()


async def seed_facility_layout(session: AsyncSession):
    """Seed floors, zones, bays, and seats."""
    print("Seeding office facilities layout (5 floors, 10 zones, 100 bays, 5,500 seats)...")
    
    # 1. Floors
    floors_data = [{"name": f"Floor {f}", "number": f} for f in range(1, 6)]
    await session.execute(insert(Floor), floors_data)
    floors_result = await session.execute(select(Floor))
    floors = floors_result.scalars().all()
    
    # 2. Zones (2 zones per floor)
    zones_data = []
    for floor in floors:
        for z in ["A", "B"]:
            zones_data.append({
                "floor_id": floor.id,
                "name": f"Zone {z}",
                "code": f"F{floor.number}Z{z}"
            })
    await session.execute(insert(Zone), zones_data)
    zones_result = await session.execute(select(Zone))
    zones = zones_result.scalars().all()
    
    # 3. Bays (10 bays per zone = 100 bays total)
    bays_data = []
    for zone in zones:
        for b in range(1, 11):
            bays_data.append({
                "zone_id": zone.id,
                "name": f"Bay {b}",
                "code": f"{zone.code}B{b:02d}"
            })
    await session.execute(insert(Bay), bays_data)
    bays_result = await session.execute(select(Bay))
    bays = bays_result.scalars().all()
    
    # 4. Seats (55 seats per bay = 5500 seats)
    seats_data = []
    seat_counter = 1
    for bay in bays:
        for s in range(1, 56):
            # Select seat type (90% Standard, 5% HotDesk, 5% Ergonomic)
            stype = random.choices(["Standard", "HotDesk", "Ergonomic"], weights=[90, 5, 5])[0]
            # Seat Number format: S-Floor-Zone-Bay-Number (e.g. S-1-A-1-45)
            # Find associated floor and zone code from bay
            seat_number = f"S-{bay.code}-{s:02d}"
            seats_data.append({
                "bay_id": bay.id,
                "number": seat_number,
                "status": "Available",
                "type": stype
            })
    
    # Bulk insert seats using execute(insert)
    await session.execute(insert(Seat), seats_data)
    seats_result = await session.execute(select(Seat))
    
    return seats_result.scalars().all()


async def seed_employees_and_allocations(
    session: AsyncSession, 
    roles: dict, 
    departments: list, 
    projects: list, 
    seats: list
):
    """Seed 5000 employees and their corresponding seat allocations."""
    print("Generating 5,000 employees and allocations...")
    
    # Set default password hash
    password_hash = hashpw("password123".encode("utf-8"), gensalt()).decode("utf-8")
    
    # Create Default Admin User
    admin_user = User(
        id=1,
        username="admin",
        email="admin@ethara.com",
        hashed_password=hashpw("admin123".encode("utf-8"), gensalt()).decode("utf-8"),
        role_id=roles["Admin"].id,
        is_active=True
    )
    session.add(admin_user)
    await session.commit()
    
    # Prepare list for bulk users and employees insertion
    users_data = []
    employees_data = []
    
    # Create users & employees records
    # 4,950 employees will get a User login, 50 (e.g. contractors/etc.) can just be employees
    total_employees = 5000
    
    for i in range(1, total_employees + 1):
        emp_id = f"EMP{i:04d}"
        first_name = fake.first_name()
        last_name = fake.last_name()
        email = f"{first_name.lower()}.{last_name.lower()}{i}@ethara.com"
        phone = fake.phone_number()[:20]
        dept = random.choice(departments)
        proj = random.choice(projects) if random.random() > 0.15 else None
        
        # User account for employee (except last 50)
        user_id = None
        if i <= (total_employees - 50):
            # Select role: 1% HR, 2% PM, 97% Employee
            role_choice = random.choices(["HR", "Project Manager", "Employee"], weights=[1, 2, 97])[0]
            role = roles[role_choice]
            
            users_data.append({
                "id": i + 1,  # 1 is admin
                "username": f"user{i}",
                "email": email,
                "hashed_password": password_hash,
                "role_id": role.id,
                "is_active": True
            })
            user_id = i + 1
            
        employees_data.append({
            "id": i,
            "user_id": user_id,
            "employee_id": emp_id,
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "phone": phone,
            "department_id": dept.id,
            "project_id": proj.id if proj else None,
            "status": "Active"
        })
        
    print("Bulk inserting users...")
    await session.execute(insert(User), users_data)
    
    print("Bulk inserting employees...")
    await session.execute(insert(Employee), employees_data)
    
    # Retrieve employees
    emp_result = await session.execute(select(Employee))
    employees = emp_result.scalars().all()
    
    print("Allocating seats...")
    # Seat breakdown:
    # 5,500 seats total.
    # 5,000 employees total.
    # 50 employees are pending allocation (unseated).
    # 4,950 employees will be seated.
    # 100 seats will be reserved (linked to 100 seated employees).
    # 4,850 seats will be occupied (linked to 4,850 seated employees).
    # 500 seats will be available (no employees).
    # 50 seats will be maintenance (no employees).
    
    # Shuffle seats and employees for random allocation
    seats_to_allocate = list(seats)
    random.shuffle(seats_to_allocate)
    
    seated_employees = list(employees[:4950])
    # Last 50 employees (4950 to 5000) have no seat and are "Pending Allocation"
    
    allocations_data = []
    seat_status_updates = {}
    
    # First 100 seated employees: Reserved seats
    for idx, emp in enumerate(seated_employees[:100]):
        seat = seats_to_allocate.pop()
        allocations_data.append({
            "seat_id": seat.id,
            "employee_id": emp.id,
            "project_id": emp.project_id,
            "allocated_by_id": admin_user.id,
            "status": "Reserved",
            "start_date": datetime.utcnow() - timedelta(days=random.randint(10, 50)),
            "end_date": None
        })
        seat_status_updates[seat.id] = "Reserved"
        
    # Remaining 4,850 seated employees: Occupied seats
    for idx, emp in enumerate(seated_employees[100:]):
        seat = seats_to_allocate.pop()
        allocations_data.append({
            "seat_id": seat.id,
            "employee_id": emp.id,
            "project_id": emp.project_id,
            "allocated_by_id": admin_user.id,
            "status": "Active",
            "start_date": datetime.utcnow() - timedelta(days=random.randint(10, 50)),
            "end_date": None
        })
        seat_status_updates[seat.id] = "Occupied"
        
    # Out of the remaining 550 seats:
    # 50 seats: Maintenance
    for s in range(50):
        seat = seats_to_allocate.pop()
        seat_status_updates[seat.id] = "Maintenance"
        
    # The remaining 500 seats will be left as "Available" (default state, nothing in updates)
    
    print("Bulk inserting allocations...")
    await session.execute(insert(SeatAllocation), allocations_data)
    
    print("Updating seat statuses in database...")
    # Execute batch seat status updates to match allocation states
    for seat_id, new_status in seat_status_updates.items():
        # Update dynamically
        await session.execute(
            Seat.__table__.update().where(Seat.id == seat_id).values(status=new_status)
        )
        
    await session.commit()
    print("Seeding allocations completed successfully.")


async def seed_audit_logs(session: AsyncSession):
    """Seed dummy audit logs to populate the history tab."""
    print("Seeding audit logs...")
    audit_data = [
        {
            "user_id": 1,
            "action": "system_initialize",
            "details": "Ethara System Initialized and Seeded with 5,000 employees and 5,500 seats.",
            "ip_address": "127.0.0.1",
            "created_at": datetime.utcnow() - timedelta(hours=2)
        },
        {
            "user_id": 1,
            "action": "login",
            "details": "System Administrator logged in.",
            "ip_address": "127.0.0.1",
            "created_at": datetime.utcnow() - timedelta(hours=1)
        }
    ]
    await session.execute(insert(AuditLog), audit_data)
    await session.commit()


async def main():
    print("Starting database seeding process...")
    async with async_session_factory() as session:
        try:
            await clean_database(session)
            roles = await seed_roles_and_permissions(session)
            departments, projects = await seed_departments_and_projects(session)
            seats = await seed_facility_layout(session)
            await seed_employees_and_allocations(session, roles, departments, projects, seats)
            await seed_audit_logs(session)
            
            # Reset postgres sequences so subsequent autoincrements don't fail
            print("Resetting primary key sequences...")
            tables_to_reset = [
                "users", "employees", "roles", "permissions", "departments", 
                "projects", "floors", "zones", "bays", "seats", 
                "seat_allocations", "audit_logs", "notifications"
            ]
            for table_name in tables_to_reset:
                await session.execute(text(
                    f"SELECT setval('{table_name}_id_seq', COALESCE((SELECT MAX(id) FROM {table_name}), 1), true);"
                ))
            await session.commit()
            
            print("Database Seeding Completed Successfully! All tables fully populated.")
        except Exception as e:
            print(f"Error during seeding: {e}")
            await session.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(main())
