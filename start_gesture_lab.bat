@echo off
echo ================================================
echo   Demarrage Gesture Lab - Eloquence AI
echo ================================================
echo.

REM Demarrer MediaPipe Service (Port 8002)
echo [1/3] Demarrage MediaPipe Service...
start "MediaPipe Service" cmd /k "cd /d c:\control\eloquence-ai\backend\services\mediapipe_service && .\venv\Scripts\python.exe main.py"
timeout /t 3 /nobreak > nul

REM Demarrer Orchestrator (Port 8000)
echo [2/3] Demarrage Orchestrator...
start "Orchestrator" cmd /k "cd /d c:\control\eloquence-ai\backend && python main.py"
timeout /t 3 /nobreak > nul

REM Demarrer Frontend (Port 3000)
echo [3/3] Demarrage Frontend...
start "Frontend" cmd /k "cd /d c:\control\eloquence-ai\frontend && npm run dev"
timeout /t 2 /nobreak > nul

echo.
echo ================================================
echo   Tous les services sont en cours de demarrage!
echo ================================================
echo.
echo MediaPipe Service : http://localhost:8002
echo Orchestrator      : http://localhost:8000
echo Frontend          : http://localhost:3000
echo.
echo Gesture Lab       : http://localhost:3000/gestures
echo.
echo Pour arreter tous les services, fermez les 3 fenetres.
echo.
pause
