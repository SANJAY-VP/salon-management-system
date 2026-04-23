"""
Authentication Middleware for JWT token validation
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.utils.auth_utils import decode_token
from app.services.user_service import UserService
from app.db.database import SessionLocal
from typing import List


class AuthenticationMiddleware(BaseHTTPMiddleware):
    """
    Middleware to automatically validate JWT tokens for protected routes
    """
    
    # Routes that don't require authentication
    PUBLIC_ROUTES: List[str] = [
        "/",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/auth/register",
        "/auth/login",
        "/health",
        "/api/v1/auth/register",
        "/api/v1/auth/login",
        "/api/v1/auth/forgot-password",
        "/api/v1/auth/reset-password",
    ]
    
    # Routes that start with these prefixes are public
    PUBLIC_PREFIXES: List[str] = [
        "/static",
        "/public",
        "/uploads",
        "/api/v1/dashboard",
    ]
    
    async def dispatch(self, request: Request, call_next):
        """
        Process each request and validate authentication if needed
        """
        path = request.url.path
        method = request.method
        
        # CRITICAL: Always allow OPTIONS requests (CORS preflight)
        print(f"Received {method} request to {path}")
        if method == "OPTIONS":
            from starlette.responses import Response
            return Response(
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
                    "Access-Control-Allow-Methods": "*",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Allow-Credentials": "true",
                }
            )
                
        # if request.method == "OPTIONS":
        #     return JSONResponse(status_code=200, content={"ok": True})
        
        # Skip authentication for public routes
        if self._is_public_route(path, method):
            return await call_next(request)
        
        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization")
        
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Missing or invalid authorization header"},
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        token = auth_header.split(" ")[1]
        
        try:
            # Decode and validate token
            payload = decode_token(token)
            
            # Verify token type
            if payload.get("type") != "access":
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Invalid token type"}
                )
            
            # Get user ID from token
            user_id = payload.get("sub")
            if not user_id:
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Invalid token payload"}
                )
            
            # Verify user exists and is active
            db = SessionLocal()
            try:
                user = UserService.get_user_by_id(db, int(user_id))
                if not user:
                    return JSONResponse(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        content={"detail": "User not found"}
                    )
                
                if not user.is_active:
                    return JSONResponse(
                        status_code=status.HTTP_403_FORBIDDEN,
                        content={"detail": "User account is deactivated"}
                    )
                
                # Attach user info to request state for route handlers to use
                request.state.user_id = user.id
                request.state.user_email = user.email
                request.state.user_role = user.role
                request.state.user = user
                
            finally:
                db.close()
            
            # Continue to route handler
            return await call_next(request)
            
        except HTTPException as e:
            return JSONResponse(
                status_code=e.status_code,
                content={"detail": e.detail}
            )
        except Exception as e:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": f"Authentication failed: {str(e)}"}
            )
    
    def _is_public_route(self, path: str, method: str = "GET") -> bool:
        """
        Check if a route is public (doesn't require authentication).
        Some routes are only public for read (GET) operations.
        """
        # Check exact matches
        if path in self.PUBLIC_ROUTES:
            return True
        
        # Check prefixes
        for prefix in self.PUBLIC_PREFIXES:
            if path.startswith(prefix):
                return True
        
        # Allow viewing shop reviews (GET /api/v1/reviews/shop/{id})
        if path.startswith("/api/v1/reviews/shop/") and method == "GET":
            return True
        
        # Allow viewing shop slots (GET only — POST routes like auto-generate require auth)
        if path.startswith("/api/v1/slots/shop/") and method == "GET":
            return True
        
        # Allow viewing individual shop details (GET /api/v1/shops/{id})
        if path.startswith("/api/v1/shops/") and path.count("/") == 4 and method == "GET":
            return True
        
        # Allow viewing shop services (GET /api/v1/services/shop/{id})
        if path.startswith("/api/v1/services/shop/") and method == "GET":
            return True

        # Allow listing barbers for a shop (GET /api/v1/barbers/shop/{id}) — matches public route docstring
        if path.startswith("/api/v1/barbers/shop/") and method == "GET":
            return True

        return False
