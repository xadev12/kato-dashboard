import { memo } from 'react'
import type { Workers, WorkerItem } from '../types'

interface Props {
  workers: Workers
}

const specialistIcons: Record<string, string> = {
  'Frontend': '🎨',
  'Backend': '⚙️',
  'DevOps': '🚀',
  'Design': '✨',
  'QA': '🔍',
  'Data': '📊',
  'ML': '🧠',
  'Security': '🔒',
  'Default': '🔧'
}

function getSpecialistIcon(specialist: string): string {
  const key = Object.keys(specialistIcons).find(k => 
    specialist.toLowerCase().includes(k.toLowerCase())
  )
  return key ? specialistIcons[key] : specialistIcons.Default
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString()
}

const WorkerItemRow = memo(function WorkerItemRow({ worker, isActive }: { worker: WorkerItem; isActive?: boolean }) {
  const icon = getSpecialistIcon(worker.specialist)
  
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
      isActive 
        ? 'bg-emerald-500/5 border-emerald-500/20' 
        : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]'
    }`}>
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
        isActive ? 'bg-emerald-500/10' : 'bg-white/[0.05]'
      }`}>
        {icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{worker.specialist}</span>
          {isActive && (
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </div>
        <span className="text-xs text-gray-500 truncate block">{worker.taskId}</span>
      </div>
      
      <span className="text-xs text-gray-600 tabular-nums">
        {formatTimeAgo(worker.queuedAt)}
      </span>
    </div>
  )
})

export const WorkerQueuePanel = memo(function WorkerQueuePanel({ workers }: Props) {
  const totalWorkers = workers.active.length + workers.queue.length + workers.recent.length

  if (totalWorkers === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📋</span>
          <h3 className="font-semibold text-white">Worker Queue</h3>
          <span className="ml-auto text-xs text-gray-500">Empty</span>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No workers in queue</p>
          <p className="text-xs mt-1">All tasks are being handled</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <h3 className="font-semibold text-white">Worker Queue</h3>
        </div>
        <div className="flex items-center gap-2">
          {workers.active.length > 0 && (
            <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
              {workers.active.length} Active
            </span>
          )}
          {workers.queue.length > 0 && (
            <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
              {workers.queue.length} Queued
            </span>
          )}
          {workers.recent.length > 0 && (
            <span className="px-2 py-1 rounded-md bg-gray-500/10 text-gray-400 text-xs font-medium border border-gray-500/20">
              {workers.recent.length} Recent
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        {/* Active workers */}
        {workers.active.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Active</span>
            {workers.active.map((worker, idx) => (
              <WorkerItemRow key={`active-${idx}`} worker={worker} isActive />
            ))}
          </div>
        )}
        
        {/* Queued workers */}
        {workers.queue.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Queued</span>
            {workers.queue.map((worker, idx) => (
              <WorkerItemRow key={`queue-${idx}`} worker={worker} />
            ))}
          </div>
        )}
        
        {/* Recent (completed) workers */}
        {workers.recent.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Recent</span>
            {workers.recent.map((worker, idx) => (
              <WorkerItemRow key={`recent-${idx}`} worker={worker} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
})
