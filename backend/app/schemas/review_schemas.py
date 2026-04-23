"""
Pydantic schemas for Review model
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ReviewCreate(BaseModel):
    """Schema for creating a new review"""
    shop_id: int
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = Field(None, max_length=255)
    comment: Optional[str] = None


class ReviewUpdate(BaseModel):
    """Schema for updating a review"""
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = Field(None, max_length=255)
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    """Schema for review response"""
    id: int
    user_id: int
    shop_id: int
    rating: int
    title: Optional[str]
    comment: Optional[str]
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


