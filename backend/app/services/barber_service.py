from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.barber import Barber


class BarberService:
    """
    Service class for Barber CRUD operations
    """
    
    @staticmethod
    def create_barber(
        db: Session,
        shop_id: int,
        name: str,
        **kwargs
    ) -> Barber:
        """
        Create a new barber
        
        Args:
            db: Database session
            shop_id: Shop ID where barber works
            name: Barber name
            **kwargs: Additional fields (phone, email, specialization, etc.)
        
        Returns:
            Created Barber object
        """
        barber = Barber(
            shop_id=shop_id,
            name=name,
            **kwargs
        )
        db.add(barber)
        db.commit()
        db.refresh(barber)
        return barber
    
    @staticmethod
    def get_barber_by_id(db: Session, barber_id: int) -> Optional[Barber]:
        """Get barber by ID"""
        return db.query(Barber).filter(Barber.id == barber_id).first()
    
    @staticmethod
    def get_barbers_by_shop(
        db: Session,
        shop_id: int,
        is_active: bool = True
    ) -> List[Barber]:
        """
        Get all barbers for a specific shop
        
        Args:
            db: Database session
            shop_id: Shop ID
            is_active: Filter by active status
        
        Returns:
            List of Barber objects
        """
        query = db.query(Barber).filter(Barber.shop_id == shop_id)
        if is_active is not None:
            query = query.filter(Barber.is_active == is_active)
        return query.all()
    
    @staticmethod
    def get_all_barbers(
        db: Session,
        skip: int = 0,
        limit: int = 100
    ) -> List[Barber]:
        """
        Get all barbers with pagination
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
        
        Returns:
            List of Barber objects
        """
        return db.query(Barber).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_barber(db: Session, barber_id: int, **kwargs) -> Optional[Barber]:
        """
        Update barber information
        
        Args:
            db: Database session
            barber_id: Barber ID
            **kwargs: Fields to update
        
        Returns:
            Updated Barber object or None
        """
        barber = db.query(Barber).filter(Barber.id == barber_id).first()
        if barber:
            for key, value in kwargs.items():
                if hasattr(barber, key) and value is not None:
                    setattr(barber, key, value)
            db.commit()
            db.refresh(barber)
        return barber
    
    @staticmethod
    def delete_barber(db: Session, barber_id: int) -> bool:
        """
        Delete a barber
        
        Args:
            db: Database session
            barber_id: Barber ID
        
        Returns:
            True if deleted, False if not found
        """
        barber = db.query(Barber).filter(Barber.id == barber_id).first()
        if barber:
            db.delete(barber)
            db.commit()
            return True
        return False
    
    @staticmethod
    def activate_barber(db: Session, barber_id: int) -> Optional[Barber]:
        """Activate a barber"""
        barber = db.query(Barber).filter(Barber.id == barber_id).first()
        if barber:
            barber.is_active = True
            db.commit()
            db.refresh(barber)
        return barber
    
    @staticmethod
    def deactivate_barber(db: Session, barber_id: int) -> Optional[Barber]:
        """Deactivate a barber"""
        barber = db.query(Barber).filter(Barber.id == barber_id).first()
        if barber:
            barber.is_active = False
            db.commit()
            db.refresh(barber)
        return barber
