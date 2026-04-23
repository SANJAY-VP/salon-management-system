"""
Barber management routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.services.barber_service import BarberService
from app.services.barber_shop_service import BarberShopService
from app.schemas.barber_schemas import BarberCreate, BarberUpdate, BarberResponse
from app.schemas.common import MessageResponse
from app.utils.dependencies import get_current_user_from_request
from app.models.user import UserRole


router = APIRouter(prefix="/barbers", tags=["Barbers"])


@router.post("", response_model=BarberResponse, status_code=status.HTTP_201_CREATED)
def create_barber(
    barber_data: BarberCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create a new barber for a shop. Only shop owner can add barbers."""
    current_user = get_current_user_from_request(request)

    shop = BarberShopService.get_shop_by_id(db, barber_data.shop_id)
    if not shop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found")

    if shop.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to add barbers to this shop"
        )

    data = barber_data.model_dump()
    shop_id = data.pop("shop_id")
    name = data.pop("name")
    
    barber = BarberService.create_barber(
        db=db,
        shop_id=shop_id,
        name=name,
        **data
    )
    return barber


@router.get("/shop/{shop_id}", response_model=List[BarberResponse])
def get_shop_barbers(
    shop_id: int,
    db: Session = Depends(get_db)
):
    """Get all barbers for a shop (public)."""
    barbers = BarberService.get_barbers_by_shop(db, shop_id, is_active=None)
    return barbers


@router.get("/{barber_id}", response_model=BarberResponse)
def get_barber(barber_id: int, db: Session = Depends(get_db)):
    """Get barber details by ID."""
    barber = BarberService.get_barber_by_id(db, barber_id)
    if not barber:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barber not found")
    return barber


@router.put("/{barber_id}", response_model=BarberResponse)
def update_barber(
    barber_id: int,
    barber_data: BarberUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update barber information. Only shop owner can update."""
    current_user = get_current_user_from_request(request)

    barber = BarberService.get_barber_by_id(db, barber_id)
    if not barber:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barber not found")

    shop = BarberShopService.get_shop_by_id(db, barber.shop_id)
    if shop.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this barber"
        )

    update_data = barber_data.model_dump(exclude_unset=True)
    updated_barber = BarberService.update_barber(db, barber_id, **update_data)
    return updated_barber


@router.delete("/{barber_id}", response_model=MessageResponse)
def delete_barber(
    barber_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Delete a barber. Only shop owner can delete."""
    current_user = get_current_user_from_request(request)

    barber = BarberService.get_barber_by_id(db, barber_id)
    if not barber:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Barber not found")

    shop = BarberShopService.get_shop_by_id(db, barber.shop_id)
    if shop.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this barber"
        )

    success = BarberService.delete_barber(db, barber_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete barber"
        )

    return MessageResponse(message="Barber deleted successfully")
