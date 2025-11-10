"""
Database models for the Face Recognition System
"""
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database.connection import Base


class User(Base):
    """User model for employees and students"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True)
    role = Column(String(20), nullable=False)  # employee or student
    department = Column(String(100))  # department or class
    photo_path = Column(String(255))
    face_encoding_path = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    attendance_logs = relationship("AttendanceLog", back_populates="user")

    def __repr__(self):
        return f"<User(id={self.id}, user_id={self.user_id}, name={self.name}, role={self.role})>"


class AttendanceLog(Base):
    """Attendance log model for tracking recognition events"""
    __tablename__ = "attendance_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    event_type = Column(String(20), default="entry")  # entry or exit
    camera_id = Column(String(50), default="default")
    confidence = Column(Float)  # Recognition confidence score
    image_path = Column(String(255))  # Path to captured image
    location = Column(String(100))  # Camera location
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="attendance_logs")

    def __repr__(self):
        return f"<AttendanceLog(id={self.id}, user_id={self.user_id}, timestamp={self.timestamp})>"


class Admin(Base):
    """Admin user model for dashboard access"""
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)

    def __repr__(self):
        return f"<Admin(id={self.id}, username={self.username})>"


class UnknownFace(Base):
    """Log for unrecognized faces"""
    __tablename__ = "unknown_faces"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    camera_id = Column(String(50), default="default")
    image_path = Column(String(255))
    location = Column(String(100))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<UnknownFace(id={self.id}, timestamp={self.timestamp})>"
