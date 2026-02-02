# GitHub Webhook Integration Test Commands

## Generated Webhook Secret
```
d8abedeb62c3d76804d8b51b5e64ce7eceea361b5483ddcd8cc466e0e7037194
```

## Quick Test with curl

### 1. Test with valid signature (should return 200)
```bash
# Generate signature
PAYLOAD='{"ref":"refs/heads/main","repository":{"name":"my-repo","html_url":"https://github.com/xadev12/my-repo"},"commits":[{"id":"abc123","message":"Test commit"}]}'
SECRET="d8abedeb62c3d76804d8b51b5e64ce7eceea361b5483ddcd8cc466e0e7037194"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')

# Send webhook
curl -X POST http://localhost:3001/api/webhook/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-GitHub-Delivery: $(uuidgen)" \
  -H "X-Hub-Signature-256: sha256=$SIGNATURE" \
  -d "$PAYLOAD"
```

### 2. Test with invalid signature (should return 401)
```bash
curl -X POST http://localhost:3001/api/webhook/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-Hub-Signature-256: sha256=invalid" \
  -d '{"test":"data"}'
```

### 3. Get recent webhook events
```bash
curl http://localhost:3001/api/webhook/github/events
curl "http://localhost:3001/api/webhook/github/events?type=push&limit=10"
```

## Test Script (Node.js)
```bash
cd /Users/devl/clawd/kato-dashboard/backend
node test-webhook.js push
node test-webhook.js pull_request
node test-webhook.js issues
node test-webhook.js release
```

## GitHub Setup Instructions

For each repository you want to integrate:

1. Go to **Settings → Webhooks → Add webhook**
2. **Payload URL**: `https://kato-dashboard.vercel.app/api/webhook/github`
3. **Content type**: `application/json`
4. **Secret**: `d8abedeb62c3d76804d8b51b5e64ce7eceea361b5483ddcd8cc466e0e7037194`
5. **Events to subscribe to**:
   - ✓ Pushes
   - ✓ Pull requests
   - ✓ Issues
   - ✓ Releases
6. Click **Add webhook**

## How It Works

When GitHub sends a webhook:
1. Signature is verified using HMAC-SHA256
2. Event is stored in `github_events` table
3. Repository URL is matched to project (via `repo_url` field)
4. Project stats are updated:
   - `push`: +2% progress, +commit count
   - `pull_request opened`: +5% progress, +1 open PR
   - `pull_request merged`: +10% progress, -1 open PR
   - `issues opened`: +0% progress, +1 open issue
   - `issues closed`: +3% progress, -1 open issue
   - `release published`: +15% progress, +10% bonus

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhook/github` | Receive GitHub webhooks |
| GET | `/api/webhook/github/events` | List stored webhook events |
| GET | `/api/projects` | List projects (includes GitHub stats) |

## Environment Variables

Add to `backend/.env`:
```
GITHUB_WEBHOOK_SECRET=d8abedeb62c3d76804d8b51b5e64ce7eceea361b5483ddcd8cc466e0e7037194
```
