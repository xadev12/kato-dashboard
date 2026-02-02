import { memo, useMemo } from 'react'
import { useProjects, useAgents } from '../hooks/useProjects'
import type { BlockedItem } from '../types'

// Priority configuration matching existing patterns
const priorityConfig = {
  high: { 
    color: 'text-rose-400', 
    bg: 'bg-rose-500/10', 
    border: 'border-rose-500/20',
    bar: 'from-rose-500 to-rose-400',
    label: 'High'
  },
  medium: { 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/10', 
    border: 'border-amber-500/20',
    bar: 'from-amber-500 to-amber-400',
    label: 'Medium'
  },
  low: { 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/10', 
    border: 'border-emerald-500/20',
    bar: 'from-emerald-500 to-emerald-400',
    label: 'Low'
  }
}

const queenIcons: Record<string, string> = {
  main: '👑',
  product: '📋',
  devops: '🔧',
  business: '💼',
  brain: '🧠'
}

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

// Format token cost
function formatTokenCost(cost: number): string {
  if (cost >= 1000) return `${(cost / 1000).toFixed(1)}k`
  return cost.toString()
}

export function MyActions() {
  const { projects, loading: projectsLoading } = useProjects()
  const { queens, loading: agentsLoading } = useAgents()

  // Calculate blocked items from projects and agents
  const blockedItems = useMemo(() => {
    const items: BlockedItem[] = []
    
    // Find blocked tasks from projects
    projects.forEach(project => {
      if (project.tasks) {
        project.tasks.forEach(task => {
          // Task is blocked if status is stuck/queued and has blocker info
          if (task.status === 'queued' && task.blockerReason) {
            items.push({
              id: task.id,
              type: 'task',
              projectName: project.name,
              title: task.title,
              blockerDescription: task.blockerReason,
              actionRequired: task.actionRequired || 'Review and provide direction',
              estimatedTokenCost: task.estimatedTokenCost || 5000,
              priority: task.priority || 'medium',
              blockedSince: task.created_at || new Date().toISOString(),
              assignedQueen: project.assignedQueen
            })
          }
        })
      }
    })
    
    // Find blocked agents
    queens.forEach(agent => {
      if (agent.status === 'blocked') {
        items.push({
          id: `agent-${agent.id}`,
          type: 'agent',
          projectName: 'Agent Coordination',
          title: `${agent.name} is blocked`,
          blockerDescription: agent.currentTask ? `Stuck on: ${agent.currentTask}` : 'Waiting for direction',
          actionRequired: 'Review current task and provide next steps',
          estimatedTokenCost: 3000,
          priority: 'high',
          blockedSince: new Date().toISOString(),
          assignedQueen: agent.id
        })
      }
    })
    
    // Sort by priority (high first), then by blocked time
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return items.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return new Date(a.blockedSince).getTime() - new Date(b.blockedSince).getTime()
    })
  }, [projects, queens])

  // Calculate stats
  const stats = useMemo(() => {
    const totalCost = blockedItems.reduce((sum, item) => sum + item.estimatedTokenCost, 0)
    const highPriority = blockedItems.filter(i => i.priority === 'high').length
    const mediumPriority = blockedItems.filter(i => i.priority === 'medium').length
    const lowPriority = blockedItems.filter(i => i.priority === 'low').length
    return { totalCost, highPriority, mediumPriority, lowPriority }
  }, [blockedItems])

  const loading = projectsLoading || agentsLoading

  if (loading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">My Actions</h1>
            {blockedItems.length > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-medium border border-rose-500/20 animate-pulse">
                {blockedItems.length} blocked
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            Bottleneck surface area — items waiting on Xavier's input
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Blocked"
          value={blockedItems.length.toString()}
          icon="⚠️"
          color="rose"
        />
        <StatCard
          label="Est. Token Cost"
          value={`${formatTokenCost(stats.totalCost)} tokens`}
          icon="💎"
          color="violet"
        />
        <StatCard
          label="High Priority"
          value={stats.highPriority.toString()}
          icon="🔴"
          color="rose"
        />
        <StatCard
          label="Avg Resolution Time"
          value="~2h"
          icon="⏱️"
          color="amber"
        />
      </div>

      {/* Priority Distribution */}
      {blockedItems.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-[#111111] border border-white/[0.06] rounded-xl">
          <span className="text-sm text-gray-400">Priority distribution:</span>
          <div className="flex items-center gap-4">
            {stats.highPriority > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-sm text-rose-400 font-medium">{stats.highPriority} High</span>
              </div>
            )}
            {stats.mediumPriority > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-sm text-amber-400 font-medium">{stats.mediumPriority} Medium</span>
              </div>
            )}
            {stats.lowPriority > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm text-emerald-400 font-medium">{stats.lowPriority} Low</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Blocked Items List */}
      {blockedItems.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {blockedItems.map((item, index) => (
            <BlockedItemCard key={item.id} item={item} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}

// Stat Card Component
function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  const colorClasses: Record<string, { bg: string; text: string }> = {
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  }
  const colors = colorClasses[color] || colorClasses.violet

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] p-4 transition-all duration-200 hover:border-white/[0.1]">
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-0 transition-opacity duration-200 group-hover:opacity-100`} />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{icon}</span>
          <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">{label}</span>
        </div>
        <div className={`text-2xl font-bold ${colors.text}`}>{value}</div>
      </div>
    </div>
  )
}

// Blocked Item Card Component
const BlockedItemCard = memo(function BlockedItemCard({ item, index }: { item: BlockedItem; index: number }) {
  const priority = priorityConfig[item.priority]
  const queenIcon = item.assignedQueen ? queenIcons[item.assignedQueen] : null

  return (
    <div 
      className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] transition-all duration-300 hover:border-white/[0.1] hover:shadow-lg"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Priority indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${priority.bar}`} />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-500">{item.projectName}</span>
              <span className="text-gray-700">•</span>
              <span className={`px-2 py-0.5 rounded-md ${priority.bg} ${priority.color} ${priority.border} border text-[10px] font-medium uppercase tracking-wide`}>
                {priority.label}
              </span>
            </div>
            <h3 className="font-semibold text-white text-lg group-hover:text-violet-400 transition-colors">
              {item.title}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            {queenIcon && (
              <span className="px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-sm">
                {queenIcon}
              </span>
            )}
            <div className="text-right">
              <div className="text-sm font-medium text-violet-400">{formatTokenCost(item.estimatedTokenCost)} tokens</div>
              <div className="text-xs text-gray-500">est. cost</div>
            </div>
          </div>
        </div>

        {/* Blocker Description */}
        <div className="mb-4 p-3 bg-rose-500/5 border border-rose-500/10 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-rose-400 text-sm">⚠️</span>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Blocker</span>
              <p className="text-sm text-gray-300 mt-0.5">{item.blockerDescription}</p>
            </div>
          </div>
        </div>

        {/* Action Required */}
        <div className="mb-4 flex items-start gap-2">
          <span className="text-emerald-400 text-sm">✓</span>
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Action Required</span>
            <p className="text-sm text-gray-300 mt-0.5">{item.actionRequired}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Blocked {formatRelativeTime(item.blockedSince)}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {item.type === 'agent' ? 'Agent Issue' : 'Task Blocked'}
            </span>
          </div>
          
          <button className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all duration-150 shadow-sm hover:shadow-md">
            Resolve
          </button>
        </div>
      </div>
    </div>
  )
})

// Empty State
function EmptyState() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-16 text-center">
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-20 h-20 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
          <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">All Clear!</h3>
          <p className="text-sm text-gray-500">
            No blocked items waiting on your input. The system is running smoothly.
          </p>
        </div>
      </div>
    </div>
  )
}

// Loading State
function LoadingState() {
  return (
    <div className="space-y-6 pb-8">
      <div className="h-8 w-48 bg-white/[0.05] rounded animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-white/[0.03] border border-white/[0.06] rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 bg-white/[0.03] border border-white/[0.06] rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}
