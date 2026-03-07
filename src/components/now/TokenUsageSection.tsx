import type { TokenBudget } from '../../types/now'

interface Props {
  budget: TokenBudget
}

export function TokenUsageSection({ budget }: Props) {
  const barColor = budget.usedPercent > 85 ? 'var(--error)'
    : budget.usedPercent > 60 ? 'var(--warning)'
    : 'var(--success)'

  return (
    <div className="space-y-3">
      {/* Daily Budget Bar */}
      <div
        className="p-4 rounded-lg"
        style={{
          background: budget.overBudget ? 'var(--error-muted)' : 'var(--bg-secondary)',
          border: `1px solid ${budget.overBudget ? 'rgba(184, 122, 122, 0.2)' : 'var(--border-subtle)'}`,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            ${budget.todayCost.toFixed(2)} / ${budget.budget.toFixed(2)} today
          </span>
          <span
            className="text-sm font-semibold"
            style={{ color: barColor }}
          >
            {budget.usedPercent}%
          </span>
        </div>

        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: 'var(--bg-muted)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.min(budget.usedPercent, 100)}%`,
              background: barColor,
            }}
          />
        </div>

        {budget.overBudget && (
          <p className="mt-2 text-xs font-medium" style={{ color: 'var(--error)' }}>
            Over daily budget!
          </p>
        )}
      </div>
    </div>
  )
}
