from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from app.models.barber_shop import BarberShop
from datetime import datetime


class BarberShopService:
    """
    Service class for BarberShop CRUD operations
    """
    
    @staticmethod
    def create_shop(
        db: Session,
        owner_id: int,
        name: str,
        address: str,
        city: str,
        state: str,
        pincode: str,
        latitude: float,
        longitude: float,
        phone: str,
        **kwargs
    ) -> BarberShop:
        """
        Create a new barber shop
        
        Args:
            db: Database session
            owner_id: Owner user ID
            name: Shop name
            address: Shop address
            city: City
            state: State
            pincode: PIN code
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            phone: Contact phone
            **kwargs: Additional fields
        
        Returns:
            Created BarberShop object
        """
        shop = BarberShop(
            owner_id=owner_id,
            name=name,
            address=address,
            city=city,
            state=state,
            pincode=pincode,
            latitude=latitude,
            longitude=longitude,
            phone=phone,
            **kwargs
        )
        db.add(shop)
        db.commit()
        db.refresh(shop)
        return shop
    
    @staticmethod
    def get_shop_by_id(db: Session, shop_id: int) -> Optional[BarberShop]:
        """Get shop by ID"""
        return db.query(BarberShop).filter(BarberShop.id == shop_id).first()
    
    # @staticmethod
    # def get_all_shops(
    #     db: Session,
    #     skip: int = 0,
    #     limit: int = 100,
    #     city: Optional[str] = None,
    #     is_active: bool = True
    # ) -> List[BarberShop]:
    #     """
    #     Get all shops with pagination and filters
        
    #     Args:
    #         db: Database session
    #         skip: Number of records to skip
    #         limit: Maximum number of records to return
    #         city: Filter by city
    #         is_active: Filter by active status
        
    #     Returns:
    #         List of BarberShop objects
    #     """
    #     query = db.query(BarberShop).filter(BarberShop.is_active == is_active)
    #     if city:
    #         query = query.filter(BarberShop.city.ilike(f"%{city}%"))
    #     return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def search_shops(
        db: Session,
        keyword: Optional[str] = None,
        city: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        radius_km: float = 10.0,
        min_rating: Optional[float] = None,
        skip: int = 0,
        limit: int = 10
    ) -> List[BarberShop]:
        """
        Search shops with advanced filtering
        
        Args:
            db: Database session
            keyword: Search keyword (name, description)
            city: City filter
            latitude: User latitude for proximity search
            longitude: User longitude for proximity search
            radius_km: Search radius in kilometers
            min_rating: Minimum average rating
            skip: Number of records to skip
            limit: Maximum number of records to return
        
        Returns:
            List of BarberShop objects
        """
        query = db.query(BarberShop).filter(BarberShop.is_active == True)
        
        # Keyword search
        if keyword:
            search_pattern = f"%{keyword}%"
            query = query.filter(
                or_(
                    BarberShop.name.ilike(search_pattern),
                    BarberShop.description.ilike(search_pattern)
                )
            )
        
        # City filter
        if city:
            query = query.filter(BarberShop.city.ilike(f"%{city}%"))
        
        # Rating filter
        if min_rating:
            query = query.filter(BarberShop.average_rating >= min_rating)
        
        # Proximity search using Haversine formula (simplified)
        # Note: For production, consider using PostGIS extension for better performance
        if latitude and longitude:
            # This is a simplified approach; use PostGIS for production
            lat_range = radius_km / 111.0  # Approximate degrees
            lon_range = radius_km / (111.0 * abs(func.cos(func.radians(latitude))))
            
            query = query.filter(
                and_(
                    BarberShop.latitude.between(latitude - lat_range, latitude + lat_range),
                    BarberShop.longitude.between(longitude - lon_range, longitude + lon_range)
                )
            )
        
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def get_shops_by_owner(db: Session, owner_id: int) -> List[BarberShop]:
        """Get all shops owned by a user"""
        return db.query(BarberShop).filter(BarberShop.owner_id == owner_id).all()
    
    @staticmethod
    def update_shop(db: Session, shop_id: int, **kwargs) -> Optional[BarberShop]:
        """
        Update shop information
        
        Args:
            db: Database session
            shop_id: Shop ID
            **kwargs: Fields to update
        
        Returns:
            Updated BarberShop object or None
        """
        shop = db.query(BarberShop).filter(BarberShop.id == shop_id).first()
        if shop:
            for key, value in kwargs.items():
                if hasattr(shop, key) and value is not None:
                    setattr(shop, key, value)
            db.commit()
            db.refresh(shop)
        return shop
    
    @staticmethod
    def delete_shop(db: Session, shop_id: int) -> bool:
        """
        Delete a shop
        
        Args:
            db: Database session
            shop_id: Shop ID
        
        Returns:
            True if deleted, False if not found
        """
        shop = db.query(BarberShop).filter(BarberShop.id == shop_id).first()
        if shop:
            db.delete(shop)
            db.commit()
            return True
        return False
    
    @staticmethod
    def toggle_shop_status(db: Session, shop_id: int) -> Optional[BarberShop]:
        """Toggle shop open/closed status"""
        shop = db.query(BarberShop).filter(BarberShop.id == shop_id).first()
        if shop:
            shop.is_open = not shop.is_open
            db.commit()
            db.refresh(shop)
        return shop
    
    @staticmethod
    def update_shop_rating(db: Session, shop_id: int) -> Optional[BarberShop]:
        """
        Recalculate and update shop's average rating based on reviews
        This should be called after adding/updating/deleting a review
        """
        from app.models.review import Review
        
        shop = db.query(BarberShop).filter(BarberShop.id == shop_id).first()
        if shop:
            rating_data = db.query(
                func.avg(Review.rating),
                func.count(Review.id)
            ).filter(
                Review.shop_id == shop_id,
                Review.is_active == True
            ).first()
            
            shop.average_rating = float(rating_data[0]) if rating_data[0] else 0.0
            shop.total_reviews = rating_data[1] or 0
            db.commit()
            db.refresh(shop)
        return shop
