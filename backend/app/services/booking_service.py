from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import secrets
from app.models.booking import Booking, BookingStatus


class BookingService:
    """
    Service class for Booking CRUD operations
    """
    
    @staticmethod
    def generate_booking_code() -> str:
        """Generate a unique booking code"""
        return secrets.token_hex(4).upper()
    
    @staticmethod
    def create_booking(
        db: Session,
        user_id: int,
        shop_id: int,
        slot_id: int,
        service_id: int,
        customer_name: str,
        customer_phone: str,
        customer_email: Optional[str] = None,
        notes: Optional[str] = None,
        points_used: int = 0,
        **kwargs
    ) -> Booking:
        """
        Create a new booking
        
        Args:
            db: Database session
            user_id: User ID
            shop_id: Shop ID
            slot_id: Slot ID to book
            service_id: Service ID
            customer_name: Customer name
            customer_phone: Customer phone
            customer_email: Customer email
            notes: Special requests/notes
            points_used: Points used for discount
            **kwargs: Additional fields
        
        Returns:
            Created Booking object
        """
        # Generate unique booking code
        booking_code = BookingService.generate_booking_code()
        while db.query(Booking).filter(Booking.booking_code == booking_code).first():
            booking_code = BookingService.generate_booking_code()
        
        booking = Booking(
            user_id=user_id,
            shop_id=shop_id,
            slot_id=slot_id,
            service_id=service_id,
            booking_code=booking_code,
            customer_name=customer_name,
            customer_phone=customer_phone,
            customer_email=customer_email,
            notes=notes,
            points_used=points_used,
            **kwargs
        )
        
        db.add(booking)
        db.commit()
        db.refresh(booking)
        return booking
    
    @staticmethod
    def get_booking_by_id(db: Session, booking_id: int) -> Optional[Booking]:
        """Get booking by ID"""
        return db.query(Booking).filter(Booking.id == booking_id).first()
    
    @staticmethod
    def get_booking_by_code(db: Session, booking_code: str) -> Optional[Booking]:
        """Get booking by booking code"""
        return db.query(Booking).filter(Booking.booking_code == booking_code).first()
    
    @staticmethod
    def get_bookings_by_user(
        db: Session,
        user_id: int,
        status: Optional[BookingStatus] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Booking]:
        """
        Get all bookings for a user
        
        Args:
            db: Database session
            user_id: User ID
            status: Filter by booking status
            skip: Number of records to skip
            limit: Maximum number of records to return
        
        Returns:
            List of Booking objects
        """
        query = db.query(Booking).filter(Booking.user_id == user_id)
        
        if status:
            query = query.filter(Booking.status == status)
        
        return query.order_by(Booking.created_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_bookings_by_shop(
        db: Session,
        shop_id: int,
        status: Optional[BookingStatus] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Booking]:
        """
        Get all bookings for a shop
        
        Args:
            db: Database session
            shop_id: Shop ID
            status: Filter by booking status
            skip: Number of records to skip
            limit: Maximum number of records to return
        
        Returns:
            List of Booking objects
        """
        query = db.query(Booking).filter(Booking.shop_id == shop_id)
        
        if status:
            query = query.filter(Booking.status == status)
        
        return query.order_by(Booking.created_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_booking(db: Session, booking_id: int, **kwargs) -> Optional[Booking]:
        """
        Update booking information
        
        Args:
            db: Database session
            booking_id: Booking ID
            **kwargs: Fields to update
        
        Returns:
            Updated Booking object or None
        """
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if booking:
            for key, value in kwargs.items():
                if hasattr(booking, key) and value is not None:
                    setattr(booking, key, value)
            db.commit()
            db.refresh(booking)
        return booking
    
    @staticmethod
    def confirm_booking(db: Session, booking_id: int) -> Optional[Booking]:
        """Confirm a booking"""
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if booking:
            booking.status = BookingStatus.CONFIRMED
            db.commit()
            db.refresh(booking)
        return booking
    
    @staticmethod
    def complete_booking(db: Session, booking_id: int, points_earned: int = 0) -> Optional[Booking]:
        """
        Mark a booking as completed and award points
        
        Args:
            db: Database session
            booking_id: Booking ID
            points_earned: Points to award to the user
        
        Returns:
            Updated Booking object or None
        """
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if booking:
            booking.status = BookingStatus.COMPLETED
            booking.points_earned = points_earned
            
            # Award points to user
            if points_earned > 0:
                from app.services.user_service import UserService
                UserService.update_user_points(db, booking.user_id, points_earned)
            
            db.commit()
            db.refresh(booking)
        return booking
    
    @staticmethod
    def cancel_booking(db: Session, booking_id: int) -> Optional[Booking]:
        """
        Cancel a booking
        
        Args:
            db: Database session
            booking_id: Booking ID
        
        Returns:
            Updated Booking object or None
        """
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if booking:
            booking.status = BookingStatus.CANCELLED
            booking.cancelled_at = datetime.utcnow()
            
            # Make the slot available again
            from app.services.slot_service import SlotService
            from app.models.slot import SlotStatus
            SlotService.update_slot(db, booking.slot_id, status=SlotStatus.AVAILABLE)
            
            db.commit()
            db.refresh(booking)
        return booking
    
    @staticmethod
    def delete_booking(db: Session, booking_id: int) -> bool:
        """
        Delete a booking
        
        Args:
            db: Database session
            booking_id: Booking ID
        
        Returns:
            True if deleted, False if not found
        """
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if booking:
            db.delete(booking)
            db.commit()
            return True
        return False
