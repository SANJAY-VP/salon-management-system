"""
Pydantic schemas for Slot model
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, time
from app.models.slot import SlotStatus


class SlotCreate(BaseModel):
    """Schema for creating a new slot"""
    shop_id: int
    barber_id: Optional[int] = None
    date: date
    start_time: time
    end_time: time


class SlotBulkCreate(BaseModel):
    """Schema for creating multiple slots"""
    shop_id: int
    barber_id: Optional[int] = None
    date: date
    time_slots: List[tuple[time, time]]


class SlotUpdate(BaseModel):
    """Schema for updating a slot"""
    barber_id: Optional[int] = None
    status: Optional[SlotStatus] = None
    is_active: Optional[bool] = None


class SlotResponse(BaseModel):
    """Schema for slot response"""
    id: int
    shop_id: int
    barber_id: Optional[int]
    date: date
    start_time: time
    end_time: time
    status: SlotStatus
    is_active: bool
    
    class Config:
        from_attributes = True


class SlotQuery(BaseModel):
    """Schema for querying slots"""
    shop_id: int
    date: Optional[date] = None
    barber_id: Optional[int] = None
    status: Optional[SlotStatus] = None


class SlotAutoGenerate(BaseModel):
    """Schema for auto-generating slots from shop opening/closing hours"""
    date: date
    barber_id: Optional[int] = None
    interval_minutes: int = Field(default=30, ge=15, le=120)


