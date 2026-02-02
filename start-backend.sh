#!/bin/bash

# Kato Dashboard - Full Stack Startup Script
# Starts the backend API server and data collectors

echo "╔════════════════════════════════════════════════════════╗"
echo "║     Kato Dashboard - Full Stack Startup               ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to cleanup processes on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    pkill -f "tsx backend/server" 2>/dev/null || true
    pkill -f "tsx backend/collectors" 2>/dev/null || true
    echo -e "${GREEN}All services stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Check if database exists
if [ ! -f "./backend/data/dashboard.db" ]; then
    echo -e "${BLUE}Database not found. Seeding...${NC}"
    npm run db:seed
fi

echo -e "${BLUE}Starting API server on port 3001...${NC}"
npm run server:dev > /tmp/dashboard-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Check if server is running
if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✓ API server running${NC}"
else
    echo -e "${YELLOW}⚠ API server may still be starting...${NC}"
fi

echo ""
echo -e "${BLUE}Starting data collectors...${NC}"
npm run collectors > /tmp/dashboard-collectors.log 2>&1 &
COLLECTORS_PID=$!

sleep 2
echo -e "${GREEN}✓ Data collectors running${NC}"

echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}All services started!${NC}"
echo ""
echo "API Server:     http://localhost:3001"
echo "Health Check:   http://localhost:3001/health"
echo "API Docs:       http://localhost:3001/api"
echo ""
echo "Logs:"
echo "  Server:     tail -f /tmp/dashboard-server.log"
echo "  Collectors: tail -f /tmp/dashboard-collectors.log"
echo ""
echo "Press Ctrl+C to stop all services"
echo "═══════════════════════════════════════════════════════"

# Keep script running
wait
