"""
Main FastAPI application entry point for Salon Management System
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
import logging
import time
import uvicorn

from app.config import settings
from app.db.database import engine, Base, create_tables
from app.middleware.auth_middleware import AuthenticationMiddleware

from app.api.routes import auth, shops, dashboard, bookings, slots, services, reviews, barbers, images
import os

logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Local disk uploads (skipped when CLOUDINARY_URL is set)
if not settings.CLOUDINARY_URL:
    os.makedirs("uploads/avatars", exist_ok=True)
    os.makedirs("uploads/shops", exist_ok=True)
    os.makedirs("uploads/profiles", exist_ok=True)

def _clean_operation_id(route) -> str:
    """Generate clean, human-readable operation IDs: '<tag>_<method>_<path>'."""
    tags = getattr(route, "tags", None) or ["api"]
    tag = tags[0].lower().replace(" ", "_")
    # Use explicit operation_id when provided, otherwise derive from path + method
    methods = getattr(route, "methods", {"GET"})
    method = next(iter(methods)).lower()
    path_part = route.path.replace("/", "_").strip("_").replace("{", "").replace("}", "")
    return f"{tag}_{method}_{path_part}"


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="A comprehensive slot-based booking system for salon/barber shops",
    debug=settings.DEBUG,
    generate_unique_id_function=_clean_operation_id,
)

allow_origins=[
    "http://localhost:5173",
    "https://salon-management-system-1-rpjn.onrender.com"
]
# allow_credentials=True

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Authentication Middleware
app.add_middleware(AuthenticationMiddleware)



@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests and their processing time"""
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(
        f"{request.method} {request.url.path} "
        f"completed in {process_time:.3f}s with status {response.status_code}"
    )
    
    response.headers["X-Process-Time"] = str(process_time)
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with detailed messages"""
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": exc.errors()
        }
    )


@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(request: Request, exc: SQLAlchemyError):
    """Handle database errors"""
    logger.error(f"Database error: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Database error occurred"}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle all other exceptions"""
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred"}
    )


@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Debug mode: {settings.DEBUG}")
    
    create_tables()
    logger.info("Database tables created/verified")


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    logger.info("Shutting down application")


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION
    }


if not settings.CLOUDINARY_URL:
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router, prefix="/api/v1")
app.include_router(shops.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(bookings.router, prefix="/api/v1")
app.include_router(slots.router, prefix="/api/v1")
app.include_router(services.router, prefix="/api/v1")
app.include_router(reviews.router, prefix="/api/v1")
app.include_router(barbers.router, prefix="/api/v1")
app.include_router(images.router, prefix="/api/v1")


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )


