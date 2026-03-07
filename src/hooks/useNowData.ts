import { useState, useEffect, useCallback, useMemo } from 'react'
import type {
  NowData, NeedsYouItem, KanbanTask, ProjectSummary,
  DeployReadyItem, MappedOutProject, QueenAgentStatus,
  WorkerQueueItem, ModelHealthItem, TokenBudget,
  ProgressEvent, CompletedItem, KanbanColumn
} from '../types/now'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const POLL_INTERVAL = 5000

// Agent metadata (enriches raw agent data)
const QUEEN_META: Record<string, { emoji: string; role: string; color: string }> = {
  main:  { emoji: '🤖', role: 'Chief of Staff', color: 'violet' },
  yuki:  { emoji: '🚀', role: 'DevOps Engineer', color: 'emerald' },
  koji:  { emoji: '📈', role: 'Business Strategist', color: 'blue' },
  sora:  { emoji: '🧠', role: 'Second Brain', color: 'pink' },
  karin: { emoji: '💐', role: 'Personal Assistant', color: 'amber' },
}

const QUEEN_NAMES: Record<string, string> = {
  main: 'Kato', yuki: 'Yuki', koji: 'Koji', sora: 'Sora', karin: 'Karin'
}

interface RawData {
  schemaVersion?: string
  lastUpdated?: string
  generatedAt?: string
  projects?: RawProject[]
  agents?: { queens?: RawAgent[]; workers?: RawWorkers }
  activeWork?: { projects?: any[]; blockedCount?: number }
  systemHealth?: { tokens?: any; agents?: any }
  meta?: any
  tokenStats?: any
  actions?: { pending?: any[]; recent?: any[] }
  roadmap?: { sprint?: any; active?: any[]; backlog?: any[] }
  sprint?: any
  queue?: any[]
}

interface RawProject {
  id: string
  name: string
  description?: string
  status: string
  priority?: string
  progress?: number
  currentStage?: string
  assignedQueen?: string | null
  blocker?: string | null
  created_at?: string
  updated_at?: string
  tasks?: RawTask[]
}

interface RawTask {
  id: string
  title: string
  status: string
  assignedAgent?: string | null
  completed_at?: string | null
  blockerReason?: string | null
  actionRequired?: string | null
  description?: string
  priority?: string
}

interface RawAgent {
  id: string
  name: string
  type?: string
  status: string
  currentTask?: string | null
  role?: string
  emoji?: string
}

interface RawWorkers {
  active?: any[]
  queue?: any[]
  recent?: any[]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function timeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${minutes % 60}m`
  return `${Math.floor(hours / 24)}d ${hours % 24}h`
}

async function fetchData(): Promise<RawData | null> {
  // Try live API first — fetch both status and full projects
  try {
    const [statusRes, projectsRes] = await Promise.all([
      fetch(`${API_BASE}/api/status?t=${Date.now()}`),
      fetch(`${API_BASE}/api/projects?t=${Date.now()}`)
    ])
    if (statusRes.ok && projectsRes.ok) {
      const status = await statusRes.json()
      const projects = await projectsRes.json()
      return { ...status, projects, lastUpdated: status.generatedAt || status.lastUpdated }
    }
  } catch {
    // fall through
  }

  // Fallback to static JSON
  try {
    const res = await fetch(`/dashboard-data.json?t=${Date.now()}`)
    if (res.ok) return await res.json()
  } catch {
    // fall through
  }

  return null
}

// Derive Needs You items from raw data
function deriveNeedsYou(data: RawData): NeedsYouItem[] {
  const items: NeedsYouItem[] = []
  const projects = data.projects || []

  for (const proj of projects) {
    // Projects in deploy stage
    if (proj.currentStage === 'deploy' && proj.status !== 'done') {
      items.push({
        id: `deploy-${proj.id}`,
        projectId: proj.id,
        projectName: proj.name,
        actionType: 'deploy_approval',
        title: `Approve deploy for ${proj.name}`,
        description: `Project is in deploy stage, awaiting deployment.`,
        stage: 'deploy',
        waitingSince: proj.updated_at || new Date().toISOString(),
        actions: [
          { label: 'Deploy Now', type: 'primary' },
          { label: 'View Details', type: 'secondary' },
          { label: 'Defer', type: 'default' }
        ]
      })
    }

    // Projects in QA stage (need review sign-off)
    if (proj.currentStage === 'qa' && proj.status !== 'done') {
      items.push({
        id: `qa-${proj.id}`,
        projectId: proj.id,
        projectName: proj.name,
        actionType: 'review_signoff',
        title: `Review QA for ${proj.name}`,
        description: `Project is in QA stage, awaiting sign-off.`,
        stage: 'qa',
        waitingSince: proj.updated_at || new Date().toISOString(),
        actions: [
          { label: 'Approve', type: 'primary' },
          { label: 'View Details', type: 'secondary' }
        ]
      })
    }

    // Blocked projects requiring decision
    if (proj.status === 'blocked' && proj.blocker) {
      items.push({
        id: `blocked-${proj.id}`,
        projectId: proj.id,
        projectName: proj.name,
        actionType: 'blocker_escalation',
        title: `Unblock ${proj.name}`,
        description: proj.blocker,
        stage: proj.currentStage,
        waitingSince: proj.updated_at || new Date().toISOString(),
        actions: [
          { label: 'Open', type: 'primary' },
          { label: 'Defer', type: 'default' }
        ]
      })
    }

    // Tasks with actionRequired
    for (const task of proj.tasks || []) {
      if (task.actionRequired) {
        items.push({
          id: `action-${task.id}`,
          projectId: proj.id,
          projectName: proj.name,
          actionType: 'decision_pending',
          title: task.actionRequired,
          description: task.title,
          stage: proj.currentStage,
          waitingSince: proj.updated_at || new Date().toISOString(),
          actions: [
            { label: 'Open', type: 'primary' },
            { label: 'Defer', type: 'default' }
          ]
        })
      }
    }
  }

  // Budget alert
  const tokens = data.systemHealth?.tokens || data.meta?.tokenStats?.today
  if (tokens) {
    const cost = tokens.cost || 0
    const budget = tokens.budget || 20
    if (cost / budget > 0.8) {
      items.push({
        id: 'budget-alert',
        projectId: 'system',
        projectName: 'System',
        actionType: 'budget_alert',
        title: `Budget alert: ${Math.round((cost / budget) * 100)}% of daily limit`,
        description: `$${cost.toFixed(2)} of $${budget} spent today.`,
        waitingSince: new Date().toISOString(),
        actions: [
          { label: 'View Tokens', type: 'secondary' }
        ]
      })
    }
  }

  // Sort by wait time (longest waiting first)
  items.sort((a, b) => new Date(a.waitingSince).getTime() - new Date(b.waitingSince).getTime())
  return items
}

// Derive Kanban tasks from all active projects
function deriveKanbanTasks(data: RawData): KanbanTask[] {
  const tasks: KanbanTask[] = []
  const projects = data.projects || []

  for (const proj of projects) {
    if (proj.status === 'done') continue

    for (const task of proj.tasks || []) {
      if (task.status === 'done') continue

      let column: KanbanColumn = 'in_progress'
      if (task.blockerReason) {
        column = 'blocked'
      } else if (task.status === 'queued') {
        continue // Queued tasks go to Mapped Out, not Kanban
      }

      tasks.push({
        id: task.id,
        projectId: proj.id,
        projectName: proj.name,
        title: task.title,
        column,
        assignedAgent: task.assignedAgent || null,
        timeActive: proj.updated_at ? timeSince(proj.updated_at) : '—',
        context: task.description,
        blockerReason: task.blockerReason || undefined,
        blockerAgent: undefined,
      })
    }
  }

  return tasks
}

// Derive project summaries
function deriveProjectSummaries(data: RawData): ProjectSummary[] {
  const projects = data.projects || []
  return projects
    .filter(p => p.status !== 'done' && p.status !== 'not_started')
    .map(proj => {
      const tasks = proj.tasks || []
      const completedTasks = tasks.filter(t => t.status === 'done').length
      return {
        id: proj.id,
        name: proj.name,
        progress: proj.progress || (tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0),
        totalTasks: tasks.length,
        completedTasks,
        stage: proj.currentStage || 'unknown',
        activeWorkers: tasks.filter(t => t.status === 'in_progress' && t.assignedAgent).length,
        status: proj.status,
        blocker: proj.blocker,
      }
    })
}

// Derive deploy-ready items
function deriveDeployReady(data: RawData): DeployReadyItem[] {
  const projects = data.projects || []
  return projects
    .filter(p => p.currentStage === 'deploy' && p.status !== 'done')
    .map(proj => ({
      id: proj.id,
      projectName: proj.name,
      qaPassedAt: proj.updated_at || new Date().toISOString(),
      branch: 'main',
    }))
}

// Derive mapped out (queued) tasks
function deriveMappedOut(data: RawData): MappedOutProject[] {
  const projects = data.projects || []
  const result: MappedOutProject[] = []

  for (const proj of projects) {
    if (proj.status === 'done') continue
    const queuedTasks = (proj.tasks || []).filter(t => t.status === 'queued')
    if (queuedTasks.length === 0) continue

    result.push({
      projectId: proj.id,
      projectName: proj.name,
      tasks: queuedTasks.map(t => ({
        id: t.id,
        title: t.title,
        dependencies: [],
        nextStep: 'Awaiting capacity',
        scope: undefined,
      }))
    })
  }

  return result
}

// Derive agent status
function deriveAgents(data: RawData): QueenAgentStatus[] {
  const queens = data.agents?.queens || []
  return queens.map(a => {
    const meta = QUEEN_META[a.id] || { emoji: '?', role: a.role || 'Agent', color: 'gray' }
    return {
      id: a.id,
      name: QUEEN_NAMES[a.id] || a.name,
      emoji: a.emoji || meta.emoji,
      role: a.role || meta.role,
      status: (a.status === 'active' ? 'active' : 'idle') as QueenAgentStatus['status'],
      currentTask: a.currentTask || null,
      todayTasks: 0,
      todayCost: 0,
      color: meta.color,
    }
  })
}

// Derive worker queue
function deriveWorkerQueue(data: RawData): WorkerQueueItem[] {
  const workers = data.agents?.workers
  if (!workers) return []

  const items: WorkerQueueItem[] = []

  for (const w of workers.active || []) {
    items.push({
      id: w.id || w.specialist || w.taskId,
      status: 'active',
      agentModel: w.specialist || w.model || 'Unknown',
      task: w.task || w.taskId || 'Working',
      project: w.project || '—',
      duration: w.spawnedAt ? timeSince(w.spawnedAt) : '—',
    })
  }

  for (const w of workers.queue || []) {
    items.push({
      id: w.id || w.taskId,
      status: 'queued',
      agentModel: '—',
      task: w.task || w.taskId || 'Queued',
      project: w.project || '—',
      duration: 'waiting',
    })
  }

  for (const w of (workers.recent || []).slice(0, 5)) {
    items.push({
      id: w.id || w.taskId,
      status: 'done',
      agentModel: w.specialist || w.model || 'Unknown',
      task: w.task || w.taskId || 'Completed',
      project: w.project || '—',
      duration: w.duration || '—',
      cost: w.cost,
    })
  }

  return items
}

// Derive token budget
function deriveTokenBudget(data: RawData): TokenBudget {
  const tokens = data.systemHealth?.tokens
  if (tokens) {
    return {
      todayCost: tokens.cost || 0,
      budget: tokens.budget || 20,
      usedPercent: tokens.budgetUsedPercent || 0,
      overBudget: tokens.overBudget || false,
    }
  }

  const meta = data.meta?.tokenStats?.today
  const cost = meta?.cost || 0
  const budget = 20
  return {
    todayCost: cost,
    budget,
    usedPercent: Math.round((cost / budget) * 100),
    overBudget: cost > budget,
  }
}

// Derive activity log from actions
function deriveProgressLog(data: RawData): ProgressEvent[] {
  const actions = data.actions
  if (!actions) return []

  const events: ProgressEvent[] = []

  for (const a of [...(actions.pending || []), ...(actions.recent || [])]) {
    events.push({
      id: a.id,
      type: a.type === 'approval' || a.type === 'decision' ? 'decision'
        : a.type === 'completed' ? 'pipeline'
        : 'agent',
      title: a.title,
      description: a.description || '',
      timestamp: a.createdAt || a.timestamp || new Date().toISOString(),
    })
  }

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return events
}

// Derive recently completed items
function deriveRecentlyCompleted(data: RawData): CompletedItem[] {
  const items: CompletedItem[] = []
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const projects = data.projects || []

  for (const proj of projects) {
    for (const task of proj.tasks || []) {
      if (task.status === 'done' && task.completed_at) {
        const completedTime = new Date(task.completed_at).getTime()
        if (completedTime > sevenDaysAgo) {
          items.push({
            id: task.id,
            title: task.title,
            projectName: proj.name,
            agentName: task.assignedAgent || 'Unknown',
            completedAt: task.completed_at,
            type: 'task',
          })
        }
      }
    }
  }

  items.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
  return items
}

export function useNowData(): NowData {
  const [raw, setRaw] = useState<RawData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isApiConnected, setIsApiConnected] = useState(false)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const result = await fetchData()
      if (result) {
        setRaw(result)
        setError(null)
        setIsApiConnected(!!result.generatedAt)
      }
    } catch {
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [refresh])

  const lastUpdated = raw?.lastUpdated || raw?.generatedAt || ''
  const lastUpdatedAgo = useMemo(() => lastUpdated ? timeAgo(lastUpdated) : 'Unknown', [lastUpdated])

  const needsYou = useMemo(() => raw ? deriveNeedsYou(raw) : [], [raw])
  const kanbanTasks = useMemo(() => raw ? deriveKanbanTasks(raw) : [], [raw])
  const projectSummaries = useMemo(() => raw ? deriveProjectSummaries(raw) : [], [raw])
  const deployReady = useMemo(() => raw ? deriveDeployReady(raw) : [], [raw])
  const mappedOut = useMemo(() => raw ? deriveMappedOut(raw) : [], [raw])
  const agents = useMemo(() => raw ? deriveAgents(raw) : [], [raw])
  const workerQueue = useMemo(() => raw ? deriveWorkerQueue(raw) : [], [raw])
  const tokenBudget = useMemo(() => raw ? deriveTokenBudget(raw) : { todayCost: 0, budget: 20, usedPercent: 0, overBudget: false }, [raw])
  const progressLog = useMemo(() => raw ? deriveProgressLog(raw) : [], [raw])
  const recentlyCompleted = useMemo(() => raw ? deriveRecentlyCompleted(raw) : [], [raw])

  // Model health — derive from data or return defaults
  const modelHealth = useMemo((): ModelHealthItem[] => [
    { model: 'Codex', status: 'healthy', failCount: 0 },
    { model: 'Claude', status: 'healthy', failCount: 0 },
    { model: 'Kimi', status: 'healthy', failCount: 0 },
    { model: 'MiniMax', status: 'healthy', failCount: 0 },
  ], [])

  return {
    loading,
    error,
    refreshing,
    isApiConnected,
    lastUpdated,
    lastUpdatedAgo,
    refresh,

    needsYou,
    kanbanTasks,
    projectSummaries,
    deployReady,
    mappedOut,
    agents,
    workerQueue,
    modelHealth,
    tokenBudget,
    progressLog,
    recentlyCompleted,

    needsYouCount: needsYou.length,
    activeTaskCount: kanbanTasks.filter(t => t.column === 'in_progress').length,
    blockedTaskCount: kanbanTasks.filter(t => t.column === 'blocked').length,
  }
}
