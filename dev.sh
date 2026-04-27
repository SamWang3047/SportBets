#!/bin/bash

# Script to run both frontend and backend

echo "Starting SportBets development environment..."

# Check if .env exists in backend
if [ ! -f "backend/.env" ]; then
  echo "Creating backend/.env from .env.example..."
  cp backend/.env.example backend/.env
fi

# Start backend in background
echo "Starting backend..."
cd backend && npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "SportBets is running!"
echo "=========================================="
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:3001"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop both servers"

# Handle Ctrl+C to kill both processes
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# Wait for both processes
wait
