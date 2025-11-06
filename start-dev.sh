#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🎮 Starting MMO Gaming Platform..."
echo ""

# Kill any existing processes on ports 3001 and 5173
echo "🧹 Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "   Killed process on port 3001" || echo "   Port 3001 is free"
lsof -ti:5173 | xargs kill -9 2>/dev/null && echo "   Killed process on port 5173" || echo "   Port 5173 is free"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd server && npm install && cd ..
fi

echo ""
echo "🚀 Starting servers..."
echo ""
echo "Backend will run on: http://localhost:3001"
echo "Frontend will run on: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start backend in background
(cd server && npm start) &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend (stay in project root)
npm run dev

# Cleanup: kill backend when frontend is stopped
kill $BACKEND_PID 2>/dev/null
