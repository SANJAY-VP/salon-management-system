"""
Pydantic schemas for authentication endpoints
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class RegisterRequest(BaseModel):
    """Schema for user registration"""
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    full_name: str = Field(..., min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    role: UserRole = UserRole.CUSTOMER
    
    # Optional location fields
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


class LoginRequest(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Schema for token response"""
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    role: str


class ChangePasswordRequest(BaseModel):
    """Schema for changing password"""
    current_password: str
    new_password: str = Field(..., min_length=8, description="Password must be at least 8 characters")


class ForgotPasswordRequest(BaseModel):
    """Schema for forgot password"""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Schema for password reset"""
    token: str
    new_password: str = Field(..., min_length=8, description="Password must be at least 8 characters")


class UpdateProfileRequest(BaseModel):
    """Schema for updating user profile"""
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    avatar: Optional[str] = None


class UserResponse(BaseModel):
    """Schema for user response"""
    id: int
    email: str
    full_name: str
    phone: Optional[str]
    role: str
    is_active: bool
    is_verified: bool
    points: int
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    pincode: Optional[str]
    avatar: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
