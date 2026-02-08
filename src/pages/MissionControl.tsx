import { useDashboardData } from '../hooks/useDashboardData'
import { Link } from 'react-router-dom'

export function MissionControl() {
  const {
    loading,
    sprint,
    activeProjects,
    blockedProjects,
    queue,
    systemHealth,
    lastUpdatedAgo,
    activeCount,
    blockedCount,
    refresh
  } = useDashboardData()

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header Bar */}
      <Header
        sprint={sprint}
        activeCount={activeCount}
        blockedCount={blockedCount}
        lastUpdated={lastUpdatedAgo}
        onRefresh={refresh}
      />

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Active Work */}
        <div className="space-y-4">
          <SectionHeader title="Active Work" subtitle="What's happening now" />
          <ActiveWorkColumn projects={activeProjects} blockedProjects={blockedProjects} />
        </div>

        {/* CENTER: Queue */}
        <div className="space-y-4">
          <SectionHeader title="Queue" subtitle="What's next" />
          <QueueColumn items={queue} />
        </div>

        {/* RIGHT: System Health */}
        <div className="space-y-4">
          <SectionHeader title="System Health" subtitle="What it's costing" />
          <SystemHealthColumn health={systemHealth} />
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
  onRefresh
}: {
  sprint: any
  activeCount: number
  blockedCount: number
  lastUpdated: string
  onRefresh: () => void
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/[0.06]">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">KATO DASHBOARD</h1>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-xs font-medium border border-cyan-500/20">
            v3
          </span>
        </div>
        {sprint && (
          <p className="text-sm text-gray-400">
            {sprint.name}: <span className="text-cyan-400 font-medium">Day {sprint.day}</span> of {sprint.totalDays}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Quick Stats */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] rounded-lg border border-white/[0.06]">
          <span className="text-xs text-gray-400">Active:</span>
          <span className="text-sm font-semibold text-cyan-400">{activeCount}</span>
        </div>
        {blockedCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <span className="text-xs text-amber-400">Blocked:</span>
            <span className="text-sm font-semibold text-amber-400">{blockedCount}</span>
          </div>
        )}

        {/* Last Updated */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Updated {lastUpdated}</span>
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
            title="Refresh"
          >
            <RefreshIcon className="w-3.5 h-3.5" />
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
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-xs text-gray-500">{subtitle}</p>
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
        icon={<CheckIcon className="w-6 h-6 text-emerald-400" />}
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
      className={`block p-4 rounded-xl border transition-all duration-200 hover:border-white/[0.15] ${
        isBlocked
          ? 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10'
          : 'bg-[#111111] border-white/[0.06] hover:bg-white/[0.03]'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${
              isBlocked
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
            }`}>
              {isBlocked ? 'Blocked' : 'In Progress'}
            </span>
            <span className="text-[10px] text-gray-500">{project.priority}</span>
          </div>
          <h3 className="font-medium text-white truncate">{project.name}</h3>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-500">Progress</span>
          <span className={isBlocked ? 'text-amber-400' : 'text-cyan-400'}>{project.progress}%</span>
        </div>
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isBlocked ? 'bg-amber-500' : 'bg-gradient-to-r from-cyan-500 to-cyan-400'
            }`}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Blocker */}
      {project.blocker && (
        <div className="p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/10">
          <div className="flex items-start gap-2">
            <WarningIcon className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200 line-clamp-2">{project.blocker}</p>
          </div>
        </div>
      )}

      {/* Assigned Agent */}
      {project.assignedQueen && (
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
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
        icon={<QueueIcon className="w-6 h-6 text-gray-400" />}
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
        className="block text-center py-3 text-xs text-gray-500 hover:text-cyan-400 transition-colors"
      >
        View full roadmap
      </Link>
    </div>
  )
}

// Queue Item
function QueueItem({ item, index }: { item: any; index: number }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-[#111111] border border-white/[0.06] hover:border-white/[0.1] transition-all">
      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white/[0.05] text-xs text-gray-400 font-medium">
        {index}
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-200 truncate">{item.feature}</h4>
        <p className="text-xs text-gray-500">{item.project}</p>
      </div>
      <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${
        item.priority === 'P1'
          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
      }`}>
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
      <div className={`p-4 rounded-xl border ${
        tokens.overBudget
          ? 'bg-rose-500/5 border-rose-500/20'
          : 'bg-[#111111] border-white/[0.06]'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-white">Tokens Today</span>
          <span className={`text-lg font-bold ${tokens.overBudget ? 'text-rose-400' : 'text-cyan-400'}`}>
            ${tokens.cost.toFixed(2)}
          </span>
        </div>

        <div className="mb-2">
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                tokens.overBudget
                  ? 'bg-rose-500'
                  : tokens.budgetUsedPercent > 75
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
              }`}
              style={{ width: `${Math.min(tokens.budgetUsedPercent, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{tokens.budgetUsedPercent}% used</span>
          <span>Budget: ${tokens.budget}/day</span>
        </div>
      </div>

      {/* Active Agents */}
      <div className="p-4 rounded-xl bg-[#111111] border border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-white">Active Agents</span>
          <span className="text-xs text-gray-500">{agents.active} of {agents.total}</span>
        </div>

        <div className="space-y-2">
          {agents.list.slice(0, 5).map((agent: any) => (
            <AgentRow key={agent.id} agent={agent} />
          ))}
        </div>

        <Link
          to="/roster"
          className="block text-center py-2 mt-3 text-xs text-gray-500 hover:text-cyan-400 transition-colors border-t border-white/[0.06]"
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
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
      <div className="relative">
        <span className={`w-2 h-2 rounded-full ${
          isActive ? 'bg-amber-400' : 'bg-emerald-400'
        }`} />
        {isActive && (
          <span className="absolute inset-0 w-2 h-2 rounded-full bg-amber-400 animate-ping opacity-75" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-gray-200">{agent.name}</span>
        {agent.currentTask && (
          <p className="text-xs text-gray-500 truncate">{agent.currentTask}</p>
        )}
      </div>
      <span className={`text-xs ${isActive ? 'text-amber-400' : 'text-emerald-400'}`}>
        {isActive ? 'busy' : 'idle'}
      </span>
    </div>
  )
}

// Empty State
function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="p-8 rounded-xl bg-[#111111] border border-white/[0.06] text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/[0.05] flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-white mb-1">{title}</h3>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  )
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 bg-white/[0.03] rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="h-8 bg-white/[0.03] rounded-lg w-32" />
          <div className="h-40 bg-white/[0.03] rounded-xl" />
          <div className="h-40 bg-white/[0.03] rounded-xl" />
        </div>
        <div className="space-y-4">
          <div className="h-8 bg-white/[0.03] rounded-lg w-32" />
          <div className="h-16 bg-white/[0.03] rounded-xl" />
          <div className="h-16 bg-white/[0.03] rounded-xl" />
          <div className="h-16 bg-white/[0.03] rounded-xl" />
        </div>
        <div className="space-y-4">
          <div className="h-8 bg-white/[0.03] rounded-lg w-32" />
          <div className="h-32 bg-white/[0.03] rounded-xl" />
          <div className="h-48 bg-white/[0.03] rounded-xl" />
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
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

function AgentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  )
}

function QueueIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}
