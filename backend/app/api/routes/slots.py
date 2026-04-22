"""
Slot management routes for barber shops
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta

from app.db.database import get_db
from app.services.slot_service import SlotService
from app.services.barber_shop_service import BarberShopService
from app.schemas.slot_schemas import SlotCreate, SlotUpdate, SlotResponse, SlotAutoGenerate
from app.schemas.common import MessageResponse
from app.utils.dependencies import get_current_user_from_request
from app.models.user import UserRole
from app.models.slot import SlotStatus


router = APIRouter(prefix="/slots", tags=["Slots"])


@router.post("", response_model=SlotResponse, status_code=status.HTTP_201_CREATED, summary="Create Slot", operation_id="slot_create")
def create_slot(
    slot_data: SlotCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Create a new time slot
    
    Only shop owner can create slots for their shop
    """
    current_user = get_current_user_from_request(request)
    
    shop = BarberShopService.get_shop_by_id(db, slot_data.shop_id)
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )
    
    if shop.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to create slots for this shop"
        )
    
    slot = SlotService.create_slot(db=db, **slot_data.model_dump())
    
    return slot


@router.post("/bulk", response_model=List[SlotResponse], status_code=status.HTTP_201_CREATED, summary="Bulk Create Slots", operation_id="slot_bulk_create")
def create_bulk_slots(
    slots_data: List[SlotCreate],
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Create multiple time slots at once
    
    Only shop owner can create slots for their shop
    """
    if not slots_data:
        return []
        
    current_user = get_current_user_from_request(request)
    
    # Check permission for the first shop_id (assuming all are for the same shop)
    shop_id = slots_data[0].shop_id
    shop = BarberShopService.get_shop_by_id(db, shop_id)
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )
        
    if shop.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to create slots for this shop"
        )
        
    time_slots = [(sd.start_time, sd.end_time) for sd in slots_data]
    
    slots = SlotService.create_multiple_slots(
        db=db,
        shop_id=shop_id,
        date=slots_data[0].date,
        time_slots=time_slots,
        barber_id=slots_data[0].barber_id
    )
    
    return slots


@router.post("/shop/{shop_id}/auto-generate", response_model=List[SlotResponse], status_code=status.HTTP_200_OK, summary="Auto-Generate Slots", operation_id="slot_auto_generate")
def auto_generate_shop_slots(
    shop_id: int,
    data: SlotAutoGenerate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Auto-generate 30-min slots from shop opening to closing time for a given date.
    Idempotent — safe to call multiple times; returns existing slots if already generated.
    """
    current_user = get_current_user_from_request(request)

    shop = BarberShopService.get_shop_by_id(db, shop_id)
    if not shop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found")

    if shop.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

    if not shop.opening_time or not shop.closing_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Shop must have opening and closing times configured"
        )

    slots = SlotService.auto_generate_slots(
        db=db,
        shop_id=shop_id,
        opening_time=shop.opening_time,
        closing_time=shop.closing_time,
        slot_date=data.date,
        barber_id=data.barber_id,
        interval_minutes=data.interval_minutes,
    )
    return slots


@router.get("/shop/{shop_id}", response_model=List[SlotResponse], summary="Get Shop Slots", operation_id="slot_list_by_shop")
def get_shop_slots(
    shop_id: int,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    status: Optional[SlotStatus] = Query(None),
    barber_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get all slots for a shop (used by barber calendar view).

    When a specific start_date / end_date range is given and no slots exist yet,
    auto-generates them from the shop's opening/closing times.

    Public GET endpoint.
    """
    shop = BarberShopService.get_shop_by_id(db, shop_id)
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )

    # Auto-generate for each day in the requested range if missing
    if start_date and end_date and shop.opening_time and shop.closing_time:
        cursor = start_date
        while cursor <= end_date:
            SlotService.auto_generate_slots(
                db=db,
                shop_id=shop_id,
                opening_time=shop.opening_time,
                closing_time=shop.closing_time,
                slot_date=cursor,
            )
            cursor += timedelta(days=1)

    slots = SlotService.get_slots_by_shop(
        db=db,
        shop_id=shop_id,
        start_date=start_date,
        end_date=end_date,
        status=status,
    )

    if barber_id:
        slots = [s for s in slots if s.barber_id == barber_id]

    return slots


@router.get("/shop/{shop_id}/available", response_model=List[SlotResponse], summary="Get Available Slots", operation_id="slot_list_available")
def get_available_slots(
    shop_id: int,
    slot_date: Optional[date] = Query(None, description="Filter by specific date"),
    barber_id: Optional[int] = Query(None, description="Filter by barber"),
    db: Session = Depends(get_db)
):
    """
    Get available slots for booking.

    Production-grade self-healing endpoint: if no slots exist for the requested
    date, they are auto-generated from the shop's opening/closing times so
    customers always see real-time availability without manual intervention.

    Public endpoint — no authentication required.
    """
    shop = BarberShopService.get_shop_by_id(db, shop_id)
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )

    slots = SlotService.get_or_generate_available_slots(
        db=db,
        shop_id=shop_id,
        opening_time=shop.opening_time,
        closing_time=shop.closing_time,
        slot_date=slot_date,
        barber_id=barber_id,
    )

    return slots


@router.get("/{slot_id}", response_model=SlotResponse, summary="Get Slot by ID", operation_id="slot_get")
def get_slot(slot_id: int, db: Session = Depends(get_db)):
    """Get slot details by ID"""
    slot = SlotService.get_slot_by_id(db, slot_id)
    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Slot not found"
        )
    return slot


@router.put("/{slot_id}", response_model=SlotResponse, summary="Update Slot", operation_id="slot_update")
def update_slot(
    slot_id: int,
    slot_data: SlotUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Update slot information
    
    Only shop owner can update slots
    """
    current_user = get_current_user_from_request(request)
    
    slot = SlotService.get_slot_by_id(db, slot_id)
    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Slot not found"
        )
    
    shop = BarberShopService.get_shop_by_id(db, slot.shop_id)
    if shop.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this slot"
        )
    
    update_data = slot_data.model_dump(exclude_unset=True)
    updated_slot = SlotService.update_slot(db, slot_id, **update_data)
    
    return updated_slot


@router.delete("/{slot_id}", response_model=MessageResponse, summary="Delete Slot", operation_id="slot_delete")
def delete_slot(
    slot_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Delete a slot
    
    Only shop owner can delete slots
    """
    current_user = get_current_user_from_request(request)
    
    slot = SlotService.get_slot_by_id(db, slot_id)
    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Slot not found"
        )
    
    shop = BarberShopService.get_shop_by_id(db, slot.shop_id)
    if shop.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this slot"
        )
    
    if slot.status == SlotStatus.BOOKED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a booked slot"
        )
    
    success = SlotService.delete_slot(db, slot_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete slot"
        )
    
    return MessageResponse(message="Slot deleted successfully")


