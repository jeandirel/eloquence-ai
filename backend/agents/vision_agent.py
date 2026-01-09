"""
Vision Agent - Computer Vision Module for EloquenceAI

Handles gaze tracking, hand gestures, and emotion detection.
"""

import asyncio
import logging
from typing import Dict, Optional, Tuple, List
import numpy as np
import cv2
import mediapipe as mp
from deepface import DeepFace

from deepface import DeepFace
import base64
import io
from PIL import Image

logger = logging.getLogger(__name__)


class VisionAgent:
    """
    Processes video frames for gaze tracking, gesture detection, and emotion analysis.
    """
    
    def __init__(self):
        # Initialize MediaPipe Face Mesh
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Initialize MediaPipe Hands
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            max_num_hands=1,
            model_complexity=0,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Calibration data
        self.calibration_baseline: Optional[np.ndarray] = None
        self.calibration_frames = []
        self.is_calibrated = False
        
        # Iris landmark indices (MediaPipe specific)
        self.LEFT_IRIS = [474, 475, 476, 477]
        self.RIGHT_IRIS = [469, 470, 471, 472]
        self.LEFT_EYE_CORNERS = [33, 133]
        self.RIGHT_EYE_CORNERS = [362, 263]
        
        logger.info("Vision Agent initialized (Face Mesh + Hands + DeepFace)")
    
    async def analyze_frame(
        self, 
        image_data: bytes, 
        process_emotion: bool = False
    ) -> Optional[Dict]:
        """
        Analyze a single video frame for gaze, gestures, and optionally emotion.
        """
        try:
            # Convert bytes to OpenCV format
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                return None
            
            # Convert to RGB
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            result = {
                "timestamp": asyncio.get_event_loop().time()
            }

            # 1. Face Analysis (Gaze)
            face_results = self.face_mesh.process(img_rgb)
            if face_results.multi_face_landmarks:
                face_landmarks = face_results.multi_face_landmarks[0]
                gaze_vector, gaze_deviation = self._calculate_gaze(face_landmarks, img.shape)
                
                result["gaze_vector"] = gaze_vector.tolist() if gaze_vector is not None else None
                result["gaze_deviation"] = gaze_deviation
                
                # Optional Emotion Detection (Expensive)
                if process_emotion:
                    emotion = await self._detect_emotion(img) # Use BGR for DeepFace
                    result.update(emotion)
            
            # 2. Hand Analysis (Gestures)
            hand_results = self.hands.process(img_rgb)
            if hand_results.multi_hand_landmarks:
                hand_landmarks = hand_results.multi_hand_landmarks[0]
                gesture = self._classify_gesture(hand_landmarks)
                result["gesture"] = gesture
            
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing frame: {e}")
            return None
    
    def _calculate_gaze(self, face_landmarks, img_shape: Tuple[int, int, int]) -> Tuple[Optional[np.ndarray], float]:
        """Calculate gaze vector and deviation."""
        h, w, _ = img_shape
        try:
            # Simple gaze approximation using iris vs eye corners
            left_iris_x = np.mean([face_landmarks.landmark[i].x * w for i in self.LEFT_IRIS])
            left_iris_y = np.mean([face_landmarks.landmark[i].y * h for i in self.LEFT_IRIS])
            left_eye_center = np.mean([[face_landmarks.landmark[i].x * w, face_landmarks.landmark[i].y * h] for i in self.LEFT_EYE_CORNERS], axis=0)
            
            gaze_vector = np.array([left_iris_x - left_eye_center[0], left_iris_y - left_eye_center[1]])
            gaze_vector = gaze_vector / (np.linalg.norm(gaze_vector) + 1e-6)
            
            if not self.is_calibrated:
                self._update_calibration(gaze_vector)
                return gaze_vector, 0.0
            
            if self.calibration_baseline is not None:
                dot = np.clip(np.dot(gaze_vector, self.calibration_baseline), -1.0, 1.0)
                deviation = np.degrees(np.arccos(dot))
            else:
                deviation = 0.0
                
            return gaze_vector, deviation
        except Exception:
            return None, 0.0

    def _update_calibration(self, gaze_vector: np.ndarray):
        """Calibrate gaze baseline."""
        self.calibration_frames.append(gaze_vector)
        if len(self.calibration_frames) >= 30:
            self.calibration_baseline = np.mean(self.calibration_frames, axis=0)
            self.is_calibrated = True
            logger.info("Gaze calibration complete")

    def _classify_gesture(self, landmarks) -> str:
        """
        Classify hand landmarks into basic gestures.
        """
        # Extract finger states (Open/Closed)
        # Thumb is tricky, check x-distance for simplicity or skip
        fingers = []
        
        # Tips and PIP joints
        tips = [8, 12, 16, 20] # Index, Middle, Ring, Pinky
        pips = [6, 10, 14, 18]
        
        # Check if tip is above PIP (y-axis, inverted in screen coords, so tip.y < pip.y is open)
        for tip, pip in zip(tips, pips):
            if landmarks.landmark[tip].y < landmarks.landmark[pip].y:
                fingers.append(1) # Open
            else:
                fingers.append(0) # Closed
                
        # Simple Logic
        if sum(fingers) == 0:
            return "FIST"
        elif sum(fingers) == 4:
            return "OPEN_PALM"
        elif fingers[0] == 1 and sum(fingers) == 1:
            return "POINTING"
        elif fingers[0] == 1 and fingers[1] == 1 and sum(fingers) == 2:
            return "TWO_FINGERS" # Victory/Peace
        
        return "UNKNOWN"

    async def _detect_emotion(self, img_bgr: np.ndarray) -> Dict[str, float]:
        """
        Detect emotion using DeepFace.
        Runs in executor to avoid blocking the event loop.
        """
        try:
            # Run DeepFace in a separate thread/executor
            loop = asyncio.get_event_loop()
            
            # DeepFace.analyze expects BGR or RGB path, but also accepts numpy array
            # result is a list of dicts
            result = await loop.run_in_executor(
                None, 
                lambda: DeepFace.analyze(
                    img_path=img_bgr, 
                    actions=['emotion'], 
                    enforce_detection=False,
                    detector_backend='opencv',
                    silent=True
                )
            )
            
            if result and len(result) > 0:
                dominant_emotion = result[0]['dominant_emotion']
                # Map to valence/arousal or just raw string
                return {
                    "emotion_label": dominant_emotion,
                    "emotion_confidence": result[0]['emotion'][dominant_emotion] / 100.0
                }
                
        except Exception as e:
            logger.error(f"DeepFace error: {e}")
            
        return {"emotion_label": "neutral", "emotion_confidence": 0.0}

    def reset_calibration(self):
        self.calibration_baseline = None
        self.calibration_frames = []
        self.is_calibrated = False
