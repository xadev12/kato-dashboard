import { useState, useEffect } from 'react'
import type { AgentTokenMetrics, DailyTokenStat, ModelTokenMetrics, TokenStats } from '../types'

// Sample token metrics data (fallback)
const sampleMetrics: TokenStats = {
  period: 'week',
  generatedAt: new Date().toISOString(),
  totalTokensUsed: 2450000,
  totalCost: 18.45,
  avgTokensPerTask: 15700,
  tokenWastePercent: 12.5,
  parallelizationEfficiency: 87,
  sessionCount: 45,
  dailyStats: [
    { date: '2026-01-27', tokensUsed: 320000, tasksCompleted: 18, agentsActive: 5, cost: 2.40 },
    { date: '2026-01-28', tokensUsed: 380000, tasksCompleted: 22, agentsActive: 5, cost: 2.85 },
    { date: '2026-01-29', tokensUsed: 410000, tasksCompleted: 26, agentsActive: 6, cost: 3.08 },
    { date: '2026-01-30', tokensUsed: 350000, tasksCompleted: 20, agentsActive: 5, cost: 2.63 },
    { date: '2026-01-31', tokensUsed: 420000, tasksCompleted: 25, agentsActive: 5, cost: 3.15 },
    { date: '2026-02-01', tokensUsed: 360000, tasksCompleted: 21, agentsActive: 4, cost: 2.70 },
    { date: '2026-02-02', tokensUsed: 210000, tasksCompleted: 12, agentsActive: 3, cost: 1.58 },
  ],
  agentBreakdown: [
    { agentId: 'main', agentName: 'Kato', tokensUsed: 680000, tasksCompleted: 52, avgTokensPerTask: 13077, successRate: 94, cost: 5.10 },
    { agentId: 'product', agentName: 'Product Owner', tokensUsed: 420000, tasksCompleted: 28, avgTokensPerTask: 15000, successRate: 91, cost: 3.15 },
    { agentId: 'devops', agentName: 'DevOps Engineer', tokensUsed: 310000, tasksCompleted: 22, avgTokensPerTask: 14091, successRate: 97, cost: 2.33 },
    { agentId: 'business', agentName: 'Business Strategist', tokensUsed: 180000, tasksCompleted: 12, avgTokensPerTask: 15000, successRate: 88, cost: 1.35 },
    { agentId: 'brain', agentName: 'Second Brain Keeper', tokensUsed: 560000, tasksCompleted: 44, avgTokensPerTask: 12727, successRate: 95, cost: 4.20 },
  ],
  modelBreakdown: [
    { modelId: 'claude-opus-4-5', modelName: 'Claude Opus 4.5', tokensUsed: 1200000, inputTokens: 800000, outputTokens: 400000, cost: 12.00 },
    { modelId: 'kimi-code', modelName: 'Kimi Code', tokensUsed: 850000, inputTokens: 600000, outputTokens: 250000, cost: 4.25 },
    { modelId: 'gpt-4o', modelName: 'GPT-4o', tokensUsed: 400000, inputTokens: 280000, outputTokens: 120000, cost: 2.20 },
  ],
}

// Format numbers
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return num.toString()
}

// Format currency
function formatCurrency(num: number): string {
  return `$${num.toFixed(2)}`
}

// Format tokens
function formatTokens(num: number): string {
  return num.toLocaleString()
}

export function TokenDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week')
  const [metrics, setMetrics] = useState<TokenStats>(sampleMetrics)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // Fetch real data from dashboard-data.json
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await fetch('/dashboard-data.json')
        if (!response.ok) {
          throw new Error('Failed to load dashboard data')
        }
        const data = await response.json()
        
        if (data.tokenStats) {
          setMetrics(data.tokenStats)
        }
        if (data.lastUpdated) {
          setLastUpdated(data.lastUpdated)
        }
        setError(null)
      } catch (err) {
        console.error('Error loading token stats:', err)
        setError('Using sample data - real stats unavailable')
        // Keep using sampleMetrics as fallback
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedPeriod])

  // Calculate trend (comparing last day to average)
  const avgDailyTokens = metrics.totalTokensUsed / (metrics.dailyStats.length || 1)
  const lastDayTokens = metrics.dailyStats[metrics.dailyStats.length - 1]?.tokensUsed || 0
  const tokenTrend = ((lastDayTokens - avgDailyTokens) / avgDailyTokens) * 100

  const avgDailyCost = metrics.totalCost / (metrics.dailyStats.length || 1)
  const lastDayCost = metrics.dailyStats[metrics.dailyStats.length - 1]?.cost || 0
  const costTrend = ((lastDayCost - avgDailyCost) / avgDailyCost) * 100

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">Token Efficiency</h1>
            {loading && (
              <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            )}
          </div>
          <p className="text-sm text-gray-400">
            Track token usage, cost estimates, and parallelization efficiency
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
          {error && (
            <p className="text-xs text-amber-400/80">{error}</p>
          )}
        </div>
        
        {/* Period Selector */}
        <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-lg border border-white/[0.06]">
          {(['day', 'week', 'month'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              disabled={loading}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 capitalize ${
                selectedPeriod === period
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.03] disabled:opacity-50'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Tokens"
          value={formatNumber(metrics.totalTokensUsed)}
          subValue={formatTokens(metrics.totalTokensUsed)}
          icon="tokens"
          color="violet"
          trend={tokenTrend}
          loading={loading}
        />
        <MetricCard
          label="Est. Cost"
          value={formatCurrency(metrics.totalCost)}
          subValue="USD"
          icon="cost"
          color="emerald"
          trend={costTrend}
          inverseTrend
          loading={loading}
        />
        <MetricCard
          label="Token Waste"
          value={`${metrics.tokenWastePercent}%`}
          subValue="of total usage"
          icon="waste"
          color="rose"
          trend={-2.3}
          inverseTrend
          loading={loading}
        />
        <MetricCard
          label="Parallelization"
          value={`${metrics.parallelizationEfficiency}%`}
          subValue="efficiency"
          icon="parallel"
          color="amber"
          trend={5.1}
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Usage Chart */}
        <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <ChartIcon className="w-4 h-4 text-violet-400" />
              Daily Token Usage
            </h3>
            <span className="text-xs text-gray-500">
              {metrics.dailyStats.length > 0 && 
                `${metrics.dailyStats.length} days • ${formatCurrency(metrics.totalCost)} total`
              }
            </span>
          </div>
          <TokenUsageChart data={metrics.dailyStats} loading={loading} />
        </div>

        {/* Model Breakdown */}
        <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <ModelIcon className="w-4 h-4 text-emerald-400" />
              Model Usage
            </h3>
            <span className="text-xs text-gray-500">By provider</span>
          </div>
          <ModelBreakdown models={metrics.modelBreakdown || []} loading={loading} />
        </div>
      </div>

      {/* Agent Breakdown */}
      <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <AgentIcon className="w-4 h-4 text-amber-400" />
            Per-Agent Breakdown
          </h3>
          <span className="text-xs text-gray-500">
            {metrics.sessionCount > 0 && `${metrics.sessionCount} sessions`}
          </span>
        </div>
        <AgentBreakdownTable agents={metrics.agentBreakdown} loading={loading} />
      </div>

      {/* Daily Stats Table */}
      <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-blue-400" />
            Daily Breakdown
          </h3>
        </div>
        <DailyStatsTable stats={metrics.dailyStats} loading={loading} />
      </div>
    </div>
  )
}

// Metric Card Component
function MetricCard({ 
  label, 
  value, 
  subValue, 
  icon, 
  color,
  trend,
  inverseTrend,
  loading,
}: { 
  label: string
  value: string
  subValue: string
  icon: string
  color: string
  trend?: number
  inverseTrend?: boolean
  loading?: boolean
}) {
  const colorClasses: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    violet: { 
      bg: 'bg-violet-500/10', 
      text: 'text-violet-400', 
      border: 'border-violet-500/20',
      icon: 'text-violet-400'
    },
    amber: { 
      bg: 'bg-amber-500/10', 
      text: 'text-amber-400', 
      border: 'border-amber-500/20',
      icon: 'text-amber-400'
    },
    rose: { 
      bg: 'bg-rose-500/10', 
      text: 'text-rose-400', 
      border: 'border-rose-500/20',
      icon: 'text-rose-400'
    },
    emerald: { 
      bg: 'bg-emerald-500/10', 
      text: 'text-emerald-400', 
      border: 'border-emerald-500/20',
      icon: 'text-emerald-400'
    },
    blue: { 
      bg: 'bg-blue-500/10', 
      text: 'text-blue-400', 
      border: 'border-blue-500/20',
      icon: 'text-blue-400'
    },
  }
  const colors = colorClasses[color] || colorClasses.violet

  const trendPositive = trend !== undefined ? (inverseTrend ? trend < 0 : trend > 0) : undefined
  const trendColor = trendPositive ? 'text-emerald-400' : 'text-rose-400'
  const trendIcon = trendPositive ? '↑' : '↓'

  const IconComponent = () => {
    switch (icon) {
      case 'tokens':
        return <TokensIcon className={`w-5 h-5 ${colors.icon}`} />
      case 'cost':
        return <CostIcon className={`w-5 h-5 ${colors.icon}`} />
      case 'waste':
        return <WasteIcon className={`w-5 h-5 ${colors.icon}`} />
      case 'parallel':
        return <ParallelIcon className={`w-5 h-5 ${colors.icon}`} />
      default:
        return <ChartIcon className={`w-5 h-5 ${colors.icon}`} />
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] p-5 transition-all duration-200 hover:border-white/[0.1]">
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-0 transition-opacity duration-200 group-hover:opacity-100`} />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <IconComponent />
          <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">{label}</span>
        </div>
        {loading ? (
          <div className="h-8 w-24 bg-white/5 rounded animate-pulse" />
        ) : (
          <>
            <div className={`text-2xl sm:text-3xl font-bold ${colors.text} mb-1`}>{value}</div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{subValue}</span>
              {trend !== undefined && (
                <span className={`text-xs font-medium ${trendColor} flex items-center gap-0.5`}>
                  {trendIcon} {Math.abs(trend).toFixed(1)}%
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Token Usage Chart Component
function TokenUsageChart({ data, loading }: { data: DailyTokenStat[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No data available
      </div>
    )
  }

  const maxTokens = Math.max(...data.map(d => d.tokensUsed))
  const chartHeight = 180
  const barWidth = Math.min(48, Math.max(24, 300 / data.length))
  const gap = 12
  const totalWidth = data.length * (barWidth + gap) + gap

  return (
    <div className="relative h-56 overflow-x-auto">
      <svg viewBox={`0 0 ${totalWidth} ${chartHeight + 40}`} className="min-w-full h-full" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={gap}
            y1={chartHeight * (1 - ratio)}
            x2={totalWidth - gap}
            y2={chartHeight * (1 - ratio)}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        ))}

        {/* Bars */}
        {data.map((day, i) => {
          const barHeight = maxTokens > 0 ? (day.tokensUsed / maxTokens) * (chartHeight - 30) : 0
          const x = gap + i * (barWidth + gap)
          const y = chartHeight - barHeight

          return (
            <g key={day.date}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(0, barHeight)}
                fill="url(#gradient)"
                rx="4"
                className="transition-all duration-300 hover:opacity-80"
              />
              
              {/* Value label */}
              {barHeight > 20 && (
                <text
                  x={x + barWidth / 2}
                  y={Math.max(12, y - 6)}
                  textAnchor="middle"
                  fill="#8b5cf6"
                  fontSize="10"
                  fontWeight="500"
                >
                  {formatNumber(day.tokensUsed)}
                </text>
              )}
              
              {/* Date label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 18}
                textAnchor="middle"
                fill="#6b7280"
                fontSize="10"
              >
                {new Date(day.date).toLocaleDateString([], { weekday: 'short', day: 'numeric' })}
              </text>
            </g>
          )
        })}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

// Model Breakdown Component
function ModelBreakdown({ models, loading }: { models: ModelTokenMetrics[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="h-56 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!models || models.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-gray-500 text-sm">
        No model data available
      </div>
    )
  }

  const totalTokens = models.reduce((sum, m) => sum + m.tokensUsed, 0)

  // Model color mapping
  const modelColors: Record<string, string> = {
    'claude-opus-4-5': '#f97316', // orange
    'claude-sonnet-4-5': '#f97316',
    'claude-haiku': '#f97316',
    'kimi-code': '#8b5cf6', // violet
    'kimi-chat': '#8b5cf6',
    'gpt-4o': '#10b981', // emerald
    'gpt-4o-mini': '#10b981',
    'gemini-2.5-pro': '#3b82f6', // blue
    'gemini-2.5-flash': '#3b82f6',
  }

  const getModelColor = (modelId: string) => {
    for (const [key, color] of Object.entries(modelColors)) {
      if (modelId.includes(key)) return color
    }
    return '#6b7280' // gray default
  }

  return (
    <div className="space-y-4">
      {/* Donut chart */}
      <div className="flex items-center justify-center h-32">
        <div className="relative w-28 h-28">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {models.map((model, i) => {
              const percentage = totalTokens > 0 ? (model.tokensUsed / totalTokens) : 0
              const offset = models.slice(0, i).reduce((sum, m) => sum + (totalTokens > 0 ? (m.tokensUsed / totalTokens) : 0), 0)
              
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

      {/* Legend */}
      <div className="space-y-2">
        {models.map((model) => {
          const percentage = totalTokens > 0 ? ((model.tokensUsed / totalTokens) * 100).toFixed(1) : '0.0'
          return (
            <div key={model.modelId} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: getModelColor(model.modelId) }}
                />
                <span className="text-gray-300">{model.modelName}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-xs">{percentage}%</span>
                <span className="text-emerald-400 font-medium">{formatCurrency(model.cost)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Agent Breakdown Table
function AgentBreakdownTable({ agents, loading }: { agents: AgentTokenMetrics[]; loading?: boolean }) {
  const sortedAgents = [...agents].sort((a, b) => b.tokensUsed - a.tokensUsed)

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-white/5 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <table className="w-full min-w-[500px]">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Avg/Task</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Success</th>
          </tr>
        </thead>
        <tbody>
          {sortedAgents.map((agent) => (
            <tr key={agent.agentId} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
              <td className="py-3 px-3">
                <div className="font-medium text-gray-200 text-sm">{agent.agentName}</div>
              </td>
              <td className="py-3 px-3 text-right">
                <span className="text-violet-400 font-medium text-sm">{formatNumber(agent.tokensUsed)}</span>
              </td>
              <td className="py-3 px-3 text-right">
                <span className="text-emerald-400 font-medium text-sm">{formatCurrency(agent.cost || 0)}</span>
              </td>
              <td className="py-3 px-3 text-right text-gray-400 text-sm">{agent.tasksCompleted}</td>
              <td className="py-3 px-3 text-right text-gray-400 text-sm">{formatNumber(agent.avgTokensPerTask)}</td>
              <td className="py-3 px-3 text-right">
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  agent.successRate >= 95 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                  agent.successRate >= 90 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {agent.successRate}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Daily Stats Table
function DailyStatsTable({ stats, loading }: { stats: DailyTokenStat[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <table className="w-full min-w-[400px]">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Agents</th>
          </tr>
        </thead>
        <tbody>
          {[...stats].reverse().map((stat) => (
            <tr key={stat.date} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
              <td className="py-3 px-3">
                <div className="text-gray-200 text-sm">
                  {new Date(stat.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </div>
              </td>
              <td className="py-3 px-3 text-right">
                <span className="text-violet-400 font-medium text-sm">{formatNumber(stat.tokensUsed)}</span>
              </td>
              <td className="py-3 px-3 text-right">
                <span className="text-emerald-400 font-medium text-sm">{formatCurrency(stat.cost || 0)}</span>
              </td>
              <td className="py-3 px-3 text-right text-gray-400 text-sm">{stat.tasksCompleted}</td>
              <td className="py-3 px-3 text-right text-gray-400 text-sm">{stat.agentsActive}</td>
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

function WasteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function ParallelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
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

function AgentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
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
