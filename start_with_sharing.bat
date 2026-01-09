@echo off
echo ================================================
echo   Demarrage Eloquence AI avec Partage Public
echo ================================================
echo.

REM Verifier si ngrok est installe
where ngrok >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] ngrok n'est pas installe!
    echo.
    echo Telechargez ngrok : https://ngrok.com/download
    echo Puis installez-le et ajoutez-le au PATH
    echo.
    pause
    exit /b 1
)

echo [1/4] Demarrage MediaPipe Service...
start "MediaPipe Service" cmd /k "cd /d c:\control\eloquence-ai\backend\services\mediapipe_service && .\venv\Scripts\python.exe main.py"
timeout /t 3 /nobreak > nul

echo [2/4] Demarrage Orchestrator...
start "Orchestrator" cmd /k "cd /d c:\control\eloquence-ai\backend && python main.py"
timeout /t 3 /nobreak > nul

echo [3/4] Demarrage Frontend...
start "Frontend" cmd /k "cd /d c:\control\eloquence-ai\frontend && npm run dev"
timeout /t 5 /nobreak > nul

echo [4/4] Creation du tunnel public avec ngrok...
start "ngrok Tunnel" cmd /k "ngrok http 3000"
timeout /t 3 /nobreak > nul

echo.
echo ================================================
echo   TOUS LES SERVICES SONT DEMARRES!
echo ================================================
echo.
echo Local        : http://localhost:3000/gestures
echo.
echo Pour obtenir le lien public :
echo 1. Regardez la fenetre "ngrok Tunnel"
echo 2. Copiez l'URL qui commence par "https://xxxx.ngrok.io"
echo 3. Partagez ce lien avec vos amis!
echo.
echo Pour generer un QR Code :
echo - Ouvrez : http://localhost:3000/qr
echo - Collez votre URL ngrok
echo.
pause
