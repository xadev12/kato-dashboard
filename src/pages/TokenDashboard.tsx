import { useTokenStats } from '../hooks/useProjects'

// Format numbers
function formatNumber(num: number): string {
  if (!num) return '0'
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return num.toString()
}

// Format currency
function formatCurrency(num: number): string {
  return `$${(num || 0).toFixed(2)}`
}

// Format tokens
function formatTokens(num: number): string {
  return (num || 0).toLocaleString()
}

// Format percentage
function formatPercent(num: number): string {
  return `${(num || 0).toFixed(1)}%`
}

export function TokenDashboard() {
  const { stats, loading } = useTokenStats()

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-white">Token Usage</h1>
          <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="space-y-6 pb-8">
        <h1 className="text-3xl font-bold text-white">Token Usage</h1>
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-200">
          <p>No token data available</p>
          <p className="text-sm text-rose-300/60 mt-2">
            Token statistics will appear here once data is collected.
          </p>
        </div>
      </div>
    )
  }

  // Calculate today's percentage of monthly
  const todayPercentOfMonthly = stats.monthly?.limit 
    ? (stats.today.tokensUsed / stats.monthly.limit) * 100 
    : 0

  const monthlyPercentUsed = stats.monthly?.limit 
    ? (stats.monthly.used / stats.monthly.limit) * 100 
    : 0

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">Token Usage</h1>
            <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
              LIVE
            </span>
          </div>
          <p className="text-sm text-gray-400">
            Real-time token usage tracking with daily and monthly breakdowns
          </p>
          {stats.generatedAt && (
            <p className="text-xs text-gray-500">
              Last updated: {new Date(stats.generatedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Today's Usage"
          value={formatNumber(stats.today?.tokensUsed || 0)}
          subValue={formatTokens(stats.today?.tokensUsed || 0)}
          detail={`${todayPercentOfMonthly.toFixed(2)}% of monthly`}
          icon="tokens"
          color="violet"
        />
        <MetricCard
          label="Today's Cost"
          value={formatCurrency(stats.today?.cost || 0)}
          subValue="USD"
          detail={`${stats.today?.sessions || 0} sessions`}
          icon="cost"
          color="emerald"
        />
        <MetricCard
          label="Monthly Used"
          value={formatNumber(stats.monthly?.used || 0)}
          subValue={`${formatPercent(monthlyPercentUsed)} of limit`}
          detail={formatTokens(stats.monthly?.used || 0)}
          icon="calendar"
          color="amber"
        />
        <MetricCard
          label="Monthly Remaining"
          value={formatNumber(stats.monthly?.remaining || 0)}
          subValue="tokens left"
          detail={`Projected: ${formatNumber(stats.monthly?.projected || 0)}`}
          icon="remaining"
          color="blue"
        />
      </div>

      {/* Monthly Progress Bar */}
      <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Monthly Limit Progress</h3>
          <span className="text-sm text-gray-400">
            {formatTokens(stats.monthly?.used || 0)} / {formatTokens(stats.monthly?.limit || 0)}
          </span>
        </div>
        <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-violet-600 via-violet-500 to-violet-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(monthlyPercentUsed, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-3 text-sm">
          <span className="text-gray-500">0%</span>
          <span className={`font-medium ${monthlyPercentUsed > 80 ? 'text-rose-400' : monthlyPercentUsed > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {formatPercent(monthlyPercentUsed)} used
          </span>
          <span className="text-gray-500">100%</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Model Breakdown */}
        <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <ModelIcon className="w-4 h-4 text-violet-400" />
              Today's Model Usage
            </h3>
            <span className="text-xs text-gray-500">By provider</span>
          </div>
          <ModelBreakdown models={stats.modelBreakdown || []} />
        </div>

        {/* Weekly Overview (if available) */}
        <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <ChartIcon className="w-4 h-4 text-emerald-400" />
              Usage Overview
            </h3>
            <span className="text-xs text-gray-500">{stats.period}</span>
          </div>
          <UsageOverview stats={stats} />
        </div>
      </div>

      {/* Model Breakdown Table */}
      <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <ModelIcon className="w-4 h-4 text-amber-400" />
            Model Breakdown
          </h3>
          <span className="text-xs text-gray-500">
            {stats.modelBreakdown?.length || 0} models used today
          </span>
        </div>
        <ModelBreakdownTable models={stats.modelBreakdown || []} />
      </div>
    </div>
  )
}

// Usage Overview Component
function UsageOverview({ stats }: { stats: any }) {
  const items = [
    { label: 'Total Tokens', value: formatNumber(stats.totalTokensUsed), subValue: formatTokens(stats.totalTokensUsed), color: 'text-violet-400' },
    { label: 'Total Cost', value: formatCurrency(stats.totalCost), subValue: 'USD', color: 'text-emerald-400' },
    { label: 'Requests', value: formatNumber(stats.totalRequests), subValue: 'API calls', color: 'text-amber-400' },
    { label: 'Avg/Request', value: formatNumber(stats.avgTokensPerRequest), subValue: 'tokens', color: 'text-blue-400' },
    { label: 'Efficiency', value: `${stats.parallelizationEfficiency}%`, subValue: 'parallel', color: 'text-emerald-400' },
    { label: 'Waste', value: `${stats.tokenWastePercent}%`, subValue: 'optimized', color: stats.tokenWastePercent < 5 ? 'text-emerald-400' : 'text-amber-400' },
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((item) => (
        <div key={item.label} className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.06]">
          <div className="text-xs text-gray-500 mb-1">{item.label}</div>
          <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
          <div className="text-xs text-gray-600">{item.subValue}</div>
        </div>
      ))}
    </div>
  )
}

// Metric Card Component
function MetricCard({ label, value, subValue, detail, icon, color }: { 
  label: string; value: string; subValue: string; detail?: string; icon: string; color: string 
}) {
  const colorClasses: Record<string, { text: string; icon: string }> = {
    violet: { text: 'text-violet-400', icon: 'text-violet-400' },
    amber: { text: 'text-amber-400', icon: 'text-amber-400' },
    rose: { text: 'text-rose-400', icon: 'text-rose-400' },
    emerald: { text: 'text-emerald-400', icon: 'text-emerald-400' },
    blue: { text: 'text-blue-400', icon: 'text-blue-400' },
  }
  const colors = colorClasses[color] || colorClasses.violet

  const IconComponent = () => {
    switch (icon) {
      case 'tokens': return <TokensIcon className={`w-5 h-5 ${colors.icon}`} />
      case 'cost': return <CostIcon className={`w-5 h-5 ${colors.icon}`} />
      case 'calendar': return <CalendarIcon className={`w-5 h-5 ${colors.icon}`} />
      case 'remaining': return <RemainingIcon className={`w-5 h-5 ${colors.icon}`} />
      default: return <ChartIcon className={`w-5 h-5 ${colors.icon}`} />
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] p-5 transition-all duration-200 hover:border-white/[0.1]">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <IconComponent />
          <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">{label}</span>
        </div>
        <div className={`text-2xl sm:text-3xl font-bold ${colors.text} mb-1`}>{value}</div>
        <div className="text-xs text-gray-500">{subValue}</div>
        {detail && <div className="text-xs text-gray-600 mt-1">{detail}</div>}
      </div>
    </div>
  )
}

// Model Breakdown Component
function ModelBreakdown({ models }: { models: any[] }) {
  if (!models || models.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-gray-500 text-sm">
        No model data available
      </div>
    )
  }

  const totalTokens = models.reduce((sum, m) => sum + (m.tokensUsed || 0), 0)

  const modelColors: Record<string, string> = {
    'claude': '#f97316',
    'kimi': '#8b5cf6',
    'gpt': '#10b981',
    'gemini': '#3b82f6',
    'codex': '#06b6d4'
  }

  const getModelColor = (modelId: string) => {
    for (const [key, color] of Object.entries(modelColors)) {
      if (modelId?.toLowerCase().includes(key)) return color
    }
    return '#6b7280'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center h-32">
        <div className="relative w-28 h-28">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {models.map((model, i) => {
              const percentage = totalTokens > 0 ? ((model.tokensUsed || 0) / totalTokens) : 0
              const offset = models.slice(0, i).reduce((sum, m) => sum + (totalTokens > 0 ? ((m.tokensUsed || 0) / totalTokens) : 0), 0)
              
              return (
                <circle
                  key={model.modelId}
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke={getModelColor(model.modelId)}
                  strokeWidth="14"
                  strokeDasharray={`${percentage * 238.76} 238.76`}
                  strokeDashoffset={`-${offset * 238.76}`}
                  strokeLinecap="round"
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-white">{models.length}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {models.map((model) => (
          <div key={model.modelId} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getModelColor(model.modelId) }} />
              <span className="text-gray-300">{model.modelName}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-xs">{model.percentage}%</span>
              <span className="text-emerald-400 font-medium">{formatCurrency(model.cost)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Model Breakdown Table
function ModelBreakdownTable({ models }: { models: any[] }) {
  const sortedModels = [...models].sort((a, b) => (b.tokensUsed || 0) - (a.tokensUsed || 0))

  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <table className="w-full min-w-[500px]">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Requests</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Share</th>
          </tr>
        </thead>
        <tbody>
          {sortedModels.map((model) => (
            <tr key={model.modelId} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
              <td className="py-3 px-3">
                <div className="font-medium text-gray-200 text-sm">{model.modelName}</div>
                <div className="text-xs text-gray-600">{model.modelId}</div>
              </td>
              <td className="py-3 px-3 text-right">
                <span className="text-violet-400 font-medium text-sm">{formatNumber(model.tokensUsed)}</span>
              </td>
              <td className="py-3 px-3 text-right">
                <span className="text-emerald-400 font-medium text-sm">{formatCurrency(model.cost)}</span>
              </td>
              <td className="py-3 px-3 text-right text-gray-400 text-sm">{(model.requests || 0).toLocaleString()}</td>
              <td className="py-3 px-3 text-right">
                <span className="text-gray-400 text-sm">{model.percentage}%</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Icon Components
function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  )
}

function TokensIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12" />
      <path d="M8 10c2-1 6-1 8 0" />
      <path d="M8 14c2 1 6 1 8 0" />
    </svg>
  )
}

function CostIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function RemainingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M2 12h20" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
}

function ModelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}
