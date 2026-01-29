-- Kato Dashboard Schema
-- Run this in your Supabase SQL editor

-- Projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  status text not null default 'backlog' check (status in ('backlog', 'in_progress', 'done')),
  repo_url text,
  progress integer default 0 check (progress >= 0 and progress <= 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tasks
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  description text default '',
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  assigned_to text,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Activity Log
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  action_type text not null,
  description text not null,
  metadata jsonb,
  project_id uuid references projects(id) on delete set null,
  timestamp timestamptz default now()
);

-- Agent Status
create table if not exists agent_status (
  id text primary key,
  agent_name text not null,
  status text not null default 'idle' check (status in ('idle', 'working', 'completed')),
  current_task text,
  last_seen timestamptz default now()
);

-- Indexes
create index if not exists idx_tasks_project_id on tasks(project_id);
create index if not exists idx_tasks_status on tasks(status);
create index if not exists idx_activity_timestamp on activity_log(timestamp desc);
create index if not exists idx_projects_status on projects(status);

-- RLS (enable for production)
alter table projects enable row level security;
alter table tasks enable row level security;
alter table activity_log enable row level security;
alter table agent_status enable row level security;

-- Public read access (adjust for your auth needs)
create policy "Public read projects" on projects for select using (true);
create policy "Public read tasks" on tasks for select using (true);
create policy "Public read activity" on activity_log for select using (true);
create policy "Public read agents" on agent_status for select using (true);

-- Allow inserts/updates (lock down in production with auth)
create policy "Allow all inserts projects" on projects for insert with check (true);
create policy "Allow all updates projects" on projects for update using (true);
create policy "Allow all inserts tasks" on tasks for insert with check (true);
create policy "Allow all updates tasks" on tasks for update using (true);
create policy "Allow all inserts activity" on activity_log for insert with check (true);
create policy "Allow all upsert agents" on agent_status for all using (true);

-- Seed data
insert into projects (name, description, status, repo_url, progress) values
  ('Move PWA', 'Daily move goal tracker with Ring integration and Supabase backend', 'in_progress', 'https://github.com/xadev12/move-pwa', 75),
  ('Kato Dashboard', 'Mini Linear-style project dashboard for tracking agent work', 'in_progress', 'https://github.com/xadev12/kato-dashboard', 30),
  ('Obsidian Vault Setup', 'Second Brain vault with templates, plugins, and workflow automation', 'done', null, 100),
  ('Moltbot Skills', 'Custom skills for Moltbot: calendar, email, browser automation', 'backlog', null, 10);
