"""
Authentication dependencies for protected routes
"""
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.user_service import UserService
from app.utils.auth_utils import decode_token
from app.models.user import User, UserRole
from typing import Optional

# Security scheme for Bearer token
security = HTTPBearer()


def get_current_user_from_request(request: Request) -> User:
    """
    Dependency to get current user from request state (set by middleware)
    This is the preferred method when using AuthenticationMiddleware
    
    Args:
        request: FastAPI request object with user attached by middleware
    
    Returns:
        User object from request state
    
    Raises:
        HTTPException: If user not found in request state
    """
    if not hasattr(request.state, "user"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated"
        )
    return request.state.user


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token
    
    Args:
        credentials: Bearer token credentials
        db: Database session
    
    Returns:
        User object
    
    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    
    # Decode token
    payload = decode_token(token)
    
    # Verify token type
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    
    # Get user ID from token
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    # Fetch user from database
    user = UserService.get_user_by_id(db, int(user_id))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to ensure user is active
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        User object
    
    Raises:
        HTTPException: If user is not active
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


def get_current_verified_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to ensure user is verified
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        User object
    
    Raises:
        HTTPException: If user is not verified
    """
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required"
        )
    return current_user


def require_role(allowed_roles: list[UserRole]):
    """
    Factory function to create role-based access control dependency
    Works with AuthenticationMiddleware
    
    Args:
        allowed_roles: List of allowed user roles
    
    Returns:
        Dependency function
    """
    def role_checker(request: Request) -> User:
        user = get_current_user_from_request(request)
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return user
    
    return role_checker


# Convenience dependencies for common roles
def get_admin_user(request: Request) -> User:
    """Require ADMIN role"""
    user = get_current_user_from_request(request)
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return user


def get_barber_user(request: Request) -> User:
    """Require BARBER role"""
    user = get_current_user_from_request(request)
    if user.role != UserRole.BARBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Barber privileges required"
        )
    return user


def get_shop_owner_user(request: Request) -> User:
    """Require SHOP_OWNER role"""
    user = get_current_user_from_request(request)
    if user.role != UserRole.SHOP_OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Shop owner privileges required"
        )
    return user


# Pre-defined role dependencies
def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure user is an admin"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def get_barber_owner(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure user is a barber owner"""
    if current_user.role != UserRole.BARBER_OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Barber owner access required"
        )
    return current_user
