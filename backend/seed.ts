#!/usr/bin/env node
/**
 * Seed script - Initialize database with sample data
 */

import { db, initSchema } from './db.js'
import fs from 'fs'

// Initialize schema first
initSchema()

// Clear existing data
console.log('🗑️  Clearing existing data...')
db.prepare('DELETE FROM memory').run()
db.prepare('DELETE FROM activity').run()
db.prepare('DELETE FROM tokens').run()
db.prepare('DELETE FROM sessions').run()
db.prepare('DELETE FROM workers').run()
db.prepare('DELETE FROM sub_agents').run()
db.prepare('DELETE FROM agents').run()
db.prepare('DELETE FROM tasks').run()
db.prepare('DELETE FROM projects').run()

console.log('🌱 Seeding database...')

// Seed Projects
const projects = [
  {
    id: 'kato-dashboard',
    name: 'Kato Dashboard',
    description: 'Project management dashboard with real-time updates and agent coordination',
    status: 'in_progress',
    repo_url: 'https://github.com/xadev12/kato-dashboard',
    progress: 75,
    priority: 'high',
    assigned_queen: 'main',
    impact: 9,
    effort: 7
  },
  {
    id: 'move-pwa',
    name: 'Move PWA',
    description: 'Daily fitness tracker with Ring integration and Supabase backend',
    status: 'done',
    repo_url: 'https://github.com/xadev12/move-pwa',
    progress: 100,
    priority: 'high',
    assigned_queen: 'main',
    impact: 8,
    effort: 6
  },
  {
    id: 'move-ios',
    name: 'Move iOS',
    description: 'Native iOS fitness app for hybrid athletes with Apple Health sync',
    status: 'done',
    progress: 100,
    priority: 'high',
    assigned_queen: 'product',
    impact: 9,
    effort: 8
  },
  {
    id: 'morning-reads',
    name: 'Morning Reads Automation',
    description: 'Automated content curation from X/Twitter to Readwise Reader',
    status: 'in_progress',
    repo_url: null,
    progress: 60,
    priority: 'medium',
    assigned_queen: 'brain',
    impact: 6,
    effort: 4
  }
]

const projectStmt = db.prepare(`
  INSERT INTO projects (id, name, description, status, repo_url, progress, priority, assigned_queen, impact, effort)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

for (const p of projects) {
  projectStmt.run(p.id, p.name, p.description, p.status, p.repo_url, p.progress, p.priority, p.assigned_queen, p.impact, p.effort)
}
console.log(`✅ Seeded ${projects.length} projects`)

// Seed Tasks
const tasks = [
  { project_id: 'kato-dashboard', title: 'Build backend API with SQLite', status: 'done', priority: 'high' },
  { project_id: 'kato-dashboard', title: 'Create data collectors', status: 'done', priority: 'high' },
  { project_id: 'kato-dashboard', title: 'Integrate frontend with real API', status: 'in_progress', priority: 'high' },
  { project_id: 'kato-dashboard', title: 'Add real-time polling', status: 'queued', priority: 'medium' },
  { project_id: 'kato-dashboard', title: 'Deploy backend to production', status: 'queued', priority: 'medium' },
  { project_id: 'move-pwa', title: 'Set up Supabase project', status: 'done', priority: 'high' },
  { project_id: 'move-pwa', title: 'Implement Ring API integration', status: 'done', priority: 'high' },
  { project_id: 'move-pwa', title: 'Deploy to Vercel', status: 'done', priority: 'high' },
  { project_id: 'move-pwa', title: 'Add offline support', status: 'done', priority: 'medium' },
  { project_id: 'morning-reads', title: 'Create Twitter/X scraper', status: 'done', priority: 'high' },
  { project_id: 'morning-reads', title: 'Integrate Readwise API', status: 'done', priority: 'high' },
  { project_id: 'morning-reads', title: 'Add content filtering', status: 'in_progress', priority: 'medium' }
]

const taskStmt = db.prepare(`
  INSERT INTO tasks (id, project_id, title, status, priority, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`)

for (let i = 0; i < tasks.length; i++) {
  const t = tasks[i]
  taskStmt.run(`task-${i + 1}`, t.project_id, t.title, t.status, t.priority, new Date().toISOString())
}
console.log(`✅ Seeded ${tasks.length} tasks`)

// Seed Agents
const agents = [
  {
    id: 'main',
    name: 'Kato',
    emoji: '🐱',
    skills: JSON.stringify(['architecture', 'coordination', 'coding']),
    description: 'Main orchestrator agent',
    color: '#3b82f6',
    stats_tasks_completed: 156,
    stats_success_rate: 94,
    stats_current_streak: 12,
    stats_weekly_velocity: 23
  },
  {
    id: 'product',
    name: 'Product Owner',
    emoji: '📊',
    skills: JSON.stringify(['roadmap', 'prioritization', 'user-research']),
    description: 'Product strategy and roadmap',
    color: '#10b981',
    stats_tasks_completed: 89,
    stats_success_rate: 91,
    stats_current_streak: 5,
    stats_weekly_velocity: 15
  },
  {
    id: 'devops',
    name: 'DevOps Engineer',
    emoji: '⚙️',
    skills: JSON.stringify(['ci/cd', 'infrastructure', 'monitoring']),
    description: 'Infrastructure and deployment',
    color: '#f59e0b',
    stats_tasks_completed: 67,
    stats_success_rate: 98,
    stats_current_streak: 8,
    stats_weekly_velocity: 12
  },
  {
    id: 'business',
    name: 'Business Strategist',
    emoji: '💼',
    skills: JSON.stringify(['market-analysis', 'pricing', 'growth']),
    description: 'Business strategy and growth',
    color: '#8b5cf6',
    stats_tasks_completed: 45,
    stats_success_rate: 88,
    stats_current_streak: 3,
    stats_weekly_velocity: 8
  },
  {
    id: 'brain',
    name: 'Second Brain Keeper',
    emoji: '🧠',
    skills: JSON.stringify(['knowledge-management', 'automation', 'content']),
    description: 'Knowledge management and curation',
    color: '#ec4899',
    stats_tasks_completed: 112,
    stats_success_rate: 96,
    stats_current_streak: 18,
    stats_weekly_velocity: 28
  }
]

const agentStmt = db.prepare(`
  INSERT INTO agents (id, name, emoji, skills, description, color, stats_tasks_completed, stats_success_rate, stats_current_streak, stats_weekly_velocity)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

for (const a of agents) {
  agentStmt.run(a.id, a.name, a.emoji, a.skills, a.description, a.color, a.stats_tasks_completed, a.stats_success_rate, a.stats_current_streak, a.stats_weekly_velocity)
}
console.log(`✅ Seeded ${agents.length} agents`)

// Seed Sub-agents
const subAgents = [
  { parent_id: 'main', name: 'Frontend Specialist', emoji: '🎨', specialty: 'React/TypeScript UI development' },
  { parent_id: 'main', name: 'Backend Specialist', emoji: '⚡', specialty: 'API and database design' },
  { parent_id: 'product', name: 'UX Researcher', emoji: '🔍', specialty: 'User research and testing' },
  { parent_id: 'devops', name: 'Security Auditor', emoji: '🔒', specialty: 'Security reviews and compliance' }
]

const subAgentStmt = db.prepare(`
  INSERT INTO sub_agents (id, parent_id, name, emoji, specialty)
  VALUES (?, ?, ?, ?, ?)
`)

for (let i = 0; i < subAgents.length; i++) {
  const s = subAgents[i]
  subAgentStmt.run(`sub-${i + 1}`, s.parent_id, s.name, s.emoji, s.specialty)
}
console.log(`✅ Seeded ${subAgents.length} sub-agents`)

// Seed Activity
const activities = [
  { type: 'project_created', desc: 'Project "Kato Dashboard" created', project: 'kato-dashboard' },
  { type: 'task_created', desc: 'Task "Build backend API" created', project: 'kato-dashboard' },
  { type: 'task_updated', desc: 'Task "Build backend API" marked as done', project: 'kato-dashboard' },
  { type: 'deploy', desc: 'Deployed Move PWA to production', project: 'move-pwa' },
  { type: 'commit', desc: 'Commit: feat: add real-time token tracking', project: 'kato-dashboard' },
  { type: 'agent_action', desc: 'Main agent completed 5 tasks today', project: null }
]

const activityStmt = db.prepare(`
  INSERT INTO activity (id, action_type, description, project_id, timestamp)
  VALUES (?, ?, ?, ?, ?)
`)

for (let i = 0; i < activities.length; i++) {
  const a = activities[i]
  const time = new Date(Date.now() - i * 3600000).toISOString()
  activityStmt.run(`act-${i + 1}`, a.type, a.desc, a.project, time)
}
console.log(`✅ Seeded ${activities.length} activities`)

// Seed Token Stats (last 7 days)
const models = ['kimi-for-coding', 'claude-sonnet-4-5', 'claude-opus-4-5']
const tokenStmt = db.prepare(`
  INSERT INTO tokens (date, agent_id, model, tokens_used, input_tokens, output_tokens, cost, session_count)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

for (let i = 0; i < 7; i++) {
  const date = new Date()
  date.setDate(date.getDate() - i)
  const dateStr = date.toISOString().split('T')[0]
  
  for (const model of models) {
    const tokens = Math.floor(Math.random() * 5000000) + 1000000
    const inputTokens = Math.floor(tokens * 0.7)
    const outputTokens = tokens - inputTokens
    const cost = tokens * 0.000002
    const sessions = Math.floor(Math.random() * 50) + 10
    
    tokenStmt.run(dateStr, 'main', model, tokens, inputTokens, outputTokens, cost, sessions)
  }
}
console.log(`✅ Seeded token stats for last 7 days`)

// Seed Workers
const workers = [
  { specialist: 'Frontend', task_id: 'task-3', status: 'active' },
  { specialist: 'Backend', task_id: 'task-4', status: 'queued' }
]

const workerStmt = db.prepare(`
  INSERT INTO workers (id, specialist, task_id, status, queued_at, spawned_at)
  VALUES (?, ?, ?, ?, ?, ?)
`)

for (let i = 0; i < workers.length; i++) {
  const w = workers[i]
  const now = new Date().toISOString()
  workerStmt.run(`worker-${i + 1}`, w.specialist, w.task_id, w.status, now, w.status === 'active' ? now : null)
}
console.log(`✅ Seeded ${workers.length} workers`)

// Seed Memory
const memories = [
  { agent: 'main', type: 'decision', content: 'Decided to use SQLite for dashboard backend - zero config, file-based' },
  { agent: 'main', type: 'lesson', content: 'Learned: better-sqlite3 has much better performance than node-sqlite3 for sync operations' },
  { agent: 'product', type: 'preference', content: 'Prefer kanban view over list view for task management' },
  { agent: 'brain', type: 'observation', content: 'Morning reading automation saves ~15 min daily' }
]

const memoryStmt = db.prepare(`
  INSERT INTO memory (id, agent_id, type, content, tags)
  VALUES (?, ?, ?, ?, ?)
`)

for (let i = 0; i < memories.length; i++) {
  const m = memories[i]
  memoryStmt.run(`mem-${i + 1}`, m.agent, m.type, m.content, JSON.stringify([m.type]))
}
console.log(`✅ Seeded ${memories.length} memory entries`)

console.log('\n🎉 Database seeded successfully!')
console.log('Run "npm run dev" to start the backend server')
