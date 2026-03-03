from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import secrets
from app.models.transaction import Transaction, PaymentStatus, PaymentMethod


class TransactionService:
    """
    Service class for Transaction CRUD operations
    """
    
    @staticmethod
    def generate_transaction_id() -> str:
        """Generate a unique transaction ID"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        random_part = secrets.token_hex(4).upper()
        return f"TXN{timestamp}{random_part}"
    
    @staticmethod
    def create_transaction(
        db: Session,
        booking_id: int,
        amount: float,
        payment_method: PaymentMethod,
        discount: float = 0.0,
        **kwargs
    ) -> Transaction:
        """
        Create a new transaction
        
        Args:
            db: Database session
            booking_id: Booking ID
            amount: Transaction amount
            payment_method: Payment method used
            discount: Discount amount
            **kwargs: Additional fields (payment_gateway_id, payment_details, etc.)
        
        Returns:
            Created Transaction object
        """
        # Generate unique transaction ID
        transaction_id = TransactionService.generate_transaction_id()
        while db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first():
            transaction_id = TransactionService.generate_transaction_id()
        
        final_amount = amount - discount
        
        transaction = Transaction(
            booking_id=booking_id,
            transaction_id=transaction_id,
            amount=amount,
            discount=discount,
            final_amount=final_amount,
            payment_method=payment_method,
            **kwargs
        )
        
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        return transaction
    
    @staticmethod
    def get_transaction_by_id(db: Session, transaction_id: int) -> Optional[Transaction]:
        """Get transaction by ID"""
        return db.query(Transaction).filter(Transaction.id == transaction_id).first()
    
    @staticmethod
    def get_transaction_by_transaction_id(db: Session, transaction_id: str) -> Optional[Transaction]:
        """Get transaction by transaction ID"""
        return db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    
    @staticmethod
    def get_transaction_by_booking(db: Session, booking_id: int) -> Optional[Transaction]:
        """Get transaction for a specific booking"""
        return db.query(Transaction).filter(Transaction.booking_id == booking_id).first()
    
    @staticmethod
    def get_transactions_by_user(
        db: Session,
        user_id: int,
        status: Optional[PaymentStatus] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Transaction]:
        """
        Get all transactions for a user (through bookings)
        
        Args:
            db: Database session
            user_id: User ID
            status: Filter by payment status
            skip: Number of records to skip
            limit: Maximum number of records to return
        
        Returns:
            List of Transaction objects
        """
        from app.models.booking import Booking
        
        query = db.query(Transaction).join(
            Booking, Transaction.booking_id == Booking.id
        ).filter(Booking.user_id == user_id)
        
        if status:
            query = query.filter(Transaction.status == status)
        
        return query.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_transactions_by_shop(
        db: Session,
        shop_id: int,
        status: Optional[PaymentStatus] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Transaction]:
        """
        Get all transactions for a shop (through bookings)
        
        Args:
            db: Database session
            shop_id: Shop ID
            status: Filter by payment status
            skip: Number of records to skip
            limit: Maximum number of records to return
        
        Returns:
            List of Transaction objects
        """
        from app.models.booking import Booking
        
        query = db.query(Transaction).join(
            Booking, Transaction.booking_id == Booking.id
        ).filter(Booking.shop_id == shop_id)
        
        if status:
            query = query.filter(Transaction.status == status)
        
        return query.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_transaction(db: Session, transaction_id: int, **kwargs) -> Optional[Transaction]:
        """
        Update transaction information
        
        Args:
            db: Database session
            transaction_id: Transaction ID
            **kwargs: Fields to update
        
        Returns:
            Updated Transaction object or None
        """
        transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if transaction:
            for key, value in kwargs.items():
                if hasattr(transaction, key) and value is not None:
                    setattr(transaction, key, value)
            db.commit()
            db.refresh(transaction)
        return transaction
    
    @staticmethod
    def complete_transaction(db: Session, transaction_id: int, payment_gateway_id: Optional[str] = None) -> Optional[Transaction]:
        """
        Mark transaction as completed
        
        Args:
            db: Database session
            transaction_id: Transaction ID
            payment_gateway_id: Payment gateway transaction ID
        
        Returns:
            Updated Transaction object or None
        """
        transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if transaction:
            transaction.status = PaymentStatus.COMPLETED
            transaction.completed_at = datetime.utcnow()
            if payment_gateway_id:
                transaction.payment_gateway_id = payment_gateway_id
            db.commit()
            db.refresh(transaction)
        return transaction
    
    @staticmethod
    def fail_transaction(db: Session, transaction_id: int, failure_reason: str) -> Optional[Transaction]:
        """
        Mark transaction as failed
        
        Args:
            db: Database session
            transaction_id: Transaction ID
            failure_reason: Reason for failure
        
        Returns:
            Updated Transaction object or None
        """
        transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if transaction:
            transaction.status = PaymentStatus.FAILED
            transaction.failure_reason = failure_reason
            db.commit()
            db.refresh(transaction)
        return transaction
    
    @staticmethod
    def refund_transaction(db: Session, transaction_id: int) -> Optional[Transaction]:
        """
        Mark transaction as refunded
        
        Args:
            db: Database session
            transaction_id: Transaction ID
        
        Returns:
            Updated Transaction object or None
        """
        transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if transaction:
            transaction.status = PaymentStatus.REFUNDED
            db.commit()
            db.refresh(transaction)
        return transaction
    
    @staticmethod
    def delete_transaction(db: Session, transaction_id: int) -> bool:
        """
        Delete a transaction
        
        Args:
            db: Database session
            transaction_id: Transaction ID
        
        Returns:
            True if deleted, False if not found
        """
        transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if transaction:
            db.delete(transaction)
            db.commit()
            return True
        return False
    
    @staticmethod
    def get_shop_earnings(
        db: Session,
        shop_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> float:
        """
        Calculate total earnings for a shop
        
        Args:
            db: Database session
            shop_id: Shop ID
            start_date: Start date filter
            end_date: End date filter
        
        Returns:
            Total earnings amount
        """
        from app.models.booking import Booking
        from sqlalchemy import func
        
        query = db.query(func.sum(Transaction.final_amount)).join(
            Booking, Transaction.booking_id == Booking.id
        ).filter(
            Booking.shop_id == shop_id,
            Transaction.status == PaymentStatus.COMPLETED
        )
        
        if start_date:
            query = query.filter(Transaction.completed_at >= start_date)
        
        if end_date:
            query = query.filter(Transaction.completed_at <= end_date)
        
        result = query.scalar()
        return float(result) if result else 0.0
