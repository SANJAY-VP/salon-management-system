"""
Barber Shop management routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.services.barber_shop_service import BarberShopService
from app.schemas.shop_schemas import (
    BarberShopCreate, BarberShopUpdate, BarberShopResponse,
    BarberShopStatusUpdate
)
from app.schemas.common import MessageResponse
from app.utils.dependencies import get_current_user_from_request
from app.models.user import User, UserRole


router = APIRouter(prefix="/shops", tags=["Barber Shops"])


@router.post("", response_model=BarberShopResponse, status_code=status.HTTP_201_CREATED)
def create_shop(
    shop_data: BarberShopCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create a new barber shop. Requires BARBER_OWNER role."""
    current_user = get_current_user_from_request(request)

    if current_user.role != UserRole.BARBER_OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only barber owners can create shops"
        )

    shop = BarberShopService.create_shop(
        db=db,
        owner_id=current_user.id,
        **shop_data.model_dump()
    )
    return shop


# IMPORTANT: static sub-paths must come BEFORE /{shop_id} to avoid
# FastAPI trying to parse "owner" as an integer shop_id.
@router.get("/owner/my-shops", response_model=List[BarberShopResponse])
def get_my_shops(request: Request, db: Session = Depends(get_db)):
    """Get all shops owned by the current authenticated user."""
    current_user = get_current_user_from_request(request)
    shops = BarberShopService.get_shops_by_owner(db, current_user.id)
    return shops


@router.get("/{shop_id}", response_model=BarberShopResponse)
def get_shop(shop_id: int, db: Session = Depends(get_db)):
    """Get shop details by ID (public)."""
    shop = BarberShopService.get_shop_by_id(db, shop_id)
    if not shop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found")
    return shop


@router.put("/{shop_id}", response_model=BarberShopResponse)
def update_shop(
    shop_id: int,
    shop_data: BarberShopUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update shop information. Only shop owner or admin can update."""
    current_user = get_current_user_from_request(request)

    shop = BarberShopService.get_shop_by_id(db, shop_id)
    if not shop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found")

    if shop.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this shop"
        )

    update_data = shop_data.model_dump(exclude_unset=True)
    updated_shop = BarberShopService.update_shop(db, shop_id, **update_data)
    return updated_shop


@router.patch("/{shop_id}/status", response_model=BarberShopResponse)
def update_shop_status(
    shop_id: int,
    status_data: BarberShopStatusUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Toggle shop open/close status."""
    current_user = get_current_user_from_request(request)

    shop = BarberShopService.get_shop_by_id(db, shop_id)
    if not shop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found")

    if shop.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this shop"
        )

    updated_shop = BarberShopService.update_shop(db, shop_id, is_open=status_data.is_open)
    return updated_shop


@router.delete("/{shop_id}", response_model=MessageResponse)
def delete_shop(
    shop_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """Delete a shop. Only shop owner or admin can delete."""
    current_user = get_current_user_from_request(request)

    shop = BarberShopService.get_shop_by_id(db, shop_id)
    if not shop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found")

    if shop.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this shop"
        )

    success = BarberShopService.delete_shop(db, shop_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete shop"
        )

    return MessageResponse(message="Shop deleted successfully")
