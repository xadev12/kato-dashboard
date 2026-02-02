import { useState, useEffect } from 'react'

// Types for real token data
interface TokenEntry {
  date: string
  tokensUsed: number
  cost: number
  requests: number
  agentsActive: number
}

interface AgentBreakdown {
  agentId: string
  agentName: string
  tokensUsed: number
  cost: number
  requests: number
  avgTokensPerRequest: number
  successRate: number
}

interface ModelBreakdown {
  modelId: string
  modelName: string
  tokensUsed: number
  cost: number
  requests: number
  percentage: string
}

interface TokenStats {
  period: string
  generatedAt: string
  totalTokensUsed: number
  totalCost: number
  totalRequests: number
  avgTokensPerRequest: number
  tokenWastePercent: number
  parallelizationEfficiency: number
  dailyStats: TokenEntry[]
  agentBreakdown: AgentBreakdown[]
  modelBreakdown: ModelBreakdown[]
}

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

export function TokenDashboard() {
  const [metrics, setMetrics] = useState<TokenStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch real data from token-stats.json
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await fetch('/token-stats.json')
        if (!response.ok) {
          throw new Error('Failed to load token stats')
        }
        const data: TokenStats = await response.json()
        setMetrics(data)
        setError(null)
      } catch (err) {
        console.error('Error loading token stats:', err)
        setError('Failed to load token data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-white">Token Efficiency</h1>
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

  if (error || !metrics) {
    return (
      <div className="space-y-6 pb-8">
        <h1 className="text-3xl font-bold text-white">Token Efficiency</h1>
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-200">
          <p>{error || 'No token data available'}</p>
          <p className="text-sm text-rose-300/60 mt-2">
            Run: node scripts/token-logger.js --once
          </p>
        </div>
      </div>
    )
  }

  // Calculate trends
  const avgDailyTokens = metrics.totalTokensUsed / (metrics.dailyStats.length || 1)
  const lastDayTokens = metrics.dailyStats[metrics.dailyStats.length - 1]?.tokensUsed || 0
  const tokenTrend = avgDailyTokens > 0 ? ((lastDayTokens - avgDailyTokens) / avgDailyTokens) * 100 : 0

  const avgDailyCost = metrics.totalCost / (metrics.dailyStats.length || 1)
  const lastDayCost = metrics.dailyStats[metrics.dailyStats.length - 1]?.cost || 0
  const costTrend = avgDailyCost > 0 ? ((lastDayCost - avgDailyCost) / avgDailyCost) * 100 : 0

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">Token Efficiency</h1>
            <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
              LIVE
            </span>
          </div>
          <p className="text-sm text-gray-400">
            Real-time token usage and cost tracking from OpenClaw gateway
          </p>
          {metrics.generatedAt && (
            <p className="text-xs text-gray-500">
              Last updated: {new Date(metrics.generatedAt).toLocaleString()}
            </p>
          )}
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
        />
        <MetricCard
          label="Est. Cost"
          value={formatCurrency(metrics.totalCost)}
          subValue="USD"
          icon="cost"
          color="emerald"
          trend={costTrend}
          inverseTrend
        />
        <MetricCard
          label="Total Requests"
          value={formatNumber(metrics.totalRequests)}
          subValue="API calls"
          icon="requests"
          color="amber"
        />
        <MetricCard
          label="Avg per Request"
          value={formatNumber(metrics.avgTokensPerRequest)}
          subValue="tokens"
          icon="avg"
          color="blue"
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
              {metrics.dailyStats.length} days
            </span>
          </div>
          <TokenUsageChart data={metrics.dailyStats} />
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
          <ModelBreakdown models={metrics.modelBreakdown} />
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
            {metrics.totalRequests.toLocaleString()} total requests
          </span>
        </div>
        <AgentBreakdownTable agents={metrics.agentBreakdown} />
      </div>

      {/* Daily Stats Table */}
      <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-blue-400" />
            Daily Breakdown
          </h3>
        </div>
        <DailyStatsTable stats={metrics.dailyStats} />
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
}: { 
  label: string
  value: string
  subValue: string
  icon: string
  color: string
  trend?: number
  inverseTrend?: boolean
}) {
  const colorClasses: Record<string, { text: string; icon: string }> = {
    violet: { text: 'text-violet-400', icon: 'text-violet-400' },
    amber: { text: 'text-amber-400', icon: 'text-amber-400' },
    rose: { text: 'text-rose-400', icon: 'text-rose-400' },
    emerald: { text: 'text-emerald-400', icon: 'text-emerald-400' },
    blue: { text: 'text-blue-400', icon: 'text-blue-400' },
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
      case 'requests':
        return <RequestsIcon className={`w-5 h-5 ${colors.icon}`} />
      case 'avg':
        return <AvgIcon className={`w-5 h-5 ${colors.icon}`} />
      default:
        return <ChartIcon className={`w-5 h-5 ${colors.icon}`} />
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
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{subValue}</span>
          {trend !== undefined && (
            <span className={`text-xs font-medium ${trendColor} flex items-center gap-0.5`}>
              {trendIcon} {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Token Usage Chart Component
function TokenUsageChart({ data }: { data: TokenEntry[] }) {
  if (data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-gray-500">
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

        {data.map((day, i) => {
          const barHeight = maxTokens > 0 ? (day.tokensUsed / maxTokens) * (chartHeight - 30) : 0
          const x = gap + i * (barWidth + gap)
          const y = chartHeight - barHeight

          return (
            <g key={day.date}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(0, barHeight)}
                fill="url(#gradient)"
                rx="4"
                className="transition-all duration-300 hover:opacity-80"
              />
              
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
function ModelBreakdown({ models }: { models: ModelBreakdown[] }) {
  if (!models || models.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-gray-500 text-sm">
        No model data available
      </div>
    )
  }

  const totalTokens = models.reduce((sum, m) => sum + m.tokensUsed, 0)

  const modelColors: Record<string, string> = {
    'claude': '#f97316',
    'kimi': '#8b5cf6',
    'gpt': '#10b981',
    'gemini': '#3b82f6',
  }

  const getModelColor = (modelId: string) => {
    for (const [key, color] of Object.entries(modelColors)) {
      if (modelId.toLowerCase().includes(key)) return color
    }
    return '#6b7280'
  }

  return (
    <div className="space-y-4">
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

      <div className="space-y-2">
        {models.map((model) => (
          <div key={model.modelId} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: getModelColor(model.modelId) }}
              />
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

// Agent Breakdown Table
function AgentBreakdownTable({ agents }: { agents: AgentBreakdown[] }) {
  const sortedAgents = [...agents].sort((a, b) => b.tokensUsed - a.tokensUsed)

  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <table className="w-full min-w-[500px]">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Requests</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Avg/Req</th>
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
                <span className="text-emerald-400 font-medium text-sm">{formatCurrency(agent.cost)}</span>
              </td>
              <td className="py-3 px-3 text-right text-gray-400 text-sm">{agent.requests.toLocaleString()}</td>
              <td className="py-3 px-3 text-right text-gray-400 text-sm">{formatNumber(agent.avgTokensPerRequest)}</td>
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
function DailyStatsTable({ stats }: { stats: TokenEntry[] }) {
  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <table className="w-full min-w-[400px]">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Requests</th>
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
                <span className="text-emerald-400 font-medium text-sm">{formatCurrency(stat.cost)}</span>
              </td>
              <td className="py-3 px-3 text-right text-gray-400 text-sm">{stat.requests.toLocaleString()}</td>
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

function RequestsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function AvgIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
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
