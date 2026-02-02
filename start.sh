#!/bin/bash

# Kato Dashboard Startup Script
# Starts both backend API server and frontend dev server

echo "🚀 Starting Kato Dashboard..."
echo ""

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Check if database exists, seed if not
if [ ! -f "backend/data/dashboard.db" ]; then
    echo "🌱 Database not found, seeding..."
    cd backend && npx tsx seed.ts && cd ..
fi

echo ""
echo "📊 Starting Backend API Server on port 3001..."
cd backend && npx tsx server.ts &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 3

# Check if backend is running
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend failed to start"
    exit 1
fi

echo ""
echo "🎨 Starting Frontend Dev Server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "═══════════════════════════════════════════════"
echo "✨ Kato Dashboard is running!"
echo "═══════════════════════════════════════════════"
echo ""
echo "📊 Dashboard: http://localhost:5173"
echo "🔌 API:      http://localhost:3001/api"
echo "✅ Health:   http://localhost:3001/health"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for interrupt
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
