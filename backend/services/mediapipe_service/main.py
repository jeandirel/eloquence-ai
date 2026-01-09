"""
MediaPipe Microservice - Gesture Detection Only
Port: 8002
"""

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import mediapipe as mp
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    max_num_hands=2,  # Support 2 hands for better detection
    model_complexity=0,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Initialize MediaPipe Drawing
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

# Pipeline State (Global for simplicity in this microservice instance)
from collections import deque, Counter

class GesturePipeline:
    def __init__(self):
        # 6. Validation Temporelle Configuration
        self.history_size = 5 # Number of frames for smoothing
        self.gesture_history = deque(maxlen=self.history_size)
        self.cooldown_frames = 10
        self.cooldown_counter = 0
        # Track wrist position for TCHAO (wave) detection
        self.wrist_history = deque(maxlen=10)
        self.last_wrist_x = None
        self.last_confirmed_gesture = "UNKNOWN"

    def process(self, landmarks, img_shape):
        """
        Execute steps 4, 5, 6 of the pipeline.
        4. Analyse Géométrique
        5. Classification Geste
        6. Validation Temporelle
        """
        h, w, _ = img_shape
        
        # --- 4. Analyse Géométrique ---
        # Extract meaningful geometric features (distances, states)
        thumb_tip = landmarks.landmark[4]
        index_tip = landmarks.landmark[8]
        middle_tip = landmarks.landmark[12]
        ring_tip = landmarks.landmark[16]
        pinky_tip = landmarks.landmark[20]
        wrist = landmarks.landmark[0]
        
        # Fingers States (0 = Folded, 1 = Extended)
        fingers = []
        
        # Thumb: Compare x-distance to wrist (simplified for right hand/camera mirror)
        # Using simple check: is tip far from palm center?
        # A more robust check for general purpose:
        thumb_extended = False
        # Calculate pseudo-palm center (average of MCPs)
        palm_center_x = (landmarks.landmark[5].x + landmarks.landmark[9].x + landmarks.landmark[17].x) / 3
        if abs(thumb_tip.x - palm_center_x) > 0.05: # Arbitrary threshold for extension
            thumb_extended = True
        fingers.append(1 if thumb_extended else 0)

        # Other 4 fingers: Tip y < PIP y (assuming hand is upright)
        tips = [8, 12, 16, 20]
        pips = [6, 10, 14, 18]
        for tip, pip in zip(tips, pips):
            if landmarks.landmark[tip].y < landmarks.landmark[pip].y:
                fingers.append(1)
            else:
                fingers.append(0)
                
        # --- 5. Classification Geste ---
        raw_gesture = "UNKNOWN"
        total_extended = sum(fingers)
        
        # Calculate distances for OK gesture detection
        thumb_index_dist = np.sqrt(
            (thumb_tip.x - index_tip.x)**2 + 
            (thumb_tip.y - index_tip.y)**2
        )
        
        # Track wrist movement for TCHAO (wave) detection
        current_wrist_x = wrist.x
        wrist_movement = 0
        if self.last_wrist_x is not None:
            wrist_movement = abs(current_wrist_x - self.last_wrist_x)
        self.last_wrist_x = current_wrist_x
        self.wrist_history.append(wrist_movement)
        avg_wrist_movement = sum(self.wrist_history) / len(self.wrist_history) if self.wrist_history else 0
        
        # Rule-based classification (priority order matters)
        if total_extended == 0:
            raw_gesture = "FIST"
        
        # THUMBS_UP: Only thumb extended
        elif fingers[0] == 1 and sum(fingers[1:]) == 0:
            raw_gesture = "THUMBS_UP"
        
        # OK: Thumb and index close together (forming circle)
        elif thumb_index_dist < 0.05 and total_extended >= 3:
            raw_gesture = "OK"
        
        # PEACE: Index and middle finger extended, others folded
        elif fingers[1] == 1 and fingers[2] == 1 and fingers[3] == 0 and fingers[4] == 0:
            raw_gesture = "PEACE"
        
        # TCHAO: Open palm with lateral movement
        elif total_extended == 5 and avg_wrist_movement > 0.02:
            raw_gesture = "TCHAO"
        
        # OPEN_PALM: All fingers extended, no movement
        elif total_extended == 5:
            raw_gesture = "OPEN_PALM"
        
        # POINTING: Index only extended
        elif fingers[1] == 1 and total_extended == 1:
            raw_gesture = "POINTING"
        
        # TWO_FINGERS: Index and middle extended (but not PEACE pattern)
        elif fingers[1] == 1 and fingers[2] == 1 and total_extended == 2:
            raw_gesture = "TWO_FINGERS"
            
        # --- 6. Validation Temporelle ---
        # 6a. Cooldown check
        if self.cooldown_counter > 0:
            self.cooldown_counter -= 1
            return self.last_confirmed_gesture
            
        # 6b. History Smoothing
        self.gesture_history.append(raw_gesture)
        
        if len(self.gesture_history) == self.history_size:
            # Get most common gesture in history
            most_common, count = Counter(self.gesture_history).most_common(1)[0]
            
            # Confidence threshold (e.g., 4/5 frames must match)
            if count >= 4:
                new_gesture = most_common
                
                # If gesture changed to something significant, trigger cooldown?
                # For this MVP, we just return the stabilized gesture
                self.last_confirmed_gesture = new_gesture
                return new_gesture
                
        return self.last_confirmed_gesture

# Initialize Pipeline
pipeline = GesturePipeline()

@app.post("/analyze")
async def analyze_frame(file: UploadFile = File(...)):
    """
    Full Pipeline:
    1. Capture (FastAPI)
    2. Detection Main & Face (MediaPipe)
    3. Extraction (Landmarks)
    4. Analyse (Geometry)
    5. Classification
    6. Validation
    7. Action
    """
    try:
        # --- 1. Capture Vidéo ---
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {"error": "Invalid image"}
        
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        result = {}
        gesture_out = "UNKNOWN"
        
        # --- 2. Détection Main ---
        hand_results = hands.process(img_rgb)
        
        # Serialize hand landmarks
        if hand_results.multi_hand_landmarks:
            hand_landmarks_list = []
            for hand_landmarks in hand_results.multi_hand_landmarks:
                # Convert landmarks to JSON-serializable format
                landmarks_dict = []
                for landmark in hand_landmarks.landmark:
                    landmarks_dict.append({
                        "x": float(landmark.x),
                        "y": float(landmark.y),
                        "z": float(landmark.z)
                    })
                hand_landmarks_list.append(landmarks_dict)
            
            result["hand_landmarks"] = hand_landmarks_list
            
            # Hand connections for drawing
            result["hand_connections"] = [[conn[0], conn[1]] for conn in mp_hands.HAND_CONNECTIONS]
            
            # --- 3. Extraction Landmarks (first hand for gesture) ---
            hand_landmarks = hand_results.multi_hand_landmarks[0]
            
            # --- 4, 5, 6. Analyse, Classification, Validation ---
            gesture_out = pipeline.process(hand_landmarks, img.shape)
            
            result["gesture"] = gesture_out
            
            # --- 7. Action Logique (Mapping done in Orchestrator) ---
            if gesture_out != "UNKNOWN":
                result["command_trigger"] = True
                
        else:
            # Reset history if no hand detected
            pipeline.gesture_history.clear()
        
        # --- 2b. Détection Visage ---
        face_results = face_mesh.process(img_rgb)
        
        if face_results.multi_face_landmarks:
            face_landmarks_list = []
            for face_landmarks in face_results.multi_face_landmarks:
                # Convert face landmarks to JSON-serializable format
                landmarks_dict = []
                for landmark in face_landmarks.landmark:
                    landmarks_dict.append({
                        "x": float(landmark.x),
                        "y": float(landmark.y),
                        "z": float(landmark.z)
                    })
                face_landmarks_list.append(landmarks_dict)
            
            result["face_landmarks"] = face_landmarks_list
            
            # Face connections for drawing (use contours subset to avoid overwhelming frontend)
            # Using FACEMESH_CONTOURS for a cleaner look
            result["face_connections"] = [[conn[0], conn[1]] for conn in mp_face_mesh.FACEMESH_CONTOURS]
        
        return result
        
    except Exception as e:
        logger.error(f"Error: {e}")
        return {"error": str(e)}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "mediapipe"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
