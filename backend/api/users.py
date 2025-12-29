"""
User Management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
from datetime import datetime
from backend.database.connection import get_db
from backend.models.models import Admin, User
from backend.models.schemas import UserCreate, UserResponse, UserUpdate, FileUploadResponse
from backend.utils.auth import get_current_active_admin
from backend.services.face_recognition_service import face_recognition_service, FACE_RECOGNITION_AVAILABLE
from backend.config import settings

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_id: str = Form(...),
    name: str = Form(...),
    role: str = Form(...),
    email: Optional[str] = Form(None),
    department: Optional[str] = Form(None),
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin)
):
    """
    Register a new user with face encoding
    """
    # Validate role
    if role not in ["employee", "student"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be either 'employee' or 'student'"
        )

    # Check if user_id already exists
    existing_user = db.query(User).filter(User.user_id == user_id).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID already exists"
        )

    # Validate file extension
    file_extension = photo.filename.split(".")[-1].lower()
    if file_extension not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {settings.ALLOWED_EXTENSIONS}"
        )

    # Save uploaded photo
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    photo_filename = f"{user_id}_{timestamp}.{file_extension}"
    photo_path = os.path.join(settings.UPLOAD_FOLDER, photo_filename)

    with open(photo_path, "wb") as buffer:
        shutil.copyfileobj(photo.file, buffer)

    # Only process face recognition if libraries are available
    if FACE_RECOGNITION_AVAILABLE:
        # Validate face in image
        is_valid, message = face_recognition_service.validate_face_image(photo_path)
        if not is_valid:
            os.remove(photo_path)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )

        # Create face encoding
        face_encoding = face_recognition_service.create_face_encoding(photo_path)
        if face_encoding is None:
            os.remove(photo_path)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not generate face encoding"
            )

    # Create new user
    new_user = User(
        user_id=user_id,
        name=name,
        email=email,
        role=role,
        department=department,
        photo_path=photo_path
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Save face encoding only if available
    if FACE_RECOGNITION_AVAILABLE:
        encoding_path = face_recognition_service.save_face_encoding(
            new_user.id,
            new_user.name,
            face_encoding
        )
        new_user.face_encoding_path = encoding_path
        db.commit()
        db.refresh(new_user)

        # Reload known faces
        face_recognition_service.reload_known_faces()

    return new_user


@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 50,
    role: Optional[str] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin)
):
    """
    Get list of users with optional filtering
    """
    query = db.query(User)

    if role:
        query = query.filter(User.role == role)

    if department:
        query = query.filter(User.department == department)

    users = query.offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin)
):
    """
    Get user by ID
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin)
):
    """
    Update user information
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Update fields
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin)
):
    """
    Delete a user
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Delete face encoding
    face_recognition_service.delete_face_encoding(user.id)

    # Delete photo
    if user.photo_path and os.path.exists(user.photo_path):
        os.remove(user.photo_path)

    # Delete user from database
    db.delete(user)
    db.commit()

    # Reload known faces
    face_recognition_service.reload_known_faces()

    return None


@router.get("/{user_id}/photo")
@router.head("/{user_id}/photo")
async def get_user_photo(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Get user photo by user ID (supports GET and HEAD methods)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not user.photo_path or not os.path.exists(user.photo_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found"
        )

    # Determine content type based on file extension
    ext = user.photo_path.split('.')[-1].lower()
    media_type = f"image/{ext}" if ext in ['png', 'jpg', 'jpeg', 'gif'] else "image/png"

    return FileResponse(user.photo_path, media_type=media_type)
