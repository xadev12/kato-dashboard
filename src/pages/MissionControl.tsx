import { useDashboardData } from '../hooks/useDashboardData'
import { Link } from 'react-router-dom'
import { OpportunityScan, KatoQueue } from '../components/OpportunityScan'
import { ActionsPanel } from '../components/ActionsPanel'
import { SystemPanel } from '../components/SystemPanel'
import { HistoryView } from '../components/HistoryView'

export function MissionControl() {
  const {
    loading,
    refreshing,
    sprint,
    activeProjects,
    blockedProjects,
    queue,
    systemHealth,
    opportunities,
    katoQueue,
    systemTasks,
    completedTasks,
    tokenStatsForPanel,
    lastUpdatedAgo,
    activeCount,
    blockedCount,
    isApiConnected,
    refresh
  } = useDashboardData()

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8 min-w-0 overflow-x-hidden">
      {/* Header Bar */}
      <Header
        sprint={sprint}
        activeCount={activeCount}
        blockedCount={blockedCount}
        lastUpdated={lastUpdatedAgo}
        isApiConnected={isApiConnected}
        isRefreshing={refreshing}
        onRefresh={refresh}
      />

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Active Work */}
        <div className="space-y-4 min-w-0">
          <SectionHeader title="Active Work" subtitle="What's happening now" />
          <ActiveWorkColumn projects={activeProjects} blockedProjects={blockedProjects} />
        </div>

        {/* CENTER: Queue */}
        <div className="space-y-4 min-w-0">
          <SectionHeader title="Queue" subtitle="What's next" />
          <QueueColumn items={queue} />
        </div>

        {/* RIGHT: System Health */}
        <div className="space-y-4 min-w-0">
          <SectionHeader title="System Health" subtitle="What it's costing" />
          <SystemHealthColumn health={systemHealth} />
          {/* System Tasks — collapsible */}
          <div
            className="p-4 rounded-xl"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}
          >
            <SystemPanel systemTasks={systemTasks} tokenStats={tokenStatsForPanel} />
          </div>
        </div>
      </div>

      {/* Second Row: Actions, Opportunity Scan & Kato's Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Actions Panel */}
        <div
          className="p-4 rounded-2xl min-w-0"
          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
        >
          <ActionsPanel
            opportunities={opportunities?.items}
            blockedProjects={blockedProjects}
            katoTasks={katoQueue?.tasks}
          />
        </div>

        {/* CENTER: Opportunity Scan */}
        <div
          className="p-4 rounded-2xl min-w-0"
          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
        >
          <OpportunityScan data={opportunities} />
        </div>

        {/* RIGHT: Kato's Queue */}
        <div
          className="p-4 rounded-2xl min-w-0"
          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
        >
          <KatoQueue data={katoQueue} />
        </div>
      </div>

      {/* Third Row: Historical Archive */}
      <div
        className="p-4 rounded-2xl"
        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
      >
        <HistoryView
          opportunities={opportunities?.items}
          completedTasks={completedTasks}
          metrics={opportunities?.metrics}
        />
      </div>
    </div>
  )
}

// Header Component
function Header({
  sprint,
  activeCount,
  blockedCount,
  lastUpdated,
  isApiConnected,
  isRefreshing,
  onRefresh
}: {
  sprint: any
  activeCount: number
  blockedCount: number
  lastUpdated: string
  isApiConnected: boolean
  isRefreshing: boolean
  onRefresh: () => void
}) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            KATO DASHBOARD
          </h1>
          <span
            className="hidden sm:inline-block px-2 py-0.5 rounded text-xs font-medium"
            style={{ background: 'rgba(139, 115, 85, 0.08)', color: 'var(--accent-primary)', border: '1px solid rgba(139, 115, 85, 0.15)' }}
          >
            v4
          </span>
          {/* Connection Status */}
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
            style={{
              background: isApiConnected ? 'var(--success-muted)' : 'var(--warning-muted)',
              color: isApiConnected ? 'var(--success)' : 'var(--warning)',
              border: `1px solid ${isApiConnected ? 'rgba(122, 158, 126, 0.2)' : 'rgba(201, 169, 89, 0.2)'}`
            }}
            title={isApiConnected ? 'Live API connection' : 'Static data (API unavailable)'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isApiConnected ? 'animate-pulse' : ''}`}
              style={{ background: isApiConnected ? 'var(--success)' : 'var(--warning)' }}
            />
            {isApiConnected ? 'Live' : 'Cached'}
          </div>
        </div>
        {sprint && (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {sprint.name}: <span className="font-medium" style={{ color: 'var(--accent-primary)' }}>Day {sprint.day}</span> of {sprint.totalDays}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Quick Stats */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
        >
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Active:</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>{activeCount}</span>
        </div>
        {blockedCount > 0 && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--warning-muted)', border: '1px solid rgba(201, 169, 89, 0.2)' }}
          >
            <span className="text-xs" style={{ color: 'var(--warning)' }}>Blocked:</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--warning)' }}>{blockedCount}</span>
          </div>
        )}

        {/* Last Updated with Refresh */}
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Updated {lastUpdated}</span>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`p-1.5 rounded-lg transition-all duration-200 ${
              isRefreshing ? 'cursor-not-allowed opacity-50' : ''
            }`}
            style={{ color: 'var(--text-tertiary)' }}
            title={isRefreshing ? 'Refreshing...' : 'Refresh data'}
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => window.location.reload()}
            className="p-1.5 rounded-lg transition-all duration-200"
            style={{ color: 'var(--text-tertiary)' }}
            title="Full page reload"
          >
            <ReloadIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Section Header
function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{subtitle}</p>
      </div>
    </div>
  )
}

// Active Work Column
function ActiveWorkColumn({ projects, blockedProjects }: { projects: any[]; blockedProjects: any[] }) {
  const allProjects = [...projects, ...blockedProjects]

  if (allProjects.length === 0) {
    return (
      <EmptyState
        icon={<CheckIcon className="w-6 h-6" style={{ color: 'var(--success)' }} />}
        title="All clear"
        subtitle="No active projects right now"
      />
    )
  }

  return (
    <div className="space-y-3">
      {allProjects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}

// Project Card
function ProjectCard({ project }: { project: any }) {
  const isBlocked = project.status === 'blocked'

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block p-4 rounded-xl transition-all duration-300"
      style={{
        background: isBlocked ? 'var(--warning-muted)' : 'var(--bg-secondary)',
        border: `1px solid ${isBlocked ? 'rgba(201, 169, 89, 0.2)' : 'var(--border-subtle)'}`,
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase"
              style={{
                background: isBlocked ? 'rgba(201, 169, 89, 0.1)' : 'rgba(139, 115, 85, 0.08)',
                color: isBlocked ? 'var(--warning)' : 'var(--accent-primary)',
                border: `1px solid ${isBlocked ? 'rgba(201, 169, 89, 0.2)' : 'rgba(139, 115, 85, 0.15)'}`
              }}
            >
              {isBlocked ? 'Blocked' : 'In Progress'}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{project.priority}</span>
          </div>
          <h3 className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{project.name}</h3>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span style={{ color: 'var(--text-tertiary)' }}>Progress</span>
          <span style={{ color: isBlocked ? 'var(--warning)' : 'var(--accent-primary)' }}>{project.progress}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${project.progress}%`,
              background: isBlocked ? 'var(--warning)' : 'linear-gradient(90deg, var(--accent-primary), var(--accent-primary-light))'
            }}
          />
        </div>
      </div>

      {/* Blocker */}
      {project.blocker && (
        <div
          className="p-2.5 rounded-lg"
          style={{ background: 'var(--warning-muted)', border: '1px solid rgba(201, 169, 89, 0.15)' }}
        >
          <div className="flex items-start gap-2">
            <WarningIcon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
            <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{project.blocker}</p>
          </div>
        </div>
      )}

      {/* Assigned Agent */}
      {project.assignedQueen && (
        <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <AgentIcon className="w-3.5 h-3.5" />
          <span>{project.assignedQueen}</span>
        </div>
      )}
    </Link>
  )
}

// Queue Column
function QueueColumn({ items }: { items: any[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<QueueIcon className="w-6 h-6" style={{ color: 'var(--text-tertiary)' }} />}
        title="Queue empty"
        subtitle="No P1 items in the roadmap"
      />
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <QueueItem key={item.id} item={item} index={index + 1} />
      ))}

      <Link
        to="/projects"
        className="block text-center py-3 text-xs transition-colors"
        style={{ color: 'var(--text-tertiary)' }}
      >
        View full roadmap
      </Link>
    </div>
  )
}

// Queue Item
function QueueItem({ item, index }: { item: any; index: number }) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl transition-all duration-300"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}
    >
      <span
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium"
        style={{ background: 'var(--bg-muted)', color: 'var(--text-tertiary)' }}
      >
        {index}
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.feature}</h4>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{item.project}</p>
      </div>
      <span
        className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium"
        style={{
          background: item.priority === 'P1' ? 'var(--error-muted)' : 'var(--bg-muted)',
          color: item.priority === 'P1' ? 'var(--error)' : 'var(--text-tertiary)',
          border: `1px solid ${item.priority === 'P1' ? 'rgba(184, 122, 122, 0.2)' : 'var(--border-subtle)'}`
        }}
      >
        {item.priority}
      </span>
    </div>
  )
}

// System Health Column
function SystemHealthColumn({ health }: { health: any }) {
  const tokens = health?.tokens || { today: 0, cost: 0, budget: 20, budgetUsedPercent: 0, overBudget: false }
  const agents = health?.agents || { total: 0, active: 0, idle: 0, list: [] }

  return (
    <div className="space-y-4">
      {/* Token Usage */}
      <div
        className="p-4 rounded-xl"
        style={{
          background: tokens.overBudget ? 'var(--error-muted)' : 'var(--bg-secondary)',
          border: `1px solid ${tokens.overBudget ? 'rgba(184, 122, 122, 0.2)' : 'var(--border-subtle)'}`,
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Tokens Today</span>
          <span
            className="text-lg font-bold"
            style={{ color: tokens.overBudget ? 'var(--error)' : 'var(--accent-primary)' }}
          >
            ${tokens.cost.toFixed(2)}
          </span>
        </div>

        <div className="mb-2">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(tokens.budgetUsedPercent, 100)}%`,
                background: tokens.overBudget
                  ? 'var(--error)'
                  : tokens.budgetUsedPercent > 75
                  ? 'var(--warning)'
                  : 'linear-gradient(90deg, var(--accent-primary), var(--success))'
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span>{tokens.budgetUsedPercent}% used</span>
          <span>Budget: ${tokens.budget}/day</span>
        </div>
      </div>

      {/* Active Agents */}
      <div
        className="p-4 rounded-xl"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Active Agents</span>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{agents.active} of {agents.total}</span>
        </div>

        <div className="space-y-2">
          {agents.list.slice(0, 5).map((agent: any) => (
            <AgentRow key={agent.id} agent={agent} />
          ))}
        </div>

        <Link
          to="/roster"
          className="block text-center py-2 mt-3 text-xs transition-colors"
          style={{ color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-subtle)' }}
        >
          View all agents
        </Link>
      </div>
    </div>
  )
}

// Agent Row
function AgentRow({ agent }: { agent: any }) {
  const isActive = agent.status === 'active'

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg transition-all duration-200">
      <div className="relative">
        <span
          className="block w-2 h-2 rounded-full"
          style={{ background: isActive ? 'var(--warning)' : 'var(--success)' }}
        />
        {isActive && (
          <span
            className="absolute inset-0 w-2 h-2 rounded-full animate-ping opacity-75"
            style={{ background: 'var(--warning)' }}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{agent.name}</span>
        {agent.currentTask && (
          <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{agent.currentTask}</p>
        )}
      </div>
      <span className="text-xs" style={{ color: isActive ? 'var(--warning)' : 'var(--success)' }}>
        {isActive ? 'busy' : 'idle'}
      </span>
    </div>
  )
}

// Empty State
function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div
      className="p-8 rounded-xl text-center"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div
        className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
        style={{ background: 'var(--bg-muted)' }}
      >
        {icon}
      </div>
      <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{subtitle}</p>
    </div>
  )
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 rounded-xl" style={{ background: 'var(--bg-muted)' }} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="h-8 rounded-lg w-32" style={{ background: 'var(--bg-muted)' }} />
          <div className="h-40 rounded-xl" style={{ background: 'var(--bg-muted)' }} />
          <div className="h-40 rounded-xl" style={{ background: 'var(--bg-muted)' }} />
        </div>
        <div className="space-y-4">
          <div className="h-8 rounded-lg w-32" style={{ background: 'var(--bg-muted)' }} />
          <div className="h-16 rounded-xl" style={{ background: 'var(--bg-muted)' }} />
          <div className="h-16 rounded-xl" style={{ background: 'var(--bg-muted)' }} />
          <div className="h-16 rounded-xl" style={{ background: 'var(--bg-muted)' }} />
        </div>
        <div className="space-y-4">
          <div className="h-8 rounded-lg w-32" style={{ background: 'var(--bg-muted)' }} />
          <div className="h-32 rounded-xl" style={{ background: 'var(--bg-muted)' }} />
          <div className="h-48 rounded-xl" style={{ background: 'var(--bg-muted)' }} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-48 rounded-2xl" style={{ background: 'var(--bg-muted)' }} />
        <div className="h-48 rounded-2xl" style={{ background: 'var(--bg-muted)' }} />
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

function ReloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  )
}

function CheckIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function WarningIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
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

function QueueIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}
