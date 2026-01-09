# EloquenceAI - One-Command Setup Script
# This script automates the initial setup for development

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  EloquenceAI Setup Wizard" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "[1/5] Checking prerequisites..." -ForegroundColor Yellow

# Check Docker
$dockerCheck = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCheck) {
    Write-Host "❌ Docker not found. Please install Docker Desktop" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker found" -ForegroundColor Green

# Check Python
$pythonCheck = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCheck) {
    Write-Host "❌ Python not found. Please install Python 3.12+" -ForegroundColor Red
    exit 1
}
$pythonVersion = python --version
Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green

# Check Node.js
$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCheck) {
    Write-Host "❌ Node.js not found. Please install Node.js 20+" -ForegroundColor Red
    exit 1
}
$nodeVersion = node --version
Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green

Write-Host ""
Write-Host "[2/5] Setting up LiveKit Server..." -ForegroundColor Yellow
Set-Location docker
Write-Host "Starting LiveKit with Docker Compose..." -ForegroundColor Gray
docker-compose up -d 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ LiveKit server started on http://localhost:7880" -ForegroundColor Green
}
else {
    Write-Host "⚠ LiveKit server may already be running" -ForegroundColor Yellow
}
Set-Location ..

Write-Host ""
Write-Host "[3/5] Setting up Python Backend..." -ForegroundColor Yellow
Set-Location backend

if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Gray
    python -m venv venv
}

Write-Host "Activating virtual environment..." -ForegroundColor Gray
& "venv\Scripts\Activate.ps1"

Write-Host "Installing Python dependencies (this may take a few minutes)..." -ForegroundColor Gray
pip install -q -r requirements.txt

if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Gray
    Copy-Item .env.example .env
    Write-Host "⚠ Remember to add your OpenAI API key to backend/.env" -ForegroundColor Yellow
}

Write-Host "✓ Backend setup complete" -ForegroundColor Green
Set-Location ..

Write-Host ""
Write-Host "[4/5] Setting up Next.js Frontend..." -ForegroundColor Yellow
Set-Location frontend

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies (this may take several minutes)..." -ForegroundColor Gray
    npm install --silent --legacy-peer-deps 2>&1 | Out-Null
}

Write-Host "Installing LiveKit and UI libraries..." -ForegroundColor Gray
npm install --silent --legacy-peer-deps @livekit/components-react livekit-client framer-motion recharts lucide-react 2>&1 | Out-Null
npm install --silent --legacy-peer-deps @radix-ui/react-toast @radix-ui/react-slider @radix-ui/react-dialog @radix-ui/react-select 2>&1 | Out-Null

if (-not (Test-Path ".env.local")) {
    Write-Host "Creating .env.local file..." -ForegroundColor Gray
    Copy-Item env.example .env.local
}

Write-Host "✓ Frontend setup complete" -ForegroundColor Green
Set-Location ..

Write-Host ""
Write-Host "[5/5] Final checks..." -ForegroundColor Yellow

# Test LiveKit connection
Write-Host "Testing LiveKit connection..." -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "http://localhost:7880" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✓ LiveKit is accessible" -ForegroundColor Green
}
catch {
    Write-Host "⚠ LiveKit may not be ready yet. Give it a few seconds." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Setup Complete! 🎉" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start EloquenceAI, you need 3 terminals:" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 1 - LiveKit (already running):" -ForegroundColor Yellow
Write-Host "  cd docker && docker-compose up" -ForegroundColor Gray
Write-Host ""
Write-Host "Terminal 2 - Python Backend:" -ForegroundColor Yellow
Write-Host "  cd backend" -ForegroundColor Gray
Write-Host "  venv\Scripts\activate" -ForegroundColor Gray
Write-Host "  python main.py" -ForegroundColor Gray
Write-Host ""
Write-Host "Terminal 3 - Frontend:" -ForegroundColor Yellow
Write-Host "  cd frontend" -ForegroundColor Gray
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Then open: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Need help? Check docs/QUICKSTART.md" -ForegroundColor Gray
