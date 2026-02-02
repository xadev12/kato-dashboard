import { useState, useMemo } from 'react'
import { useMemory } from '../hooks/useProjects'
import type { MemoryUpdate } from '../types'

const typeConfig: Record<string, { bg: string; text: string; border: string; icon: string; label: string }> = {
  self_review: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', icon: ' review', label: 'Self-Review' },
  daily_log: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', icon: ' log', label: 'Daily Log' },
  preference: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', icon: ' pref', label: 'Preference' },
  lesson: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: ' lesson', label: 'Lesson' },
  decision: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: ' decision', label: 'Decision' }
}

const agentNames: Record<string, string> = {
  main: 'Kato',
  product: 'Product Owner',
  devops: 'DevOps Engineer',
  business: 'Business Strategist',
  brain: 'Second Brain Keeper'
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function MemoryManager() {
  const { updates, stats, loading } = useMemory()
  const [activeTab, setActiveTab] = useState<'all' | 'self_review' | 'daily_log' | 'lessons'>('all')
  const [selectedEntry, setSelectedEntry] = useState<MemoryUpdate | null>(null)

  // Filter updates based on tab
  const filteredUpdates = useMemo(() => {
    if (activeTab === 'all') return updates
    if (activeTab === 'lessons') return updates.filter(u => u.type === 'lesson' || u.type === 'preference')
    return updates.filter(u => u.type === activeTab)
  }, [updates, activeTab])

  // Count by type
  const counts = useMemo(() => ({
    all: updates.length,
    self_review: updates.filter(u => u.type === 'self_review').length,
    daily_log: updates.filter(u => u.type === 'daily_log').length,
    lessons: updates.filter(u => u.type === 'lesson' || u.type === 'preference').length
  }), [updates])

  if (loading) {
    return <LoadingState />
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Memory</h1>
          <p className="text-sm text-gray-400">
            Recent memory updates, self-review entries, and daily logs from all agents
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg">
          <span className="text-xs font-medium text-violet-400">{stats.selfReviewEntries + stats.dailyLogEntries} entries</span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Entries" value={(stats.selfReviewEntries + stats.dailyLogEntries).toString()} color="violet" />
        <StatCard label="Self-Reviews" value={stats.selfReviewEntries.toString()} color="rose" />
        <StatCard label="Daily Logs" value={stats.dailyLogEntries.toString()} color="blue" />
        <StatCard label="Last Updated" value={formatRelativeTime(stats.lastUpdated)} color="amber" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-lg border border-white/[0.06] w-fit">
        <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')} label="All" count={counts.all} />
        <TabButton active={activeTab === 'self_review'} onClick={() => setActiveTab('self_review')} label="Self-Reviews" count={counts.self_review} />
        <TabButton active={activeTab === 'daily_log'} onClick={() => setActiveTab('daily_log')} label="Daily Logs" count={counts.daily_log} />
        <TabButton active={activeTab === 'lessons'} onClick={() => setActiveTab('lessons')} label="Lessons" count={counts.lessons} />
      </div>

      {/* Memory Entries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredUpdates.map((entry) => {
          const config = typeConfig[entry.type] || typeConfig.lesson
          return (
            <div 
              key={entry.id}
              onClick={() => setSelectedEntry(entry)}
              className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] p-5 transition-all duration-200 hover:border-white/[0.1] cursor-pointer"
            >
              {/* Type indicator bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.text.replace('text-', 'from-').replace('400', '500')} to-transparent`} />
              
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-md ${config.bg} ${config.text} ${config.border} border text-[10px] font-medium uppercase tracking-wide`}>
                      {config.label}
                    </span>
                    <span className="text-xs text-gray-500">{agentNames[entry.agentId] || entry.agentId}</span>
                  </div>
                  <h3 className="font-medium text-white mb-2 group-hover:text-violet-400 transition-colors">
                    {entry.title}
                  </h3>
                  <p className="text-sm text-gray-400 line-clamp-2">{entry.content}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
                <span className="text-xs text-gray-500">{formatRelativeTime(entry.timestamp)}</span>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          )
        })}
      </div>

      {filteredUpdates.length === 0 && (
        <EmptyState message="No memory entries found for this filter" />
      )}

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <EntryDetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  )
}

// Tab Button Component
function TabButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/20'
          : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]'
      }`}
    >
      {label} <span className="opacity-60">·</span> {count}
    </button>
  )
}

// Stat Card Component
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClasses: Record<string, string> = {
    violet: 'text-violet-400',
    rose: 'text-rose-400',
    blue: 'text-blue-400',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400'
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-4 text-center">
      <div className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</div>
      <div className="text-xs uppercase tracking-wider text-gray-500 font-medium mt-1">{label}</div>
    </div>
  )
}

// Entry Detail Modal
function EntryDetailModal({ entry, onClose }: { entry: MemoryUpdate; onClose: () => void }) {
  const config = typeConfig[entry.type] || typeConfig.lesson

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#111111] p-6 shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.05] text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-3 py-1 rounded-lg ${config.bg} ${config.text} ${config.border} border text-xs font-medium uppercase tracking-wide`}>
            {config.label}
          </span>
          <span className="text-xs text-gray-500">{agentNames[entry.agentId] || entry.agentId}</span>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-white mb-4">{entry.title}</h2>

        {/* Content */}
        <div className="prose prose-invert prose-sm max-w-none">
          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.06]">
          <span className="text-sm text-gray-500">{new Date(entry.timestamp).toLocaleString()}</span>
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// Empty State Component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-12 text-center col-span-full">
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 mx-auto bg-white/[0.03] rounded-full flex items-center justify-center border border-white/[0.06]">
          <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-gray-500">{message}</p>
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
          <div key={i} className="h-20 bg-white/[0.03] border border-white/[0.06] rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 bg-white/[0.03] border border-white/[0.06] rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}
