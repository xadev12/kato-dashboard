import { memo } from 'react'
import type { QueenAgent, AgentState } from '../types'

interface Props {
  agent: QueenAgent
}

const statusConfig: Record<AgentState, { color: string; bg: string; border: string; icon: string; label: string }> = {
  idle: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: '●',
    label: 'Idle'
  },
  active: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    icon: '◐',
    label: 'Active'
  },
  blocked: {
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    icon: '●',
    label: 'Blocked'
  }
}

const queenIcons: Record<string, string> = {
  main: '👑',
  product: '📋',
  devops: '🔧',
  business: '💼'
}

const queenColors: Record<string, { gradient: string; glow: string }> = {
  main: {
    gradient: 'from-violet-500/20 to-purple-500/10',
    glow: 'group-hover:shadow-violet-500/10'
  },
  product: {
    gradient: 'from-amber-500/20 to-orange-500/10',
    glow: 'group-hover:shadow-amber-500/10'
  },
  devops: {
    gradient: 'from-emerald-500/20 to-teal-500/10',
    glow: 'group-hover:shadow-emerald-500/10'
  },
  business: {
    gradient: 'from-blue-500/20 to-cyan-500/10',
    glow: 'group-hover:shadow-blue-500/10'
  },
  brain: {
    gradient: 'from-pink-500/20 to-rose-500/10',
    glow: 'group-hover:shadow-pink-500/10'
  }
}

export const AgentStatusCard = memo(function AgentStatusCard({ agent }: Props) {
  const status = statusConfig[agent.status]
  const icon = queenIcons[agent.id] || '🤖'
  const colors = queenColors[agent.id] || queenColors.main
  const stats = agent.stats
  
  return (
    <div className={`group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] p-4 transition-all duration-300 hover:border-white/[0.1] hover:shadow-lg ${colors.glow}`}>
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
      
      <div className="relative z-10">
        {/* Header with icon and status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-xl border border-white/[0.06]">
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">{agent.name}</h3>
              <span className="text-xs text-gray-500 capitalize">{agent.id} Agent</span>
            </div>
          </div>
          
          {/* Status badge */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${status.bg} ${status.border} border`}>
            <span className={`text-xs ${status.color}`}>{status.icon}</span>
            <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
          </div>
        </div>
        
        {/* Current task */}
        <div className="mt-3 mb-3">
          {agent.currentTask ? (
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Current Task</span>
              <p className="text-sm text-gray-300 truncate">{agent.currentTask}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <span className="text-xs">Waiting for assignment...</span>
            </div>
          )}
        </div>
        
        {/* Stats Row - Trading Style */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.06]">
            <div className="text-center">
              <div className="text-sm font-bold text-white">{stats.tasksCompleted}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">Done</div>
            </div>
            <div className="text-center border-x border-white/[0.06]">
              <div className="text-sm font-bold text-emerald-400">{stats.successRate}%</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-amber-400">{stats.currentStreak}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">Streak</div>
            </div>
          </div>
        )}
        
        {/* Animated pulse for active agents */}
        {agent.status === 'active' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5">
            <div className="h-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent animate-pulse" />
          </div>
        )}
      </div>
    </div>
  )
})
