import type { Task } from '../types'
import { StatusBadge } from './StatusBadge'

interface Props {
  task: Task
  onStatusChange?: (id: string, status: Task['status']) => void
}

const priorityDot: Record<string, string> = {
  high: 'bg-rose-400',
  medium: 'bg-amber-400',
  low: 'bg-gray-500',
}

function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function TaskCard({ task, onStatusChange }: Props) {
  const nextStatus: Record<Task['status'], Task['status']> = {
    queued: 'in_progress',
    in_progress: 'done',
    done: 'queued',
  }

  const timestamp = task.completed_at || task.created_at || null

  return (
    <div
      className="card group cursor-pointer"
      onClick={() => onStatusChange?.(task.id, nextStatus[task.status])}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${priorityDot[task.priority || 'low']}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium ${task.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
              {task.title}
            </p>
            <StatusBadge status={task.status} />
          </div>
          {task.assigned_to && (
            <p className="text-xs text-gray-600 mt-1">
              → {task.assigned_to}
            </p>
          )}
          {timestamp && (
            <p className="text-[10px] text-gray-500 mt-1">
              {formatDateTime(timestamp)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
