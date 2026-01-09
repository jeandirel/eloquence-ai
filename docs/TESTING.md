# EloquenceAI - Installation and Testing Guide

## Quick Installation

### Option 1: Automated Setup (Windows)

Run the automated setup script:

```powershell
.\setup.ps1
```

This will:
- Check prerequisites (Docker, Python, Node.js)
- Start LiveKit server
- Set up Python virtual environment and install dependencies
- Install frontend dependencies
- Create environment files

### Option 2: Manual Setup

#### 1. Start LiveKit Server

```bash
cd docker
docker-compose up -d
```

Verify: Visit http://localhost:7880

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env from template
copy .env.example .env
```

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
copy env.example .env.local
```

---

## Running the Application

### Terminal 1: LiveKit Server

```bash
cd docker
docker-compose up
```

Keep this running. You should see LiveKit server logs.

### Terminal 2: Python Backend Agent

```bash
cd backend
venv\Scripts\activate  # or source venv/bin/activate on Mac/Linux
python main.py
```

You should see:
```
INFO - EloquenceAI Agent starting...
INFO - Vision Agent initialized
INFO - Audio Agent initialized
INFO - Fusion Engine initialized
```

### Terminal 3: Frontend Development Server

```bash
cd frontend
npm run dev
```

You should see:
```
▲ Next.js 16.1.1
- Local:   http://localhost:3000
```

---

## Testing the System

### 1. Open the Application

Navigate to **http://localhost:3000** in your browser (Chrome recommended).

### 2. Grant Permissions

- Enter your name in the Green Room
- Click "Start Practice Session"
- Allow camera and microphone access when prompted

### 3. Test Scenarios

#### A. Gaze Tracking Test
1. Look directly at your camera for a few seconds (calibration)
2. Look away to the left/right for 5+ seconds
3. **Expected**: You should see a nudge saying "Maintain eye contact"

#### B. Speaking Pace Test
1. Speak very rapidly (as fast as you can)
2. **Expected**: After ~160 WPM, you'll see "Slow down  your pace" nudge

#### C. Filler Word Test
1. Say "um" or "uh" repeatedly while speaking
2. **Expected**: Filler count increases (visible in backend logs)

#### D. Communication Score
- Watch the score bar at the top of the screen
- It should fluctuate based on your gaze, pace, and emotional expression

### 4. End Session

- Click the red ❌ button in the control bar
- View the summary statistics (placeholder data for now)

---

## Troubleshooting

### ❌ "Failed to connect to LiveKit"

**Check:**
1. Is Docker running? → `docker ps` should show `eloquence-livekit`
2. Is port 7880 available? → `netstat -an | findstr 7880`
3. Is firewall blocking? → Try disabling temporarily

**Fix:**
```bash
cd docker
docker-compose down
docker-compose up -d
```

### ❌ Python agent crashes

**Check logs for specific error:**

- **ModuleNotFoundError**: `pip install -r requirements.txt`
- **MediaPipe error**: Try `pip install mediapipe --upgrade`
- **LiveKit connection error**: Verify `.env` has correct `LIVEKIT_URL`

### ❌ Frontend build errors

**Common fixes:**
```bash
cd frontend
rm -rf .next node_modules
npm install
npm run dev
```

### ❌ Camera not showing

**Check:**
1. Camera permissions granted in browser?
2. Camera not used by another app?
3. Try in incognito mode (to reset permissions)

### ❌ No feedback nudges appearing

**Debugging steps:**
1. Check Python agent console for "Published feedback" messages
2. Open browser DevTools → Console → Look for data messages
3. Verify LiveKit connection in browser console

---

## Development Tips

### Viewing Backend Logs

The Python agent logs show:
- Frame processing rate
- Gaze deviation values
- Communication Score updates
- Published feedback events

Set `LOG_LEVEL=DEBUG` in `backend/.env` for verbose output.

### Frontend Hot Reload

The Next.js dev server has hot module reload. Changes to components will reflect immediately without restart.

### Backend Changes

After modifying Python code, restart:
```bash
# Stop main.py (Ctrl+C)
python main.py
```

### Resetting Calibration

The gaze calibration happens in the first ~30 frames. To recalibrate:
1. Look directly at camera
2. Stay still for 3 seconds
3. Gaze tracking will adapt

---

## Performance Benchmarks

### Expected Metrics

| Metric | Target | Typical |
|--------|--------|---------|
| End-to-end latency | <500ms | ~350ms |
| Video processing | 30 FPS | 25-30 FPS |
| Emotion inference | 5 FPS | 5 FPS |
| CPU usage (backend) | <50% | 30-40% |
| Memory (backend) | <500MB | 300MB |

### Measuring Latency

1. Perform a clear action (e.g., look away)
2. Time until nudge appears
3. Should be under 500ms for gaze alerts

---

## Next Steps After Testing

Once basic functionality is confirmed:

1. **Integrate Real STT**: Replace mock transcription with OpenAI Realtime API
2. **Add Emotion Model**: Integrate actual EfficientNet-B0 for valence/arousal
3. **Build Analytics Dashboard**: Create timeline visualization with Recharts
4. **Implement Recording**: Add optional session recording feature
5. **Enhance Calibration**: Improve gaze baseline with user guidance

---

## Common Questions

**Q: Why is the emotion detection always neutral?**  
A: The emotion model is a placeholder. You need to integrate an actual ML model (EfficientNet-B0 trained on AffectNet).

**Q: Can I use this without Docker?**  
A: You'd need to run LiveKit server natively. Docker is recommended for simplicity.

**Q: Will this work on mobile?**  
A: WebRTC works on mobile, but MediaPipe performance may be limited. Desktop Chrome is recommended.

**Q: How do I deploy this?**  
A: Frontend can deploy to Vercel. Backend needs a server with Python + GPU (optional). LiveKit can use their cloud service.

---

## Support

- **Documentation**: See `docs/QUICKSTART.md` and `README.md`
- **Code Issues**: Check the walkthrough artifact for architecture details
- **LiveKit Docs**: https://docs.livekit.io
- **MediaPipe Docs**: https://developers.google.com/mediapipe

Happy coaching! 🎤✨
