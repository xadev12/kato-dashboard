#!/usr/bin/env node
/**
 * GitHub Webhook Test Script for Kato Dashboard
 * Usage: node test-webhook.js [event-type]
 * Example: node test-webhook.js push
 */

import crypto from 'crypto';

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3001/api/webhook/github';
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'd8abedeb62c3d76804d8b51b5e64ce7eceea361b5483ddcd8cc466e0e7037194';
const EVENT_TYPE = process.argv[2] || 'push';

// Generate UUID for delivery ID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generate HMAC signature
function generateSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const signature = hmac.update(payload).digest('hex');
  return `sha256=${signature}`;
}

// Test payloads for different event types
const testPayloads = {
  push: {
    ref: 'refs/heads/main',
    repository: {
      name: 'test-repo',
      full_name: 'xadev12/test-repo',
      html_url: 'https://github.com/xadev12/test-repo'
    },
    commits: [
      { id: 'abc123', message: 'Test commit 1' },
      { id: 'def456', message: 'Test commit 2' }
    ],
    pusher: { name: 'testuser' }
  },
  pull_request: {
    action: 'opened',
    number: 1,
    repository: {
      name: 'test-repo',
      full_name: 'xadev12/test-repo',
      html_url: 'https://github.com/xadev12/test-repo'
    },
    pull_request: {
      title: 'Test Pull Request',
      state: 'open'
    }
  },
  issues: {
    action: 'opened',
    repository: {
      name: 'test-repo',
      full_name: 'xadev12/test-repo',
      html_url: 'https://github.com/xadev12/test-repo'
    },
    issue: {
      title: 'Test Issue',
      state: 'open'
    }
  },
  release: {
    action: 'published',
    repository: {
      name: 'test-repo',
      full_name: 'xadev12/test-repo',
      html_url: 'https://github.com/xadev12/test-repo'
    },
    release: {
      tag_name: 'v1.0.0',
      name: 'Version 1.0.0'
    }
  }
};

async function sendWebhook(eventType, payload, signature) {
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-GitHub-Event': eventType,
      'X-GitHub-Delivery': generateUUID(),
      'X-Hub-Signature-256': signature
    },
    body: payload
  });

  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

async function testWebhook() {
  console.log('================================');
  console.log('GitHub Webhook Test');
  console.log('================================');
  console.log(`URL: ${WEBHOOK_URL}`);
  console.log(`Event: ${EVENT_TYPE}`);
  console.log(`Secret: ${WEBHOOK_SECRET.slice(0, 10)}...`);
  console.log('');

  const payloadObj = testPayloads[EVENT_TYPE];
  if (!payloadObj) {
    console.error(`Unknown event type: ${EVENT_TYPE}`);
    console.error('Supported types: push, pull_request, issues, release');
    process.exit(1);
  }

  const payload = JSON.stringify(payloadObj);
  const signature = generateSignature(payload, WEBHOOK_SECRET);

  console.log('Payload:');
  console.log(JSON.stringify(payloadObj, null, 2));
  console.log('');
  console.log(`Signature: ${signature.slice(0, 20)}...`);
  console.log('');
  console.log('Sending request...');
  console.log('================================');

  // Test with valid signature
  const validResult = await sendWebhook(EVENT_TYPE, payload, signature);
  console.log(`HTTP Status: ${validResult.status}`);
  console.log('Response:');
  console.log(JSON.stringify(validResult.body, null, 2));
  console.log('');

  // Test with invalid signature
  console.log('================================');
  console.log('Testing with invalid signature...');
  console.log('================================');

  const invalidResult = await sendWebhook(EVENT_TYPE, payload, 'sha256=invalidsignature123');
  console.log(`HTTP Status: ${invalidResult.status} (expected: 401)`);
  console.log('Response:');
  console.log(JSON.stringify(invalidResult.body, null, 2));
  console.log('');

  // Test events endpoint
  console.log('================================');
  console.log('Testing events endpoint...');
  console.log('================================');

  const eventsResponse = await fetch(`${WEBHOOK_URL}/events`);
  const eventsBody = await eventsResponse.json();
  console.log(`HTTP Status: ${eventsResponse.status}`);
  console.log(`Events count: ${Array.isArray(eventsBody) ? eventsBody.length : 'N/A'}`);
  console.log('');

  console.log('================================');
  console.log('Test complete!');
  console.log('================================');
}

// Run tests
testWebhook().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
