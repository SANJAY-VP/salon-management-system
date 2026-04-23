"""
Dashboard and search routes for discovering barber shops
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.services.barber_shop_service import BarberShopService
from app.services.service_service import ServiceService
from app.schemas.shop_schemas import BarberShopResponse
from app.schemas.service_schemas import ServiceResponse


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/search", response_model=List[BarberShopResponse])
def search_shops(
    latitude: Optional[float] = Query(None, ge=-90, le=90),
    longitude: Optional[float] = Query(None, ge=-180, le=180),
    keyword: Optional[str] = Query(None, description="Search keyword for name/description"),
    city: Optional[str] = Query(None, description="Filter by city"),
    state: Optional[str] = Query(None, description="Filter by state"),
    pincode: Optional[str] = Query(None, description="Filter by pincode"),
    radius_km: float = Query(10.0, ge=0.1, le=100, description="Search radius in km"),
    min_rating: Optional[float] = Query(None, ge=0, le=5, description="Minimum rating"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Number of records to return"),
    db: Session = Depends(get_db)
):
    """
    Search for barber shops with advanced filtering
    
    Supports:
    - Keyword search (name, description)
    - Location-based search (latitude, longitude, radius)
    - City/State/Pincode filters
    - Minimum rating filter
    - Pagination (skip, limit)
    
    Public endpoint - no authentication required
    """
    shops = BarberShopService.search_shops(
        db=db,
        keyword=keyword,
        city=city,
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
        min_rating=min_rating,
        skip=skip,
        limit=limit
    )
    
    return shops


@router.get("/shops/{shop_id}/services", response_model=List[ServiceResponse])
def get_shop_services(shop_id: int, db: Session = Depends(get_db)):
    """
    Get all active services offered by a shop
    
    Public endpoint - no authentication required
    """
    shop = BarberShopService.get_shop_by_id(db, shop_id)
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )
    
    services = ServiceService.get_services_by_shop(db, shop_id, active_only=True)
    return services


@router.get("/featured", response_model=List[BarberShopResponse])
def get_featured_shops(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Get featured/top-rated shops
    
    Returns shops sorted by rating
    Public endpoint - no authentication required
    """
    shops = BarberShopService.search_shops(
        db=db,
        min_rating=4.0,
        skip=0,
        limit=limit
    )
    
    return sorted(shops, key=lambda x: x.average_rating, reverse=True)
