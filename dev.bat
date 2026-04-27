@echo off
echo Starting SportBets development environment...

REM Check if .env exists in backend
if not exist "backend\.env" (
  echo Creating backend\.env from .env.example...
  copy backend\.env.example backend\.env
)

REM Start backend
echo Starting backend...
start cmd /k "cd backend && npm run dev"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo Starting frontend...
start cmd /k "npm run dev"

echo.
echo ==========================================
echo SportBets is running!
echo ==========================================
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3001
echo ==========================================
echo.
echo Close the terminal windows to stop the servers
