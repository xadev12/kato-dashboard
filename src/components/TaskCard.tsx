import type { Task } from '../types'
import { StatusBadge } from './StatusBadge'

interface Props {
  task: Task
  onStatusChange?: (id: string, status: Task['status']) => void
}

const priorityDot: Record<string, string> = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-gray-500',
}

export function TaskCard({ task, onStatusChange }: Props) {
  const nextStatus: Record<string, Task['status']> = {
    todo: 'in_progress',
    in_progress: 'done',
    done: 'todo',
  }

  return (
    <div
      className="card group cursor-pointer"
      onClick={() => onStatusChange?.(task.id, nextStatus[task.status])}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${priorityDot[task.priority]}`} />
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
        </div>
      </div>
    </div>
  )
}
