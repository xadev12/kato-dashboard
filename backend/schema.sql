-- Kato Dashboard Database Schema
-- SQLite file-based database

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'done')),
  repo_url TEXT,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assigned_queen TEXT,
  impact INTEGER CHECK (impact >= 1 AND impact <= 10),
  effort INTEGER CHECK (effort >= 1 AND effort <= 10),
  time_invested REAL DEFAULT 0
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'in_progress', 'done')),
  assigned_agent TEXT,
  assigned_to TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  blocker_reason TEXT,
  action_required TEXT,
  estimated_token_cost INTEGER,
  blocked_on_queen TEXT,
  workstream TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Agents table (Queen agents)
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'queen',
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'active', 'blocked')),
  current_task TEXT,
  emoji TEXT,
  skills TEXT, -- JSON array
  description TEXT,
  color TEXT,
  stats_tasks_completed INTEGER DEFAULT 0,
  stats_success_rate INTEGER DEFAULT 0,
  stats_current_streak INTEGER DEFAULT 0,
  stats_weekly_velocity INTEGER DEFAULT 0,
  memory_total_entries INTEGER DEFAULT 0,
  memory_last_updated DATETIME,
  memory_active_contexts INTEGER DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sub-agents table
CREATE TABLE IF NOT EXISTS sub_agents (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT,
  description TEXT,
  specialty TEXT,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'active', 'blocked')),
  spawn_cost INTEGER DEFAULT 0,
  spawned_count INTEGER DEFAULT 0,
  FOREIGN KEY (parent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Workers table (active, queued, recent)
CREATE TABLE IF NOT EXISTS workers (
  id TEXT PRIMARY KEY,
  specialist TEXT NOT NULL,
  task_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'queued', 'completed')),
  queued_at DATETIME,
  spawned_at DATETIME,
  completed_at DATETIME,
  eta TEXT
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  project_id TEXT,
  task_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'failed')),
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  tokens_used INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  model TEXT,
  cost REAL DEFAULT 0,
  metadata TEXT -- JSON
);

-- Token usage aggregation table
CREATE TABLE IF NOT EXISTS tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL, -- YYYY-MM-DD
  agent_id TEXT,
  model TEXT,
  tokens_used INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cache_read_tokens INTEGER DEFAULT 0,
  cache_write_tokens INTEGER DEFAULT 0,
  cost REAL DEFAULT 0,
  session_count INTEGER DEFAULT 0,
  UNIQUE(date, agent_id, model)
);

-- Activity feed table
CREATE TABLE IF NOT EXISTS activity (
  id TEXT PRIMARY KEY,
  action_type TEXT NOT NULL CHECK (action_type IN ('project_created', 'task_created', 'task_updated', 'status_changed', 'agent_action', 'deploy', 'commit')),
  description TEXT NOT NULL,
  project_id TEXT,
  task_id TEXT,
  agent_id TEXT,
  metadata TEXT, -- JSON
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Memory entries table
CREATE TABLE IF NOT EXISTS memory (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  type TEXT NOT NULL CHECK (type IN ('decision', 'observation', 'lesson', 'preference')),
  content TEXT NOT NULL,
  tags TEXT, -- JSON array
  project_id TEXT,
  freshness_score INTEGER DEFAULT 100 -- 0-100, decreases over time
);

-- Agent preferences table
CREATE TABLE IF NOT EXISTS preferences (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  category TEXT NOT NULL,
  value TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  last_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Active project contexts table
CREATE TABLE IF NOT EXISTS project_contexts (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  project_name TEXT NOT NULL,
  context TEXT NOT NULL,
  last_accessed DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  importance TEXT CHECK (importance IN ('high', 'medium', 'low')),
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_sessions_agent ON sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_tokens_date ON tokens(date);
CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity(timestamp);
CREATE INDEX IF NOT EXISTS idx_memory_agent ON memory(agent_id);
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);

-- Trigger to update updated_at on projects
CREATE TRIGGER IF NOT EXISTS update_projects_timestamp 
AFTER UPDATE ON projects
BEGIN
  UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to update updated_at on agents
CREATE TRIGGER IF NOT EXISTS update_agents_timestamp 
AFTER UPDATE ON agents
BEGIN
  UPDATE agents SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
