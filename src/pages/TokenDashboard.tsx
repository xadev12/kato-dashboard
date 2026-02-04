import { useState, useEffect, useMemo } from 'react'
import { useRealtimeTokenStats } from '../hooks/useWebSocket'
import type { TokenStats, ModelTokenMetrics, AgentTokenMetrics } from '../types'

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 1000) {
  const [current, setCurrent] = useState(target)
  const [prevTarget, setPrevTarget] = useState(target)

  useEffect(() => {
    if (target !== prevTarget) {
      const startValue = current
      const diff = target - startValue
      const startTime = performance.now()

      const animate = (now: number) => {
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easeOut = 1 - Math.pow(1 - progress, 3)
        setCurrent(Math.round(startValue + diff * easeOut))

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
      setPrevTarget(target)
    }
  }, [target, prevTarget, current, duration])

  return current
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

// Format percentage
function formatPercent(num: number): string {
  return `${(num || 0).toFixed(1)}%`
}

// Sparkline component
function Sparkline({ data, color = 'violet' }: { data: number[]; color?: string }) {
  if (!data || data.length === 0) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const width = 120
  const height = 40
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((val - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  const colorClasses: Record<string, string> = {
    violet: 'stroke-violet-400',
    emerald: 'stroke-emerald-400',
    amber: 'stroke-amber-400',
    rose: 'stroke-rose-400',
  }

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        strokeWidth="2"
        className={colorClasses[color] || colorClasses.violet}
        points={points}
      />
      <circle cx={width} cy={height - ((data[data.length - 1] - min) / range) * height} r="3" className={`fill-${color}-400`} />
    </svg>
  )
}

export function TokenDashboard() {
  const { stats, loading, isConnected } = useRealtimeTokenStats()
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d'>('1h')
  const [showAgentBreakdown, setShowAgentBreakdown] = useState(false)

  // Animated counters
  const animatedTokens = useAnimatedCounter(stats?.today?.tokensUsed || 0)
  const animatedCost = useAnimatedCounter(Math.round((stats?.today?.cost || 0) * 100)) / 100
  const animatedRequests = useAnimatedCounter(stats?.today?.requests || 0)

  // Generate mock hourly data for sparkline (replace with real data)
  const hourlyData = useMemo(() => {
    if (!stats?.today?.tokensUsed) return Array(24).fill(0)
    // Generate trend based on current usage
    const base = stats.today.tokensUsed / 24
    return Array(24).fill(0).map((_, i) => {
      const hour = new Date().getHours()
      const isCurrentHour = i === hour
      const factor = isCurrentHour ? 1.2 : 0.8 + Math.random() * 0.4
      return Math.round(base * factor)
    })
  }, [stats?.today?.tokensUsed])

  // Calculate percentages
  const todayPercentOfMonthly = stats?.monthly?.limit 
    ? (stats.today.tokensUsed / stats.monthly.limit) * 100 
    : 0

  const monthlyPercentUsed = stats?.monthly?.limit 
    ? (stats.monthly.used / stats.monthly.limit) * 100 
    : 0

  // Warning levels
  const warningLevel = monthlyPercentUsed > 90 ? 'critical' : monthlyPercentUsed > 75 ? 'warning' : 'normal'

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-white">Token Usage</h1>
          <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />
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

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">Token Usage</h1>
            {/* Live indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">
                {isConnected ? 'Live' : 'Disconnected'}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-400">
            Real-time token usage tracking with live updates
          </p>
          {stats.generatedAt && (
            <p className="text-xs text-gray-500">
              Last updated: {new Date(stats.generatedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
        
        {/* Time range selector */}
        <div className="flex items-center gap-2 p-1 bg-white/[0.03] rounded-lg border border-white/[0.06]">
          {(['1h', '24h', '7d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setSelectedTimeRange(range)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedTimeRange === range
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              {range === '1h' ? 'Last Hour' : range === '24h' ? '24 Hours' : '7 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Warning banner */}
      {warningLevel !== 'normal' && (
        <div className={`rounded-xl border p-4 flex items-center gap-3 ${
          warningLevel === 'critical' 
            ? 'border-rose-500/20 bg-rose-500/10' 
            : 'border-amber-500/20 bg-amber-500/10'
        }`}>
          <svg className={`w-5 h-5 ${warningLevel === 'critical' ? 'text-rose-400' : 'text-amber-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className={warningLevel === 'critical' ? 'text-rose-200' : 'text-amber-200'}>
            {warningLevel === 'critical' 
              ? 'Monthly token limit nearly exceeded! Consider optimizing usage.' 
              : 'Approaching monthly token limit. Monitor usage closely.'}
          </span>
        </div>
      )}

      {/* Key Metrics with Sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Today's Usage"
          value={formatNumber(animatedTokens)}
          subValue={formatTokens(animatedTokens)}
          detail={`${todayPercentOfMonthly.toFixed(2)}% of monthly`}
          icon="tokens"
          color="violet"
          sparkline={hourlyData}
          trend="up"
        />
        <MetricCard
          label="Today's Cost"
          value={formatCurrency(animatedCost)}
          subValue="USD"
          detail={`${animatedRequests} requests`}
          icon="cost"
          color="emerald"
          sparkline={hourlyData.map(v => v * 0.002)}
          trend="neutral"
        />
        <MetricCard
          label="Monthly Used"
          value={formatNumber(stats.monthly?.used || 0)}
          subValue={`${formatPercent(monthlyPercentUsed)} of limit`}
          detail={formatTokens(stats.monthly?.used || 0)}
          icon="calendar"
          color={warningLevel === 'critical' ? 'rose' : warningLevel === 'warning' ? 'amber' : 'blue'}
          trend={monthlyPercentUsed > 80 ? 'down' : 'neutral'}
        />
        <MetricCard
          label="Monthly Remaining"
          value={formatNumber(stats.monthly?.remaining || 0)}
          subValue="tokens left"
          detail={`Projected: ${formatNumber(stats.monthly?.projected || 0)}`}
          icon="remaining"
          color="blue"
          trend="up"
        />
      </div>

      {/* Monthly Progress Bar */}
      <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Monthly Limit Progress</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">
              {formatTokens(stats.monthly?.used || 0)} / {formatTokens(stats.monthly?.limit || 0)}
            </span>
            <button className="px-3 py-1 rounded-md bg-white/[0.05] text-gray-400 text-xs hover:bg-white/[0.1] transition-colors">
              Export Report
            </button>
          </div>
        </div>
        <div className="h-4 bg-white/[0.06] rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              warningLevel === 'critical' 
                ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400' 
                : warningLevel === 'warning'
                ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400'
                : 'bg-gradient-to-r from-violet-600 via-violet-500 to-violet-400'
            }`}
            style={{ width: `${Math.min(monthlyPercentUsed, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-3 text-sm">
          <span className="text-gray-500">0%</span>
          <span className={`font-medium ${
            warningLevel === 'critical' ? 'text-rose-400' : 
            warningLevel === 'warning' ? 'text-amber-400' : 
            'text-emerald-400'
          }`}>
            {formatPercent(monthlyPercentUsed)} used
          </span>
          <span className="text-gray-500">100%</span>
        </div>
      </div>

      {/* Toggle for Agent Breakdown */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <ModelIcon className="w-4 h-4 text-violet-400" />
          Usage Breakdown
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAgentBreakdown(false)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              !showAgentBreakdown ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            By Model
          </button>
          <button
            onClick={() => setShowAgentBreakdown(true)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              showAgentBreakdown ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            By Agent
          </button>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model/Agent Breakdown */}
        <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-violet-400" />
              {showAgentBreakdown ? 'Agent Usage' : 'Model Usage'}
            </h3>
            <span className="text-xs text-gray-500">
              {showAgentBreakdown 
                ? `${stats.agentBreakdown?.length || 0} agents` 
                : `${stats.modelBreakdown?.length || 0} models`} today
            </span>
          </div>
          {showAgentBreakdown ? (
            <AgentBreakdown agents={stats.agentBreakdown || []} />
          ) : (
            <ModelBreakdown models={stats.modelBreakdown || []} />
          )}
        </div>

        {/* Usage Overview */}
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

      {/* Detailed Table */}
      <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-amber-400" />
            {showAgentBreakdown ? 'Agent Breakdown' : 'Model Breakdown'}
          </h3>
          <button className="px-3 py-1.5 rounded-lg bg-white/[0.05] text-gray-400 text-xs hover:bg-white/[0.1] transition-colors flex items-center gap-1.5">
            <DownloadIcon className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
        {showAgentBreakdown ? (
          <AgentBreakdownTable agents={stats.agentBreakdown || []} />
        ) : (
          <ModelBreakdownTable models={stats.modelBreakdown || []} />
        )}
      </div>
    </div>
  )
}

// Enhanced Metric Card with Sparkline
function MetricCard({ 
  label, value, subValue, detail, icon, color, sparkline, trend 
}: { 
  label: string
  value: string
  subValue: string
  detail?: string
  icon: string
  color: string
  sparkline?: number[]
  trend?: 'up' | 'down' | 'neutral'
}) {
  const colorClasses: Record<string, { text: string; icon: string; bg: string }> = {
    violet: { text: 'text-violet-400', icon: 'text-violet-400', bg: 'bg-violet-500/10' },
    amber: { text: 'text-amber-400', icon: 'text-amber-400', bg: 'bg-amber-500/10' },
    rose: { text: 'text-rose-400', icon: 'text-rose-400', bg: 'bg-rose-500/10' },
    emerald: { text: 'text-emerald-400', icon: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    blue: { text: 'text-blue-400', icon: 'text-blue-400', bg: 'bg-blue-500/10' },
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

  const TrendIcon = () => {
    if (trend === 'up') return <TrendUpIcon className="w-3.5 h-3.5 text-emerald-400" />
    if (trend === 'down') return <TrendDownIcon className="w-3.5 h-3.5 text-rose-400" />
    return <TrendNeutralIcon className="w-3.5 h-3.5 text-gray-400" />
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] p-5 transition-all duration-200 hover:border-white/[0.1]">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <IconComponent />
            <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">{label}</span>
          </div>
          <TrendIcon />
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className={`text-2xl sm:text-3xl font-bold ${colors.text} mb-1`}>{value}</div>
            <div className="text-xs text-gray-500">{subValue}</div>
            {detail && <div className="text-xs text-gray-600 mt-1">{detail}</div>}
          </div>
          {sparkline && (
            <div className="opacity-60 group-hover:opacity-100 transition-opacity">
              <Sparkline data={sparkline} color={color} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Usage Overview Component
function UsageOverview({ stats }: { stats: TokenStats }) {
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
        <div key={item.label} className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.06] hover:border-white/[0.1] transition-colors">
          <div className="text-xs text-gray-500 mb-1">{item.label}</div>
          <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
          <div className="text-xs text-gray-600">{item.subValue}</div>
        </div>
      ))}
    </div>
  )
}

// Model Breakdown Component
function ModelBreakdown({ models }: { models: ModelTokenMetrics[] }) {
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
          <div key={model.modelId} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
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

// Agent Breakdown Component
function AgentBreakdown({ agents }: { agents: AgentTokenMetrics[] }) {
  if (!agents || agents.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-gray-500 text-sm">
        No agent data available
      </div>
    )
  }

  const totalTokens = agents.reduce((sum, a) => sum + (a.tokensUsed || 0), 0)
  const colors = ['#8b5cf6', '#f97316', '#10b981', '#3b82f6', '#06b6d4', '#ec4899']

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center h-32">
        <div className="relative w-28 h-28">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {agents.map((agent, i) => {
              const percentage = totalTokens > 0 ? ((agent.tokensUsed || 0) / totalTokens) : 0
              const offset = agents.slice(0, i).reduce((sum, a) => sum + (totalTokens > 0 ? ((a.tokensUsed || 0) / totalTokens) : 0), 0)
              
              return (
                <circle
                  key={agent.agentId}
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke={colors[i % colors.length]}
                  strokeWidth="14"
                  strokeDasharray={`${percentage * 238.76} 238.76`}
                  strokeDashoffset={`-${offset * 238.76}`}
                  strokeLinecap="round"
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-white">{agents.length}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {agents.map((agent, i) => (
          <div key={agent.agentId} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
              <span className="text-gray-300">{agent.agentName}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-violet-400">{formatNumber(agent.tokensUsed)}</span>
              <span className="text-emerald-400 font-medium">{formatCurrency(agent.cost)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Model Breakdown Table
function ModelBreakdownTable({ models }: { models: ModelTokenMetrics[] }) {
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

// Agent Breakdown Table
function AgentBreakdownTable({ agents }: { agents: AgentTokenMetrics[] }) {
  const sortedAgents = [...agents].sort((a, b) => (b.tokensUsed || 0) - (a.tokensUsed || 0))

  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <table className="w-full min-w-[500px]">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Requests</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Success</th>
          </tr>
        </thead>
        <tbody>
          {sortedAgents.map((agent) => (
            <tr key={agent.agentId} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
              <td className="py-3 px-3">
                <div className="font-medium text-gray-200 text-sm">{agent.agentName}</div>
                <div className="text-xs text-gray-600">{agent.agentId}</div>
              </td>
              <td className="py-3 px-3 text-right">
                <span className="text-violet-400 font-medium text-sm">{formatNumber(agent.tokensUsed)}</span>
              </td>
              <td className="py-3 px-3 text-right">
                <span className="text-emerald-400 font-medium text-sm">{formatCurrency(agent.cost)}</span>
              </td>
              <td className="py-3 px-3 text-right text-gray-400 text-sm">{(agent.requests || 0).toLocaleString()}</td>
              <td className="py-3 px-3 text-right">
                <span className={`text-sm ${agent.successRate >= 90 ? 'text-emerald-400' : agent.successRate >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
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

function PieIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  )
}

function TableIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="12" y1="3" x2="12" y2="21" />
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

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function TrendUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}

function TrendDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  )
}

function TrendNeutralIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
