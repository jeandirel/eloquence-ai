# EloquenceAI - Quick Start Guide

## Prerequisites

Ensure you have the following installed:
- **Docker Desktop** (for LiveKit server)
- **Node.js 20+** and npm
- **Python 3.12+** and pip
- **Git** (optional, for version control)

## Step-by-Step Setup

### 1. Start LiveKit Server

Open a terminal in the `docker/` directory:

```bash
cd docker
docker-compose up -d
```

Verify LiveKit is running by visiting: http://localhost:7880

You should see the LiveKit server dashboard.

### 2. Set Up Python Backend

Open a terminal in the `backend/` directory:

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
copy .env.example .env  # Windows
# cp .env.example .env  # macOS/Linux

# Edit .env and add your OpenAI API key (if available)
# For testing, you can leave the default values
```

### 3. Set Up Next.js Frontend

Open a terminal in the `frontend/` directory:

```bash
cd frontend

# Install dependencies (if not already done)
npm install

# Install additional LiveKit and UI dependencies
npm install @livekit/components-react livekit-client
npm install framer-motion recharts lucide-react
npm install  @radix-ui/react-toast @radix-ui/react-slider

# Create environment file
copy env.example .env.local  # Windows
# cp env.example .env.local  # macOS/Linux
```

## Running the Application

You'll need **three terminal windows** open:

### Terminal 1: LiveKit Server
```bash
cd docker
docker-compose up
```

### Terminal 2: Python Backend Agent
```bash
cd backend
venv\Scripts\activate  # or source venv/bin/activate on macOS/Linux
python main.py
```

### Terminal 3: Next.js Frontend
```bash
cd frontend
npm run dev
```

### Access the Application

Open your browser and navigate to: **http://localhost:3000**

## Troubleshooting

### LiveKit Connection Issues

If you see "Failed to connect to LiveKit":
1. Ensure Docker is running (`docker ps` should show `eloquence-livekit`)
2. Check that port 7880 is not blocked by firewall
3. Verify the `.env.local` file has the correct `NEXT_PUBLIC_LIVEKIT_URL`

### Python Agent Not Starting

If the Python agent fails:
1. Check that virtual environment is activated
2. Install dependencies again: `pip install -r requirements.txt --force-reinstall`
3. Verify Python version: `python --version` (should be 3.12+)

### MediaPipe Installation Issues

On some systems, MediaPipe may have compatibility issues:
- **Windows**: Ensure Visual C++ Redistributable is installed
- **macOS**: May require `brew install cmake`
- **Alternative**: Try `pip install mediapipe --user`

### Camera/Microphone Permissions

The browser will prompt for camera and microphone access when you start a session. If you accidentally denied permission:
1. Click the lock icon in the address bar
2. Reset permissions for Camera and Microphone
3. Refresh the page

## Architecture Overview

```
User Browser (localhost:3000)
    ↓ WebRTC
LiveKit Server (localhost:7880)
    ↓ Subscribe to tracks
Python Agent (main.py)
    ├── Vision Agent (gaze + emotion)
    ├── Audio Agent (speech + prosody)
    └── Fusion Engine (generates feedback)
    ↓ Data messages
User Browser (receives visual nudges)
```

## Next Steps

1. **Test the System**: Click "Start Practice Session" and speak to your camera
2. **Explore Analytics**: End a session to view the post-session dashboard
3. **Customize Feedback**: Modify weights in `fusion_engine.py` to adjust sensitivity
4. **Add Real STT**: Integrate OpenAI Realtime API in `audio_agent.py` for production use

## Development Mode

For development, you can run the frontend with hot reload:
```bash
npm run dev
```

The Python backend does not have hot reload by default. Restart `main.py` after code changes.

## Production Build

To create a production build of the frontend:
```bash
cd frontend
npm run build
npm start
```

---

**Need Help?** Check the main README.md or review the implementation plan in the `docs/` folder.
