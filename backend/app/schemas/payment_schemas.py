"""
Pydantic schemas for Transaction/Payment model
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.transaction import PaymentMethod, PaymentStatus


class PaymentCreate(BaseModel):
    """Schema for creating a payment"""
    booking_id: int
    payment_method: PaymentMethod
    amount: float = Field(..., gt=0)
    discount: float = Field(default=0.0, ge=0)
    transaction_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_signature: Optional[str] = None


class PaymentResponse(BaseModel):
    """Schema for payment response"""
    id: int
    booking_id: int
    transaction_id: str
    payment_gateway_id: Optional[str]
    payment_method: PaymentMethod
    amount: float
    discount: float
    final_amount: float
    currency: str
    status: PaymentStatus
    created_at: datetime
    
    class Config:
        from_attributes = True


class RazorpayOrderCreate(BaseModel):
    """Schema for Razorpay order creation"""
    booking_id: int
    amount: float


class RazorpayPaymentVerify(BaseModel):
    """Schema for Razorpay payment verification"""
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


