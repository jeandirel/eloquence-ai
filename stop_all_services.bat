@echo off
echo ================================================
echo   Arret de tous les services Eloquence AI
echo ================================================
echo.

REM Tuer les processus Python (MediaPipe et Orchestrator)
echo Arret des services backend...
taskkill /F /FI "WINDOWTITLE eq MediaPipe Service*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Orchestrator*" 2>nul

REM Tuer le processus Node (Frontend)
echo Arret du frontend...
taskkill /F /FI "WINDOWTITLE eq Frontend*" 2>nul

echo.
echo ================================================
echo   Tous les services ont ete arretes!
echo ================================================
echo.
pause
