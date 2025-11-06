#!/bin/bash

echo "🎮 Starting MMO Gaming Platform..."
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
cd server && npm start &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend
cd ..
npm run dev

# Cleanup: kill backend when frontend is stopped
kill $BACKEND_PID
