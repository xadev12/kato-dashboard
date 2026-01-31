import { Link, useLocation } from 'react-router-dom'
import { AgentIndicator } from './AgentIndicator'

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isAgentDashboard = location.pathname === '/'
  const isLegacyDashboard = location.pathname === '/legacy'

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 text-sm font-bold text-white">
                  K
                </div>
                <span className="text-lg font-semibold text-white">Kato</span>
              </Link>
              <nav className="hidden sm:flex items-center gap-1 p-1 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                <Link
                  to="/"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    isAgentDashboard
                      ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/10 text-violet-300 border border-violet-500/20 shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>🤖</span> Agent View
                  </span>
                </Link>
                <Link
                  to="/legacy"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    isLegacyDashboard
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-300 border border-amber-500/20 shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>📋</span> Kanban
                  </span>
                </Link>
              </nav>
            </div>
            <AgentIndicator />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}
