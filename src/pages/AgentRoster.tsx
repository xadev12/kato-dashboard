import { memo, useState } from 'react'
import { ALL_QUEEN_AGENTS } from '../types'
import type { QueenAgent, SubAgent, AgentState } from '../types'

const statusConfig: Record<AgentState, { color: string; bg: string; border: string; label: string }> = {
  idle: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    label: 'Idle'
  },
  active: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    label: 'Active'
  },
  blocked: {
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    label: 'Blocked'
  }
}

const queenGradients: Record<string, string> = {
  violet: 'from-violet-500/20 to-purple-500/10 hover:from-violet-500/30 hover:to-purple-500/20',
  amber: 'from-amber-500/20 to-orange-500/10 hover:from-amber-500/30 hover:to-orange-500/20',
  emerald: 'from-emerald-500/20 to-teal-500/10 hover:from-emerald-500/30 hover:to-teal-500/20',
  blue: 'from-blue-500/20 to-cyan-500/10 hover:from-blue-500/30 hover:to-cyan-500/20',
  pink: 'from-pink-500/20 to-rose-500/10 hover:from-pink-500/30 hover:to-rose-500/20'
}

const queenBorderColors: Record<string, string> = {
  violet: 'group-hover:border-violet-500/30 group-hover:shadow-violet-500/10',
  amber: 'group-hover:border-amber-500/30 group-hover:shadow-amber-500/10',
  emerald: 'group-hover:border-emerald-500/30 group-hover:shadow-emerald-500/10',
  blue: 'group-hover:border-blue-500/30 group-hover:shadow-blue-500/10',
  pink: 'group-hover:border-pink-500/30 group-hover:shadow-pink-500/10'
}

export function AgentRoster() {
  const [selectedAgent, setSelectedAgent] = useState<QueenAgent | null>(null)
  const [spawnModalOpen, setSpawnModalOpen] = useState(false)
  const [selectedSubAgent, setSelectedSubAgent] = useState<SubAgent | null>(null)

  const handleSpawnClick = (agent: QueenAgent, subAgent: SubAgent) => {
    setSelectedAgent(agent)
    setSelectedSubAgent(subAgent)
    setSpawnModalOpen(true)
  }

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">Agent Roster</h1>
            <span className="px-2 py-1 rounded-lg bg-violet-500/10 text-violet-400 text-xs font-medium border border-violet-500/20">
              {ALL_QUEEN_AGENTS.length} Queens
            </span>
          </div>
          <p className="text-sm text-gray-400">
            Queen agents and their specialized sub-agent squads
          </p>
        </div>
      </div>

      {/* Queen Agents Grid */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-white">
          Queen Agents
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {ALL_QUEEN_AGENTS.map((agent) => (
            <QueenAgentCard 
              key={agent.id} 
              agent={agent} 
              onSpawnClick={handleSpawnClick}
            />
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/[0.06]">
        <SummaryStat
          label="Total Queens"
          value={ALL_QUEEN_AGENTS.length.toString()}
          icon=""
          color="violet"
        />
        <SummaryStat
          label="Active Sub-Agents"
          value={ALL_QUEEN_AGENTS.reduce((sum, a) => sum + a.subAgents.filter(s => s.status === 'active').length, 0).toString()}
          icon=""
          color="amber"
        />
        <SummaryStat
          label="Total Sub-Agents"
          value={ALL_QUEEN_AGENTS.reduce((sum, a) => sum + a.subAgents.length, 0).toString()}
          icon=""
          color="emerald"
        />
        <SummaryStat
          label="Total Spawned"
          value={ALL_QUEEN_AGENTS.reduce((sum, a) => sum + a.subAgents.reduce((s, sa) => s + sa.spawnedCount, 0), 0).toString()}
          icon=""
          color="blue"
        />
      </div>

      {/* Spawn Modal */}
      {spawnModalOpen && selectedAgent && selectedSubAgent && (
        <SpawnModal
          agent={selectedAgent}
          subAgent={selectedSubAgent}
          onClose={() => setSpawnModalOpen(false)}
        />
      )}
    </div>
  )
}

// Queen Agent Card Component
const QueenAgentCard = memo(function QueenAgentCard({ 
  agent, 
  onSpawnClick 
}: { 
  agent: QueenAgent
  onSpawnClick: (agent: QueenAgent, subAgent: SubAgent) => void 
}) {
  const status = statusConfig[agent.status]
  const gradient = queenGradients[agent.color] || queenGradients.violet
  const borderColor = queenBorderColors[agent.color] || queenBorderColors.violet
  const stats = agent.stats
  const memoryStats = agent.memoryStats

  return (
    <div className={`group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] transition-all duration-300 hover:border-white/[0.1] hover:shadow-lg ${borderColor}`}>
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
      
      <div className="relative z-10 p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] text-lg font-semibold text-gray-400 border border-white/[0.06] shadow-lg">
              {agent.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{agent.name}</h3>
              <span className="text-xs text-gray-500 capitalize">{agent.id} Agent</span>
            </div>
          </div>
          
          {/* Status badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${status.bg} ${status.border} border`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.color.replace('text-', 'bg-')}`} />
            <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-400 mb-4 leading-relaxed">
          {agent.description}
        </p>

        {/* Skills */}
        <div className="mb-4">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-2 block">Skills</span>
          <div className="flex flex-wrap gap-1.5">
            {agent.skills.map((skill) => (
              <span 
                key={skill}
                className="px-2 py-1 rounded-md bg-white/[0.05] text-gray-300 text-[10px] border border-white/[0.06]"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/[0.06] mb-4">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{stats.tasksCompleted}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">Done</div>
            </div>
            <div className="text-center border-x border-white/[0.06]">
              <div className="text-lg font-bold text-emerald-400">{stats.successRate}%</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-amber-400">{stats.currentStreak}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wide">Streak</div>
            </div>
          </div>
        )}

        {/* Memory Stats */}
        {memoryStats && (
          <div className="flex items-center justify-between text-xs text-gray-500 mb-4 p-2 bg-white/[0.03] rounded-lg">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {memoryStats.totalEntries} entries
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {memoryStats.activeContexts} contexts
            </span>
          </div>
        )}

        {/* Sub-Agents Section */}
        <div>
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-2 block">
            Sub-Agents ({agent.subAgents.length})
          </span>
          <div className="space-y-2">
            {agent.subAgents.map((subAgent) => (
              <SubAgentRow 
                key={subAgent.id} 
                subAgent={subAgent} 
                onSpawn={() => onSpawnClick(agent, subAgent)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})

// Sub-Agent Row Component
const SubAgentRow = memo(function SubAgentRow({ 
  subAgent, 
  onSpawn 
}: { 
  subAgent: SubAgent
  onSpawn: () => void 
}) {
  const status = statusConfig[subAgent.status]

  return (
    <div className="flex items-center gap-3 p-2.5 bg-white/[0.03] rounded-lg border border-white/[0.06] hover:border-white/[0.1] transition-all duration-200">
      <span className="text-sm font-medium text-gray-400 w-6">{subAgent.name.charAt(0)}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-200 truncate">{subAgent.name}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${status.color.replace('text-', 'bg-')}`} />
        </div>
        <span className="text-[10px] text-gray-500 truncate block">{subAgent.specialty}</span>
      </div>
      <div className="text-right">
        <div className="text-xs text-violet-400 font-medium">{subAgent.spawnCost >= 1000 ? `${(subAgent.spawnCost / 1000).toFixed(0)}k` : subAgent.spawnCost}</div>
        <div className="text-[10px] text-gray-500">tokens</div>
      </div>
      <button 
        onClick={onSpawn}
        className="px-3 py-1.5 rounded-md bg-violet-600/80 hover:bg-violet-600 text-white text-xs font-medium transition-all duration-150 hover:shadow-md"
      >
        Spawn
      </button>
    </div>
  )
})

// Spawn Modal Component
function SpawnModal({ 
  agent, 
  subAgent, 
  onClose 
}: { 
  agent: QueenAgent
  subAgent: SubAgent
  onClose: () => void 
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#111111] p-6 shadow-2xl animate-fade-in"
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
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-xl font-semibold text-violet-300 border border-violet-500/20">
            {subAgent.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Spawn {subAgent.name}</h3>
            <p className="text-sm text-gray-400">Deploy a new specialist instance</p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4 mb-6">
          <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Specialty</div>
            <div className="text-sm text-gray-200">{subAgent.specialty}</div>
          </div>
          
          <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Description</div>
            <div className="text-sm text-gray-200">{subAgent.description}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-violet-500/10 rounded-xl border border-violet-500/20">
              <div className="text-xs text-violet-400 uppercase tracking-wider mb-1">Spawn Cost</div>
              <div className="text-xl font-bold text-violet-300">{subAgent.spawnCost.toLocaleString()} tokens</div>
            </div>
            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <div className="text-xs text-emerald-400 uppercase tracking-wider mb-1">Times Spawned</div>
              <div className="text-xl font-bold text-emerald-300">{subAgent.spawnedCount}</div>
            </div>
          </div>

          <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Parent Agent</div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-400 w-6">{agent.name.charAt(0)}</span>
              <span className="text-sm text-gray-200">{agent.name}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/[0.05] text-gray-300 font-medium hover:bg-white/[0.1] transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-500 transition-colors shadow-lg shadow-violet-500/20"
          >
            Spawn Agent
          </button>
        </div>
      </div>
    </div>
  )
}

// Summary Stat Component
function SummaryStat({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  const colorClasses: Record<string, { bg: string; text: string }> = {
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
    pink: { bg: 'bg-pink-500/10', text: 'text-pink-400' },
  }
  const colors = colorClasses[color] || colorClasses.violet

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] p-4 transition-all duration-200 hover:border-white/[0.1]">
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-0 transition-opacity duration-200 group-hover:opacity-100`} />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          {icon && <span className="text-lg">{icon}</span>}
          <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">{label}</span>
        </div>
        <div className={`text-2xl font-bold ${colors.text}`}>{value}</div>
      </div>
    </div>
  )
}
