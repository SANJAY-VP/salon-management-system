from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.models.review import Review


class ReviewService:
    """
    Service class for Review CRUD operations
    """
    
    @staticmethod
    def create_review(
        db: Session,
        user_id: int,
        shop_id: int,
        rating: int,
        title: Optional[str] = None,
        comment: Optional[str] = None,
        **kwargs
    ) -> Review:
        """
        Create a new review
        
        Args:
            db: Database session
            user_id: User ID
            shop_id: Shop ID
            rating: Rating (1-5)
            title: Review title
            comment: Review comment
            **kwargs: Additional fields
        
        Returns:
            Created Review object
        """
        # Validate rating
        if rating < 1 or rating > 5:
            raise ValueError("Rating must be between 1 and 5")
        
        review = Review(
            user_id=user_id,
            shop_id=shop_id,
            rating=rating,
            title=title,
            comment=comment,
            **kwargs
        )
        
        db.add(review)
        db.commit()
        db.refresh(review)
        
        # Update shop's average rating
        from app.services.barber_shop_service import BarberShopService
        BarberShopService.update_shop_rating(db, shop_id)
        
        return review
    
    @staticmethod
    def get_user_review_for_shop(
        db: Session,
        user_id: int,
        shop_id: int
    ) -> Optional[Review]:
        """
        Get a user's review for a specific shop
        
        Args:
            db: Database session
            user_id: User ID
            shop_id: Shop ID
        
        Returns:
            Review object or None
        """
        return db.query(Review).filter(
            Review.user_id == user_id,
            Review.shop_id == shop_id
        ).first()
    
    @staticmethod
    def get_review_by_id(db: Session, review_id: int) -> Optional[Review]:
        """Get review by ID"""
        return db.query(Review).filter(Review.id == review_id).first()
    
    @staticmethod
    def get_reviews_by_shop(
        db: Session,
        shop_id: int,
        is_active: bool = True,
        skip: int = 0,
        limit: int = 100
    ) -> List[Review]:
        """
        Get all reviews for a shop
        
        Args:
            db: Database session
            shop_id: Shop ID
            is_active: Filter by active status
            skip: Number of records to skip
            limit: Maximum number of records to return
        
        Returns:
            List of Review objects
        """
        query = db.query(Review).filter(Review.shop_id == shop_id)
        
        if is_active is not None:
            query = query.filter(Review.is_active == is_active)
        
        return query.order_by(Review.created_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_reviews_by_user(
        db: Session,
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Review]:
        """
        Get all reviews by a user
        
        Args:
            db: Database session
            user_id: User ID
            skip: Number of records to skip
            limit: Maximum number of records to return
        
        Returns:
            List of Review objects
        """
        return db.query(Review).filter(
            Review.user_id == user_id
        ).order_by(Review.created_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_review(db: Session, review_id: int, **kwargs) -> Optional[Review]:
        """
        Update review information
        
        Args:
            db: Database session
            review_id: Review ID
            **kwargs: Fields to update
        
        Returns:
            Updated Review object or None
        """
        review = db.query(Review).filter(Review.id == review_id).first()
        if review:
            old_rating = review.rating
            
            for key, value in kwargs.items():
                if hasattr(review, key) and value is not None:
                    # Validate rating if being updated
                    if key == "rating" and (value < 1 or value > 5):
                        raise ValueError("Rating must be between 1 and 5")
                    setattr(review, key, value)
            
            db.commit()
            db.refresh(review)
            
            # Update shop rating if rating changed
            if old_rating != review.rating:
                from app.services.barber_shop_service import BarberShopService
                BarberShopService.update_shop_rating(db, review.shop_id)
        
        return review
    
    @staticmethod
    def delete_review(db: Session, review_id: int) -> bool:
        """
        Delete a review
        
        Args:
            db: Database session
            review_id: Review ID
        
        Returns:
            True if deleted, False if not found
        """
        review = db.query(Review).filter(Review.id == review_id).first()
        if review:
            shop_id = review.shop_id
            db.delete(review)
            db.commit()
            
            # Update shop rating after deletion
            from app.services.barber_shop_service import BarberShopService
            BarberShopService.update_shop_rating(db, shop_id)
            
            return True
        return False
    
    @staticmethod
    def deactivate_review(db: Session, review_id: int) -> Optional[Review]:
        """Deactivate a review"""
        review = db.query(Review).filter(Review.id == review_id).first()
        if review:
            review.is_active = False
            db.commit()
            db.refresh(review)
            
            # Update shop rating
            from app.services.barber_shop_service import BarberShopService
            BarberShopService.update_shop_rating(db, review.shop_id)
        
        return review
    
    @staticmethod
    def verify_review(db: Session, review_id: int) -> Optional[Review]:
        """Mark review as verified"""
        review = db.query(Review).filter(Review.id == review_id).first()
        if review:
            review.is_verified = True
            db.commit()
            db.refresh(review)
        return review
    
    @staticmethod
    def get_shop_rating_stats(db: Session, shop_id: int) -> dict:
        """
        Get rating statistics for a shop
        
        Args:
            db: Database session
            shop_id: Shop ID
        
        Returns:
            Dictionary with rating statistics
        """
        # Get count for each rating (1-5)
        rating_counts = {}
        for rating in range(1, 6):
            count = db.query(func.count(Review.id)).filter(
                Review.shop_id == shop_id,
                Review.rating == rating,
                Review.is_active == True
            ).scalar()
            rating_counts[f"{rating}_star"] = count or 0
        
        # Get average and total
        stats = db.query(
            func.avg(Review.rating).label("average"),
            func.count(Review.id).label("total")
        ).filter(
            Review.shop_id == shop_id,
            Review.is_active == True
        ).first()
        
        return {
            "average_rating": float(stats.average) if stats.average else 0.0,
            "total_reviews": stats.total or 0,
            **rating_counts
        }
