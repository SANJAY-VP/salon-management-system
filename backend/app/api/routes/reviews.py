"""
Review management routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.services.review_service import ReviewService
from app.services.barber_shop_service import BarberShopService
from app.schemas.review_schemas import ReviewCreate, ReviewUpdate, ReviewResponse
from app.schemas.common import MessageResponse
from app.utils.dependencies import get_current_user_from_request
from app.models.user import UserRole


router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    review_data: ReviewCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Create a new review for a shop
    
    Requires authentication
    """
    current_user = get_current_user_from_request(request)
    
    shop = BarberShopService.get_shop_by_id(db, review_data.shop_id)
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )
    
    existing_review = ReviewService.get_user_review_for_shop(
        db, current_user.id, review_data.shop_id
    )
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this shop. Please update your existing review."
        )
    
    review = ReviewService.create_review(
        db=db,
        user_id=current_user.id,
        **review_data.model_dump()
    )
    
    BarberShopService.update_shop_rating(db, review_data.shop_id)
    
    return review


@router.get("/{review_id}", response_model=ReviewResponse)
def get_review(review_id: int, db: Session = Depends(get_db)):
    """Get review details by ID"""
    review = ReviewService.get_review_by_id(db, review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    return review


@router.get("/shop/{shop_id}", response_model=List[ReviewResponse])
def get_shop_reviews(
    shop_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get all reviews for a shop
    
    Public endpoint
    """
    shop = BarberShopService.get_shop_by_id(db, shop_id)
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found"
        )
    
    reviews = ReviewService.get_reviews_by_shop(
        db=db,
        shop_id=shop_id,
        skip=skip,
        limit=limit
    )
    
    return reviews


@router.get("/user/my-reviews", response_model=List[ReviewResponse])
def get_my_reviews(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get all reviews by the current user
    
    Requires authentication
    """
    current_user = get_current_user_from_request(request)
    
    reviews = ReviewService.get_reviews_by_user(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
    
    return reviews


@router.put("/{review_id}", response_model=ReviewResponse)
def update_review(
    review_id: int,
    review_data: ReviewUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Update a review
    
    Only the review author can update their review
    """
    current_user = get_current_user_from_request(request)
    
    review = ReviewService.get_review_by_id(db, review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    if review.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this review"
        )
    
    update_data = review_data.model_dump(exclude_unset=True)
    updated_review = ReviewService.update_review(db, review_id, **update_data)
    
    BarberShopService.update_shop_rating(db, review.shop_id)
    
    return updated_review


@router.delete("/{review_id}", response_model=MessageResponse)
def delete_review(
    review_id: int,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Delete a review
    
    Only the review author or admin can delete
    """
    current_user = get_current_user_from_request(request)
    
    review = ReviewService.get_review_by_id(db, review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    if review.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this review"
        )
    
    shop_id = review.shop_id
    success = ReviewService.delete_review(db, review_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete review"
        )
    
    BarberShopService.update_shop_rating(db, shop_id)
    
    return MessageResponse(message="Review deleted successfully")


