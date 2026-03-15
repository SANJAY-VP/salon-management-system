from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL from environment variables
# Default to SQLite for testing/development
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./salon.db"  
)

# Determine if using SQLite
is_sqlite = DATABASE_URL.startswith("sqlite")

# Create SQLAlchemy engine with appropriate settings
if is_sqlite:
    # SQLite-specific configuration
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},  # Required for SQLite with FastAPI
        echo=True  # Set to True for SQL query logging
    )
else:
    # PostgreSQL/production configuration with connection pooling
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Verify connections before using them
        pool_size=10,  # Maximum number of connections to keep in pool
        max_overflow=20,  # Maximum number of connections that can be created beyond pool_size
        echo=False  # Set to True for SQL query logging
    )

# Create SessionLocal class for creating database sessions
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for all models
Base = declarative_base()


# Dependency to get database session
def get_db():
    """
    Dependency function that creates a new database session for each request
    and closes it when the request is completed.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Function to create all tables
def create_tables():
    Base.metadata.create_all(bind=engine)


# Function to drop all tables (use with caution!)
def drop_tables():
    Base.metadata.drop_all(bind=engine)
