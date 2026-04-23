from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Barber(Base):
    """
    Barber model - individual barbers working at a shop
    """
    __tablename__ = "barbers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    shop_id = Column(Integer, ForeignKey("barber_shops.id", ondelete="CASCADE"), nullable=False)
    
    # Basic information
    name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    specialization = Column(String(255), nullable=True)  # e.g., "Hair styling", "Makeup", "Spa"
    experience_years = Column(Integer, default=0)
    
    # Bio and profile
    bio = Column(Text, nullable=True)
    profile_image = Column(Text, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Rating
    average_rating = Column(Integer, default=0)
    total_reviews = Column(Integer, default=0)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    shop = relationship("BarberShop", back_populates="barbers")
    slots = relationship("Slot", back_populates="barber", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Barber(id={self.id}, name={self.name}, shop_id={self.shop_id})>"
