"""
Pydantic schemas for Barber model
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional


class BarberCreate(BaseModel):
    """Schema for creating a new barber"""
    shop_id: int
    name: str = Field(..., min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    specialization: Optional[str] = None
    experience_years: int = Field(default=0, ge=0)
    bio: Optional[str] = None
    profile_image: Optional[str] = None


class BarberUpdate(BaseModel):
    """Schema for updating a barber"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = Field(None, ge=0)
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    is_active: Optional[bool] = None


class BarberResponse(BaseModel):
    """Schema for barber response"""
    id: int
    shop_id: int
    name: str
    phone: Optional[str]
    email: Optional[str]
    specialization: Optional[str]
    experience_years: int
    bio: Optional[str]
    profile_image: Optional[str]
    is_active: bool
    average_rating: int
    total_reviews: int
    
    class Config:
        from_attributes = True


