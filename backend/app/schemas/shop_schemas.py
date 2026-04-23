"""
Pydantic schemas for BarberShop model
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import time


class BarberShopCreate(BaseModel):
    """Schema for creating a new barber shop"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    phone: str = Field(..., min_length=10, max_length=20)
    email: Optional[str] = None
    
    address: str = Field(..., min_length=1)
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100)
    pincode: str = Field(..., min_length=5, max_length=10)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    
    opening_time: Optional[time] = None
    closing_time: Optional[time] = None
    accepts_home_service: bool = False
    images: Optional[str] = None


class BarberShopUpdate(BaseModel):
    """Schema for updating a barber shop"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    email: Optional[str] = None
    
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    
    opening_time: Optional[time] = None
    closing_time: Optional[time] = None
    accepts_home_service: Optional[bool] = None
    images: Optional[str] = None


class BarberShopStatusUpdate(BaseModel):
    """Schema for updating shop open/close status"""
    is_open: bool


class BarberShopResponse(BaseModel):
    """Schema for barber shop response"""
    id: int
    owner_id: int
    name: str
    description: Optional[str]
    phone: str
    email: Optional[str]
    
    address: str
    city: str
    state: str
    pincode: str
    latitude: float
    longitude: float
    
    opening_time: Optional[time]
    closing_time: Optional[time]
    
    is_open: bool
    is_active: bool
    accepts_home_service: bool
    
    average_rating: float
    total_reviews: int
    
    images: Optional[str]
    
    class Config:
        from_attributes = True


class BarberShopSearch(BaseModel):
    """Schema for searching barber shops"""
    keyword: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    radius_km: float = Field(default=10.0, ge=0.1, le=100)
    min_rating: Optional[float] = Field(None, ge=0, le=5)
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=10, ge=1, le=100)


