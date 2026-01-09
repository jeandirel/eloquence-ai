@echo off
echo ========================================
echo   OmniSense - Starting All Services
echo ========================================
echo.

cd backend\services\mediapipe_service
start "MediaPipe:8002" cmd /k "python main.py"
timeout /t 2 /nobreak >nul

cd ..\deepface_service
start "DeepFace:8003" cmd /k "python main.py"
timeout /t 2 /nobreak >nul

cd ..\audio_service
start "Audio:8001" cmd /k "python main.py"
timeout /t 2 /nobreak >nul

cd ..\..\
start "Orchestrator:8000" cmd /k "python main.py"

echo.
echo All services started!
echo - MediaPipe: http://localhost:8002
echo - DeepFace:  http://localhost:8003
echo - Audio:     http://localhost:8001
echo - Main:      http://localhost:8000
echo.
pause
