# EloquenceAI 🎤

> A Multimodal Human-Computer Interaction System for Real-Time Public Speaking Coaching

![Status](https://img.shields.io/badge/status-in%20development-yellow)
![Python](https://img.shields.io/badge/python-3.12+-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![LiveKit](https://img.shields.io/badge/LiveKit-WebRTC-green)

## 📖 Overview

EloquenceAI is a cutting-edge public speaking coach that uses multimodal AI to provide real-time feedback on your presentation skills. It analyzes:

- 👁️ **Gaze Tracking**: Monitors eye contact via MediaPipe Face Mesh
- 😊 **Emotion Detection**: Assesses facial valence and arousal
- 🗣️ **Speech Analysis**: Tracks filler words, speaking rate, and prosody
- 🧠 **Multimodal Fusion**: Detects dissonance between verbal and non-verbal cues

### The "Magic Mirror" Interface

EloquenceAI presents a live video feed augmented with intelligent, non-intrusive visual nudges. When your gaze drifts or your pace speeds up, subtle cues guide you back—without breaking your flow.

## 🏗️ Architecture

```
┌─────────────────┐      WebRTC       ┌──────────────────┐
│  Next.js App    │◄─────────────────►│  LiveKit Server  │
│  (Frontend)     │                    │   (Docker)       │
└─────────────────┘                    └──────────────────┘
                                              │
                                              │ Subscribe
                                              ▼
                                       ┌──────────────────┐
                                       │  Python Agent    │
                                       │  ┌────────────┐  │
                                       │  │  Vision    │  │
                                       │  │  Module    │  │
                                       │  └────────────┘  │
                                       │  ┌────────────┐  │
                                       │  │  Audio     │  │
                                       │  │  Module    │  │
                                       │  └────────────┘  │
                                       │  ┌────────────┐  │
                                       │  │  Fusion    │  │
                                       │  │  Engine    │  │
                                       │  └────────────┘  │
                                       └──────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ and npm
- **Python** 3.12+
- **Docker** and Docker Compose
- **OpenAI API Key** (for Realtime API)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd eloquence-ai
```

### 2. Start LiveKit Server

```bash
cd docker
docker-compose up -d
```

Verify on http://localhost:7880

### 3. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your OpenAI API key
```

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## 🧪 Running the Full System

1. **Start LiveKit**: `docker-compose up -d` (in `docker/`)
2. **Start Backend Agent**: `python main.py` (in `backend/`)
3. **Start Frontend**: `npm run dev` (in `frontend/`)
4. **Open Browser**: Navigate to http://localhost:3000

## 📊 Project Structure

```
eloquence-ai/
├── frontend/              # Next.js 16 application
│   ├── app/              # App router pages
│   ├── components/       # UI components (Magic Mirror, Analytics)
│   └── lib/              # LiveKit client utilities
├── backend/              # Python LiveKit Agent
│   ├── agents/           # Vision, Audio, Fusion modules
│   ├── models/           # ML model loaders
│   └── main.py           # Entry point
├── docker/               # LiveKit server configuration
│   ├── docker-compose.yml
│   └── livekit.yaml
└── docs/                 # Documentation
```

## 🎯 Features

### Real-Time Feedback
- **Gaze Monitoring**: Get notified if you look away from the camera for >3 seconds
- **Pace Control**: Visual nudges when speaking too fast (>160 WPM)
- **Filler Detection**: Tracks "um," "uh," and other dysfluencies
- **Emotion Guidance**: Alerts for low energy or dissonance between words and expression

### Post-Session Analytics
- **Timeline Visualization**: Scrub through your recording with synchronized metrics
- **Communication Score**: See how your score evolved over the session
- **Exportable Reports**: Download detailed performance summaries

### Privacy-First Design
- **Ephemeral Processing**: Video frames processed in RAM, never saved to disk
- **Informed Consent**: Clear explanations of data usage
- **Local-First Option**: Optional client-side processing for sensitive environments

## 🛠️ Technology Stack

- **Frontend**: Next.js 16, React 19, Shadcn UI, Tailwind CSS v4
- **Backend**: Python 3.12, LiveKit Agents, MediaPipe, OpenAI Realtime API
- **Infrastructure**: LiveKit (WebRTC), Docker, Redis
- **ML Models**: MediaPipe Face Mesh, EfficientNet-B0 (Emotion), Librosa (Prosody)

## 📜 License

MIT License - See LICENSE file for details

## 👥 Team

This project was developed as part of a university HCI course, demonstrating the state-of-the-art in multimodal human-computer interaction.

## 🙏 Acknowledgments

- **LiveKit** for the incredible WebRTC infrastructure
- **MediaPipe** team for efficient computer vision
- **OpenAI** for cutting-edge speech models

---

**Note**: This is an academic project. For production use, additional security hardening and compliance reviews are recommended.
