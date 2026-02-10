import { useSubAgents } from '../hooks/useProjects'

export function AgentIndicator() {
  const { subAgents } = useSubAgents()
  const activeAgents = subAgents.filter((a: any) => a.status === 'running')

  return (
    <div className="flex items-center gap-2">
      {activeAgents.length > 0 ? (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-emerald-400">
            {activeAgents.length} agent{activeAgents.length > 1 ? 's' : ''} active
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-subtle)]">
          <span className="h-2 w-2 rounded-full bg-gray-500"></span>
          <span className="text-xs font-medium text-[var(--text-tertiary)]">idle</span>
        </div>
      )}
    </div>
  )
}
