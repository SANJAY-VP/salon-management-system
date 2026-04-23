from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class PaymentStatus(str, enum.Enum):
    """Payment status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentMethod(str, enum.Enum):
    """Payment method enumeration"""
    RAZORPAY = "razorpay"
    CASH = "cash"
    UPI = "upi"
    CARD = "card"
    WALLET = "wallet"


class Transaction(Base):
    """
    Transaction model - payment transactions
    """
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Transaction details
    transaction_id = Column(String(100), unique=True, nullable=False, index=True)
    payment_gateway_id = Column(String(255), nullable=True)  # Razorpay payment ID
    payment_method = Column(SQLEnum(PaymentMethod), nullable=False)
    
    # Amount details
    amount = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    final_amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    
    # Status
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False, index=True)
    
    # Additional info
    payment_details = Column(Text, nullable=True)  # Store JSON data
    failure_reason = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    booking = relationship("Booking", back_populates="transaction")
    
    def __repr__(self):
        return f"<Transaction(id={self.id}, transaction_id={self.transaction_id}, status={self.status})>"
