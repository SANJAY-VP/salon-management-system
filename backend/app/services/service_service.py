from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.service import Service, ServiceCategory


class ServiceService:
    """
    Service class for Service CRUD operations
    """
    
    @staticmethod
    def create_service(
        db: Session,
        shop_id: int,
        name: str,
        category: ServiceCategory,
        price: float,
        duration_minutes: int,
        **kwargs
    ) -> Service:
        """
        Create a new service
        
        Args:
            db: Database session
            shop_id: Shop ID offering the service
            name: Service name
            category: Service category
            price: Service price
            duration_minutes: Service duration in minutes
            **kwargs: Additional fields (description, etc.)
        
        Returns:
            Created Service object
        """
        service = Service(
            shop_id=shop_id,
            name=name,
            category=category,
            price=price,
            duration_minutes=duration_minutes,
            **kwargs
        )
        db.add(service)
        db.commit()
        db.refresh(service)
        return service
    
    @staticmethod
    def get_service_by_id(db: Session, service_id: int) -> Optional[Service]:
        """Get service by ID"""
        return db.query(Service).filter(Service.id == service_id).first()
    
    @staticmethod
    def get_services_by_shop(
        db: Session,
        shop_id: int,
        active_only: bool = True,
        category: Optional[ServiceCategory] = None
    ) -> List[Service]:
        """
        Get all services for a specific shop
        
        Args:
            db: Database session
            shop_id: Shop ID
            active_only: Filter by active status
            category: Filter by service category
        
        Returns:
            List of Service objects
        """
        query = db.query(Service).filter(Service.shop_id == shop_id)
        
        if active_only:
            query = query.filter(Service.is_active == True)
        
        if category:
            query = query.filter(Service.category == category)
        
        return query.all()
    
    @staticmethod
    def get_all_services(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        category: Optional[ServiceCategory] = None
    ) -> List[Service]:
        """
        Get all services with pagination
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            category: Filter by category
        
        Returns:
            List of Service objects
        """
        query = db.query(Service)
        
        if category:
            query = query.filter(Service.category == category)
        
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def update_service(db: Session, service_id: int, **kwargs) -> Optional[Service]:
        """
        Update service information
        
        Args:
            db: Database session
            service_id: Service ID
            **kwargs: Fields to update
        
        Returns:
            Updated Service object or None
        """
        service = db.query(Service).filter(Service.id == service_id).first()
        if service:
            for key, value in kwargs.items():
                if hasattr(service, key) and value is not None:
                    setattr(service, key, value)
            db.commit()
            db.refresh(service)
        return service
    
    @staticmethod
    def delete_service(db: Session, service_id: int) -> bool:
        """
        Delete a service
        
        Args:
            db: Database session
            service_id: Service ID
        
        Returns:
            True if deleted, False if not found
        """
        service = db.query(Service).filter(Service.id == service_id).first()
        if service:
            db.delete(service)
            db.commit()
            return True
        return False
    
    @staticmethod
    def activate_service(db: Session, service_id: int) -> Optional[Service]:
        """Activate a service"""
        service = db.query(Service).filter(Service.id == service_id).first()
        if service:
            service.is_active = True
            db.commit()
            db.refresh(service)
        return service
    
    @staticmethod
    def deactivate_service(db: Session, service_id: int) -> Optional[Service]:
        """Deactivate a service"""
        service = db.query(Service).filter(Service.id == service_id).first()
        if service:
            service.is_active = False
            db.commit()
            db.refresh(service)
        return service
    
    @staticmethod
    def get_services_by_category(
        db: Session,
        category: ServiceCategory,
        skip: int = 0,
        limit: int = 100
    ) -> List[Service]:
        """Get all services in a specific category"""
        return db.query(Service).filter(
            Service.category == category,
            Service.is_active == True
        ).offset(skip).limit(limit).all()
