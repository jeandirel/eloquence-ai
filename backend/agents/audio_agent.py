"""
Audio Agent - Speech Intelligence Module for EloquenceAI

Handles speech-to-text using Wav2Vec2 and intent detection.
"""

import asyncio
import logging
from typing import AsyncIterator, Dict, List, Optional
import numpy as np
from collections import deque
from datetime import datetime
import torch
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC

logger = logging.getLogger(__name__)


class AudioAgent:
    """
    Processes raw audio bytes for speech analysis.
    """
    
    def __init__(self):
        self.transcripts = deque(maxlen=100)
        self.filler_words = {"um", "uh", "like", "you know", "actually", "basically"}
        self.filler_count = 0
        self.word_timestamps = []
        
        # Audio Buffering for STT
        self.audio_buffer = [] 
        self.buffer_size_seconds = 2.0 
        self.sample_rate = 16000 # Standard for Wav2Vec2
        
        # Initialize Wav2Vec2
        try:
            logger.info("Loading Wav2Vec2 model...")
            self.processor = Wav2Vec2Processor.from_pretrained("facebook/wav2vec2-base-960h")
            self.model = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-base-960h")
            self.model.eval()
            logger.info("Wav2Vec2 loaded successfully.")
            self.has_stt = True
        except Exception as e:
            logger.error(f"Failed to load Wav2Vec2: {e}")
            self.has_stt = False
        
        logger.info("Audio Agent initialized (Raw Bytes Mode)")
    
    async def process_audio_chunk(self, chunk_data: bytes) -> Optional[Dict]:
        """Process a chunk of raw audio bytes (16-bit PCM)."""
        try:
            # Convert bytes to numpy int16
            pcm_data = np.frombuffer(chunk_data, dtype=np.int16)
            
            # Prosody (Vol/Pitch)
            prosody = self._analyze_prosody(pcm_data)
            
            transcript = None
            if self.has_stt:
                # Normalize to float -1..1
                # Check for silence threshold to avoid processing noise
                if np.max(np.abs(pcm_data)) > 500: # Simple gate
                     self.audio_buffer.append(pcm_data.astype(np.float32) / 32768.0)
                
                # Process if buffer full
                current_len = sum(len(x) for x in self.audio_buffer)
                if current_len >= self.sample_rate * self.buffer_size_seconds:
                    full_audio = np.concatenate(self.audio_buffer)
                    self.audio_buffer = []
                    transcript = await self._transcribe_audio(full_audio)
            
            if transcript:
                self._update_transcript(transcript)
                intent = self._detect_intent(transcript)
                if intent:
                    return {
                        "type": "INTENT",
                        "intent": intent,
                        "transcript": transcript,
                        "timestamp": datetime.now().isoformat()
                    }
            
            return {
                "transcript": transcript,
                "prosody": prosody,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error processing audio chunk: {e}")
            return None

    async def _transcribe_audio(self, audio_input: np.ndarray) -> Optional[str]:
        """Run Wav2Vec2 inference."""
        try:
            loop = asyncio.get_event_loop()
            
            def infer():
                # No resampling needed if input is already 16k
                inputs = self.processor(audio_input, sampling_rate=16000, return_tensors="pt", padding=True)
                with torch.no_grad():
                    logits = self.model(inputs.input_values).logits
                predicted_ids = torch.argmax(logits, dim=-1)
                transcription = self.processor.batch_decode(predicted_ids)[0]
                return transcription

            text = await loop.run_in_executor(None, infer)
            
            if text and len(text.strip()) > 0:
                logger.info(f"Transcribed: {text}")
                return text.lower()
            return None
        except Exception as e:
            logger.error(f"STT Error: {e}")
            return None

    def _detect_intent(self, text: str) -> Optional[str]:
        text = text.lower()
        if "dashboard" in text: return "OPEN_DASHBOARD"
        if "next" in text: return "NEXT_PAGE"
        if "help" in text: return "ACTIVATE_HELP"
        if "gesture" in text: return "ACTIVATE_GESTURES"
        return None
    
    def _analyze_prosody(self, pcm_data: np.ndarray) -> Dict[str, float]:
        try:
            audio_float = pcm_data.astype(np.float32) / 32768.0
            rms = np.sqrt(np.mean(audio_float**2))
            return {"volume_mean": float(rms)}
        except:
            return {"volume_mean": 0.0}

    def _update_transcript(self, word: str):
        words = word.split()
        for w in words:
            self.transcripts.append(w)

    def reset(self):
        self.transcripts.clear()
        self.audio_buffer = []
