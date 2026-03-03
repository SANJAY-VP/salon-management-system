from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from app.db.database import Base


class BarberShop(Base):
    """
    Barber Shop model
    """
    __tablename__ = "barber_shops"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Basic information
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    phone = Column(String(20), nullable=False)
    email = Column(String(255), nullable=True)
    
    # Location information
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    
    # Business hours
    opening_time = Column(Time, nullable=True)
    closing_time = Column(Time, nullable=True)
    
    # Status
    is_open = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    accepts_home_service = Column(Boolean, default=False)
    
    # Ratings
    average_rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    
    # Images (store URLs as comma-separated string or use JSON)
    images = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="barber_shops")
    barbers = relationship("Barber", back_populates="shop", cascade="all, delete-orphan")
    services = relationship("Service", back_populates="shop", cascade="all, delete-orphan")
    slots = relationship("Slot", back_populates="shop", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="shop", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="shop", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<BarberShop(id={self.id}, name={self.name}, city={self.city})>"
