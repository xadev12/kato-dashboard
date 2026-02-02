#!/bin/bash

# API Test Script for Kato Dashboard Backend

API_URL="http://localhost:3001"

echo "Testing Kato Dashboard API..."
echo ""

# Color helpers
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    
    echo -n "Testing $description... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$API_URL$endpoint")
    
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo -e "${GREEN}✓ ($response)${NC}"
        return 0
    else
        echo -e "${RED}✗ ($response)${NC}"
        return 1
    fi
}

# Health check
test_endpoint "GET" "/health" "Health Check"

# Projects
test_endpoint "GET" "/api/projects" "List Projects"
test_endpoint "GET" "/api/projects/kato-dashboard" "Get Single Project"

# Agents
test_endpoint "GET" "/api/agents" "List Agents"
test_endpoint "GET" "/api/agents/main" "Get Single Agent"

# Workers
test_endpoint "GET" "/api/workers" "List Workers"

# Tokens
test_endpoint "GET" "/api/tokens?period=week" "Token Stats"

# Activity
test_endpoint "GET" "/api/activity?limit=10" "Activity Feed"

# Memory
test_endpoint "GET" "/api/memory/main" "Agent Memory"

# Dashboard
test_endpoint "GET" "/api/dashboard" "Dashboard Summary"

echo ""
echo "API testing complete!"
