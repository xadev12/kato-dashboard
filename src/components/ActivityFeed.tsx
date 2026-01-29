import { useActivity } from '../hooks/useProjects'
import type { ActionType } from '../types'

const actionIcons: Record<ActionType, string> = {
  project_created: '📁',
  task_created: '➕',
  task_updated: '✏️',
  status_changed: '🔄',
  agent_action: '🤖',
  deploy: '🚀',
  commit: '💻',
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function ActivityFeed() {
  const { activity, loading } = useActivity(10)

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-900 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {activity.map((item, idx) => (
        <div
          key={item.id}
          className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-900/50 transition-colors"
          style={{ animationDelay: `${idx * 50}ms` }}
        >
          <span className="text-base mt-0.5 flex-shrink-0">
            {actionIcons[item.action_type] || '📌'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-300 leading-snug">{item.description}</p>
            <p className="text-xs text-gray-600 mt-0.5">{timeAgo(item.timestamp)}</p>
          </div>
        </div>
      ))}
      {activity.length === 0 && (
        <p className="text-sm text-gray-600 text-center py-8">No activity yet</p>
      )}
    </div>
  )
}
