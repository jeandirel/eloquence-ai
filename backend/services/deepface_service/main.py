"""
DeepFace Microservice - Emotion Detection
Port: 8003
"""

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from deepface import DeepFace
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

@app.post("/analyze")
async def analyze_emotion(file: UploadFile = File(...)):
    """Detect emotion from image."""
    try:
        # Read image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {"error": "Invalid image"}
        
        # Run DeepFace
        result = DeepFace.analyze(
            img_path=img,
            actions=['emotion'],
            enforce_detection=False,
            detector_backend='opencv',
            silent=True
        )
        
        if result and len(result) > 0:
            dominant_emotion = result[0]['dominant_emotion']
            confidence = result[0]['emotion'][dominant_emotion] / 100.0
            
            return {
                "emotion": dominant_emotion,
                "confidence": confidence,
                "all_emotions": result[0]['emotion']
            }
        
        return {"emotion": "neutral", "confidence": 0.0}
        
    except Exception as e:
        logger.error(f"Error: {e}")
        return {"error": str(e), "emotion": "neutral", "confidence": 0.0}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "deepface"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
