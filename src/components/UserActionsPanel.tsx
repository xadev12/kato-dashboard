import { memo, useState } from 'react'

interface Props {
  onRefresh?: () => void
}

export const UserActionsPanel = memo(function UserActionsPanel({
  onRefresh
}: Props) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onRefresh?.()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="bg-[#111111] rounded-xl border border-white/[0.06] p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Quick Actions
        </h3>
        <div className="space-y-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-gray-300 text-sm hover:bg-white/[0.06] hover:border-white/[0.1] hover:text-white transition-all duration-200 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh Dashboard'}
          </button>
        </div>
      </div>
    </div>
  )
})
