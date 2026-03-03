from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import date, time, datetime
from app.models.slot import Slot, SlotStatus


class SlotService:
    """
    Service class for Slot CRUD operations
    """
    
    @staticmethod
    def create_slot(
        db: Session,
        shop_id: int,
        date: date,
        start_time: time,
        end_time: time,
        barber_id: Optional[int] = None,
        **kwargs
    ) -> Slot:
        """
        Create a new time slot
        
        Args:
            db: Database session
            shop_id: Shop ID
            date: Slot date
            start_time: Slot start time
            end_time: Slot end time
            barber_id: Optional barber ID
            **kwargs: Additional fields
        
        Returns:
            Created Slot object
        """
        slot = Slot(
            shop_id=shop_id,
            barber_id=barber_id,
            date=date,
            start_time=start_time,
            end_time=end_time,
            **kwargs
        )
        db.add(slot)
        db.commit()
        db.refresh(slot)
        return slot
    
    @staticmethod
    def create_multiple_slots(
        db: Session,
        shop_id: int,
        date: date,
        time_slots: List[tuple],  # List of (start_time, end_time) tuples
        barber_id: Optional[int] = None
    ) -> List[Slot]:
        """
        Create multiple slots at once
        
        Args:
            db: Database session
            shop_id: Shop ID
            date: Slot date
            time_slots: List of (start_time, end_time) tuples
            barber_id: Optional barber ID
        
        Returns:
            List of created Slot objects
        """
        slots = []
        for start_time, end_time in time_slots:
            slot = Slot(
                shop_id=shop_id,
                barber_id=barber_id,
                date=date,
                start_time=start_time,
                end_time=end_time,
                status=SlotStatus.AVAILABLE
            )
            slots.append(slot)
        
        db.add_all(slots)
        db.commit()
        for slot in slots:
            db.refresh(slot)
        return slots
    
    @staticmethod
    def get_slot_by_id(db: Session, slot_id: int) -> Optional[Slot]:
        """Get slot by ID"""
        return db.query(Slot).filter(Slot.id == slot_id).first()
    
    @staticmethod
    def get_available_slots(
        db: Session,
        shop_id: int,
        date: Optional[date] = None,
        barber_id: Optional[int] = None
    ) -> List[Slot]:
        """
        Get available slots for a shop
        
        Args:
            db: Database session
            shop_id: Shop ID
            date: Filter by specific date (optional)
            barber_id: Filter by barber (optional)
        
        Returns:
            List of available Slot objects
        """
        query = db.query(Slot).filter(
            Slot.shop_id == shop_id,
            Slot.status == SlotStatus.AVAILABLE,
            Slot.is_active == True
        )
        
        if date:
            query = query.filter(Slot.date == date)
        
        if barber_id:
            query = query.filter(Slot.barber_id == barber_id)
        
        return query.order_by(Slot.date, Slot.start_time).all()
    
    @staticmethod
    def get_slots_by_shop(
        db: Session,
        shop_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        status: Optional[SlotStatus] = None
    ) -> List[Slot]:
        """
        Get slots for a shop with optional date range and status filter
        
        Args:
            db: Database session
            shop_id: Shop ID
            start_date: Start date filter
            end_date: End date filter
            status: Slot status filter
        
        Returns:
            List of Slot objects
        """
        query = db.query(Slot).filter(Slot.shop_id == shop_id)
        
        if start_date:
            query = query.filter(Slot.date >= start_date)
        
        if end_date:
            query = query.filter(Slot.date <= end_date)
        
        if status:
            query = query.filter(Slot.status == status)
        
        return query.order_by(Slot.date, Slot.start_time).all()
    
    @staticmethod
    def get_slots_by_barber(
        db: Session,
        barber_id: int,
        date: Optional[date] = None
    ) -> List[Slot]:
        """Get slots assigned to a specific barber"""
        query = db.query(Slot).filter(Slot.barber_id == barber_id)
        
        if date:
            query = query.filter(Slot.date == date)
        
        return query.order_by(Slot.date, Slot.start_time).all()
    
    @staticmethod
    def update_slot(db: Session, slot_id: int, **kwargs) -> Optional[Slot]:
        """
        Update slot information
        
        Args:
            db: Database session
            slot_id: Slot ID
            **kwargs: Fields to update
        
        Returns:
            Updated Slot object or None
        """
        slot = db.query(Slot).filter(Slot.id == slot_id).first()
        if slot:
            for key, value in kwargs.items():
                if hasattr(slot, key) and value is not None:
                    setattr(slot, key, value)
            db.commit()
            db.refresh(slot)
        return slot
    
    @staticmethod
    def book_slot(db: Session, slot_id: int) -> Optional[Slot]:
        """
        Mark a slot as booked
        
        Args:
            db: Database session
            slot_id: Slot ID
        
        Returns:
            Updated Slot object or None
        """
        slot = db.query(Slot).filter(
            Slot.id == slot_id,
            Slot.status == SlotStatus.AVAILABLE
        ).first()
        
        if slot:
            slot.status = SlotStatus.BOOKED
            db.commit()
            db.refresh(slot)
        return slot
    
    @staticmethod
    def complete_slot(db: Session, slot_id: int) -> Optional[Slot]:
        """Mark a slot as completed"""
        slot = db.query(Slot).filter(Slot.id == slot_id).first()
        if slot:
            slot.status = SlotStatus.COMPLETED
            db.commit()
            db.refresh(slot)
        return slot
    
    @staticmethod
    def cancel_slot(db: Session, slot_id: int) -> Optional[Slot]:
        """Cancel a slot (make it available again)"""
        slot = db.query(Slot).filter(Slot.id == slot_id).first()
        if slot:
            slot.status = SlotStatus.CANCELLED
            db.commit()
            db.refresh(slot)
        return slot
    
    @staticmethod
    def delete_slot(db: Session, slot_id: int) -> bool:
        """
        Delete a slot
        
        Args:
            db: Database session
            slot_id: Slot ID
        
        Returns:
            True if deleted, False if not found
        """
        slot = db.query(Slot).filter(Slot.id == slot_id).first()
        if slot:
            db.delete(slot)
            db.commit()
            return True
        return False
