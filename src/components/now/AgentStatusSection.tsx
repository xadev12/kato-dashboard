import type { QueenAgentStatus, WorkerQueueItem, ModelHealthItem, DrawerContent } from '../../types/now'

interface Props {
  agents: QueenAgentStatus[]
  workerQueue: WorkerQueueItem[]
  modelHealth: ModelHealthItem[]
  onOpenDrawer: (content: DrawerContent) => void
}

export function AgentStatusSection({ agents, workerQueue, modelHealth, onOpenDrawer }: Props) {
  return (
    <div className="space-y-4">
      {/* Queen Agent Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {agents.map(agent => (
          <QueenCard
            key={agent.id}
            agent={agent}
            onClick={() => onOpenDrawer({
              type: 'agent',
              id: agent.id,
              title: `${agent.emoji} ${agent.name}`,
              data: agent as unknown as Record<string, unknown>,
            })}
          />
        ))}
      </div>

      {/* Worker Queue Table */}
      {workerQueue.length > 0 && (
        <WorkerQueueTable items={workerQueue} />
      )}

      {/* Model Health Strip */}
      <ModelHealthStrip items={modelHealth} />
    </div>
  )
}

function QueenCard({ agent, onClick }: { agent: QueenAgentStatus; onClick: () => void }) {
  const statusColor = agent.status === 'active' ? 'var(--warning)'
    : agent.status === 'error' ? 'var(--error)'
    : 'var(--success)'

  return (
    <button
      onClick={onClick}
      className="p-3 rounded-lg transition-all duration-200 hover:shadow-sm text-left"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-sm">{agent.emoji}</span>
        <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          {agent.name}
        </span>
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0 ml-auto"
          style={{ background: statusColor }}
        />
      </div>

      <p className="text-[10px] line-clamp-1 mb-1" style={{ color: 'var(--text-tertiary)' }}>
        {agent.currentTask || agent.role}
      </p>

      <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
        <span>{agent.todayTasks} tasks</span>
        <span>${agent.todayCost.toFixed(2)}</span>
      </div>
    </button>
  )
}

function WorkerQueueTable({ items }: { items: WorkerQueueItem[] }) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: '1px solid var(--border-subtle)' }}
    >
      <table className="w-full text-[11px]">
        <thead>
          <tr style={{ background: 'var(--bg-tertiary)' }}>
            <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text-tertiary)' }}>Status</th>
            <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text-tertiary)' }}>Agent/Model</th>
            <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text-tertiary)' }}>Task</th>
            <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text-tertiary)' }}>Project</th>
            <th className="text-right px-3 py-2 font-medium" style={{ color: 'var(--text-tertiary)' }}>Duration</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <td className="px-3 py-2">
                <WorkerStatusDot status={item.status} />
              </td>
              <td className="px-3 py-2" style={{ color: 'var(--text-primary)' }}>
                {item.agentModel}
              </td>
              <td className="px-3 py-2 max-w-48 truncate" style={{ color: 'var(--text-secondary)' }}>
                {item.task}
              </td>
              <td className="px-3 py-2" style={{ color: 'var(--text-tertiary)' }}>
                {item.project}
              </td>
              <td className="px-3 py-2 text-right" style={{ color: 'var(--text-tertiary)' }}>
                {item.duration}
                {item.cost !== undefined && <span className="ml-1">${item.cost.toFixed(2)}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function WorkerStatusDot({ status }: { status: WorkerQueueItem['status'] }) {
  const color = status === 'active' ? 'var(--warning)' : status === 'queued' ? 'var(--text-muted)' : 'var(--success)'
  const label = status === 'active' ? 'Active' : status === 'queued' ? 'Queued' : 'Done'

  return (
    <span className="flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </span>
  )
}

function ModelHealthStrip({ items }: { items: ModelHealthItem[] }) {
  return (
    <div
      className="flex items-center gap-4 px-3 py-2 rounded-lg"
      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
    >
      {items.map(item => {
        const statusIcon = item.status === 'healthy' ? '●' : item.status === 'degraded' ? '◐' : '○'
        const color = item.status === 'healthy' ? 'var(--success)'
          : item.status === 'degraded' ? 'var(--warning)'
          : 'var(--error)'

        return (
          <span key={item.model} className="flex items-center gap-1 text-[11px]">
            <span style={{ color }}>{statusIcon}</span>
            <span style={{ color: 'var(--text-secondary)' }}>{item.model}</span>
            {item.failCount > 0 && (
              <span style={{ color: 'var(--warning)' }}>({item.failCount} fail)</span>
            )}
          </span>
        )
      })}
    </div>
  )
}
