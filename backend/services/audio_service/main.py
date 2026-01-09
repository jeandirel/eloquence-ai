"""
Audio Microservice - Speech Recognition Optimized
Port: 8001
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import torch
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC
import webrtcvad
import librosa
import logging
from typing import Tuple, Optional
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LogisticRegression

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Audio Microservice Optimized")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Wav2Vec2 STT Model
logger.info("Loading Wav2Vec2 model...")
processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-base-960h")
model = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-base-960h")
model.eval()
logger.info("Model loaded.")

# --- Simple ML intent classifier ---
# Sample training data (expandable)
train_texts = [
    "enable emotion", "activate gesture", "start gaze", "disable emotion", 
    "stop gaze", "confirm action", "cancel action", "switch to gesture",
    "open dashboard", "next", "help"
]
train_labels = [
    "ACTIVATE_MODULE", "ACTIVATE_MODULE", "ACTIVATE_MODULE",
    "DEACTIVATE_MODULE", "DEACTIVATE_MODULE", "CONFIRM", "CANCEL",
    "SWITCH_TO", "ACTIVATE_MODULE", "NAVIGATE", "SYSTEM_ACTION"
]

vectorizer = CountVectorizer()
X_train = vectorizer.fit_transform(train_texts)
intent_clf = LogisticRegression()
intent_clf.fit(X_train, train_labels)
logger.info("Intent classifier initialized.")

# --- Helper Functions ---

def read_audio(file: UploadFile) -> Tuple[np.ndarray, int]:
    """Read audio - handles both file formats (via librosa) and raw PCM Int16"""
    contents = file.file.read()
    try:
        # Try as structured audio file first (wav, mp3, etc.)
        audio, sr = librosa.load(librosa.io.BytesIO(contents), sr=16000, mono=True)
        return audio, sr
    except:
        # Fallback: treat as raw PCM Int16 (from WebSocket/Browser)
        try:
            pcm_data = np.frombuffer(contents, dtype=np.int16)
            audio_float = pcm_data.astype(np.float32) / 32768.0
            return audio_float, 16000
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid audio data: {e}")

def is_speech(audio: np.ndarray, sr: int) -> bool:
    """Simple VAD using webrtcvad"""
    vad = webrtcvad.Vad(1)  # Aggressiveness 0-3
    frame_duration = 30  # ms
    frame_length = int(sr * frame_duration / 1000)
    for start in range(0, len(audio), frame_length):
        frame = audio[start:start+frame_length]
        if len(frame) < frame_length:
            break
        pcm16 = (frame * 32767).astype(np.int16).tobytes()
        if vad.is_speech(pcm16, sr):
            return True
    return False

def transcribe_audio(audio: np.ndarray, sr: int) -> str:
    """Convert audio to text using Wav2Vec2"""
    inputs = processor(audio, sampling_rate=sr, return_tensors="pt", padding=True)
    with torch.no_grad():
        logits = model(inputs.input_values).logits
    predicted_ids = torch.argmax(logits, dim=-1)
    transcription = processor.batch_decode(predicted_ids)[0].lower()
    return transcription

def detect_intent(transcription: str) -> Tuple[Optional[str], Optional[str]]:
    """Predict intent and entity from transcription"""
    # ML-based intent detection
    X_test = vectorizer.transform([transcription])
    intent = intent_clf.predict(X_test)[0]

    # Entity detection based on keywords
    entity = None
    keywords = {
        "EMOTION_AI": ["emotion"],
        "GESTURE_CONTROL": ["gesture"],
        "GAZE_TRACKER": ["gaze"],
        "SPEECH_STUDIO": ["speech"],
        "DASHBOARD": ["dashboard"],
        "NEXT_SECTION": ["next"],
        "HELP_MODE": ["help"],
        "ACTION": ["action"]
    }
    for e, kws in keywords.items():
        if any(k in transcription for k in kws):
            entity = e
            break
    return intent, entity

# --- API Routes ---

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    # Accept any binary data (PCM from orchestrator)
    try:
        audio, sr = read_audio(file)
        if len(audio) == 0 or not is_speech(audio, sr):
            logger.info("No speech detected in audio.")
            return {"transcript": "", "intent": None, "entity": None}

        transcription = transcribe_audio(audio, sr)
        logger.info(f"Transcription: {transcription}")
        
        # Skip intent detection if transcription is empty or just whitespace
        if not transcription or not transcription.strip():
            logger.info("Empty transcription, skipping intent detection.")
            return {"transcript": "", "intent": None, "entity": None}

        intent, entity = detect_intent(transcription)
        logger.info(f"Intent: {intent}, Entity: {entity}")

        return {
            "transcript": transcription,
            "intent": intent,
            "entity": entity
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "audio"}

# --- Run ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
