import time
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.routers import api_router
import redis
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ethara-app")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise Seat Allocation & Project Mapping System Backend REST APIs",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to Redis for Rate Limiting
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    redis_client.ping()
    logger.info("Connected to Redis successfully for rate-limiting.")
except Exception as e:
    redis_client = None
    logger.warning(f"Could not connect to Redis: {e}. Rate limiting disabled (fallback).")


# Rate Limiting Middleware
@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    # Skip rate limiting for docs, openapi, or local tests if needed
    path = request.url.path
    if path.startswith("/docs") or path.startswith("/redoc") or "openapi.json" in path:
        return await call_next(request)

    if redis_client:
        client_ip = request.client.host if request.client else "unknown"
        # Set limit of 100 requests per minute per IP
        key = f"rate_limit:{client_ip}:{int(time.time() / 60)}"
        try:
            requests_count = redis_client.incr(key)
            if requests_count == 1:
                redis_client.expire(key, 60)
            if requests_count > 200:  # 200 requests per minute
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"detail": "Too many requests. Please try again later."}
                )
        except Exception as e:
            logger.warning(f"Redis rate limiting write failed: {e}")
            
    return await call_next(request)


# Security Headers Middleware
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    # OWASP Secure headers
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# Global Exception Handling
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled Exception occurred: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please contact support."}
    )


# Mount All APIs
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health Checks"])
async def health_check():
    """Simple API status checks for load balancers or container orchestrators."""
    redis_alive = False
    if redis_client:
        try:
            redis_alive = redis_client.ping()
        except Exception:
            pass
            
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "redis_connected": redis_alive
    }
