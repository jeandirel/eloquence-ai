"""
OmniSense Main Orchestrator
Port: 8000

Coordinates all microservices and manages WebSocket connections.
"""

import os
import asyncio
import logging
import warnings
from typing import Dict
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import httpx
import io

warnings.filterwarnings("ignore")
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("OmniSense")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service URLs
MEDIAPIPE_URL = "http://localhost:8002"
DEEPFACE_URL = "http://localhost:8003"
AUDIO_URL = "http://localhost:8001"

class SessionManager:
    """Manages recording of session data (emotions, gestures)."""
    def __init__(self):
        self.active = False
        self.start_time = 0
        self.emotions_log = []
        self.gestures_log = []
        self.events_timeline = []
    
    def start_session(self):
        self.active = True
        import time
        self.start_time = time.time()
        self.emotions_log = []
        self.gestures_log = []
        self.events_timeline = []
        logger.info("Session STARTED")

    def stop_session(self):
        if not self.active:
            return None
        self.active = False
        import time
        duration = time.time() - self.start_time
        
        # Calculate stats
        emotion_counts = {}
        for e in self.emotions_log:
            emotion_counts[e] = emotion_counts.get(e, 0) + 1
            
        gesture_counts = {}
        for g in self.gestures_log:
            gesture_counts[g] = gesture_counts.get(g, 0) + 1
            
        report = {
            "duration_seconds": round(duration, 2),
            "emotion_stats": emotion_counts,
            "gesture_stats": gesture_counts,
            "timeline": self.events_timeline
        }
        logger.info(f"Session STOPPED. Report: {report}")
        return report

    def log_emotion(self, emotion):
        if self.active:
            self.emotions_log.append(emotion)
            
    def log_gesture(self, gesture):
        if self.active:
            self.gestures_log.append(gesture)
            import time
            self.events_timeline.append({
                "time": round(time.time() - self.start_time, 2),
                "type": "GESTURE",
                "value": gesture
            })

session_manager = SessionManager()

class FusionEngine:
    """Synthesizes multimodal inputs."""
    
    def __init__(self):
        self.last_emotion = "neutral"
        self.gaze_history = []
    
    async def process_vision(self, vision_data: Dict, websocket: WebSocket):
        """Process vision results and generate UI feedback."""
        try:
            # Emotion-based UI adaptation
            if "emotion" in vision_data:
                emotion = vision_data["emotion"]
                
                # Log to session
                session_manager.log_emotion(emotion)
                
                if emotion != self.last_emotion:
                    self.last_emotion = emotion
                    
                    ui_mode = "STANDARD"
                    if emotion in ["angry", "fear"]:
                        ui_mode = "SIMPLIFIED"
                    elif emotion == "sad":
                        ui_mode = "CALM"
                    elif emotion in ["happy", "surprise"]:
                        ui_mode = "DYNAMIC"
                    
                    await websocket.send_json({
                        "type": "UI_ADAPTATION",
                        "mode": ui_mode,
                        "emotion": emotion,
                        "confidence": vision_data.get("confidence", 0.0),
                        "all_emotions": vision_data.get("all_emotions", {})
                    })
            
            
            # Gesture commands
            if "gesture" in vision_data:
                gesture = vision_data["gesture"]
                command = None
                
                # Log to session
                if gesture != "UNKNOWN":
                    session_manager.log_gesture(gesture)

                if gesture == "FIST":
                    command = "SELECT_ITEM"
                elif gesture == "OPEN_PALM":
                    command = "PAUSE_SESSION"
                elif gesture == "POINTING":
                    command = "HIGHLIGHT_MODE"
                elif gesture == "PEACE":
                    command = "NEXT_ITEM"
                elif gesture == "THUMBS_UP":
                    command = "APPROVE"
                elif gesture == "OK":
                    command = "CONFIRM"
                elif gesture == "TCHAO":
                    command = "GOODBYE"
                
                if command:
                    # Send gesture command with landmarks data
                    await websocket.send_json({
                        "type": "UI_COMMAND",
                        "source": "GESTURE",
                        "command": command,
                        "gesture": gesture,
                        # Include landmarks for visualization
                        "hand_landmarks": vision_data.get("hand_landmarks"),
                        "face_landmarks": vision_data.get("face_landmarks"),
                        "hand_connections": vision_data.get("hand_connections"),
                        "face_connections": vision_data.get("face_connections")
                    })
            
            # Gaze alerts
            if "gaze" in vision_data:
                deviation = vision_data["gaze"].get("deviation", 0)
                self.gaze_history.append(deviation)
                
                if len(self.gaze_history) > 30:
                    self.gaze_history.pop(0)
                
                avg_deviation = sum(self.gaze_history) / len(self.gaze_history)
                
                if avg_deviation > 15:  # Threshold
                    await websocket.send_json({
                        "type": "GAZE_ALERT"
                    })
        
        except Exception as e:
            logger.error(f"Fusion error: {e}")
    
    async def process_audio(self, audio_data: Dict, websocket: WebSocket):
        """Process audio results."""
        try:
            if audio_data.get("intent"):
                # [Step 8] Decision Engine
                intent = audio_data["intent"]
                entity = audio_data.get("entity")
                
                # Context Check (mock)
                logger.info(f"Step 8: Decision Engine | Validating {intent} on {entity}...")
                
                await websocket.send_json({
                    "type": "UI_COMMAND",
                    "source": "VOICE",
                    "command": intent,
                    "entity": entity,
                    "transcript": audio_data.get("transcript", "")
                })
        except Exception as e:
            logger.error(f"Audio fusion error: {e}")

fusion = FusionEngine()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("Client connected")
    
    http_client = httpx.AsyncClient(timeout=10.0)
    audio_buffer = bytearray()
    BUFFER_THRESHOLD = 48000  # ~1.5 seconds of audio (16kHz * 2 bytes * 1.5)
    
    try:
        while True:
            data = await websocket.receive_bytes()
            
            data_type = data[0]
            payload = data[1:]
            
            if data_type == 0:  # Video
                # Call MediaPipe
                try:
                    mp_response = await http_client.post(
                        f"{MEDIAPIPE_URL}/analyze",
                        files={"file": ("frame.jpg", io.BytesIO(payload), "image/jpeg")}
                    )
                    mp_result = mp_response.json()
                    
                    # Call DeepFace (Optional - Don't block Gesture Lab if this fails)
                    df_result = {}
                    try:
                        df_response = await http_client.post(
                            f"{DEEPFACE_URL}/analyze",
                            files={"file": ("frame.jpg", io.BytesIO(payload), "image/jpeg")}
                        )
                        if df_response.status_code == 200:
                            df_result = df_response.json()
                    except Exception as df_error:
                        # Log but continue (don't break gesture flow)
                        # logger.warning(f"DeepFace skipped: {df_error}")
                        pass
                    
                    combined = {**mp_result, **df_result}
                    await fusion.process_vision(combined, websocket)
                    
                except Exception as e:
                    logger.error(f"Vision error: {e}")
            
            elif data_type == 2: # JSON Control Message
                # Handle control messages like START/STOP SESSION
                try:
                    import json
                    message = json.loads(payload.decode('utf-8'))
                    if message.get("type") == "SESSION_CONTROL":
                        action = message.get("action")
                        if action == "START":
                            session_manager.start_session()
                        elif action == "STOP":
                            report = session_manager.stop_session()
                            if report:
                                await websocket.send_json({
                                    "type": "SESSION_REPORT",
                                    "report": report
                                })
                except Exception as e:
                    logger.error(f"Control message error: {e}")

            elif data_type == 1:  # Audio
                # Buffer audio
                audio_buffer.extend(payload)
                
                if len(audio_buffer) >= BUFFER_THRESHOLD:
                    try:
                        # Send accumulated buffer
                        logger.info(f"Probcessing audio buffer: {len(audio_buffer)} bytes")
                        audio_response = await http_client.post(
                            f"{AUDIO_URL}/transcribe",
                            files={"file": ("audio.pcm", io.BytesIO(audio_buffer), "application/octet-stream")}
                        )
                        audio_result = audio_response.json()
                        
                        await fusion.process_audio(audio_result, websocket)
                        
                        # Clear buffer (sliding window could be better but clear is safer for commands)
                        audio_buffer.clear()
                        
                    except Exception as e:
                        logger.error(f"Audio error: {e}")
                        # Keep buffer or clear? Clear to avoid stuck bad state
                        audio_buffer.clear()
    
    except WebSocketDisconnect:
        logger.info("Client disconnected")
    finally:
        await http_client.aclose()

@app.get("/health")
async def health():
    """Health check for all services."""
    async with httpx.AsyncClient() as client:
        services = {
            "mediapipe": MEDIAPIPE_URL,
            "deepface": DEEPFACE_URL,
            "audio": AUDIO_URL
        }
        
        status = {}
        for name, url in services.items():
            try:
                response = await client.get(f"{url}/health", timeout=2.0)
                status[name] = response.json()
            except:
                status[name] = {"status": "offline"}
        
        return {"orchestrator": "healthy", "services": status}

if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 Starting OmniSense Orchestrator")
    uvicorn.run(app, host="0.0.0.0", port=8000)
