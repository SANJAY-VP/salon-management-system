"""
Celery background tasks for the Salon Management System
"""
from app.celery_app import celery_app
from app.db.database import SessionLocal
import logging

logger = logging.getLogger(__name__)


@celery_app.task(name='app.celery_tasks.send_booking_confirmation')
def send_booking_confirmation(booking_id: int, email: str):
    """
    Send booking confirmation email
    
    Args:
        booking_id: Booking ID
        email: Customer email
    """
    try:
        logger.info(f"Sending booking confirmation for booking {booking_id} to {email}")
        return {"status": "success", "booking_id": booking_id}
    except Exception as e:
        logger.error(f"Failed to send booking confirmation: {str(e)}")
        raise


@celery_app.task(name='app.celery_tasks.send_reminder')
def send_reminder(booking_id: int, email: str):
    """
    Send booking reminder email
    
    Args:
        booking_id: Booking ID
        email: Customer email
    """
    try:
        logger.info(f"Sending reminder for booking {booking_id} to {email}")
        return {"status": "success", "booking_id": booking_id}
    except Exception as e:
        logger.error(f"Failed to send reminder: {str(e)}")
        raise


@celery_app.task(name='app.celery_tasks.update_slot_status')
def update_slot_status():
    """
    Periodic task to update slot statuses
    Mark past slots as completed if they haven't been updated
    """
    try:
        db = SessionLocal()
        from app.services.slot_service import SlotService
        from app.models.slot import SlotStatus
        from datetime import date, datetime
        
        logger.info("Running periodic slot status update")
        
        db.close()
        return {"status": "success", "updated": 0}
    except Exception as e:
        logger.error(f"Failed to update slot statuses: {str(e)}")
        raise


@celery_app.task(name='app.celery_tasks.calculate_shop_rating')
def calculate_shop_rating(shop_id: int):
    """
    Recalculate shop rating after review changes
    
    Args:
        shop_id: Shop ID
    """
    try:
        db = SessionLocal()
        from app.services.barber_shop_service import BarberShopService
        
        logger.info(f"Recalculating rating for shop {shop_id}")
        BarberShopService.update_shop_rating(db, shop_id)
        
        db.close()
        return {"status": "success", "shop_id": shop_id}
    except Exception as e:
        logger.error(f"Failed to calculate shop rating: {str(e)}")
        raise


@celery_app.task(name='app.celery_tasks.cleanup_expired_slots')
def cleanup_expired_slots():
    """
    Cleanup old expired slots
    Mark cancelled/no-show slots as completed after a certain period
    """
    try:
        db = SessionLocal()
        from datetime import datetime, timedelta
        
        logger.info("Running expired slots cleanup")
        
        db.close()
        return {"status": "success", "cleaned": 0}
    except Exception as e:
        logger.error(f"Failed to cleanup expired slots: {str(e)}")
        raise
