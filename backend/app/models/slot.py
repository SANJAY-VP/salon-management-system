from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Time, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class SlotStatus(str, enum.Enum):
    """Slot status enumeration"""
    AVAILABLE = "available"
    BOOKED = "booked"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Slot(Base):
    """
    Slot model - time slots for bookings
    """
    __tablename__ = "slots"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    shop_id = Column(Integer, ForeignKey("barber_shops.id", ondelete="CASCADE"), nullable=False)
    barber_id = Column(Integer, ForeignKey("barbers.id", ondelete="CASCADE"), nullable=True)
    
    # Slot timing
    date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    # Status
    status = Column(SQLEnum(SlotStatus), default=SlotStatus.AVAILABLE, nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    shop = relationship("BarberShop", back_populates="slots")
    barber = relationship("Barber", back_populates="slots")
    booking = relationship("Booking", back_populates="slot", uselist=False)
    
    def __repr__(self):
        return f"<Slot(id={self.id}, date={self.date}, time={self.start_time}-{self.end_time}, status={self.status})>"
