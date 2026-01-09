"""
Fusion Engine - Multimodal Integration for EloquenceAI

Combines vision and audio signals to generate coaching feedback and UI commands.
Implements the OmniSense adaptive logic.
"""

import logging
from typing import Dict, List, Optional
from collections import deque
from datetime import datetime
import asyncio

logger = logging.getLogger(__name__)


class FusionEngine:
    """
    Multimodal fusion engine that combines vision and audio analysis
    to produce unified coaching feedback and UI adaptation commands.
    """
    
    def __init__(self):
        # Scoring weights (configurable per coach persona)
        self.alpha = 0.3  # Emotion valence weight
        self.beta = 0.3   # Prosodic confidence weight
        self.gamma = 0.3  # Gaze attention weight
        self.delta = 0.1  # Filler penalty weight
        
        # State buffers
        self.vision_buffer = deque(maxlen=30)
        self.audio_buffer = deque(maxlen=30)
        
        # State tracking
        self.last_emotion = "neutral"
        self.current_score = 0.5
        
        # Alert cooldowns
        self.last_gaze_alert = 0.0
        self.last_pace_alert = 0.0
        self.last_dissonance_alert = 0.0
        self.alert_cooldown = 5.0
        
        logger.info("Fusion Engine initialized (OmniSense Mode)")
    
    async def process_vision_data(self, vision_data: Dict) -> Optional[Dict]:
        """
        Process vision analysis results (Gaze + Gesture + Emotion).
        """
        self.vision_buffer.append(vision_data)
        
        # 1. Handle Gestures
        gesture = vision_data.get("gesture", "UNKNOWN")
        if gesture != "UNKNOWN":
            logger.info(f"Gesture Detected: {gesture}")
            # Map gesture to command
            command_map = {
                "FIST": "SELECT_ITEM",
                "OPEN_PALM": "PAUSE_SESSION",
                "POINTING": "HIGHLIGHT_MODE",
                "TWO_FINGERS": "SCROLL_MODE"
            }
            if gesture in command_map:
                return {
                    "type": "UI_COMMAND",
                    "command": command_map[gesture],
                    "source": "GESTURE",
                    "timestamp": vision_data["timestamp"]
                }
        
        # 2. Handle Emotion for UI Adaptation
        if "emotion_label" in vision_data:
            emotion = vision_data["emotion_label"]
            if emotion != self.last_emotion:
                self.last_emotion = emotion
                # Return adaptation command
                # "happy" -> Dynamic, "sad" -> Encouraging, "angry" -> Simplified
                ui_mode = "STANDARD"
                if emotion in ["angry", "fear"]:
                    ui_mode = "SIMPLIFIED"
                elif emotion in ["sad"]:
                    ui_mode = "CALM"
                elif emotion in ["happy", "surprise"]:
                    ui_mode = "DYNAMIC"
                
                return {
                    "type": "UI_ADAPTATION",
                    "mode": ui_mode,
                    "emotion": emotion,
                    "timestamp": vision_data["timestamp"]
                }

        # 3. Check gaze deviation (Original Speech Coach Feature)
        gaze_deviation = vision_data.get("gaze_deviation", 0.0)
        if gaze_deviation > 20.0:
            now = asyncio.get_event_loop().time()
            if now - self.last_gaze_alert > self.alert_cooldown:
                self.last_gaze_alert = now
                return {
                    "type": "GAZE_ALERT",
                    "message": "Maintain eye contact",
                    "icon": "eye"
                }
        
        await self._update_score()
        return None
    
    async def process_audio_data(self, audio_data: Dict) -> Optional[Dict]:
        """
        Process audio analysis results (Speech + Intent).
        """
        self.audio_buffer.append(audio_data)
        
        # 1. Handle Voice Commands (Intents)
        if audio_data.get("type") == "INTENT":
            logger.info(f"Voice Intent: {audio_data['intent']}")
            return {
                "type": "UI_COMMAND",
                "command": audio_data["intent"],
                "source": "VOICE",
                "transcript": audio_data["transcript"]
            }
        
        # 2. Check speaking rate (Original Feature)
        wpm = audio_data.get("wpm", 0.0)
        if wpm > 180.0:
            now = asyncio.get_event_loop().time()
            if now - self.last_pace_alert > self.alert_cooldown:
                self.last_pace_alert = now
                return {
                    "type": "PACE_ALERT",
                    "message": "Slow down",
                    "icon": "speedometer"
                }
                
        await self._update_score()
        return None
    
    async def _update_score(self):
        """Calculate the Communication Score."""
        if not self.vision_buffer or not self.audio_buffer:
            return
        
        # Simple weighted score update
        self.current_score = 0.7 # Placeholder for now to keep UI happy
    
    def get_current_score(self) -> float:
        return self.current_score
    
    def reset(self):
        self.vision_buffer.clear()
        self.audio_buffer.clear()
        self.current_score = 0.5
        logger.info("Fusion engine reset")
