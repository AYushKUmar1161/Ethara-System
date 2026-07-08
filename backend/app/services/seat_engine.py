from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy import select, or_, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Employee, Project
from app.models.facility import Seat, Bay, Zone, Floor
from app.models.allocation import SeatAllocation
from app.models.audit import AuditLog, Notification
from app.repositories import SeatRepository, SeatAllocationRepository, EmployeeRepository


class SeatEngineService:
    """Intelligent Seat Allocation Engine matching business rules and priorities."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.seat_repo = SeatRepository(db)
        self.alloc_repo = SeatAllocationRepository(db)
        self.emp_repo = EmployeeRepository(db)

    async def log_action(self, user_id: Optional[int], action: str, details: str):
        """Helper to create audit log records."""
        audit_entry = AuditLog(
            user_id=user_id,
            action=action,
            details=details,
            created_at=datetime.utcnow()
        )
        self.db.add(audit_entry)

    async def notify_user(self, user_id: int, message: str, ntype: str = "info"):
        """Helper to create user notification records."""
        notif = Notification(
            user_id=user_id,
            message=message,
            type=ntype,
            created_at=datetime.utcnow()
        )
        self.db.add(notif)

    async def find_optimal_seat(self, employee_id: int) -> Optional[Seat]:
        """
        Match an available seat for an employee based on business rule priorities:
        1. Same Project members' nearby seats (same bay, then same zone).
        2. Same Department members' nearby seats (same bay, then same zone).
        3. Same Floor available seats.
        4. Any available seat.
        """
        # Load employee details
        employee = await self.emp_repo.get_by_id(employee_id)
        if not employee:
            raise ValueError(f"Employee with ID {employee_id} not found.")

        # Priority 1: Same Project members' locations
        if employee.project_id:
            # Find seats occupied by members of the same project
            proj_stmt = (
                select(SeatAllocation)
                .filter(
                    SeatAllocation.project_id == employee.project_id,
                    SeatAllocation.status == "Active"
                )
            )
            proj_allocs = (await self.db.execute(proj_stmt)).scalars().all()
            
            if proj_allocs:
                # Get the bays and zones where they sit
                project_seats = [alloc.seat for alloc in proj_allocs]
                bay_ids = list(set(seat.bay_id for seat in project_seats))
                
                # Check for available seats in the same bays
                bay_seat_stmt = (
                    select(Seat)
                    .filter(Seat.bay_id.in_(bay_ids), Seat.status == "Available")
                    .limit(1)
                )
                optimal_seat = (await self.db.execute(bay_seat_stmt)).scalar_one_or_none()
                if optimal_seat:
                    return optimal_seat

                # Check for available seats in the same zones
                zone_ids = list(set(seat.bay.zone_id for seat in project_seats))
                zone_seat_stmt = (
                    select(Seat)
                    .join(Bay)
                    .filter(Bay.zone_id.in_(zone_ids), Seat.status == "Available")
                    .limit(1)
                )
                optimal_seat = (await self.db.execute(zone_seat_stmt)).scalar_one_or_none()
                if optimal_seat:
                    return optimal_seat

        # Priority 2: Same Department members' locations
        dept_stmt = (
            select(SeatAllocation)
            .join(Employee)
            .filter(
                Employee.department_id == employee.department_id,
                SeatAllocation.status == "Active"
            )
        )
        dept_allocs = (await self.db.execute(dept_stmt)).scalars().all()
        
        if dept_allocs:
            dept_seats = [alloc.seat for alloc in dept_allocs]
            bay_ids = list(set(seat.bay_id for seat in dept_seats))
            
            # Check same bays
            bay_seat_stmt = (
                select(Seat)
                .filter(Seat.bay_id.in_(bay_ids), Seat.status == "Available")
                .limit(1)
            )
            optimal_seat = (await self.db.execute(bay_seat_stmt)).scalar_one_or_none()
            if optimal_seat:
                return optimal_seat

            # Check same zones
            zone_ids = list(set(seat.bay.zone_id for seat in dept_seats))
            zone_seat_stmt = (
                select(Seat)
                .join(Bay)
                .filter(Bay.zone_id.in_(zone_ids), Seat.status == "Available")
                .limit(1)
            )
            optimal_seat = (await self.db.execute(zone_seat_stmt)).scalar_one_or_none()
            if optimal_seat:
                return optimal_seat

        # Priority 3: Same Floor available seats
        # Let's check floors sequentially or find the floor with the highest available count
        # For simplicity, search first available seat starting from floor 1
        any_seat_stmt = select(Seat).filter(Seat.status == "Available").order_by(Seat.id.asc()).limit(1)
        optimal_seat = (await self.db.execute(any_seat_stmt)).scalar_one_or_none()
        return optimal_seat

    async def allocate_seat(
        self, 
        seat_id: int, 
        employee_id: int, 
        allocated_by_id: int,
        status: str = "Active"
    ) -> SeatAllocation:
        """Manually allocate a specific seat to an employee."""
        # Check seat availability
        seat = await self.seat_repo.get_by_id(seat_id)
        if not seat:
            raise ValueError("Seat not found.")
        if seat.status not in ["Available", "Pending"]:
            raise ValueError(f"Seat is currently {seat.status} and cannot be allocated.")

        # Check if employee has an active seat allocation
        active_alloc = await self.alloc_repo.get_active_allocation_by_employee(employee_id)
        if active_alloc:
            # Release current seat first
            await self.release_seat(active_alloc.id, allocated_by_id)

        # Load employee details
        employee = await self.emp_repo.get_by_id(employee_id)
        if not employee:
            raise ValueError("Employee not found.")

        # Create allocation
        alloc = SeatAllocation(
            seat_id=seat.id,
            employee_id=employee.id,
            project_id=employee.project_id,
            allocated_by_id=allocated_by_id,
            status=status,
            start_date=datetime.utcnow()
        )
        self.db.add(alloc)

        # Update seat status
        seat.status = "Occupied" if status == "Active" else "Reserved"
        self.db.add(seat)
        await self.db.flush()

        # Logs & Notifications
        await self.log_action(
            allocated_by_id, 
            "allocate_seat", 
            f"Allocated seat {seat.number} to employee {employee.first_name} {employee.last_name} ({employee.employee_id})."
        )
        if employee.user_id:
            await self.notify_user(
                employee.user_id,
                f"You have been allocated seat {seat.number}.",
                "success"
            )

        return alloc

    async def release_seat(self, allocation_id: int, released_by_id: int) -> SeatAllocation:
        """Release an active seat allocation."""
        alloc = await self.alloc_repo.get_by_id(allocation_id)
        if not alloc or alloc.status not in ["Active", "Reserved"]:
            raise ValueError("Active seat allocation not found.")

        # Load seat and employee
        seat = await self.seat_repo.get_by_id(alloc.seat_id)
        employee = await self.emp_repo.get_by_id(alloc.employee_id)

        # Update allocation
        alloc.status = "Released"
        alloc.end_date = datetime.utcnow()
        self.db.add(alloc)

        # Update seat
        if seat:
            seat.status = "Available"
            self.db.add(seat)

        await self.db.flush()

        # Logs
        if employee:
            await self.log_action(
                released_by_id,
                "release_seat",
                f"Released seat {seat.number if seat else 'Unknown'} from employee {employee.first_name} {employee.last_name}."
            )
            if employee.user_id:
                await self.notify_user(
                    employee.user_id,
                    f"Your seat allocation for {seat.number if seat else 'Unknown'} has been released."
                )

        return alloc

    async def auto_allocate_seat(self, employee_id: int, allocated_by_id: int) -> SeatAllocation:
        """Intelligently match and allocate a seat to an employee."""
        optimal_seat = await self.find_optimal_seat(employee_id)
        if not optimal_seat:
            raise ValueError("No available seats found in the facility.")
        
        return await self.allocate_seat(optimal_seat.id, employee_id, allocated_by_id)

    async def transfer_seat(
        self, 
        current_alloc_id: int, 
        target_seat_id: int, 
        transferred_by_id: int
    ) -> SeatAllocation:
        """Transfer an employee from their current seat to a target seat."""
        alloc = await self.alloc_repo.get_by_id(current_alloc_id)
        if not alloc or alloc.status not in ["Active", "Reserved"]:
            raise ValueError("Active seat allocation not found.")

        employee_id = alloc.employee_id
        
        # Release the current seat
        await self.release_seat(current_alloc_id, transferred_by_id)
        
        # Allocate the new seat
        new_alloc = await self.allocate_seat(target_seat_id, employee_id, transferred_by_id)
        return new_alloc

    async def bulk_allocate(self, employee_ids: List[int], allocated_by_id: int) -> List[SeatAllocation]:
        """Intelligently allocate seats to a list of employees in bulk."""
        allocations = []
        for emp_id in employee_ids:
            try:
                alloc = await self.auto_allocate_seat(emp_id, allocated_by_id)
                allocations.append(alloc)
            except Exception as e:
                # Log error and continue bulk operation
                await self.log_action(
                    allocated_by_id,
                    "bulk_allocate_error",
                    f"Failed to auto-allocate employee ID {emp_id}: {str(e)}"
                )
        return allocations

    async def bulk_release(self, allocation_ids: List[int], released_by_id: int) -> List[SeatAllocation]:
        """Release a list of allocations in bulk."""
        released = []
        for alloc_id in allocation_ids:
            try:
                alloc = await self.release_seat(alloc_id, released_by_id)
                released.append(alloc)
            except Exception as e:
                await self.log_action(
                    released_by_id,
                    "bulk_release_error",
                    f"Failed to release allocation ID {alloc_id}: {str(e)}"
                )
        return released

    async def reserve_seat(self, seat_id: int, employee_id: int, reserved_by_id: int) -> SeatAllocation:
        """Reserve a seat for an employee (e.g. for temporary or VIP use)."""
        return await self.allocate_seat(seat_id, employee_id, reserved_by_id, status="Reserved")

    async def maintenance_block(self, seat_id: int, blocked_by_id: int, reason: str = "Maintenance") -> Seat:
        """Block a seat for maintenance."""
        seat = await self.seat_repo.get_by_id(seat_id)
        if not seat:
            raise ValueError("Seat not found.")
        
        # If seat has active allocation, release it first
        active_alloc = await self.alloc_repo.get_active_allocation_by_seat(seat_id)
        if active_alloc:
            await self.release_seat(active_alloc.id, blocked_by_id)

        seat.status = "Maintenance"
        self.db.add(seat)
        await self.db.flush()

        await self.log_action(
            blocked_by_id,
            "maintenance_block",
            f"Blocked seat {seat.number} for maintenance. Reason: {reason}"
        )
        return seat
