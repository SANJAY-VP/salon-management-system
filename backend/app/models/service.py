from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class ServiceCategory(str, enum.Enum):
    """Service category enumeration"""
    HAIRCUT = "haircut"
    SHAVE = "shave"
    MAKEUP = "makeup"
    SPA = "spa"
    FACIAL = "facial"
    MASSAGE = "massage"
    HAIR_COLOR = "hair_color"
    STYLING = "styling"
    OTHER = "other"


class Service(Base):
    """
    Service model - services offered by barber shops
    """
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    shop_id = Column(Integer, ForeignKey("barber_shops.id", ondelete="CASCADE"), nullable=False)
    
    # Service details
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(SQLEnum(ServiceCategory), nullable=False, index=True)
    
    # Pricing
    price = Column(Float, nullable=False)
    duration_minutes = Column(Integer, nullable=False)  # Duration in minutes
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    shop = relationship("BarberShop", back_populates="services")
    bookings = relationship("Booking", back_populates="service")
    
    def __repr__(self):
        return f"<Service(id={self.id}, name={self.name}, price={self.price})>"
