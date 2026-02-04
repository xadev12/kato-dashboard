import { memo, useState, useMemo } from 'react'
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

// Mock recent activity data
const RECENT_ACTIVITY: Record<string, Array<{ task: string; time: string; status: 'completed' | 'in_progress' | 'failed' }>> = {
  main: [
    { task: 'Dashboard v3 redesign', time: '2h ago', status: 'in_progress' },
    { task: 'Pipeline optimization', time: '5h ago', status: 'completed' },
    { task: 'Memory system upgrade', time: '1d ago', status: 'completed' }
  ],
  product: [
    { task: 'Feature prioritization', time: '4h ago', status: 'completed' },
    { task: 'User story review', time: '1d ago', status: 'completed' }
  ],
  devops: [
    { task: 'CI/CD pipeline fix', time: '6h ago', status: 'completed' },
    { task: 'Security audit', time: '2d ago', status: 'completed' }
  ],
  business: [
    { task: 'Market analysis', time: '1d ago', status: 'completed' },
    { task: 'Competitive research', time: '3d ago', status: 'completed' }
  ],
  brain: [
    { task: 'Knowledge base cleanup', time: '3h ago', status: 'in_progress' },
    { task: 'Note organization', time: '1d ago', status: 'completed' }
  ]
}

export function AgentRoster() {
  const [selectedAgent, setSelectedAgent] = useState<QueenAgent | null>(null)
  const [spawnModalOpen, setSpawnModalOpen] = useState(false)
  const [selectedSubAgent, setSelectedSubAgent] = useState<SubAgent | null>(null)
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | AgentState>('all')
  const [skillFilter, setSkillFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)

  // Get all unique skills
  const allSkills = useMemo(() => {
    const skills = new Set<string>()
    ALL_QUEEN_AGENTS.forEach(agent => {
      agent.skills.forEach(skill => skills.add(skill))
    })
    return Array.from(skills).sort()
  }, [])

  // Filter agents
  const filteredAgents = useMemo(() => {
    return ALL_QUEEN_AGENTS.filter(agent => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        agent.subAgents.some(sa => sa.name.toLowerCase().includes(searchQuery.toLowerCase()))
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || agent.status === statusFilter
      
      // Skill filter
      const matchesSkill = skillFilter === 'all' || agent.skills.includes(skillFilter)
      
      return matchesSearch && matchesStatus && matchesSkill
    })
  }, [searchQuery, statusFilter, skillFilter])

  const handleSpawnClick = (agent: QueenAgent, subAgent: SubAgent) => {
    setSelectedAgent(agent)
    setSelectedSubAgent(subAgent)
    setSpawnModalOpen(true)
  }

  const toggleExpandAgent = (agentId: string) => {
    setExpandedAgent(expandedAgent === agentId ? null : agentId)
  }

  // Calculate stats
  const stats = useMemo(() => ({
    total: ALL_QUEEN_AGENTS.length,
    active: ALL_QUEEN_AGENTS.filter(a => a.status === 'active').length,
    idle: ALL_QUEEN_AGENTS.filter(a => a.status === 'idle').length,
    blocked: ALL_QUEEN_AGENTS.filter(a => a.status === 'blocked').length,
    totalSubAgents: ALL_QUEEN_AGENTS.reduce((sum, a) => sum + a.subAgents.length, 0),
    activeSubAgents: ALL_QUEEN_AGENTS.reduce((sum, a) => sum + a.subAgents.filter(s => s.status === 'active').length, 0)
  }), [])

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">Agent Roster</h1>
            <span className="px-2 py-1 rounded-lg bg-violet-500/10 text-violet-400 text-xs font-medium border border-violet-500/20">
              {filteredAgents.length} of {stats.total} Queens
            </span>
          </div>
          <p className="text-sm text-gray-400">
            Queen agents and their specialized sub-agent squads
          </p>
        </div>
        
        {/* View toggle */}
        <div className="flex items-center gap-2 p-1 bg-white/[0.03] rounded-lg border border-white/[0.06]">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <GridIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search agents, skills, or sub-agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-white/[0.06] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2.5 bg-[#111111] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/50"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="idle">Idle</option>
            <option value="blocked">Blocked</option>
          </select>
          
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="px-3 py-2.5 bg-[#111111] border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/50"
          >
            <option value="all">All Skills</option>
            {allSkills.map(skill => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatusCard 
          label="Active" 
          value={stats.active} 
          total={stats.total}
          color="amber"
          icon={<ActiveIcon className="w-4 h-4" />}
        />
        <StatusCard 
          label="Idle" 
          value={stats.idle} 
          total={stats.total}
          color="emerald"
          icon={<IdleIcon className="w-4 h-4" />}
        />
        <StatusCard 
          label="Blocked" 
          value={stats.blocked} 
          total={stats.total}
          color="rose"
          icon={<BlockedIcon className="w-4 h-4" />}
        />
        <StatusCard 
          label="Sub-Agents" 
          value={stats.activeSubAgents} 
          total={stats.totalSubAgents}
          color="blue"
          icon={<SubAgentIcon className="w-4 h-4" />}
        />
      </div>

      {/* Agents Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredAgents.map((agent) => (
            <QueenAgentCard 
              key={agent.id} 
              agent={agent} 
              onSpawnClick={handleSpawnClick}
              isExpanded={expandedAgent === agent.id}
              onToggleExpand={() => toggleExpandAgent(agent.id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAgents.map((agent) => (
            <QueenAgentListRow
              key={agent.id}
              agent={agent}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredAgents.length === 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-16 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-20 h-20 mx-auto bg-gray-500/10 rounded-full flex items-center justify-center border border-gray-500/20">
              <SearchIcon className="w-10 h-10 text-gray-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">No agents found</h3>
              <p className="text-sm text-gray-500">
                Try adjusting your search or filters to find what you're looking for.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setSkillFilter('all')
              }}
              className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

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

// Status Card Component
function StatusCard({ label, value, total, color, icon }: { 
  label: string
  value: number
  total: number
  color: string
  icon: React.ReactNode
}) {
  const colorClasses: Record<string, { bg: string; text: string }> = {
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  }
  const colors = colorClasses[color] || colorClasses.blue

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className={`p-2 rounded-lg ${colors.bg}`}>
        <span className={colors.text}>{icon}</span>
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-white">{value}</span>
          <span className="text-xs text-gray-500">/ {total}</span>
        </div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  )
}

// Queen Agent Card Component
const QueenAgentCard = memo(function QueenAgentCard({ 
  agent, 
  onSpawnClick,
  isExpanded,
  onToggleExpand
}: { 
  agent: QueenAgent
  onSpawnClick: (agent: QueenAgent, subAgent: SubAgent) => void
  isExpanded: boolean
  onToggleExpand: () => void
}) {
  const status = statusConfig[agent.status]
  const gradient = queenGradients[agent.color] || queenGradients.violet
  const borderColor = queenBorderColors[agent.color] || queenBorderColors.violet
  const stats = agent.stats
  const memoryStats = agent.memoryStats
  const recentActivity = RECENT_ACTIVITY[agent.id] || []

  return (
    <div className={`group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] transition-all duration-300 hover:border-white/[0.1] hover:shadow-lg ${borderColor}`}>
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
      
      {/* Live pulse for active agents */}
      {agent.status === 'active' && (
        <div className="absolute top-4 right-4">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
        </div>
      )}
      
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

        {/* Current Task */}
        {agent.currentTask && (
          <div className="mb-4 p-3 bg-amber-500/5 rounded-lg border border-amber-500/10">
            <div className="text-[10px] uppercase tracking-wider text-amber-400/70 font-medium mb-1">Current Task</div>
            <div className="text-sm text-amber-200 truncate">{agent.currentTask}</div>
            {agent.taskStartedAt && (
              <div className="text-xs text-amber-400/50 mt-1">
                Started {new Date(agent.taskStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-gray-400 mb-4 leading-relaxed line-clamp-2">
          {agent.description}
        </p>

        {/* Skills */}
        <div className="mb-4">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-2 block">Skills</span>
          <div className="flex flex-wrap gap-1.5">
            {agent.skills.slice(0, 4).map((skill) => (
              <span 
                key={skill}
                className="px-2 py-1 rounded-md bg-white/[0.05] text-gray-300 text-[10px] border border-white/[0.06] hover:bg-white/[0.08] transition-colors cursor-default"
              >
                {skill}
              </span>
            ))}
            {agent.skills.length > 4 && (
              <span className="px-2 py-1 rounded-md bg-white/[0.05] text-gray-500 text-[10px]">
                +{agent.skills.length - 4}
              </span>
            )}
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

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Recent Activity</span>
              <button 
                onClick={onToggleExpand}
                className="text-[10px] text-violet-400 hover:text-violet-300"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            </div>
            <div className="space-y-1.5">
              {(isExpanded ? recentActivity : recentActivity.slice(0, 2)).map((activity, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    activity.status === 'completed' ? 'bg-emerald-400' :
                    activity.status === 'in_progress' ? 'bg-amber-400' : 'bg-rose-400'
                  }`} />
                  <span className="text-gray-300 truncate flex-1">{activity.task}</span>
                  <span className="text-gray-500 text-[10px]">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Memory Stats */}
        {memoryStats && (
          <div className="flex items-center justify-between text-xs text-gray-500 mb-4 p-2 bg-white/[0.03] rounded-lg">
            <span className="flex items-center gap-1.5">
              <MemoryIcon className="w-3.5 h-3.5" />
              {memoryStats.totalEntries} entries
            </span>
            <span className="flex items-center gap-1.5">
              <ContextIcon className="w-3.5 h-3.5" />
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
            {agent.subAgents.slice(0, isExpanded ? undefined : 3).map((subAgent) => (
              <SubAgentRow 
                key={subAgent.id} 
                subAgent={subAgent} 
                onSpawn={() => onSpawnClick(agent, subAgent)}
              />
            ))}
            {!isExpanded && agent.subAgents.length > 3 && (
              <button
                onClick={onToggleExpand}
                className="w-full py-2 text-xs text-gray-500 hover:text-white transition-colors"
              >
                +{agent.subAgents.length - 3} more sub-agents
              </button>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/[0.06]">
          <button className="flex-1 px-3 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-gray-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5">
            <MessageIcon className="w-3.5 h-3.5" />
            Message
          </button>
          <button className="flex-1 px-3 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-gray-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5">
            <MemoryIcon className="w-3.5 h-3.5" />
            Memory
          </button>
          <button 
            onClick={onToggleExpand}
            className="px-3 py-2 rounded-lg bg-violet-600/80 hover:bg-violet-600 text-white text-xs font-medium transition-colors"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>
    </div>
  )
})

// Queen Agent List Row (for list view)
function QueenAgentListRow({ 
  agent
}: { 
  agent: QueenAgent
}) {
  const status = statusConfig[agent.status]

  return (
    <div className="group flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-[#111111] hover:border-white/[0.1] transition-all">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] text-base font-semibold text-gray-400 border border-white/[0.06]">
        {agent.name.charAt(0)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-white">{agent.name}</h3>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${status.bg} ${status.border} border`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.color.replace('text-', 'bg-')}`} />
            <span className={`text-[10px] font-medium ${status.color}`}>{status.label}</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 truncate">{agent.description}</p>
      </div>
      
      <div className="hidden md:flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
          {agent.stats?.tasksCompleted || 0} tasks
        </span>
        <span className="flex items-center gap-1.5">
          <SubAgentIcon className="w-3.5 h-3.5" />
          {agent.subAgents.length} sub-agents
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <button className="px-3 py-1.5 rounded-lg bg-violet-600/80 hover:bg-violet-600 text-white text-xs font-medium transition-colors">
          Spawn
        </button>
      </div>
    </div>
  )
}

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
          <CloseIcon className="w-5 h-5" />
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

// Icon Components
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function ListIcon({ className }: { className?: string }) {
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

function ActiveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

function IdleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="9" x2="15" y2="15" />
      <line x1="15" y1="9" x2="9" y2="15" />
    </svg>
  )
}

function BlockedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  )
}

function SubAgentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function MemoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function ContextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  )
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
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
