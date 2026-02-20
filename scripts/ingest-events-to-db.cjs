#!/usr/bin/env node
/**
 * Event Ingest Script — Reads events.jsonl and writes to dashboard SQLite DB.
 *
 * Usage:
 *   node scripts/ingest-events-to-db.cjs          # incremental (from last ingested)
 *   node scripts/ingest-events-to-db.cjs --full    # re-ingest all events
 *
 * CommonJS — uses better-sqlite3 directly (not the TypeScript db.ts).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Dependency check
// ---------------------------------------------------------------------------
let Database;
try {
  Database = require('better-sqlite3');
} catch (err) {
  console.error(
    'better-sqlite3 is not installed.\n' +
    'Run: npm install better-sqlite3 --save\n' +
    '(from /Users/devl/clawd/projects/kato-dashboard/)'
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const DB_PATH = '/Users/devl/clawd/projects/kato-dashboard/backend/data/dashboard.db';
const EVENTS_PATH = '/Users/devl/clawd/data/logs/events.jsonl';
const STATE_PATH = path.join(__dirname, '..', 'data', 'ingest-state.json');

// Ensure data dir for state file
const stateDir = path.dirname(STATE_PATH);
if (!fs.existsSync(stateDir)) {
  fs.mkdirSync(stateDir, { recursive: true });
}

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------
const fullMode = process.argv.includes('--full');

// ---------------------------------------------------------------------------
// Database setup
// ---------------------------------------------------------------------------
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------------------------------------------------------------------------
// Schema migrations
// ---------------------------------------------------------------------------
function runMigrations() {
  // 1. pipeline_events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS pipeline_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      project_id TEXT,
      stage TEXT,
      model TEXT,
      tool TEXT,
      success INTEGER,
      duration_ms INTEGER,
      input_tokens INTEGER,
      output_tokens INTEGER,
      estimated_cost REAL,
      complexity TEXT,
      error TEXT,
      metadata TEXT,
      timestamp DATETIME NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pipeline_events_project ON pipeline_events(project_id);
    CREATE INDEX IF NOT EXISTS idx_pipeline_events_type ON pipeline_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_pipeline_events_timestamp ON pipeline_events(timestamp);
  `);

  // 2. Add project_id and stage columns to tokens table (if missing)
  const tokenColumns = db.pragma('table_info(tokens)').map(c => c.name);

  if (!tokenColumns.includes('project_id')) {
    try {
      db.exec('ALTER TABLE tokens ADD COLUMN project_id TEXT');
    } catch (err) {
      // Column may already exist in rare edge cases
      if (!err.message.includes('duplicate column')) throw err;
    }
  }

  if (!tokenColumns.includes('stage')) {
    try {
      db.exec('ALTER TABLE tokens ADD COLUMN stage TEXT');
    } catch (err) {
      if (!err.message.includes('duplicate column')) throw err;
    }
  }

  console.log('Migrations applied.');
}

// ---------------------------------------------------------------------------
// State management (last ingested event)
// ---------------------------------------------------------------------------
function loadState() {
  if (fullMode) return { lastEventId: null, lastLine: 0 };
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  } catch {
    return { lastEventId: null, lastLine: 0 };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

// ---------------------------------------------------------------------------
// Read events from JSONL
// ---------------------------------------------------------------------------
function readEvents(startLine) {
  if (!fs.existsSync(EVENTS_PATH)) {
    console.log(`Events file not found: ${EVENTS_PATH}`);
    console.log('Nothing to ingest.');
    return [];
  }

  const raw = fs.readFileSync(EVENTS_PATH, 'utf8');
  const lines = raw.split('\n').filter(l => l.trim());
  const events = [];

  for (let i = startLine; i < lines.length; i++) {
    try {
      const evt = JSON.parse(lines[i]);
      // Ensure every event has an id
      if (!evt.id) {
        evt.id = crypto.randomUUID
          ? crypto.randomUUID()
          : crypto.randomBytes(16).toString('hex');
      }
      evt._lineIndex = i;
      events.push(evt);
    } catch (err) {
      console.warn(`Skipping malformed line ${i + 1}: ${err.message}`);
    }
  }

  return events;
}

// ---------------------------------------------------------------------------
// Prepared statements
// ---------------------------------------------------------------------------
function prepareStatements() {
  const insertPipelineEvent = db.prepare(`
    INSERT OR IGNORE INTO pipeline_events
      (id, event_type, project_id, stage, model, tool, success, duration_ms,
       input_tokens, output_tokens, estimated_cost, complexity, error, metadata, timestamp)
    VALUES
      (@id, @event_type, @project_id, @stage, @model, @tool, @success, @duration_ms,
       @input_tokens, @output_tokens, @estimated_cost, @complexity, @error, @metadata, @timestamp)
  `);

  const insertActivity = db.prepare(`
    INSERT OR IGNORE INTO activity
      (id, action_type, description, project_id, task_id, agent_id, metadata, timestamp)
    VALUES
      (@id, @action_type, @description, @project_id, @task_id, @agent_id, @metadata, @timestamp)
  `);

  const upsertSession = db.prepare(`
    INSERT INTO sessions
      (id, agent_id, project_id, task_id, status, started_at, completed_at,
       tokens_used, input_tokens, output_tokens, model, cost, metadata)
    VALUES
      (@id, @agent_id, @project_id, @task_id, @status, @started_at, @completed_at,
       @tokens_used, @input_tokens, @output_tokens, @model, @cost, @metadata)
    ON CONFLICT(id) DO UPDATE SET
      status      = excluded.status,
      completed_at = COALESCE(excluded.completed_at, sessions.completed_at),
      tokens_used  = COALESCE(excluded.tokens_used, sessions.tokens_used),
      input_tokens = COALESCE(excluded.input_tokens, sessions.input_tokens),
      output_tokens = COALESCE(excluded.output_tokens, sessions.output_tokens),
      model        = COALESCE(excluded.model, sessions.model),
      cost         = COALESCE(excluded.cost, sessions.cost),
      metadata     = COALESCE(excluded.metadata, sessions.metadata)
  `);

  const upsertTokens = db.prepare(`
    INSERT INTO tokens
      (date, agent_id, model, tokens_used, input_tokens, output_tokens, cost, session_count, project_id, stage)
    VALUES
      (@date, @agent_id, @model, @tokens_used, @input_tokens, @output_tokens, @cost, 1, @project_id, @stage)
    ON CONFLICT(date, agent_id, model) DO UPDATE SET
      tokens_used   = tokens.tokens_used   + excluded.tokens_used,
      input_tokens  = tokens.input_tokens  + excluded.input_tokens,
      output_tokens = tokens.output_tokens + excluded.output_tokens,
      cost          = tokens.cost          + excluded.cost,
      session_count = tokens.session_count + 1,
      project_id    = COALESCE(excluded.project_id, tokens.project_id),
      stage         = COALESCE(excluded.stage, tokens.stage)
  `);

  const updateProjectStatus = db.prepare(`
    UPDATE projects SET
      status = @status,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @project_id
  `);

  return {
    insertPipelineEvent,
    insertActivity,
    upsertSession,
    upsertTokens,
    updateProjectStatus,
  };
}

// ---------------------------------------------------------------------------
// Event handlers — map each event type to the appropriate tables
// ---------------------------------------------------------------------------
function generateId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString('hex');
}

function ts(evt) {
  return evt.timestamp || new Date().toISOString();
}

function metaJson(evt) {
  const meta = Object.assign({}, evt);
  delete meta.id;
  delete meta.event_type;
  delete meta.timestamp;
  delete meta._lineIndex;
  return JSON.stringify(meta);
}

function handleAgentSpawned(evt, stmts, stats) {
  // activity
  stmts.insertActivity.run({
    id: `act-${evt.id}`,
    action_type: 'agent_action',
    description: `Agent spawned: ${evt.agent_id || 'unknown'}${evt.model ? ' (' + evt.model + ')' : ''}`,
    project_id: evt.project_id || null,
    task_id: evt.task_id || null,
    agent_id: evt.agent_id || null,
    metadata: metaJson(evt),
    timestamp: ts(evt),
  });
  stats.activity++;

  // session (new, status=active)
  stmts.upsertSession.run({
    id: evt.session_id || evt.id,
    agent_id: evt.agent_id || 'unknown',
    project_id: evt.project_id || null,
    task_id: evt.task_id || null,
    status: 'active',
    started_at: ts(evt),
    completed_at: null,
    tokens_used: 0,
    input_tokens: 0,
    output_tokens: 0,
    model: evt.model || null,
    cost: 0,
    metadata: metaJson(evt),
  });
  stats.sessions++;
}

function handleAgentCompleted(evt, stmts, stats) {
  stmts.insertActivity.run({
    id: `act-${evt.id}`,
    action_type: 'agent_action',
    description: `Agent completed: ${evt.agent_id || 'unknown'}${evt.duration_ms ? ' (' + (evt.duration_ms / 1000).toFixed(1) + 's)' : ''}`,
    project_id: evt.project_id || null,
    task_id: evt.task_id || null,
    agent_id: evt.agent_id || null,
    metadata: metaJson(evt),
    timestamp: ts(evt),
  });
  stats.activity++;

  stmts.upsertSession.run({
    id: evt.session_id || evt.id,
    agent_id: evt.agent_id || 'unknown',
    project_id: evt.project_id || null,
    task_id: evt.task_id || null,
    status: 'completed',
    started_at: ts(evt),
    completed_at: ts(evt),
    tokens_used: (evt.input_tokens || 0) + (evt.output_tokens || 0),
    input_tokens: evt.input_tokens || 0,
    output_tokens: evt.output_tokens || 0,
    model: evt.model || null,
    cost: evt.estimated_cost || 0,
    metadata: metaJson(evt),
  });
  stats.sessions++;
}

function handleAgentFailed(evt, stmts, stats) {
  stmts.insertActivity.run({
    id: `act-${evt.id}`,
    action_type: 'agent_action',
    description: `Agent failed: ${evt.agent_id || 'unknown'} — ${evt.error || 'unknown error'}`,
    project_id: evt.project_id || null,
    task_id: evt.task_id || null,
    agent_id: evt.agent_id || null,
    metadata: metaJson(evt),
    timestamp: ts(evt),
  });
  stats.activity++;

  stmts.upsertSession.run({
    id: evt.session_id || evt.id,
    agent_id: evt.agent_id || 'unknown',
    project_id: evt.project_id || null,
    task_id: evt.task_id || null,
    status: 'failed',
    started_at: ts(evt),
    completed_at: ts(evt),
    tokens_used: (evt.input_tokens || 0) + (evt.output_tokens || 0),
    input_tokens: evt.input_tokens || 0,
    output_tokens: evt.output_tokens || 0,
    model: evt.model || null,
    cost: evt.estimated_cost || 0,
    metadata: metaJson(evt),
  });
  stats.sessions++;
}

function handleStageAdvanced(evt, stmts, stats) {
  stmts.insertActivity.run({
    id: `act-${evt.id}`,
    action_type: 'status_changed',
    description: `Stage advanced: ${evt.project_id || 'unknown'} -> ${evt.stage || 'unknown'}`,
    project_id: evt.project_id || null,
    task_id: null,
    agent_id: evt.agent_id || null,
    metadata: metaJson(evt),
    timestamp: ts(evt),
  });
  stats.activity++;

  if (evt.project_id) {
    stmts.updateProjectStatus.run({
      project_id: evt.project_id,
      status: 'in_progress',
    });
    stats.projectUpdates++;
  }
}

function handleGatePassed(evt, stmts, stats) {
  stmts.insertActivity.run({
    id: `act-${evt.id}`,
    action_type: 'status_changed',
    description: `Gate passed: ${evt.project_id || 'unknown'} @ ${evt.stage || 'unknown'}`,
    project_id: evt.project_id || null,
    task_id: null,
    agent_id: evt.agent_id || null,
    metadata: metaJson(evt),
    timestamp: ts(evt),
  });
  stats.activity++;

  if (evt.project_id) {
    stmts.updateProjectStatus.run({
      project_id: evt.project_id,
      status: 'in_progress',
    });
    stats.projectUpdates++;
  }
}

function handleGateFailed(evt, stmts, stats) {
  stmts.insertActivity.run({
    id: `act-${evt.id}`,
    action_type: 'status_changed',
    description: `Gate failed: ${evt.project_id || 'unknown'} @ ${evt.stage || 'unknown'} — ${evt.error || 'unknown'}`,
    project_id: evt.project_id || null,
    task_id: null,
    agent_id: evt.agent_id || null,
    metadata: metaJson(evt),
    timestamp: ts(evt),
  });
  stats.activity++;
}

function handleCostRecorded(evt, stmts, stats) {
  const date = (evt.timestamp || new Date().toISOString()).slice(0, 10); // YYYY-MM-DD

  stmts.upsertTokens.run({
    date,
    agent_id: evt.agent_id || 'unknown',
    model: evt.model || 'unknown',
    tokens_used: (evt.input_tokens || 0) + (evt.output_tokens || 0),
    input_tokens: evt.input_tokens || 0,
    output_tokens: evt.output_tokens || 0,
    cost: evt.estimated_cost || 0,
    project_id: evt.project_id || null,
    stage: evt.stage || null,
  });
  stats.tokens++;
}

function handleDecisionPending(evt, stmts, stats) {
  stmts.insertActivity.run({
    id: `act-${evt.id}`,
    action_type: 'agent_action',
    description: `Decision pending: ${evt.description || evt.project_id || 'unknown'}`,
    project_id: evt.project_id || null,
    task_id: evt.task_id || null,
    agent_id: evt.agent_id || null,
    metadata: metaJson(evt),
    timestamp: ts(evt),
  });
  stats.activity++;
}

function handleDecisionResolved(evt, stmts, stats) {
  stmts.insertActivity.run({
    id: `act-${evt.id}`,
    action_type: 'agent_action',
    description: `Decision resolved: ${evt.description || evt.project_id || 'unknown'}`,
    project_id: evt.project_id || null,
    task_id: evt.task_id || null,
    agent_id: evt.agent_id || null,
    metadata: metaJson(evt),
    timestamp: ts(evt),
  });
  stats.activity++;
}

// Dispatch map
const HANDLERS = {
  agent_spawned: handleAgentSpawned,
  agent_completed: handleAgentCompleted,
  agent_failed: handleAgentFailed,
  stage_advanced: handleStageAdvanced,
  gate_passed: handleGatePassed,
  gate_failed: handleGateFailed,
  cost_recorded: handleCostRecorded,
  decision_pending: handleDecisionPending,
  decision_resolved: handleDecisionResolved,
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  console.log(`Event ingest — ${fullMode ? 'FULL' : 'incremental'} mode`);
  console.log(`DB:     ${DB_PATH}`);
  console.log(`Events: ${EVENTS_PATH}`);
  console.log('');

  // 1. Run migrations
  runMigrations();

  // 2. Load state
  const state = loadState();
  const startLine = state.lastLine || 0;
  if (!fullMode && startLine > 0) {
    console.log(`Resuming from line ${startLine + 1} (last event: ${state.lastEventId || 'none'})`);
  }

  // 3. Read events
  const events = readEvents(fullMode ? 0 : startLine);
  if (events.length === 0) {
    console.log('No new events to ingest.');
    return;
  }

  console.log(`Found ${events.length} event(s) to process.`);

  // 4. Prepare statements
  const stmts = prepareStatements();

  // 5. Process events inside a transaction
  const stats = {
    total: 0,
    activity: 0,
    sessions: 0,
    tokens: 0,
    pipelineEvents: 0,
    projectUpdates: 0,
    skipped: 0,
  };

  const ingestAll = db.transaction((evts) => {
    for (const evt of evts) {
      const evtType = evt.event_type || evt.type;
      if (!evtType) {
        console.warn(`Skipping event without type (line ${evt._lineIndex + 1})`);
        stats.skipped++;
        continue;
      }

      // Always insert into pipeline_events
      stmts.insertPipelineEvent.run({
        id: evt.id,
        event_type: evtType,
        project_id: evt.project_id || null,
        stage: evt.stage || null,
        model: evt.model || null,
        tool: evt.tool || null,
        success: evt.success != null ? (evt.success ? 1 : 0) : null,
        duration_ms: evt.duration_ms || null,
        input_tokens: evt.input_tokens || null,
        output_tokens: evt.output_tokens || null,
        estimated_cost: evt.estimated_cost || null,
        complexity: evt.complexity || null,
        error: evt.error || null,
        metadata: metaJson(evt),
        timestamp: ts(evt),
      });
      stats.pipelineEvents++;

      // Dispatch to type-specific handler
      const handler = HANDLERS[evtType];
      if (handler) {
        handler(evt, stmts, stats);
      } else {
        // Unknown event type — already stored in pipeline_events, just note it
        console.warn(`Unknown event type "${evtType}" on line ${evt._lineIndex + 1} — stored in pipeline_events only.`);
      }

      stats.total++;
    }
  });

  ingestAll(events);

  // 6. Save state
  const lastEvt = events[events.length - 1];
  saveState({
    lastEventId: lastEvt.id,
    lastLine: lastEvt._lineIndex + 1,
    lastTimestamp: ts(lastEvt),
    updatedAt: new Date().toISOString(),
  });

  // 7. Summary
  console.log('');
  console.log('--- Ingest Summary ---');
  console.log(`Events processed:   ${stats.total}`);
  console.log(`Pipeline events:    ${stats.pipelineEvents}`);
  console.log(`Activity rows:      ${stats.activity}`);
  console.log(`Session upserts:    ${stats.sessions}`);
  console.log(`Token aggregations: ${stats.tokens}`);
  console.log(`Project updates:    ${stats.projectUpdates}`);
  if (stats.skipped > 0) {
    console.log(`Skipped:            ${stats.skipped}`);
  }
  console.log('Done.');
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
try {
  main();
} catch (err) {
  console.error('Fatal error during ingest:', err);
  process.exit(1);
} finally {
  db.close();
}
