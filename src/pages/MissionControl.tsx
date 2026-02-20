import { useDashboardData } from '../hooks/useDashboardData'
import { Link } from 'react-router-dom'

export function MissionControl() {
  const {
    loading,
    refreshing,
    sprint,
    activeProjects,
    blockedProjects,
    queue,
    systemHealth,
    lastUpdatedAgo,
    activeCount,
    blockedCount,
    refresh,
    // Raw data for fallback
    data
  } = useDashboardData()

  if (loading) {
    return <LoadingSkeleton />
  }

  // Get projects from raw data as fallback
  const rawProjects = data?.projects || []
  const inProgressProjects = rawProjects.filter((p: any) => p.status === 'in_progress' || p.status === 'blocked')
  const displayProjects = activeProjects.length > 0 ? activeProjects : inProgressProjects.slice(0, 5)

  // Get queue from roadmap backlog (cast to any for legacy data structure)
  const rawData = data as any
  const roadmapBacklog = rawData?.roadmap?.backlog?.slice(0, 5) || []
  const displayQueue = queue.length > 0 ? queue : roadmapBacklog.map((b: any) => ({
    id: b.id,
    feature: b.feature,
    project: b.project,
    priority: b.priority
  }))

  // Get sprint info from roadmap
  const sprintInfo = sprint || rawData?.roadmap?.sprint

  return (
    <div className="space-y-6 animate-fade-in pb-8 min-w-0 overflow-x-hidden">
      {/* Header Bar */}
      <Header
        sprint={sprintInfo}
        activeCount={activeCount || displayProjects.length}
        blockedCount={blockedCount || blockedProjects.length}
        lastUpdated={lastUpdatedAgo}
        isRefreshing={refreshing}
        onRefresh={refresh}
      />

      {/* Single Row: Active Work | Queue | System Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Active Work */}
        <div className="space-y-3 min-w-0">
          <SectionHeader title="Active" count={displayProjects.length} />
          <ActiveWorkColumn projects={displayProjects} blockedProjects={blockedProjects} />
        </div>

        {/* CENTER: Queue */}
        <div className="space-y-3 min-w-0">
          <SectionHeader title="Queue" count={displayQueue.length} />
          <QueueColumn items={displayQueue} />
        </div>

        {/* RIGHT: System Health */}
        <div className="space-y-3 min-w-0">
          <SectionHeader title="System" />
          <SystemHealthColumn health={systemHealth} agents={data?.agents?.queens} tokens={data?.meta?.tokenStats?.today} />
        </div>
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
  isRefreshing,
  onRefresh
}: {
  sprint: any
  activeCount: number
  blockedCount: number
  lastUpdated: string
  isRefreshing: boolean
  onRefresh: () => void
}) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Dashboard
        </h1>
        {sprint && (
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {sprint.name} · Day {sprint.day || '?'}/{sprint.totalDays || 60}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg text-sm" style={{ background: 'var(--bg-tertiary)' }}>
          <span style={{ color: 'var(--accent-primary)' }}>{activeCount} active</span>
          {blockedCount > 0 && (
            <span style={{ color: 'var(--warning)' }}>· {blockedCount} blocked</span>
          )}
        </div>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{lastUpdated}</span>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-lg transition-all duration-200"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <RefreshIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  )
}

// Section Header
function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
        {title}
      </h2>
      {count !== undefined && (
        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
          {count}
        </span>
      )}
    </div>
  )
}

// Active Work Column
function ActiveWorkColumn({ projects, blockedProjects }: { projects: any[]; blockedProjects: any[] }) {
  const allProjects = [...projects, ...(blockedProjects || [])].slice(0, 6)

  if (allProjects.length === 0) {
    return (
      <EmptyState
        icon={<CheckIcon className="w-5 h-5" style={{ color: 'var(--success)' }} />}
        title="All clear"
        subtitle="No active projects"
      />
    )
  }

  return (
    <div className="space-y-2">
      {allProjects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}

// Project Card
function ProjectCard({ project }: { project: any }) {
  const isBlocked = project.status === 'blocked'
  const progress = project.progress || 0

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block p-3 rounded-lg transition-all duration-200 hover:opacity-80"
      style={{
        background: isBlocked ? 'var(--warning-muted)' : 'var(--bg-secondary)',
        border: `1px solid ${isBlocked ? 'rgba(201, 169, 89, 0.2)' : 'var(--border-subtle)'}`
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase"
          style={{
            background: isBlocked ? 'rgba(201, 169, 89, 0.1)' : 'rgba(139, 115, 85, 0.08)',
            color: isBlocked ? 'var(--warning)' : 'var(--accent-primary)'
          }}
        >
          {isBlocked ? 'Blocked' : project.currentStage || 'In Progress'}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{project.priority}</span>
      </div>

      <h3 className="text-sm font-medium truncate mb-2" style={{ color: 'var(--text-primary)' }}>
        {project.name}
      </h3>

      {/* Compact Progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: isBlocked ? 'var(--warning)' : 'var(--accent-primary)'
            }}
          />
        </div>
        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{progress}%</span>
      </div>

      {/* Blocker hint */}
      {project.blocker && (
        <p className="mt-2 text-[10px] line-clamp-1" style={{ color: 'var(--warning)' }}>
          {project.blocker}
        </p>
      )}
    </Link>
  )
}

// Queue Column
function QueueColumn({ items }: { items: any[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<QueueIcon className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />}
        title="Queue empty"
        subtitle="No items in queue"
      />
    )
  }

  return (
    <div className="space-y-2">
      {items.slice(0, 6).map((item, index) => (
        <QueueItem key={item.id} item={item} index={index + 1} />
      ))}
    </div>
  )
}

// Queue Item
function QueueItem({ item, index }: { item: any; index: number }) {
  return (
    <div
      className="flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
    >
      <span
        className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-medium"
        style={{ background: 'var(--bg-muted)', color: 'var(--text-tertiary)' }}
      >
        {index}
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{item.feature || item.name}</h4>
        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{item.project}</p>
      </div>
      <span
        className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium"
        style={{
          background: item.priority === 'P1' ? 'var(--error-muted)' : 'var(--bg-muted)',
          color: item.priority === 'P1' ? 'var(--error)' : 'var(--text-tertiary)'
        }}
      >
        {item.priority}
      </span>
    </div>
  )
}

// System Health Column
function SystemHealthColumn({ health, agents, tokens }: { health: any; agents?: any[]; tokens?: any }) {
  const tokenData = health?.tokens || { today: 0, cost: 0, budget: 20, budgetUsedPercent: 0, overBudget: false }
  const agentData = health?.agents || { total: agents?.length || 0, active: 0, idle: 0, list: agents || [] }

  // Calculate cost from tokens if needed
  const cost = tokenData.cost || (tokens?.cost > 0 ? tokens.cost : (tokens?.tokensUsed || 0) / 1000000 * 3)
  const budgetUsed = Math.min(Math.round((cost / 20) * 100), 100)

  return (
    <div className="space-y-3">
      {/* Token Usage */}
      <div
        className="p-3 rounded-lg"
        style={{
          background: budgetUsed > 90 ? 'var(--error-muted)' : 'var(--bg-secondary)',
          border: `1px solid ${budgetUsed > 90 ? 'rgba(184, 122, 122, 0.2)' : 'var(--border-subtle)'}`
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Cost Today</span>
          <span className="text-sm font-semibold" style={{ color: budgetUsed > 90 ? 'var(--error)' : 'var(--accent-primary)' }}>
            ${cost.toFixed(2)}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${budgetUsed}%`,
              background: budgetUsed > 90 ? 'var(--error)' : budgetUsed > 70 ? 'var(--warning)' : 'var(--success)'
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
          <span>{budgetUsed}% of $20</span>
          <span>{tokens?.requests || 0} requests</span>
        </div>
      </div>

      {/* Agents */}
      <div
        className="p-3 rounded-lg"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Agents</span>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {agentData.list.filter((a: any) => a.status === 'active').length} active
          </span>
        </div>
        <div className="space-y-1">
          {agentData.list.slice(0, 5).map((agent: any) => (
            <div key={agent.id} className="flex items-center gap-2 py-1">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: agent.status === 'active' ? 'var(--warning)' : 'var(--success)' }}
              />
              <span className="text-xs flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
                {agent.emoji} {agent.name}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                {agent.status === 'active' ? 'busy' : 'idle'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Project Stats */}
      <div
        className="p-3 rounded-lg"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-semibold" style={{ color: 'var(--accent-primary)' }}>
              {tokens?.projects?.length || 0}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Projects</div>
          </div>
          <div>
            <div className="text-lg font-semibold" style={{ color: 'var(--success)' }}>
              {tokens?.completedProjects || 0}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Done</div>
          </div>
          <div>
            <div className="text-lg font-semibold" style={{ color: 'var(--warning)' }}>
              {tokens?.blockedProjects || 0}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Blocked</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// (AgentRow removed - inlined into SystemHealthColumn)

// Empty State
function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div
      className="p-6 rounded-lg text-center"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-muted)' }}>
        {icon}
      </div>
      <h3 className="text-sm font-medium mb-0.5" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{subtitle}</p>
    </div>
  )
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-12 rounded-lg" style={{ background: 'var(--bg-muted)' }} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-3">
            <div className="h-6 rounded w-24" style={{ background: 'var(--bg-muted)' }} />
            <div className="h-24 rounded-lg" style={{ background: 'var(--bg-muted)' }} />
            <div className="h-24 rounded-lg" style={{ background: 'var(--bg-muted)' }} />
          </div>
        ))}
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

function CheckIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
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
