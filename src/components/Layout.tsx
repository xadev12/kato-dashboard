import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useCallback } from 'react'
import { AgentIndicator } from './AgentIndicator'
import { GlobalSearch } from './GlobalSearch'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

const TAB_ITEMS = [
  { path: '/', label: 'Now' },
  { path: '/pipeline', label: 'Pipeline' },
]

// Secondary nav items (accessible from header)
const SECONDARY_NAV = [
  { path: '/projects', label: 'Projects' },
  { path: '/tokens', label: 'Tokens' },
  { path: '/roster', label: 'Roster' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const currentPath = location.pathname
  const [showShortcuts, setShowShortcuts] = useState(false)

  const isTabActive = (path: string) => {
    if (path === '/') return currentPath === '/' || currentPath === '/now'
    return currentPath.startsWith(path)
  }

  const isSecondaryActive = (path: string) => currentPath.startsWith(path)

  const handleSwitchTab = useCallback((index: number) => {
    const tab = TAB_ITEMS[index]
    if (tab) navigate(tab.path)
  }, [navigate])

  const handleFocusSearch = useCallback(() => {
    // Try to focus the GlobalSearch input
    const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement
    searchInput?.focus()
  }, [])

  useKeyboardShortcuts({
    onSwitchTab: handleSwitchTab,
    onFocusSearch: handleFocusSearch,
    onRefresh: () => window.location.reload(),
    onToggleHelp: () => setShowShortcuts(v => !v),
  })

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          background: 'rgba(250, 249, 247, 0.85)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            {/* Left: Logo + Tab Nav */}
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2.5">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-[var(--text-primary)]"
                  style={{ background: 'var(--accent-primary)' }}
                >
                  K
                </div>
                <span
                  className="text-lg font-semibold hidden sm:inline"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Kato
                </span>
              </Link>

              {/* Tab Navigation */}
              <nav
                className="flex items-center gap-0.5 p-1 rounded-lg"
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {TAB_ITEMS.map((tab) => (
                  <Link
                    key={tab.path}
                    to={tab.path}
                    className="px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200"
                    style={{
                      background: isTabActive(tab.path) ? 'rgba(139, 115, 85, 0.1)' : 'transparent',
                      color: isTabActive(tab.path) ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      border: isTabActive(tab.path) ? '1px solid rgba(139, 115, 85, 0.15)' : '1px solid transparent',
                      boxShadow: isTabActive(tab.path) ? 'var(--shadow-sm)' : 'none',
                    }}
                  >
                    {tab.label}
                  </Link>
                ))}
              </nav>

              {/* Secondary Nav (desktop) */}
              <div className="hidden lg:flex items-center gap-1">
                {SECONDARY_NAV.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="px-2 py-1 rounded text-xs font-medium transition-all duration-200"
                    style={{
                      color: isSecondaryActive(item.path) ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right: Search + Agent Indicator */}
            <div className="flex items-center gap-3">
              <GlobalSearch />
              <AgentIndicator />
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav
            className="lg:hidden flex items-center gap-2 py-2 overflow-x-auto scrollbar-hide"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            {SECONDARY_NAV.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex-shrink-0 px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
                style={{
                  color: isSecondaryActive(item.path) ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                  background: isSecondaryActive(item.path) ? 'rgba(139, 115, 85, 0.06)' : 'transparent',
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Keyboard Shortcuts Overlay */}
      {showShortcuts && (
        <ShortcutsOverlay onClose={() => setShowShortcuts(false)} />
      )}
    </div>
  )
}

function ShortcutsOverlay({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 rounded-xl w-80"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Keyboard Shortcuts</h3>
          <button onClick={onClose} className="icon-btn" style={{ width: 28, height: 28 }}>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-2">
          {[
            { key: '1', desc: 'Now tab' },
            { key: '2', desc: 'Pipeline tab' },
            { key: '/', desc: 'Focus search' },
            { key: 'r', desc: 'Refresh' },
            { key: '?', desc: 'Toggle shortcuts' },
          ].map(s => (
            <div key={s.key} className="flex items-center justify-between py-1">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.desc}</span>
              <kbd
                className="px-2 py-0.5 rounded text-[10px] font-mono font-medium"
                style={{
                  background: 'var(--bg-muted)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
