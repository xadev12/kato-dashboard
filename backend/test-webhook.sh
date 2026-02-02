#!/bin/bash
# GitHub Webhook Test Script for Kato Dashboard
# Usage: ./test-webhook.sh [event-type]
# Example: ./test-webhook.sh push

set -e

WEBHOOK_URL="http://localhost:3001/api/webhook/github"
WEBHOOK_SECRET="d8abedeb62c3d76804d8b51b5e64ce7eceea361b5483ddcd8cc466e0e7037194"
EVENT_TYPE="${1:-push}"

echo "================================"
echo "GitHub Webhook Test"
echo "================================"
echo "URL: $WEBHOOK_URL"
echo "Event: $EVENT_TYPE"
echo "Secret: ${WEBHOOK_SECRET:0:10}..."
echo ""

# Create test payload based on event type
case $EVENT_TYPE in
  push)
    PAYLOAD='{
      "ref": "refs/heads/main",
      "repository": {
        "name": "test-repo",
        "full_name": "xadev12/test-repo",
        "html_url": "https://github.com/xadev12/test-repo"
      },
      "commits": [
        {"id": "abc123", "message": "Test commit 1"},
        {"id": "def456", "message": "Test commit 2"}
      ],
      "pusher": {"name": "testuser"}
    }'
    ;;
  pull_request)
    PAYLOAD='{
      "action": "opened",
      "number": 1,
      "repository": {
        "name": "test-repo",
        "full_name": "xadev12/test-repo",
        "html_url": "https://github.com/xadev12/test-repo"
      },
      "pull_request": {
        "title": "Test Pull Request",
        "state": "open"
      }
    }'
    ;;
  issues)
    PAYLOAD='{
      "action": "opened",
      "repository": {
        "name": "test-repo",
        "full_name": "xadev12/test-repo",
        "html_url": "https://github.com/xadev12/test-repo"
      },
      "issue": {
        "title": "Test Issue",
        "state": "open"
      }
    }'
    ;;
  release)
    PAYLOAD='{
      "action": "published",
      "repository": {
        "name": "test-repo",
        "full_name": "xadev12/test-repo",
        "html_url": "https://github.com/xadev12/test-repo"
      },
      "release": {
        "tag_name": "v1.0.0",
        "name": "Version 1.0.0"
      }
    }'
    ;;
  *)
    echo "Unknown event type: $EVENT_TYPE"
    echo "Supported types: push, pull_request, issues, release"
    exit 1
    ;;
esac

# Generate signature
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | sed 's/^.* //')
SIGNATURE="sha256=$SIGNATURE"

echo "Payload:"
echo "$PAYLOAD" | jq . 2>/dev/null || echo "$PAYLOAD"
echo ""
echo "Signature: $SIGNATURE"
echo ""
echo "Sending request..."
echo "================================"

# Send the webhook request
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: $EVENT_TYPE" \
  -H "X-GitHub-Delivery: $(uuidgen)" \
  -H "X-Hub-Signature-256: $SIGNATURE" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

# Test with invalid signature
echo "================================"
echo "Testing with invalid signature..."
echo "================================"

RESPONSE_INVALID=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: $EVENT_TYPE" \
  -H "X-GitHub-Delivery: $(uuidgen)" \
  -H "X-Hub-Signature-256: sha256=invalidsignature123" \
  -d "$PAYLOAD")

HTTP_CODE_INVALID=$(echo "$RESPONSE_INVALID" | tail -n1)
BODY_INVALID=$(echo "$RESPONSE_INVALID" | sed '$d')

echo "HTTP Status: $HTTP_CODE_INVALID (expected: 401)"
echo "Response:"
echo "$BODY_INVALID" | jq . 2>/dev/null || echo "$BODY_INVALID"
echo ""

# Test events endpoint
echo "================================"
echo "Testing events endpoint..."
echo "================================"

RESPONSE_EVENTS=$(curl -s -w "\n%{http_code}" "$WEBHOOK_URL/events")
HTTP_CODE_EVENTS=$(echo "$RESPONSE_EVENTS" | tail -n1)
BODY_EVENTS=$(echo "$RESPONSE_EVENTS" | sed '$d')

echo "HTTP Status: $HTTP_CODE_EVENTS"
echo "Events count: $(echo "$BODY_EVENTS" | jq 'length')"
echo ""

echo "================================"
echo "Test complete!"
echo "================================"
