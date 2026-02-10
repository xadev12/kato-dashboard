import { memo } from 'react'
import type { QueenAgent, AgentState } from '../types'

interface Props {
  agent: QueenAgent
}

const statusConfig: Record<AgentState, { color: string; bg: string; border: string; icon: string; label: string; pulse: boolean }> = {
  idle: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: '○',
    label: 'Idle',
    pulse: false
  },
  active: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    icon: '●',
    label: 'Active',
    pulse: true
  },
  blocked: {
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    icon: '◍',
    label: 'Blocked',
    pulse: true
  }
}

const queenInitials: Record<string, string> = {
  main: 'K',
  product: 'P',
  devops: 'D',
  business: 'B',
  brain: 'B'
}

const queenColors: Record<string, { gradient: string; glow: string; text: string }> = {
  main: {
    gradient: 'from-violet-500/20 to-purple-500/10',
    glow: 'group-hover:shadow-violet-500/10',
    text: 'text-violet-400'
  },
  product: {
    gradient: 'from-amber-500/20 to-orange-500/10',
    glow: 'group-hover:shadow-amber-500/10',
    text: 'text-amber-400'
  },
  devops: {
    gradient: 'from-emerald-500/20 to-teal-500/10',
    glow: 'group-hover:shadow-emerald-500/10',
    text: 'text-emerald-400'
  },
  business: {
    gradient: 'from-blue-500/20 to-cyan-500/10',
    glow: 'group-hover:shadow-blue-500/10',
    text: 'text-blue-400'
  },
  brain: {
    gradient: 'from-pink-500/20 to-rose-500/10',
    glow: 'group-hover:shadow-pink-500/10',
    text: 'text-pink-400'
  }
}

// Calculate active task count for an agent
function getAgentTaskCount(agent: QueenAgent): number {
  let count = agent.currentTask ? 1 : 0
  if (agent.subAgents) {
    count += agent.subAgents.filter(sa => sa.currentTask).length
  }
  return count
}

export const AgentStatusCard = memo(function AgentStatusCard({ agent }: Props) {
  const status = statusConfig[agent.status]
  const initial = queenInitials[agent.id] || 'A'
  const colors = queenColors[agent.id] || queenColors.main
  const stats = agent.stats
  const taskCount = getAgentTaskCount(agent)

  // Calculate time active if there's a task
  const timeActive = agent.taskStartedAt 
    ? getElapsedTime(agent.taskStartedAt)
    : null

  return (
    <div className={`group relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 transition-all duration-300 hover:border-[var(--border-medium)] hover:shadow-lg ${colors.glow}`}>
      {/* Background gradient on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
      
      <div className="relative z-10">
        {/* Header with icon and status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-muted)] text-sm font-semibold ${colors.text} border border-[var(--border-subtle)]`}>
              {initial}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[var(--text-primary)] text-sm">{agent.name}</h3>
                {taskCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${status.bg} ${status.color} border ${status.border}`}>
                    {taskCount} task{taskCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <span className="text-xs text-[var(--text-tertiary)] capitalize">{agent.id}</span>
            </div>
          </div>
          
          {/* Status badge */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${status.bg} ${status.border} border`}>
            <span className={`text-xs ${status.color} ${status.pulse ? 'animate-pulse' : ''}`}>{status.icon}</span>
            <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
          </div>
        </div>
        
        {/* Current task */}
        <div className="mt-3 mb-3">
          {agent.currentTask ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium">Current Task</span>
                {timeActive && (
                  <span className="text-[10px] text-amber-400">{timeActive}</span>
                )}
              </div>
              <p className="text-sm text-[var(--text-secondary)] truncate">{agent.currentTask}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
              <span className="text-xs">Waiting for assignment...</span>
            </div>
          )}
        </div>
        
        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[var(--border-subtle)]">
            <div className="text-center">
              <div className="text-sm font-bold text-[var(--text-primary)]">{stats.tasksCompleted}</div>
              <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">Done</div>
            </div>
            <div className="text-center border-x border-[var(--border-subtle)]">
              <div className="text-sm font-bold text-emerald-400">{stats.successRate}%</div>
              <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-amber-400">{stats.currentStreak}</div>
              <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">Streak</div>
            </div>
          </div>
        )}
        
        {/* Animated pulse for active agents */}
        {agent.status === 'active' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5">
            <div className="h-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent animate-pulse" />
          </div>
        )}
        
        {/* Blocked indicator */}
        {agent.status === 'blocked' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5">
            <div className="h-full bg-gradient-to-r from-transparent via-rose-500/50 to-transparent animate-pulse" />
          </div>
        )}
      </div>
    </div>
  )
})

// Helper to calculate elapsed time
function getElapsedTime(startedAt: string): string {
  const start = new Date(startedAt).getTime()
  const now = Date.now()
  const diffMs = now - start
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  return `${Math.floor(diffHours / 24)}d`
}
