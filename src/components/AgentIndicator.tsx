import { useAgentStatus } from '../hooks/useProjects'

export function AgentIndicator() {
  const { agents } = useAgentStatus()
  const workingAgents = agents.filter(a => a.status === 'working')

  return (
    <div className="flex items-center gap-2">
      {workingAgents.length > 0 ? (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-emerald-400">
            {workingAgents.length} agent{workingAgents.length > 1 ? 's' : ''} active
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700">
          <span className="h-2 w-2 rounded-full bg-gray-500"></span>
          <span className="text-xs font-medium text-gray-500">idle</span>
        </div>
      )}
    </div>
  )
}
