from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.user import User, UserRole
from datetime import datetime


class UserService:
    """
    Service class for User CRUD operations
    """
    
    @staticmethod
    def create_user(db: Session,email: str,password_hash: str,full_name: str,phone: Optional[str] = None,role: UserRole = UserRole.CUSTOMER,**kwargs) -> User:
        user = User(email=email,password_hash=password_hash,full_name=full_name,phone=phone,role=role,**kwargs)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_user_by_phone(db: Session, phone: str) -> Optional[User]:
        """Get user by phone"""
        return db.query(User).filter(User.phone == phone).first()
    
    @staticmethod
    def get_all_users(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        role: Optional[UserRole] = None
    ) -> List[User]:
        """
        Get all users with pagination and optional role filter
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            role: Filter by user role
        
        Returns:
            List of User objects
        """
        query = db.query(User)
        if role:
            query = query.filter(User.role == role)
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def update_user(db: Session, user_id: int, **kwargs) -> Optional[User]:
        """
        Update user information
        
        Args:
            db: Database session
            user_id: User ID
            **kwargs: Fields to update
        
        Returns:
            Updated User object or None if not found
        """
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            for key, value in kwargs.items():
                if hasattr(user, key) and value is not None:
                    setattr(user, key, value)
            db.commit()
            db.refresh(user)
        return user
    
    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        """
        Delete a user
        
        Args:
            db: Database session
            user_id: User ID
        
        Returns:
            True if deleted, False if not found
        """
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.delete(user)
            db.commit()
            return True
        return False
    
    @staticmethod
    def update_user_points(db: Session, user_id: int, points: int) -> Optional[User]:
        """
        Update user points
        
        Args:
            db: Database session
            user_id: User ID
            points: Points to add (can be negative)
        
        Returns:
            Updated User object or None
        """
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.points += points
            db.commit()
            db.refresh(user)
        return user
    
    @staticmethod
    def verify_user(db: Session, user_id: int) -> Optional[User]:
        """Mark user as verified"""
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.is_verified = True
            db.commit()
            db.refresh(user)
        return user
    
    @staticmethod
    def deactivate_user(db: Session, user_id: int) -> Optional[User]:
        """Deactivate user account"""
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.is_active = False
            db.commit()
            db.refresh(user)
        return user
