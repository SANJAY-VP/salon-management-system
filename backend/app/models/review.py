from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Review(Base):
    """
    Review model - user reviews and ratings for shops
    """
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    shop_id = Column(Integer, ForeignKey("barber_shops.id", ondelete="CASCADE"), nullable=False)
    
    # Review details
    rating = Column(Integer, nullable=False)  # 1-5 stars
    title = Column(String(255), nullable=True)
    comment = Column(Text, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)  # Verified if user actually visited
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="reviews")
    shop = relationship("BarberShop", back_populates="reviews")
    
    def __repr__(self):
        return f"<Review(id={self.id}, rating={self.rating}, shop_id={self.shop_id})>"
