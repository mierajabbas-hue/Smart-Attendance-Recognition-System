"""
Camera Service
Handles video stream from webcam or IP camera
"""
try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False
    print("WARNING: OpenCV not available. Camera features will be disabled.")

import asyncio
import numpy as np
from typing import Optional, Generator
from backend.config import settings
from backend.services.face_recognition_service import face_recognition_service, FACE_RECOGNITION_AVAILABLE


class CameraService:
    """Service for camera operations"""

    def __init__(self):
        self.camera = None
        self.is_running = False
        self.camera_id = settings.CAMERA_ID
        self.width = settings.CAMERA_WIDTH
        self.height = settings.CAMERA_HEIGHT
        self.fps = settings.CAMERA_FPS

    def start_camera(self, camera_id: Optional[int] = None):
        """Start camera capture"""
        if not OPENCV_AVAILABLE:
            raise Exception("OpenCV is not installed. Camera features are disabled.")

        if camera_id is not None:
            self.camera_id = camera_id

        self.camera = cv2.VideoCapture(self.camera_id)
        self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
        self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
        self.camera.set(cv2.CAP_PROP_FPS, self.fps)

        if not self.camera.isOpened():
            raise Exception("Could not open camera")

        self.is_running = True
        return True

    def stop_camera(self):
        """Stop camera capture"""
        if self.camera is not None:
            self.is_running = False
            self.camera.release()
            self.camera = None

    def read_frame(self) -> Optional[np.ndarray]:
        """Read a single frame from camera"""
        if self.camera is None or not self.is_running:
            return None

        ret, frame = self.camera.read()
        if not ret:
            return None

        return frame

    def generate_frames(self, recognize: bool = True) -> Generator:
        """
        Generator that yields frames from camera
        Used for video streaming

        Args:
            recognize: Whether to perform face recognition on frames
        """
        if not self.is_running:
            self.start_camera()

        while self.is_running:
            frame = self.read_frame()
            if frame is None:
                break

            if recognize and FACE_RECOGNITION_AVAILABLE:
                # Perform face recognition
                results = face_recognition_service.recognize_faces(frame)

                # Draw bounding boxes
                frame = face_recognition_service.draw_bounding_boxes(frame, results)
            elif recognize and not FACE_RECOGNITION_AVAILABLE:
                # Add text overlay indicating face recognition is disabled
                cv2.putText(frame, "Face Recognition Disabled", (10, 30),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                cv2.putText(frame, "Manual Attendance Verification Required", (10, 60),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

            # Encode frame as JPEG
            ret, buffer = cv2.imencode('.jpg', frame)
            if not ret:
                continue

            frame_bytes = buffer.tobytes()

            # Yield frame in byte format
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    async def generate_frames_async(self, recognize: bool = True):
        """
        Async generator that yields frames from camera
        """
        if not self.is_running:
            self.start_camera()

        while self.is_running:
            frame = self.read_frame()
            if frame is None:
                break

            if recognize and FACE_RECOGNITION_AVAILABLE:
                # Perform face recognition
                results = face_recognition_service.recognize_faces(frame)

                # Draw bounding boxes
                frame = face_recognition_service.draw_bounding_boxes(frame, results)
            elif recognize and not FACE_RECOGNITION_AVAILABLE:
                # Add text overlay indicating face recognition is disabled
                cv2.putText(frame, "Face Recognition Disabled", (10, 30),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                cv2.putText(frame, "Manual Attendance Verification Required", (10, 60),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

            # Encode frame as JPEG
            ret, buffer = cv2.imencode('.jpg', frame)
            if not ret:
                continue

            frame_bytes = buffer.tobytes()

            # Yield frame in byte format
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

            # Small delay to control frame rate
            await asyncio.sleep(1.0 / self.fps)

    def capture_image(self, output_path: str) -> bool:
        """
        Capture a single image and save to file

        Args:
            output_path: Path to save the image

        Returns:
            True if successful, False otherwise
        """
        frame = self.read_frame()
        if frame is None:
            return False

        return cv2.imwrite(output_path, frame)

    def get_camera_info(self) -> dict:
        """Get camera information"""
        if not OPENCV_AVAILABLE:
            return {
                "is_running": False,
                "camera_id": self.camera_id,
                "opencv_available": False
            }

        if self.camera is None:
            return {
                "is_running": False,
                "camera_id": self.camera_id,
                "opencv_available": True
            }

        return {
            "is_running": self.is_running,
            "camera_id": self.camera_id,
            "width": int(self.camera.get(cv2.CAP_PROP_FRAME_WIDTH)),
            "height": int(self.camera.get(cv2.CAP_PROP_FRAME_HEIGHT)),
            "fps": int(self.camera.get(cv2.CAP_PROP_FPS)),
            "opencv_available": True
        }

    def __del__(self):
        """Cleanup when object is destroyed"""
        self.stop_camera()


# Create global instance
camera_service = CameraService()
