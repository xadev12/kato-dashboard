import type { ProjectStatus, TaskStatus } from '../types'

const statusConfig: Record<string, { label: string; class: string }> = {
  backlog: { label: 'Backlog', class: 'badge-gray' },
  todo: { label: 'Todo', class: 'badge-gray' },
  in_progress: { label: 'In Progress', class: 'badge-yellow' },
  done: { label: 'Done', class: 'badge-green' },
}

interface Props {
  status: ProjectStatus | TaskStatus
}

export function StatusBadge({ status }: Props) {
  const config = statusConfig[status] || statusConfig.backlog
  return <span className={`badge ${config.class}`}>{config.label}</span>
}
