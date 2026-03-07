import type { DeployReadyItem } from '../../types/now'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

interface Props {
  items: DeployReadyItem[]
}

export function ReadyForDeploy({ items }: Props) {
  if (items.length === 0) {
    return (
      <section className="mb-4">
        <p className="text-[10px] py-2" style={{ color: 'var(--text-muted)' }}>
          Nothing ready for deploy.
        </p>
      </section>
    )
  }

  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full" style={{ background: 'var(--success)' }} />
        <h2
          className="text-sm font-semibold uppercase tracking-wide"
          style={{ color: 'var(--text-secondary)' }}
        >
          Ready for Deploy
        </h2>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
          style={{ background: 'var(--success-muted)', color: 'var(--success)' }}
        >
          {items.length}
        </span>
      </div>

      <div className="space-y-2">
        {items.map(item => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-lg"
            style={{
              background: 'var(--success-muted)',
              border: '1px solid rgba(122, 158, 126, 0.2)',
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm">{item.projectEmoji || '📦'}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {item.projectName} — Ready to deploy
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  QA passed: {timeAgo(item.qaPassedAt)} | Branch: {item.branch}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button className="btn btn-primary btn-sm">Deploy Now</button>
              <button className="btn btn-ghost btn-sm">Details</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
