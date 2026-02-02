import { useState, useMemo } from 'react'
import { ALL_QUEEN_AGENTS } from '../types'
import type { QueenAgent, MemoryEntry, Preference, ActiveProjectContext } from '../types'

// Sample memory data - in production this would come from an API
const generateSampleMemory = (agent: QueenAgent): {
  entries: MemoryEntry[]
  preferences: Preference[]
  activeProjects: ActiveProjectContext[]
} => {
  const entries: MemoryEntry[] = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: 'decision',
      content: `Opted for React Query over SWR for ${agent.name}'s data fetching due to better caching strategies`,
      tags: ['frontend', 'architecture', 'decision'],
      projectId: 'dashboard-v2'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      type: 'observation',
      content: 'User prefers detailed progress indicators over simple percentages',
      tags: ['ux', 'feedback', 'observation'],
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      type: 'lesson',
      content: 'Parallel task execution reduced total project time by 40%',
      tags: ['performance', 'optimization', 'lesson'],
      projectId: 'move-pwa'
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      type: 'preference',
      content: 'Consistent use of violet accent color for primary actions',
      tags: ['design', 'branding', 'preference'],
    },
  ]

  const preferences: Preference[] = [
    { id: '1', category: 'Code Style', value: 'Functional components with hooks', priority: 'high', lastUpdated: new Date(Date.now() - 86400000).toISOString() },
    { id: '2', category: 'UI Pattern', value: 'Glassmorphism with subtle borders', priority: 'high', lastUpdated: new Date(Date.now() - 172800000).toISOString() },
    { id: '3', category: 'Communication', value: 'Concise technical summaries', priority: 'medium', lastUpdated: new Date(Date.now() - 259200000).toISOString() },
    { id: '4', category: 'Error Handling', value: 'Graceful degradation with user feedback', priority: 'high', lastUpdated: new Date(Date.now() - 345600000).toISOString() },
  ]

  const activeProjects: ActiveProjectContext[] = [
    {
      projectId: 'kato-dashboard',
      projectName: 'Kato Dashboard',
      context: 'Multi-agent coordination dashboard with real-time updates',
      lastAccessed: new Date(Date.now() - 1800000).toISOString(),
      importance: 'high'
    },
    {
      projectId: 'move-pwa',
      projectName: 'Move PWA',
      context: 'Fitness tracking with Ring integration and Supabase backend',
      lastAccessed: new Date(Date.now() - 86400000).toISOString(),
      importance: 'medium'
    },
  ]

  return { entries, preferences, activeProjects }
}

const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  decision: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  observation: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  lesson: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  preference: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
}

const priorityConfig = {
  high: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  low: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
}

export function MemoryManager() {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(ALL_QUEEN_AGENTS[0].id)
  const [activeTab, setActiveTab] = useState<'entries' | 'preferences' | 'projects'>('entries')

  const selectedAgent = useMemo(() => 
    ALL_QUEEN_AGENTS.find(a => a.id === selectedAgentId) || ALL_QUEEN_AGENTS[0],
    [selectedAgentId]
  )

  const memory = useMemo(() => generateSampleMemory(selectedAgent), [selectedAgent])

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Memory Manager</h1>
          <p className="text-sm text-gray-400">
            Per-agent memory viewer and preference management
          </p>
        </div>
      </div>

      {/* Agent Selector */}
      <div className="p-4 bg-[#111111] border border-white/[0.06] rounded-xl">
        <span className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-3 block">Select Agent</span>
        <div className="flex flex-wrap gap-2">
          {ALL_QUEEN_AGENTS.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                selectedAgentId === agent.id
                  ? 'bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-500/20'
                  : 'bg-white/[0.03] text-gray-400 border-white/[0.06] hover:bg-white/[0.06] hover:text-gray-200'
              }`}
            >
              <span>{agent.emoji}</span>
              <span>{agent.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Agent Header */}
      <div className="flex items-center gap-4 p-4 bg-[#111111] border border-white/[0.06] rounded-xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.05] text-3xl border border-white/[0.06]">
          {selectedAgent.emoji}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">{selectedAgent.name}</h2>
          <p className="text-sm text-gray-400">{selectedAgent.description}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-violet-400">{selectedAgent.memoryStats?.totalEntries || 0}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Memory Entries</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-lg border border-white/[0.06] w-fit">
        <TabButton
          active={activeTab === 'entries'}
          onClick={() => setActiveTab('entries')}
          label="Recent Entries"
          count={memory.entries.length}
        />
        <TabButton
          active={activeTab === 'preferences'}
          onClick={() => setActiveTab('preferences')}
          label="Xavier's Preferences"
          count={memory.preferences.length}
        />
        <TabButton
          active={activeTab === 'projects'}
          onClick={() => setActiveTab('projects')}
          label="Active Projects"
          count={memory.activeProjects.length}
        />
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'entries' && (
          <MemoryEntriesTab entries={memory.entries} />
        )}
        {activeTab === 'preferences' && (
          <PreferencesTab preferences={memory.preferences} />
        )}
        {activeTab === 'projects' && (
          <ActiveProjectsTab projects={memory.activeProjects} />
        )}
      </div>
    </div>
  )
}

// Tab Button Component
function TabButton({ 
  active, 
  onClick, 
  label, 
  count 
}: { 
  active: boolean
  onClick: () => void
  label: string
  count: number 
}) {
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

// Memory Entries Tab
function MemoryEntriesTab({ entries }: { entries: MemoryEntry[] }) {
  const [selectedEntry, setSelectedEntry] = useState<MemoryEntry | null>(null)

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const colors = typeColors[entry.type]
        return (
          <div 
            key={entry.id}
            onClick={() => setSelectedEntry(entry)}
            className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] p-4 transition-all duration-200 hover:border-white/[0.1] cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className={`px-2 py-1 rounded-md ${colors.bg} ${colors.text} ${colors.border} border text-[10px] font-medium uppercase tracking-wide`}>
                {entry.type}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-200 mb-2">{entry.content}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{new Date(entry.timestamp).toLocaleString()}</span>
                  {entry.projectId && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      {entry.projectId}
                    </span>
                  )}
                </div>
                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {entry.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="px-2 py-0.5 rounded bg-white/[0.05] text-gray-400 text-[10px]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <svg className="w-5 h-5 text-gray-600 group-hover:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        )
      })}

      {entries.length === 0 && (
        <EmptyState message="No memory entries found" />
      )}

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <EntryDetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
    </div>
  )
}

// Preferences Tab
function PreferencesTab({ preferences }: { preferences: Preference[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {preferences.map((pref) => {
        const priority = priorityConfig[pref.priority]
        return (
          <div 
            key={pref.id}
            className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] p-4 transition-all duration-200 hover:border-white/[0.1]"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">{pref.category}</span>
              <span className={`px-2 py-0.5 rounded ${priority.bg} ${priority.color} ${priority.border} border text-[10px] font-medium`}>
                {pref.priority}
              </span>
            </div>
            <p className="text-sm text-gray-200 mb-3">{pref.value}</p>
            <div className="text-xs text-gray-500">
              Last updated: {new Date(pref.lastUpdated).toLocaleDateString()}
            </div>
          </div>
        )
      })}

      {preferences.length === 0 && (
        <div className="col-span-full">
          <EmptyState message="No preferences recorded" />
        </div>
      )}
    </div>
  )
}

// Active Projects Tab
function ActiveProjectsTab({ projects }: { projects: ActiveProjectContext[] }) {
  const importanceConfig = {
    high: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', bar: 'from-rose-500 to-rose-400' },
    medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', bar: 'from-amber-500 to-amber-400' },
    low: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', bar: 'from-emerald-500 to-emerald-400' },
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => {
        const importance = importanceConfig[project.importance]
        return (
          <div 
            key={project.projectId}
            className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] p-5 transition-all duration-200 hover:border-white/[0.1]"
          >
            {/* Importance indicator bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${importance.bar}`} />
            
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-white text-lg">{project.projectName}</h3>
              <span className={`px-2 py-0.5 rounded ${importance.bg} ${importance.color} ${importance.border} border text-[10px] font-medium uppercase`}>
                {project.importance} priority
              </span>
            </div>
            
            <p className="text-sm text-gray-400 mb-4">{project.context}</p>
            
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Last accessed: {new Date(project.lastAccessed).toLocaleString()}
              </span>
            </div>
          </div>
        )
      })}

      {projects.length === 0 && (
        <EmptyState message="No active projects" />
      )}
    </div>
  )
}

// Entry Detail Modal
function EntryDetailModal({ entry, onClose }: { entry: MemoryEntry; onClose: () => void }) {
  const colors = typeColors[entry.type]

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
        <div className={`inline-block px-3 py-1 rounded-lg ${colors.bg} ${colors.text} ${colors.border} border text-xs font-medium uppercase tracking-wide mb-4`}>
          {entry.type}
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-lg text-gray-200 leading-relaxed">{entry.content}</p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.06]">
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Timestamp</span>
              <span className="text-sm text-gray-300">{new Date(entry.timestamp).toLocaleString()}</span>
            </div>
            {entry.projectId && (
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Project</span>
                <span className="text-sm text-gray-300">{entry.projectId}</span>
              </div>
            )}
          </div>

          {entry.tags.length > 0 && (
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Tags</span>
              <div className="flex flex-wrap gap-2">
                {entry.tags.map((tag) => (
                  <span 
                    key={tag}
                    className="px-3 py-1 rounded-lg bg-white/[0.05] text-gray-300 text-sm border border-white/[0.06]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-white/[0.06]">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-500 transition-colors"
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
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-12 text-center">
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
