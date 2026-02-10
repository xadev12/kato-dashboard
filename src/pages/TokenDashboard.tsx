import { useMemo } from 'react'
import { useDashboardData } from '../hooks/useDashboardData'

// Format currency
function formatCurrency(num: number): string {
  return `$${(num || 0).toFixed(2)}`
}

export function TokenDashboard() {
  const { data, loading, lastUpdatedAgo, refresh } = useDashboardData()

  // Get token data from v3 schema
  const tokens = useMemo(() => {
    const health = data?.systemHealth?.tokens
    return {
      todayCost: health?.cost || 0,
      todayBudget: health?.budget || 20,
      usedPercent: health?.budgetUsedPercent || 0,
      overBudget: health?.overBudget || false
    }
  }, [data])

  // Mock sprint cumulative data (would come from backend)
  const sprintData = useMemo(() => {
    const dayNumber = data?.sprint?.day || 1
    const estimatedDailyCost = tokens.todayCost || 5
    return {
      sprintTotal: estimatedDailyCost * dayNumber,
      sprintBudget: tokens.todayBudget * 60, // 60-day sprint
      sprintDay: dayNumber,
      sprintDays: data?.sprint?.totalDays || 60
    }
  }, [data, tokens])

  // Mock project breakdown (would come from backend)
  const projectBreakdown = useMemo(() => {
    const projects = data?.activeWork?.projects || []
    return projects.map(p => ({
      id: p.id,
      name: p.name,
      cost: Math.random() * tokens.todayCost * 0.5, // Mock cost
      percent: Math.floor(Math.random() * 40 + 10)
    })).sort((a, b) => b.cost - a.cost)
  }, [data, tokens])

  // Mock agent breakdown (would come from backend)
  const agentBreakdown = useMemo(() => {
    const agents = data?.systemHealth?.agents?.list || []
    return agents.map(a => ({
      id: a.id,
      name: a.name,
      cost: Math.random() * tokens.todayCost * 0.3, // Mock cost
      percent: Math.floor(Math.random() * 30 + 5)
    })).sort((a, b) => b.cost - a.cost)
  }, [data, tokens])

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Token Usage</h1>
          <p className="text-sm text-[var(--text-secondary)]">Track spending across projects and agents</p>
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

      {/* Over Budget Alert */}
      {tokens.overBudget && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
          <WarningIcon className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-rose-200">Over daily budget</p>
            <p className="text-xs text-rose-300/60">Consider optimizing usage or adjusting budget</p>
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Cost vs Budget */}
        <StatCard
          title="Today's Cost"
          value={formatCurrency(tokens.todayCost)}
          subtitle={`of ${formatCurrency(tokens.todayBudget)} budget`}
          percent={tokens.usedPercent}
          color={tokens.overBudget ? 'rose' : tokens.usedPercent > 75 ? 'amber' : 'cyan'}
          icon={<TodayIcon className="w-5 h-5" />}
        />

        {/* Sprint Cumulative */}
        <StatCard
          title="Sprint Cumulative"
          value={formatCurrency(sprintData.sprintTotal)}
          subtitle={`Day ${sprintData.sprintDay} of ${sprintData.sprintDays}`}
          percent={Math.round((sprintData.sprintTotal / sprintData.sprintBudget) * 100)}
          color="violet"
          icon={<SprintIcon className="w-5 h-5" />}
        />
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Project */}
        <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <ProjectIcon className="w-4 h-4 text-[var(--accent-primary)]" />
              Cost by Project
            </h3>
            <span className="text-xs text-[var(--text-tertiary)]">Today</span>
          </div>

          {projectBreakdown.length === 0 ? (
            <EmptyBreakdown message="No project data available" />
          ) : (
            <div className="space-y-3">
              {projectBreakdown.slice(0, 5).map((project) => (
                <BreakdownRow
                  key={project.id}
                  name={project.name}
                  cost={project.cost}
                  percent={project.percent}
                  color="cyan"
                />
              ))}
            </div>
          )}
        </div>

        {/* Cost by Agent */}
        <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <AgentIcon className="w-4 h-4 text-violet-400" />
              Cost by Agent
            </h3>
            <span className="text-xs text-[var(--text-tertiary)]">Today</span>
          </div>

          {agentBreakdown.length === 0 ? (
            <EmptyBreakdown message="No agent data available" />
          ) : (
            <div className="space-y-3">
              {agentBreakdown.slice(0, 5).map((agent) => (
                <BreakdownRow
                  key={agent.id}
                  name={agent.name}
                  cost={agent.cost}
                  percent={agent.percent}
                  color="violet"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({
  title,
  value,
  subtitle,
  percent,
  color,
  icon
}: {
  title: string
  value: string
  subtitle: string
  percent: number
  color: 'cyan' | 'amber' | 'rose' | 'violet'
  icon: React.ReactNode
}) {
  const colorClasses = {
    cyan: {
      text: 'text-[var(--accent-primary)]',
      bg: 'bg-cyan-500',
      gradient: 'from-[var(--accent-primary)] to-[var(--accent-primary-light)]'
    },
    amber: {
      text: 'text-amber-400',
      bg: 'bg-amber-500',
      gradient: 'from-amber-500 to-amber-400'
    },
    rose: {
      text: 'text-rose-400',
      bg: 'bg-rose-500',
      gradient: 'from-rose-500 to-rose-400'
    },
    violet: {
      text: 'text-violet-400',
      bg: 'bg-violet-500',
      gradient: 'from-violet-500 to-violet-400'
    }
  }

  const colors = colorClasses[color]

  return (
    <div className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={colors.text}>{icon}</span>
          <span className="text-sm font-medium text-[var(--text-primary)]">{title}</span>
        </div>
        <span className={`text-xs ${colors.text}`}>{percent}%</span>
      </div>

      <div className="mb-4">
        <span className={`text-3xl font-bold ${colors.text}`}>{value}</span>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">{subtitle}</p>
      </div>

      <div className="h-2 bg-[var(--bg-muted)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colors.gradient} transition-all duration-500`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  )
}

// Breakdown Row
function BreakdownRow({
  name,
  cost,
  percent,
  color
}: {
  name: string
  cost: number
  percent: number
  color: 'cyan' | 'violet'
}) {
  const barColor = color === 'cyan' ? 'bg-cyan-500' : 'bg-violet-500'
  const textColor = color === 'cyan' ? 'text-[var(--accent-primary)]' : 'text-violet-400'

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-[var(--text-primary)] truncate pr-2">{name}</span>
        <span className={`text-sm font-medium ${textColor}`}>{formatCurrency(cost)}</span>
      </div>
      <div className="h-1.5 bg-[var(--bg-muted)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

// Empty Breakdown
function EmptyBreakdown({ message }: { message: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm text-[var(--text-tertiary)]">{message}</p>
    </div>
  )
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-16 bg-[var(--bg-muted)] rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-40 bg-[var(--bg-muted)] rounded-xl" />
        <div className="h-40 bg-[var(--bg-muted)] rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-[var(--bg-muted)] rounded-xl" />
        <div className="h-64 bg-[var(--bg-muted)] rounded-xl" />
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

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function TodayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function SprintIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function ProjectIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function AgentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  )
}
