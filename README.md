# 🎯 Eloquence AI

**Multimodal AI Interface** - Real-time gesture detection, face tracking, emotion recognition, and speech analysis powered by MediaPipe, DeepFace, and LiveKit.

![Gesture Lab Demo](https://img.shields.io/badge/Status-Active-success)
![License](https://img.shields.io/badge/License-MIT-blue)
![Python](https://img.shields.io/badge/Python-3.12-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)

---

## ✨ Features

### 🖐️ **Gesture Lab**
- **7 Gesture Recognition**: FIST, OPEN_PALM, POINTING, PEACE, THUMBS_UP, OK, TCHAO
- **Real-time Landmarks Visualization**: Hand (21 points) + Face (468 points)
- **Multi-hand Detection**: Support for 2 hands simultaneously
- **Low Latency**: 50ms frame processing (20 FPS)
- **Visual Feedback**: Animated emoji overlays and pulse effects

### 😊 **Emotion Recognition**
- Real-time facial emotion detection using DeepFace
- 7 emotions: Happy, Sad, Angry, Surprise, Fear, Disgust, Neutral
- Adaptive UI based on detected emotion
- Emotion history tracking

### 👁️ **Gaze Tracking**
- Eye movement detection
- Attention monitoring
- Gaze deviation alerts

### 🎤 **Speech Emotion Analysis** *(Coming Soon)*
- Voice emotion recognition
- Speech-to-text
- Intent detection

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.12+**
- **Node.js 18+**
- **npm or yarn**

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/jeandirel/eloquence-ai.git
cd eloquence-ai
```

2. **Run the startup script**
```bash
# Windows
.\start_gesture_lab.bat

# Or manually start services:
# Terminal 1 - MediaPipe Service
cd backend/services/mediapipe_service
python main.py

# Terminal 2 - Orchestrator
cd backend
python main.py

# Terminal 3 - Frontend
cd frontend
npm install
npm run dev
```

3. **Access the application**
- **Gesture Lab**: http://localhost:3000/gestures
- **Emotion Recognition**: http://localhost:3000/emotion
- **Main Dashboard**: http://localhost:3000

---

## 🏗️ Architecture

```
eloquence-ai/
├── backend/
│   ├── main.py                    # Orchestrator (WebSocket hub)
│   ├── services/
│   │   ├── mediapipe_service/     # Gesture & gaze detection
│   │   ├── deepface_service/      # Emotion recognition
│   │   └── audio_service/         # Speech processing
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── gestures/              # Gesture Lab interface
│   │   ├── emotion/               # Emotion detection UI
│   │   └── page.tsx               # Main landing page
│   ├── components/
│   └── package.json
│
└── start_gesture_lab.bat          # Quick start script
```

### Tech Stack

**Backend**
- FastAPI (WebSocket server)
- MediaPipe 0.10.14 (Hand & Face detection)
- DeepFace (Emotion recognition)
- NumPy, OpenCV

**Frontend**
- Next.js 14 (React framework)
- TypeScript
- Framer Motion (Animations)
- TailwindCSS
- Canvas API (Landmarks rendering)

---

## 🎮 Usage

### Gesture Lab

1. Open http://localhost:3000/gestures
2. Allow camera access
3. Perform gestures in front of the camera:
   - ✊ **FIST**: Close your hand
   - ✋ **OPEN_PALM**: Open all fingers
   - ☝️ **POINTING**: Raise index finger only
   - ✌️ **PEACE**: Victory sign (index + middle)
   - 👍 **THUMBS_UP**: Raise thumb only
   - 👌 **OK**: Circle with thumb + index
   - 👋 **TCHAO**: Open hand with lateral movement

### Emotion Recognition

1. Open http://localhost:3000/emotion
2. Allow camera access
3. Your facial emotion will be detected in real-time
4. UI adapts based on detected emotion

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| **Gesture Detection FPS** | 20 FPS |
| **Frame Latency** | 50ms |
| **Landmarks (Hand)** | 21 points |
| **Landmarks (Face)** | 468 points |
| **Supported Gestures** | 7 |
| **Validation Threshold** | 4/5 frames |

---

## 🛠️ Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Orchestrator
ORCHESTRATOR_PORT=8000
ORCHESTRATOR_HOST=0.0.0.0

# MediaPipe Service
MEDIAPIPE_PORT=8002

# DeepFace Service
DEEPFACE_PORT=8003

# Audio Service
AUDIO_PORT=8001
```

---

## 📝 API Reference

### WebSocket Endpoint

**URL**: `ws://localhost:8000/ws`

**Message Format** (Client → Server):
```typescript
// Video frame
Blob([0x00, ...imageData])

// Audio chunk
Blob([0x01, ...audioData])
```

**Message Format** (Server → Client):
```json
{
  "type": "UI_COMMAND",
  "source": "GESTURE",
  "command": "APPROVE",
  "gesture": "THUMBS_UP",
  "hand_landmarks": [[{"x": 0.5, "y": 0.5, "z": 0.0}, ...]],
  "face_landmarks": [[{"x": 0.5, "y": 0.3, "z": 0.0}, ...]],
  "hand_connections": [[0, 1], [1, 2], ...],
  "face_connections": [[0, 1], ...]
}
```

---

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 👤 Author

**Jean Direl**
- GitHub: [@jeandirel](https://github.com/jeandirel)
- Email: jedirkab70@gmail.com

---

## 🙏 Acknowledgments

- **MediaPipe** by Google for hand and face tracking
- **DeepFace** for emotion recognition
- **Next.js** team for the amazing framework
- **Framer Motion** for smooth animations

---

## 🐛 Known Issues

- MediaPipe requires specific version (0.10.14) for `solutions` API
- Large model files excluded from git (see `.gitignore`)

---

## 🔮 Roadmap

- [ ] Custom gesture training
- [ ] Multi-user support
- [ ] 3D hand tracking
- [ ] Gesture sequence recognition
- [ ] Export recorded sessions
- [ ] Mobile support

---

## 📞 Support

For issues and questions:
- Create an issue on [GitHub Issues](https://github.com/jeandirel/eloquence-ai/issues)
- Email: jedirkab70@gmail.com

---

**Made with ❤️ for Human-Computer Interaction**
