from fastapi import APIRouter
from app.routers.auth import router as auth_router
from app.routers.employees import router as employees_router
from app.routers.projects import router as projects_router
from app.routers.facility import router as facility_router
from app.routers.allocation import router as allocations_router
from app.routers.dashboard import router as dashboard_router
from app.routers.search import router as search_router
from app.routers.audit import router as audit_router
from app.routers.ai import router as ai_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(employees_router)
api_router.include_router(projects_router)
api_router.include_router(facility_router)
api_router.include_router(allocations_router)
api_router.include_router(dashboard_router)
api_router.include_router(search_router)
api_router.include_router(audit_router)
api_router.include_router(ai_router)
