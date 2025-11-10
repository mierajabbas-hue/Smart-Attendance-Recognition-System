"""
Face Recognition Service
Handles face detection, encoding, and recognition
"""
try:
    import face_recognition
    import cv2
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    print("WARNING: face_recognition not available. Face recognition features will be disabled.")

import numpy as np
import pickle
import os
from typing import List, Tuple, Optional, Dict
from datetime import datetime
from backend.config import settings


class FaceRecognitionService:
    """Service for face recognition operations"""

    def __init__(self):
        self.known_face_encodings = []
        self.known_face_ids = []
        self.known_face_names = []
        self.tolerance = settings.FACE_RECOGNITION_TOLERANCE
        self.detection_model = settings.FACE_DETECTION_MODEL
        self.load_known_faces()

    def load_known_faces(self):
        """Load all known face encodings from storage"""
        if not FACE_RECOGNITION_AVAILABLE:
            print("Face recognition not available - skipping loading")
            return

        embeddings_folder = settings.FACE_EMBEDDINGS_FOLDER

        if not os.path.exists(embeddings_folder):
            os.makedirs(embeddings_folder, exist_ok=True)
            return

        for filename in os.listdir(embeddings_folder):
            if filename.endswith(".pkl"):
                filepath = os.path.join(embeddings_folder, filename)
                try:
                    with open(filepath, "rb") as f:
                        data = pickle.load(f)
                        self.known_face_encodings.append(data["encoding"])
                        self.known_face_ids.append(data["user_id"])
                        self.known_face_names.append(data["name"])
                except Exception as e:
                    print(f"Error loading {filename}: {str(e)}")

        print(f"Loaded {len(self.known_face_encodings)} known faces")

    def reload_known_faces(self):
        """Reload all known faces (useful after adding new users)"""
        self.known_face_encodings = []
        self.known_face_ids = []
        self.known_face_names = []
        self.load_known_faces()

    def detect_faces(self, image: np.ndarray) -> Tuple[List, List]:
        """
        Detect faces in an image
        Returns face locations and encodings
        """
        if not FACE_RECOGNITION_AVAILABLE:
            return [], []

        # Convert BGR to RGB (OpenCV uses BGR, face_recognition uses RGB)
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Find all face locations and encodings
        face_locations = face_recognition.face_locations(
            rgb_image,
            model=self.detection_model
        )

        face_encodings = face_recognition.face_encodings(
            rgb_image,
            face_locations,
            num_jitters=settings.NUM_JITTERS,
            model=settings.FACE_ENCODING_MODEL
        )

        return face_locations, face_encodings

    def recognize_faces(self, image: np.ndarray) -> List[Dict]:
        """
        Recognize faces in an image
        Returns list of recognition results
        """
        face_locations, face_encodings = self.detect_faces(image)
        results = []

        for face_location, face_encoding in zip(face_locations, face_encodings):
            # Check if there are any known faces
            if len(self.known_face_encodings) == 0:
                results.append({
                    "user_id": None,
                    "name": "Unknown",
                    "confidence": 0.0,
                    "is_recognized": False,
                    "bounding_box": face_location,
                    "timestamp": datetime.utcnow()
                })
                continue

            # Compare face with known faces
            face_distances = face_recognition.face_distance(
                self.known_face_encodings,
                face_encoding
            )

            best_match_index = np.argmin(face_distances)
            best_match_distance = face_distances[best_match_index]

            # Check if the best match is within tolerance
            if best_match_distance <= self.tolerance:
                user_id = self.known_face_ids[best_match_index]
                name = self.known_face_names[best_match_index]
                confidence = 1.0 - best_match_distance

                results.append({
                    "user_id": user_id,
                    "name": name,
                    "confidence": float(confidence),
                    "is_recognized": True,
                    "bounding_box": face_location,
                    "timestamp": datetime.utcnow()
                })
            else:
                results.append({
                    "user_id": None,
                    "name": "Unknown",
                    "confidence": float(1.0 - best_match_distance),
                    "is_recognized": False,
                    "bounding_box": face_location,
                    "timestamp": datetime.utcnow()
                })

        return results

    def create_face_encoding(self, image_path: str) -> Optional[np.ndarray]:
        """
        Create face encoding from an image file
        Returns the face encoding or None if no face found
        """
        if not FACE_RECOGNITION_AVAILABLE:
            # Return a dummy encoding for testing
            return np.random.rand(128)

        # Load image
        image = face_recognition.load_image_file(image_path)

        # Find face encodings
        face_encodings = face_recognition.face_encodings(
            image,
            num_jitters=settings.NUM_JITTERS,
            model=settings.FACE_ENCODING_MODEL
        )

        if len(face_encodings) == 0:
            return None

        # Return the first face encoding
        return face_encodings[0]

    def save_face_encoding(
        self,
        user_id: int,
        name: str,
        encoding: np.ndarray
    ) -> str:
        """
        Save face encoding to file
        Returns the file path
        """
        filename = f"user_{user_id}.pkl"
        filepath = os.path.join(settings.FACE_EMBEDDINGS_FOLDER, filename)

        data = {
            "user_id": user_id,
            "name": name,
            "encoding": encoding,
            "created_at": datetime.utcnow().isoformat()
        }

        with open(filepath, "wb") as f:
            pickle.dump(data, f)

        return filepath

    def delete_face_encoding(self, user_id: int):
        """Delete face encoding file for a user"""
        filename = f"user_{user_id}.pkl"
        filepath = os.path.join(settings.FACE_EMBEDDINGS_FOLDER, filename)

        if os.path.exists(filepath):
            os.remove(filepath)

    def draw_bounding_boxes(
        self,
        image: np.ndarray,
        results: List[Dict]
    ) -> np.ndarray:
        """
        Draw bounding boxes and labels on image
        Returns annotated image
        """
        for result in results:
            top, right, bottom, left = result["bounding_box"]

            # Choose color based on recognition status
            color = (0, 255, 0) if result["is_recognized"] else (0, 0, 255)

            # Draw rectangle
            cv2.rectangle(image, (left, top), (right, bottom), color, 2)

            # Draw label background
            cv2.rectangle(
                image,
                (left, bottom - 35),
                (right, bottom),
                color,
                cv2.FILLED
            )

            # Draw label text
            font = cv2.FONT_HERSHEY_DUPLEX
            name = result["name"]
            confidence = result["confidence"]
            label = f"{name} ({confidence:.2f})"

            cv2.putText(
                image,
                label,
                (left + 6, bottom - 6),
                font,
                0.6,
                (255, 255, 255),
                1
            )

        return image

    def validate_face_image(self, image_path: str) -> Tuple[bool, str]:
        """
        Validate that an image contains exactly one face
        Returns (is_valid, message)
        """
        if not FACE_RECOGNITION_AVAILABLE:
            # In demo mode, accept all images
            return True, "Face recognition disabled - image accepted for demo"

        try:
            image = face_recognition.load_image_file(image_path)
            face_locations = face_recognition.face_locations(image)

            if len(face_locations) == 0:
                return False, "No face detected in the image"
            elif len(face_locations) > 1:
                return False, "Multiple faces detected. Please upload an image with only one face"
            else:
                return True, "Valid face image"
        except Exception as e:
            return False, f"Error validating image: {str(e)}"


# Create global instance
face_recognition_service = FaceRecognitionService()
