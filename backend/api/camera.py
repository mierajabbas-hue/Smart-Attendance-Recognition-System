"""
Camera and Live Feed API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.models.models import Admin, User, AttendanceLog, UnknownFace
from backend.services.camera_service import camera_service
from backend.services.face_recognition_service import face_recognition_service
from backend.utils.auth import get_current_active_admin, get_admin_from_query_token
from datetime import datetime, timedelta
import asyncio
from typing import Optional
import cv2
import numpy as np
from io import BytesIO

router = APIRouter(prefix="/camera", tags=["Camera"])


@router.get("/feed")
async def video_feed(
    token: str = Query(...),
    current_admin: Admin = Depends(get_admin_from_query_token)
):
    """
    Stream live video feed with face recognition
    Requires token as query parameter for img src compatibility
    """
    return StreamingResponse(
        camera_service.generate_frames(recognize=True),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@router.get("/info")
async def get_camera_info(
    current_admin: Admin = Depends(get_current_active_admin)
):
    """
    Get camera information and status
    """
    return camera_service.get_camera_info()


@router.post("/start")
async def start_camera(
    camera_id: int = 0,
    current_admin: Admin = Depends(get_current_active_admin)
):
    """
    Start camera capture
    """
    try:
        camera_service.start_camera(camera_id)
        return {"message": "Camera started successfully", "camera_id": camera_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stop")
async def stop_camera(
    current_admin: Admin = Depends(get_current_active_admin)
):
    """
    Stop camera capture
    """
    camera_service.stop_camera()
    return {"message": "Camera stopped successfully"}


@router.post("/recognize")
async def recognize_current_frame(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin)
):
    """
    Perform face recognition on current camera frame and log attendance
    """
    # Read current frame
    frame = camera_service.read_frame()
    if frame is None:
        raise HTTPException(status_code=400, detail="Could not read frame from camera")

    # Perform face recognition
    results = face_recognition_service.recognize_faces(frame)

    # Log attendance for recognized faces
    logged_users = []
    unknown_count = 0

    for result in results:
        if result["is_recognized"]:
            user_id = result["user_id"]

            # Check if user was already logged recently (within last 5 minutes)
            five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
            recent_log = db.query(AttendanceLog)\
                .filter(
                    AttendanceLog.user_id == user_id,
                    AttendanceLog.timestamp >= five_minutes_ago
                )\
                .first()

            if not recent_log:
                # Log new attendance
                attendance_log = AttendanceLog(
                    user_id=user_id,
                    event_type="entry",
                    camera_id="default",
                    confidence=result["confidence"]
                )
                db.add(attendance_log)
                logged_users.append(result["name"])

        else:
            # Log unknown face
            unknown_face = UnknownFace(
                camera_id="default"
            )
            db.add(unknown_face)
            unknown_count += 1

    db.commit()

    return {
        "total_faces": len(results),
        "recognized": len(logged_users),
        "unknown": unknown_count,
        "logged_users": logged_users,
        "results": results
    }


@router.get("/reload-faces")
async def reload_known_faces(
    current_admin: Admin = Depends(get_current_active_admin)
):
    """
    Reload all known face encodings
    """
    face_recognition_service.reload_known_faces()
    return {
        "message": "Face encodings reloaded successfully",
        "total_faces": len(face_recognition_service.known_face_encodings)
    }


@router.post("/recognize-upload")
async def recognize_uploaded_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_active_admin)
):
    """
    Perform face recognition on an uploaded image from browser camera
    """
    try:
        # Read the uploaded file
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            raise HTTPException(status_code=400, detail="Could not decode image")

        # Perform face recognition
        results = face_recognition_service.recognize_faces(frame)

        # Log attendance for recognized faces
        logged_users = []
        unknown_count = 0

        for result in results:
            if result["is_recognized"]:
                user_id = result["user_id"]

                # Check if user was already logged recently (within last 5 minutes)
                five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
                recent_log = db.query(AttendanceLog)\
                    .filter(
                        AttendanceLog.user_id == user_id,
                        AttendanceLog.timestamp >= five_minutes_ago
                    )\
                    .first()

                if not recent_log:
                    # Log new attendance
                    attendance_log = AttendanceLog(
                        user_id=user_id,
                        event_type="entry",
                        camera_id="browser",
                        confidence=result["confidence"]
                    )
                    db.add(attendance_log)
                    logged_users.append(result["name"])

            else:
                # Log unknown face
                unknown_face = UnknownFace(
                    camera_id="browser"
                )
                db.add(unknown_face)
                unknown_count += 1

        db.commit()

        return {
            "total_faces": len(results),
            "recognized": len(logged_users),
            "unknown": unknown_count,
            "logged_users": logged_users,
            "results": results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
