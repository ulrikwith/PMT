#!/bin/bash

# PMT - Project Management Tool Startup Script
# Starts both backend and frontend servers

# Navigate to the project directory
cd "$(dirname "$0")"

echo "=========================================="
echo "  PMT - Project Management Tool"
echo "=========================================="
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down PMT..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

trap cleanup EXIT INT TERM

# Kill any existing processes on our ports
echo "Checking for existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:3002 | xargs kill -9 2>/dev/null

# Check and install backend dependencies
echo "Checking backend dependencies..."
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Check and install frontend dependencies
echo "Checking frontend dependencies..."
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Start backend server
echo ""
echo "Starting backend server on port 3001..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to initialize
sleep 2

# Start frontend server
echo "Starting frontend server on port 3002..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
echo ""
echo "Waiting for servers to be ready..."
sleep 3

# Open in Chrome App Mode
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if [ -f "$CHROME" ]; then
    echo "Launching PMT in Standalone App Mode..."
    "$CHROME" --app=http://localhost:3002 --new-window >/dev/null 2>&1
else
    echo "Chrome not found, opening in default browser..."
    open http://localhost:3002
fi

echo ""
echo "=========================================="
echo "  PMT is running!"
echo "  Frontend: http://localhost:3002"
echo "  Backend:  http://localhost:3001"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop all servers..."

# Keep script running
wait
