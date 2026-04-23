"""
Authentication routes for user registration, login, token management, and profile
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.user_service import UserService
from app.schemas.auth_schemas import (
    RegisterRequest, LoginRequest, TokenResponse,
    ChangePasswordRequest, UpdateProfileRequest, UserResponse
)
from app.utils.auth_utils import (
    hash_password, verify_password, create_token_pair
)
from app.utils.dependencies import get_current_user_from_request
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED, summary="Register User", operation_id="auth_register")
def register_user(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user"""
    existing_user = UserService.get_user_by_email(db, request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    password_hash = hash_password(request.password)
    
    try:
        user = UserService.create_user(
            db=db,
            email=request.email,
            password_hash=password_hash,
            full_name=request.full_name,
            phone=request.phone,
            role=request.role,
        )
        
        return {
            "message": "User registered successfully",
            "user_id": user.id,
            "email": user.email
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )


@router.post("/login", response_model=TokenResponse, summary="Login", operation_id="auth_login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with email and password
    
    Returns access token and refresh token
    """
    user = UserService.get_user_by_email(db, request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    
    tokens = create_token_pair(user.id, user.email, user.role.value)
    
    return TokenResponse(
        access_token=tokens["access_token"],
        token_type=tokens["token_type"],
        user_id=user.id,
        email=user.email,
        role=user.role.value
    )


@router.get("/me", response_model=UserResponse, summary="Get My Profile", operation_id="auth_get_me")
def get_current_user_profile(request: Request):
    """
    Get current authenticated user's profile
    
    Requires valid access token (validated by middleware)
    """
    current_user = get_current_user_from_request(request)
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        role=current_user.role.value,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        points=current_user.points,
        address=current_user.address,
        city=current_user.city,
        state=current_user.state,
        pincode=current_user.pincode,
        avatar=getattr(current_user, "avatar", None),
        created_at=current_user.created_at if hasattr(current_user, 'created_at') else None
    )


@router.put("/me", response_model=UserResponse, summary="Update My Profile", operation_id="auth_update_me")
def update_profile(
    req: Request,
    request: UpdateProfileRequest,
    db: Session = Depends(get_db)
):
    """
    Update current user's profile
    
    Requires valid access token (validated by middleware)
    """
    current_user = get_current_user_from_request(req)
    # Build update dictionary
    update_data = {}
    if request.full_name is not None:
        update_data["full_name"] = request.full_name
    if request.phone is not None:
        # Check if phone is already taken by another user
        if request.phone != current_user.phone:
            existing_phone = UserService.get_user_by_phone(db, request.phone)
            if existing_phone:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Phone number already in use"
                )
        update_data["phone"] = request.phone
    if request.address is not None:
        update_data["address"] = request.address
    if request.city is not None:
        update_data["city"] = request.city
    if request.state is not None:
        update_data["state"] = request.state
    if request.pincode is not None:
        update_data["pincode"] = request.pincode
    if request.avatar is not None:
        update_data["avatar"] = request.avatar

    # Update user
    updated_user = UserService.update_user(db, current_user.id, **update_data)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )
    
    return UserResponse(
        id=updated_user.id,
        email=updated_user.email,
        full_name=updated_user.full_name,
        phone=updated_user.phone,
        role=updated_user.role.value,
        is_active=updated_user.is_active,
        is_verified=updated_user.is_verified,
        points=updated_user.points,
        address=updated_user.address,
        city=updated_user.city,
        state=updated_user.state,
        pincode=updated_user.pincode,
        avatar=getattr(updated_user, "avatar", None),
        created_at=updated_user.created_at if hasattr(updated_user, 'created_at') else None
    )


@router.post("/change-password", status_code=status.HTTP_200_OK, summary="Change Password", operation_id="auth_change_password")
def change_password(
    req: Request,
    request: ChangePasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Change password for current authenticated user
    
    Requires valid access token and current password (validated by middleware)
    """
    current_user = get_current_user_from_request(req)
    # Verify current password
    if not verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Hash new password
    new_password_hash = hash_password(request.new_password)
    
    # Update password
    updated_user = UserService.update_user(
        db,
        current_user.id,
        password_hash=new_password_hash
    )
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )
    
    return {"message": "Password changed successfully"}


@router.post("/verify-email/{user_id}", status_code=status.HTTP_200_OK)
def verify_email(user_id: int, db: Session = Depends(get_db)):
    """
    Verify user email (simplified version - in production use email tokens)
    
    This is a simplified endpoint. In production, you should:
    1. Send verification email with unique token on registration
    2. User clicks link with token
    3. Backend verifies token and marks user as verified
    """
    user = UserService.verify_user(db, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "Email verified successfully"}


@router.post("/deactivate", status_code=status.HTTP_200_OK)
def deactivate_account(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Deactivate current user's account
    
    Requires valid access token (validated by middleware)
    """
    current_user = get_current_user_from_request(request)
    user = UserService.deactivate_user(db, current_user.id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate account"
        )
    
    return {"message": "Account deactivated successfully"}


@router.post("/logout", status_code=status.HTTP_200_OK, summary="Logout", operation_id="auth_logout")
def logout(request: Request):
    """
    Logout current user
    
    Note: Since we're using JWT tokens, actual logout should be handled on the client side
    by deleting the stored token. This endpoint is provided for consistency.
    
    Requires valid access token (validated by middleware)
    For production, consider implementing token blacklisting using Redis or similar.
    """
    current_user = get_current_user_from_request(request)
    return {"message": "Logged out successfully"}
