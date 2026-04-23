"""
Pydantic schemas for Booking model — includes enriched response with
slot date/time, service details, shop name, and amount paid so the
frontend can render receipts without extra API calls.
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime, date, time
from app.models.booking import BookingStatus


class BookingCreate(BaseModel):
    """Schema for creating a new booking"""
    slot_id: int
    service_id: int
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_phone: str = Field(..., min_length=10, max_length=20)
    customer_email: Optional[EmailStr] = None
    notes: Optional[str] = None
    points_used: int = Field(default=0, ge=0)


class BookingUpdate(BaseModel):
    """Schema for updating a booking"""
    status: Optional[BookingStatus] = None
    notes: Optional[str] = None


class BookingResponse(BaseModel):
    """
    Full booking response.

    Core fields always present; enriched fields (slot_*, service_*, shop_*,
    amount_paid) are populated by the list/detail endpoints so the client
    can render a proper receipt without chaining extra requests.
    """
    # ── Core fields ──────────────────────────────────────────────────────
    id: int
    user_id: int
    shop_id: int
    slot_id: int
    service_id: Optional[int]
    booking_code: str
    status: BookingStatus
    customer_name: str
    customer_phone: str
    customer_email: Optional[str]
    notes: Optional[str]
    points_used: int
    points_earned: int
    created_at: datetime

    # ── Enriched fields (slot) ────────────────────────────────────────────
    slot_date: Optional[date] = None
    slot_start_time: Optional[time] = None
    slot_end_time: Optional[time] = None

    # ── Enriched fields (service) ─────────────────────────────────────────
    service_name: Optional[str] = None
    service_price: Optional[float] = None

    # ── Enriched fields (shop) ────────────────────────────────────────────
    shop_name: Optional[str] = None

    # ── Enriched fields (payment) ─────────────────────────────────────────
    amount_paid: Optional[float] = None
    payment_method: Optional[str] = None

    class Config:
        from_attributes = True


class BookingConfirm(BaseModel):
    booking_id: int


class BookingCancel(BaseModel):
    reason: Optional[str] = None


class BookingComplete(BaseModel):
    points_earned: int = Field(default=0, ge=0)
