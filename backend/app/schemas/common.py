"""
Common response schemas for API responses
"""
from pydantic import BaseModel
from typing import Optional, Any, List


class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    detail: Optional[str] = None


class ErrorResponse(BaseModel):
    """Error response schema"""
    detail: str
    errors: Optional[List[dict]] = None


class PaginatedResponse(BaseModel):
    """Paginated response schema"""
    items: List[Any]
    total: int
    skip: int
    limit: int
    has_next: bool


