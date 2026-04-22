from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import date, time, datetime, timedelta
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
        """Get available slots for a shop (no auto-generation)."""
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
    def get_or_generate_available_slots(
        db: Session,
        shop_id: int,
        opening_time: Optional[time],
        closing_time: Optional[time],
        slot_date: Optional[date] = None,
        barber_id: Optional[int] = None,
        interval_minutes: int = 30,
        days_ahead: int = 30,
    ) -> List[Slot]:
        """
        Production-grade slot retrieval: if no slots exist for a requested date
        (or the next `days_ahead` days when no date is given), auto-generate them
        from the shop's opening / closing times so customers always see availability.

        This is idempotent — calling it multiple times will not create duplicates.
        """
        today = datetime.now().date()

        if slot_date:
            # Single-date request — auto-generate for that date if needed
            if slot_date >= today and opening_time and closing_time:
                SlotService.auto_generate_slots(
                    db=db,
                    shop_id=shop_id,
                    opening_time=opening_time,
                    closing_time=closing_time,
                    slot_date=slot_date,
                    barber_id=barber_id,
                    interval_minutes=interval_minutes,
                )
            return SlotService.get_available_slots(db, shop_id, slot_date, barber_id)

        # No specific date — ensure the next `days_ahead` days are covered
        if opening_time and closing_time:
            for i in range(days_ahead):
                target = today + timedelta(days=i)
                SlotService.auto_generate_slots(
                    db=db,
                    shop_id=shop_id,
                    opening_time=opening_time,
                    closing_time=closing_time,
                    slot_date=target,
                    barber_id=barber_id,
                    interval_minutes=interval_minutes,
                )
        return SlotService.get_available_slots(db, shop_id, None, barber_id)
    
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
        Atomically mark a slot as booked using row-level locking (SELECT FOR UPDATE).
        Prevents double-booking under concurrent requests (production-grade).

        Returns the updated Slot, or None if the slot is no longer AVAILABLE.
        """
        try:
            slot = (
                db.query(Slot)
                .filter(Slot.id == slot_id, Slot.status == SlotStatus.AVAILABLE)
                .with_for_update()
                .first()
            )
            if slot:
                slot.status = SlotStatus.BOOKED
                db.commit()
                db.refresh(slot)
            return slot
        except Exception:
            db.rollback()
            raise
    
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
    def auto_generate_slots(
        db: Session,
        shop_id: int,
        opening_time: time,
        closing_time: time,
        slot_date: date,
        barber_id: Optional[int] = None,
        interval_minutes: int = 30
    ) -> List[Slot]:
        """
        Auto-generate 30-minute (or custom interval) slots from opening to closing time.
        Idempotent: returns existing slots if they already exist for the given date.
        """
        existing = db.query(Slot).filter(
            Slot.shop_id == shop_id,
            Slot.date == slot_date,
            Slot.is_active == True
        ).all()

        if existing:
            return existing

        slots = []
        current = datetime.combine(slot_date, opening_time)
        end = datetime.combine(slot_date, closing_time)

        while current + timedelta(minutes=interval_minutes) <= end:
            slot_end = current + timedelta(minutes=interval_minutes)
            slot = Slot(
                shop_id=shop_id,
                barber_id=barber_id,
                date=slot_date,
                start_time=current.time(),
                end_time=slot_end.time(),
                status=SlotStatus.AVAILABLE,
                is_active=True,
            )
            slots.append(slot)
            current = slot_end

        if slots:
            db.add_all(slots)
            db.commit()
            for s in slots:
                db.refresh(s)

        return slots

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
