import { memo } from 'react'
import type { QueenAgent } from '../types'

interface Props {
  agents: QueenAgent[]
  onSpawnSpecialist?: (specialist: string) => void
  onMessageAgent?: (agentId: string) => void
  onCreateTask?: () => void
}

const specialists = [
  { id: 'frontend', name: 'Frontend', icon: '🎨', color: 'from-pink-500/20 to-rose-500/10', textColor: 'text-pink-400' },
  { id: 'backend', name: 'Backend', icon: '⚙️', color: 'from-blue-500/20 to-cyan-500/10', textColor: 'text-blue-400' },
  { id: 'mobile', name: 'Mobile', icon: '📱', color: 'from-emerald-500/20 to-teal-500/10', textColor: 'text-emerald-400' },
  { id: 'design', name: 'Design', icon: '✨', color: 'from-amber-500/20 to-orange-500/10', textColor: 'text-amber-400' },
  { id: 'testing', name: 'QA', icon: '🧪', color: 'from-violet-500/20 to-purple-500/10', textColor: 'text-violet-400' },
  { id: 'security', name: 'Security', icon: '🔒', color: 'from-rose-500/20 to-red-500/10', textColor: 'text-rose-400' }
]

export const UserActionsPanel = memo(function UserActionsPanel({ 
  agents, 
  onSpawnSpecialist,
  onMessageAgent,
  onCreateTask
}: Props) {

  const activeAgents = agents.filter(a => a.status === 'active')
  const idleAgents = agents.filter(a => a.status === 'idle')

  const handleSpawn = (specialistId: string) => {
    onSpawnSpecialist?.(specialistId)
  }

  const handleMessage = (agentId: string) => {
    onMessageAgent?.(agentId)
  }

  return (
    <div className="space-y-4">
      {/* Spawn Specialists */}
      <div className="bg-[#111111] rounded-xl border border-white/[0.06] p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Spawn Specialist
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {specialists.map(spec => (
            <button
              key={spec.id}
              onClick={() => handleSpawn(spec.id)}
              className={`group flex flex-col items-center gap-2 p-3 rounded-lg bg-gradient-to-br ${spec.color} border border-white/[0.06] hover:border-white/[0.15] transition-all duration-200 hover:scale-[1.02]`}
            >
              <span className="text-lg">{spec.icon}</span>
              <span className={`text-xs font-medium ${spec.textColor}`}>{spec.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Message Agents */}
      <div className="bg-[#111111] rounded-xl border border-white/[0.06] p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Message Agent
        </h3>
        
        {activeAgents.length > 0 && (
          <div className="mb-3">
            <span className="text-[10px] uppercase tracking-wider text-amber-400 font-medium mb-2 block">Active</span>
            <div className="flex flex-wrap gap-2">
              {activeAgents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => handleMessage(agent.id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  {agent.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {idleAgents.length > 0 && (
          <div>
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-medium mb-2 block">Idle</span>
            <div className="flex flex-wrap gap-2">
              {idleAgents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => handleMessage(agent.id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {agent.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-[#111111] rounded-xl border border-white/[0.06] p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Quick Actions
        </h3>
        <div className="space-y-2">
          <button
            onClick={onCreateTask}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-gray-300 text-sm hover:bg-white/[0.06] hover:border-white/[0.1] hover:text-white transition-all duration-200"
          >
            <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Task
          </button>
          <button
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-gray-300 text-sm hover:bg-white/[0.06] hover:border-white/[0.1] hover:text-white transition-all duration-200"
          >
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Dashboard
          </button>
          <button
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-gray-300 text-sm hover:bg-white/[0.06] hover:border-white/[0.1] hover:text-white transition-all duration-200"
          >
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Reports
          </button>
        </div>
      </div>
    </div>
  )
})
