"""
Service management routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.services.service_service import ServiceService
from app.services.barber_shop_service import BarberShopService
from app.schemas.service_schemas import ServiceCreate, ServiceUpdate, ServiceResponse
from app.schemas.common import MessageResponse
from app.utils.dependencies import get_current_user_from_request
from app.models.user import UserRole


router = APIRouter(prefix="/services", tags=["Services"])


@router.post("", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(
    service_data: ServiceCreate,
    shop_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create a new service for a shop. Only the shop owner can add services."""
    current_user = get_current_user_from_request(request)

    shop = BarberShopService.get_shop_by_id(db, shop_id)
    if not shop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found")

    if shop.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to add services to this shop"
        )

    service = ServiceService.create_service(
        db=db,
        shop_id=shop_id,
        **service_data.model_dump()
    )
    return service


# IMPORTANT: /shop/{shop_id} must come BEFORE /{service_id} so FastAPI
# doesn't try to parse "shop" as an integer service_id.
@router.get("/shop/{shop_id}", response_model=List[ServiceResponse])
def get_shop_services(
    shop_id: int,
    include_inactive: bool = False,
    db: Session = Depends(get_db)
):
    """Get all services for a shop. By default only returns active services (public)."""
    services = ServiceService.get_services_by_shop(
        db, shop_id, active_only=not include_inactive
    )
    return services


@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(service_id: int, db: Session = Depends(get_db)):
    """Get service details by ID."""
    service = ServiceService.get_service_by_id(db, service_id)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return service


@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: int,
    service_data: ServiceUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update service information. Only the shop owner can update services."""
    current_user = get_current_user_from_request(request)

    service = ServiceService.get_service_by_id(db, service_id)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")

    shop = BarberShopService.get_shop_by_id(db, service.shop_id)
    if shop.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this service"
        )

    update_data = service_data.model_dump(exclude_unset=True)
    updated_service = ServiceService.update_service(db, service_id, **update_data)
    return updated_service


@router.delete("/{service_id}", response_model=MessageResponse)
def delete_service(
    service_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Delete a service. Only the shop owner can delete services."""
    current_user = get_current_user_from_request(request)

    service = ServiceService.get_service_by_id(db, service_id)
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")

    shop = BarberShopService.get_shop_by_id(db, service.shop_id)
    if shop.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this service"
        )

    success = ServiceService.delete_service(db, service_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete service"
        )

    return MessageResponse(message="Service deleted successfully")
