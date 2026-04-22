"""
Pydantic schemas for Service model
"""
from pydantic import BaseModel, Field
from typing import Optional
from app.models.service import ServiceCategory


class ServiceCreate(BaseModel):
    """Schema for creating a new service"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: ServiceCategory
    price: float = Field(..., gt=0)
    duration_minutes: int = Field(..., gt=0)


class ServiceUpdate(BaseModel):
    """Schema for updating a service"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[ServiceCategory] = None
    price: Optional[float] = Field(None, gt=0)
    duration_minutes: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None


class ServiceResponse(BaseModel):
    """Schema for service response"""
    id: int
    shop_id: int
    name: str
    description: Optional[str]
    category: ServiceCategory
    price: float
    duration_minutes: int
    is_active: bool
    
    class Config:
        from_attributes = True


