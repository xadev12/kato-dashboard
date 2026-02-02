import { memo } from 'react'
import type { DashboardMeta } from '../types'

interface Props {
  meta: DashboardMeta | null
  lastUpdated: string
}

function formatLastUpdated(dateString: string): string {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffSecs < 10) return 'Just now'
  if (diffSecs < 60) return `${diffSecs}s ago`
  if (diffMins < 60) return `${diffMins}m ago`
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

interface StatItemProps {
  value: number | string
  label: string
  icon: string
  color: string
  delay?: number
}

const StatItem = memo(function StatItem({ value, label, icon, color, delay = 0 }: StatItemProps) {
  return (
    <div 
      className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] p-4 transition-all duration-300 hover:border-white/[0.1] group"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Subtle gradient on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
      
      <div className="relative z-10 flex items-center gap-4">
        {icon ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] text-2xl border border-white/[0.06] group-hover:scale-105 transition-transform duration-300">
            {icon}
          </div>
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.06] group-hover:scale-105 transition-transform duration-300">
            <div className="w-2 h-2 rounded-full bg-gray-600" />
          </div>
        )}
        <div>
          <div className="text-2xl font-bold text-white group-hover:text-white transition-colors">
            {value}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">
            {label}
          </div>
        </div>
      </div>
    </div>
  )
})

export const GlobalStatsPanel = memo(function GlobalStatsPanel({ meta, lastUpdated }: Props) {
  if (!meta) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-white/[0.05] rounded" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-white/[0.03] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  const completedToday = meta.completedProjects // This would be calculated from actual data
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          Overview
        </h2>
        <span className="text-xs text-gray-500 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Updated {formatLastUpdated(lastUpdated)}
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatItem 
          value={meta.totalProjects} 
          label="Total Projects" 
          icon=""
          color="from-violet-500/10 to-purple-500/5"
          delay={0}
        />
        <StatItem 
          value={meta.activeAgents} 
          label="Active Agents" 
          icon=""
          color="from-amber-500/10 to-orange-500/5"
          delay={50}
        />
        <StatItem 
          value={completedToday} 
          label="Completed Today" 
          icon=""
          color="from-emerald-500/10 to-teal-500/5"
          delay={100}
        />
        <StatItem 
          value={meta.queuedWorkers} 
          label="Queue Depth" 
          icon=""
          color="from-rose-500/10 to-pink-500/5"
          delay={150}
        />
      </div>
    </div>
  )
})
