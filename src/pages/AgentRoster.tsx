import { useMemo } from 'react'
import { useDashboardData } from '../hooks/useDashboardData'
import { ALL_QUEEN_AGENTS } from '../types'
import type { QueenAgent, AgentState } from '../types'

const statusConfig: Record<AgentState, { color: string; bg: string; border: string; label: string }> = {
  idle: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    label: 'Available'
  },
  active: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    label: 'Active'
  },
  blocked: {
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    label: 'Blocked'
  }
}

// Mock recent activity data
const RECENT_ACTIVITY = [
  { id: '1', agent: 'Kato', action: 'Completed dashboard v3 redesign task', time: '2h ago', type: 'completed' },
  { id: '2', agent: 'Sora', action: 'Started knowledge base cleanup', time: '3h ago', type: 'started' },
  { id: '3', agent: 'Yuki', action: 'Fixed CI/CD pipeline issue', time: '6h ago', type: 'completed' },
  { id: '4', agent: 'Karin', action: 'Completed hourly check-in', time: '30m ago', type: 'completed' },
  { id: '5', agent: 'Koji', action: 'Finished market analysis report', time: '1d ago', type: 'completed' },
]

export function AgentRoster() {
  const { data, loading, lastUpdatedAgo, refresh } = useDashboardData()

  // Get agents from v3 data or fall back to static data
  const agents = useMemo(() => {
    const liveAgents = data?.systemHealth?.agents?.list || []

    // Merge live status with full agent data
    return ALL_QUEEN_AGENTS.map(agent => {
      const liveStatus = liveAgents.find((a: any) => a.id === agent.id)
      return {
        ...agent,
        status: liveStatus?.status || agent.status,
        currentTask: liveStatus?.currentTask || agent.currentTask
      }
    })
  }, [data])

  // Split into active and idle
  const activeAgents = useMemo(() =>
    agents.filter(a => a.status === 'active'),
    [agents]
  )

  const idleAgents = useMemo(() =>
    agents.filter(a => a.status === 'idle'),
    [agents]
  )

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Agent Roster</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {activeAgents.length} active, {idleAgents.length} available
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <span>Updated {lastUpdatedAgo}</span>
          <button
            onClick={refresh}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
            title="Refresh"
          >
            <RefreshIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Agents */}
        <div className="lg:col-span-2 space-y-4">
          <SectionHeader
            title="Active Agents"
            count={activeAgents.length}
            color="amber"
          />

          {activeAgents.length === 0 ? (
            <EmptyState
              icon={<IdleIcon className="w-6 h-6 text-emerald-400" />}
              title="All agents idle"
              subtitle="No agents are currently working on tasks"
            />
          ) : (
            <div className="space-y-3">
              {activeAgents.map(agent => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}

          {/* Available Agents */}
          <div className="pt-4">
            <SectionHeader
              title="Available"
              count={idleAgents.length}
              color="emerald"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {idleAgents.map(agent => (
                <AgentCardCompact key={agent.id} agent={agent} />
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <SectionHeader
            title="Recent Activity"
            count={RECENT_ACTIVITY.length}
            color="cyan"
          />

          <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
            <div className="space-y-4">
              {RECENT_ACTIVITY.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Section Header
function SectionHeader({ title, count, color }: { title: string; count: number; color: string }) {
  const colorClasses: Record<string, string> = {
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    cyan: 'bg-cyan-500/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20'
  }

  return (
    <div className="flex items-center gap-2">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colorClasses[color]}`}>
        {count}
      </span>
    </div>
  )
}

// Agent Card (for active agents)
function AgentCard({ agent }: { agent: QueenAgent }) {
  const status = statusConfig[agent.status]

  return (
    <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-amber-500/20 hover:border-amber-500/30 transition-all">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-xl bg-[var(--bg-muted)] flex items-center justify-center text-lg font-semibold text-[var(--text-secondary)] border border-[var(--border-subtle)]">
            {agent.name.charAt(0)}
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-[var(--text-primary)]">{agent.name}</h3>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${status.bg} ${status.color} ${status.border} border`}>
              {status.label}
            </span>
          </div>

          {agent.currentTask && (
            <div className="p-2.5 bg-amber-500/5 rounded-lg border border-amber-500/10 mt-2">
              <p className="text-xs text-[var(--text-tertiary)] mb-0.5">Current Task</p>
              <p className="text-sm text-amber-200">{agent.currentTask}</p>
            </div>
          )}

          {/* Skills */}
          <div className="flex flex-wrap gap-1 mt-3">
            {agent.skills.slice(0, 3).map(skill => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded bg-[var(--bg-muted)] text-[var(--text-secondary)] text-[10px] border border-[var(--border-subtle)]"
              >
                {skill}
              </span>
            ))}
            {agent.skills.length > 3 && (
              <span className="px-2 py-0.5 rounded bg-[var(--bg-muted)] text-[var(--text-tertiary)] text-[10px]">
                +{agent.skills.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Agent Card Compact (for idle agents)
function AgentCardCompact({ agent }: { agent: QueenAgent }) {
  return (
    <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:border-emerald-500/20 transition-all">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--bg-muted)] flex items-center justify-center text-sm font-semibold text-[var(--text-secondary)] border border-[var(--border-subtle)]">
          {agent.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-[var(--text-primary)] text-sm">{agent.name}</h3>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <p className="text-xs text-[var(--text-tertiary)] truncate">{agent.description.slice(0, 50)}...</p>
        </div>
      </div>
    </div>
  )
}

// Activity Item
function ActivityItem({ activity }: { activity: any }) {
  const typeIcon = activity.type === 'completed' ? (
    <CheckIcon className="w-4 h-4 text-emerald-400" />
  ) : (
    <PlayIcon className="w-4 h-4 text-amber-400" />
  )

  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 mt-0.5">
        {typeIcon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--text-primary)]">
          <span className="font-medium text-[var(--text-primary)]">{activity.agent}</span>
          {' '}
          {activity.action}
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{activity.time}</p>
      </div>
    </div>
  )
}

// Empty State
function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="p-8 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--bg-muted)] flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1">{title}</h3>
      <p className="text-xs text-[var(--text-tertiary)]">{subtitle}</p>
    </div>
  )
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-16 bg-[var(--bg-muted)] rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-8 bg-[var(--bg-muted)] rounded-lg w-40" />
          <div className="h-32 bg-[var(--bg-muted)] rounded-xl" />
          <div className="h-32 bg-[var(--bg-muted)] rounded-xl" />
        </div>
        <div className="space-y-4">
          <div className="h-8 bg-[var(--bg-muted)] rounded-lg w-40" />
          <div className="h-64 bg-[var(--bg-muted)] rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// Icons
function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  )
}

function IdleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}
