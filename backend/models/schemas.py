"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# User Schemas
class UserBase(BaseModel):
    user_id: str
    name: str
    email: Optional[EmailStr] = None
    role: str  # employee or student
    department: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a new user"""
    pass


class UserUpdate(BaseModel):
    """Schema for updating user information"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    """Schema for user response"""
    id: int
    photo_path: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Attendance Log Schemas
class AttendanceLogBase(BaseModel):
    event_type: str = "entry"
    camera_id: str = "default"
    location: Optional[str] = None


class AttendanceLogCreate(AttendanceLogBase):
    user_id: int
    confidence: Optional[float] = None
    image_path: Optional[str] = None


class AttendanceLogResponse(AttendanceLogBase):
    id: int
    user_id: int
    timestamp: datetime
    confidence: Optional[float]
    image_path: Optional[str]
    created_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# Admin Schemas
class AdminBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None


class AdminCreate(AdminBase):
    password: str


class AdminLogin(BaseModel):
    username: str
    password: str


class AdminResponse(AdminBase):
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        from_attributes = True


# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None


# Recognition Schemas
class RecognitionResult(BaseModel):
    """Schema for face recognition result"""
    user_id: Optional[int] = None
    name: Optional[str] = None
    confidence: float
    is_recognized: bool
    timestamp: datetime
    bounding_box: Optional[List[int]] = None


class UnknownFaceLog(BaseModel):
    """Schema for logging unknown faces"""
    camera_id: str = "default"
    location: Optional[str] = None
    notes: Optional[str] = None


# Analytics Schemas
class AttendanceStats(BaseModel):
    """Schema for attendance statistics"""
    total_today: int
    total_this_week: int
    total_this_month: int
    by_department: dict
    by_role: dict
    recent_entries: List[AttendanceLogResponse]


class DashboardStats(BaseModel):
    """Schema for dashboard statistics"""
    total_users: int
    total_employees: int
    total_students: int
    today_attendance: int
    current_present: int
    attendance_rate: float
    unknown_faces_today: int


# File Upload Schema
class FileUploadResponse(BaseModel):
    """Schema for file upload response"""
    filename: str
    file_path: str
    message: str
