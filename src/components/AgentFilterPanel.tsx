import { memo, useState } from 'react'
import type { QueenAgent } from '../types'
import { AgentStatusCard } from './AgentStatusCard'

interface Props {
  agents: QueenAgent[]
}

// Hide these agents only on the Active tab
const ACTIVE_HIDDEN_AGENTS = ['kenji', 'fel', 'bel']

type FilterState = 'all' | 'active' | 'idle' | 'blocked'

export const AgentFilterPanel = memo(function AgentFilterPanel({ agents }: Props) {
  const [filter, setFilter] = useState<FilterState>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Count agents by status
  const counts = {
    all: agents.length,
    active: agents.filter(a => a.status === 'active' && !ACTIVE_HIDDEN_AGENTS.includes(a.id)).length,
    idle: agents.filter(a => a.status === 'idle').length,
    blocked: agents.filter(a => a.status === 'blocked').length
  }

  // Filter agents
  const filteredAgents = agents.filter(agent => {
    const matchesFilter = filter === 'all' || agent.status === filter
    const matchesSearch = searchQuery === '' || 
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.currentTask && agent.currentTask.toLowerCase().includes(searchQuery.toLowerCase()))
    const hiddenOnActive = filter === 'active' && ACTIVE_HIDDEN_AGENTS.includes(agent.id)
    return matchesFilter && matchesSearch && !hiddenOnActive
  })

  const tabs: { id: FilterState; label: string; color: string }[] = [
    { id: 'all', label: 'All', color: 'text-[var(--text-secondary)]' },
    { id: 'active', label: 'Active', color: 'text-amber-400' },
    { id: 'idle', label: 'Idle', color: 'text-emerald-400' },
    { id: 'blocked', label: 'Blocked', color: 'text-rose-400' }
  ]

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[var(--bg-muted)] rounded-xl border border-[var(--border-subtle)]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === tab.id
                ? 'bg-[var(--bg-muted)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-secondary)] hover:bg-white/[0.04]'
            }`}
          >
            <span className={filter === tab.id ? tab.color : ''}>{tab.label}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              filter === tab.id ? 'bg-white/[0.1]' : 'bg-[var(--bg-muted)]'
            }`}>
              {counts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search agents or tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] focus:bg-[var(--bg-muted)] transition-colors"
        />
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredAgents.map(agent => (
          <AgentStatusCard key={agent.id} agent={agent} />
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12 text-[var(--text-tertiary)]">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-sm">No agents match your filters</p>
        </div>
      )}
    </div>
  )
})
