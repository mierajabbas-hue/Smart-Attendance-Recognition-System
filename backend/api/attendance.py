"""
Attendance API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime, timedelta
from backend.database.connection import get_db
from backend.models.models import Admin, User, AttendanceLog, UnknownFace
from backend.models.schemas import (
    AttendanceLogCreate,
    AttendanceLogResponse,
    AttendanceStats,
    DashboardStats
)
from backend.utils.auth import get_current_active_admin

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/", response_model=AttendanceLogResponse, status_code=status.HTTP_201_CREATED)
async def log_attendance(
    attendance_data: AttendanceLogCreate,
    db: Session = Depends(get_db)
):
    """
    Log an attendance event
    """
    # Verify user exists
    user = db.query(User).filter(User.id == attendance_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Create attendance log
    attendance_log = AttendanceLog(
        user_id=attendance_data.user_id,
        event_type=attendance_data.event_type,
        camera_id=attendance_data.camera_id,
        location=attendance_data.location,
        confidence=attendance_data.confidence,
        image_path=attendance_data.image_path
    )

    db.add(attendance_log)
    db.commit()
    db.refresh(attendance_log)

    return attendance_log


@router.get("/", response_model=List[AttendanceLogResponse])
async def get_attendance_logs(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin)
):
    """
    Get attendance logs with optional filtering
    """
    query = db.query(AttendanceLog)

    if user_id:
        query = query.filter(AttendanceLog.user_id == user_id)

    if start_date:
        query = query.filter(AttendanceLog.timestamp >= start_date)

    if end_date:
        query = query.filter(AttendanceLog.timestamp <= end_date)

    logs = query.order_by(AttendanceLog.timestamp.desc()).offset(skip).limit(limit).all()

    # Load user data for each log
    for log in logs:
        log.user = db.query(User).filter(User.id == log.user_id).first()

    return logs


@router.get("/stats", response_model=AttendanceStats)
async def get_attendance_stats(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin)
):
    """
    Get attendance statistics
    """
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    week_start = today_start - timedelta(days=now.weekday())
    month_start = datetime(now.year, now.month, 1)

    # Total attendance today
    total_today = db.query(func.count(AttendanceLog.id))\
        .filter(AttendanceLog.timestamp >= today_start)\
        .scalar()

    # Total attendance this week
    total_this_week = db.query(func.count(AttendanceLog.id))\
        .filter(AttendanceLog.timestamp >= week_start)\
        .scalar()

    # Total attendance this month
    total_this_month = db.query(func.count(AttendanceLog.id))\
        .filter(AttendanceLog.timestamp >= month_start)\
        .scalar()

    # Attendance by department (today)
    by_department_results = db.query(
        User.department,
        func.count(AttendanceLog.id).label('count')
    ).join(User, AttendanceLog.user_id == User.id)\
        .filter(AttendanceLog.timestamp >= today_start)\
        .group_by(User.department)\
        .all()

    by_department = {dept or "Unknown": count for dept, count in by_department_results}

    # Attendance by role (today)
    by_role_results = db.query(
        User.role,
        func.count(AttendanceLog.id).label('count')
    ).join(User, AttendanceLog.user_id == User.id)\
        .filter(AttendanceLog.timestamp >= today_start)\
        .group_by(User.role)\
        .all()

    by_role = {role: count for role, count in by_role_results}

    # Recent entries (last 10)
    recent_entries = db.query(AttendanceLog)\
        .order_by(AttendanceLog.timestamp.desc())\
        .limit(10)\
        .all()

    # Load user data for recent entries
    for log in recent_entries:
        log.user = db.query(User).filter(User.id == log.user_id).first()

    return AttendanceStats(
        total_today=total_today,
        total_this_week=total_this_week,
        total_this_month=total_this_month,
        by_department=by_department,
        by_role=by_role,
        recent_entries=recent_entries
    )


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin)
):
    """
    Get dashboard statistics
    """
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)

    # Total users
    total_users = db.query(func.count(User.id)).scalar()

    # Total employees
    total_employees = db.query(func.count(User.id))\
        .filter(User.role == "employee")\
        .scalar()

    # Total students
    total_students = db.query(func.count(User.id))\
        .filter(User.role == "student")\
        .scalar()

    # Today's attendance count
    today_attendance = db.query(func.count(AttendanceLog.id))\
        .filter(AttendanceLog.timestamp >= today_start)\
        .scalar()

    # Unique users present today
    current_present = db.query(func.count(func.distinct(AttendanceLog.user_id)))\
        .filter(AttendanceLog.timestamp >= today_start)\
        .scalar()

    # Attendance rate
    attendance_rate = (current_present / total_users * 100) if total_users > 0 else 0.0

    # Unknown faces today
    unknown_faces_today = db.query(func.count(UnknownFace.id))\
        .filter(UnknownFace.timestamp >= today_start)\
        .scalar()

    return DashboardStats(
        total_users=total_users,
        total_employees=total_employees,
        total_students=total_students,
        today_attendance=today_attendance,
        current_present=current_present,
        attendance_rate=round(attendance_rate, 2),
        unknown_faces_today=unknown_faces_today
    )


@router.get("/user/{user_id}", response_model=List[AttendanceLogResponse])
async def get_user_attendance(
    user_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin)
):
    """
    Get attendance logs for a specific user
    """
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    query = db.query(AttendanceLog).filter(AttendanceLog.user_id == user_id)

    if start_date:
        query = query.filter(AttendanceLog.timestamp >= start_date)

    if end_date:
        query = query.filter(AttendanceLog.timestamp <= end_date)

    logs = query.order_by(AttendanceLog.timestamp.desc()).all()

    # Add user data
    for log in logs:
        log.user = user

    return logs
