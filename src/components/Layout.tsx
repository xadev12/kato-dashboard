import { Link, useLocation } from 'react-router-dom'
import { AgentIndicator } from './AgentIndicator'
import { GlobalSearch } from './GlobalSearch'

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/projects', label: 'Projects', icon: 'projects' },
  { path: '/tokens', label: 'Tokens', icon: 'tokens' },
  { path: '/roster', label: 'Roster', icon: 'roster' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const currentPath = location.pathname

  // Check if path matches (exact for /, prefix for others)
  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/'
    return currentPath.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-[#030712]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#030712]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 text-sm font-bold text-white">
                  K
                </div>
                <span className="text-lg font-semibold text-white">Kato</span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-1 p-1 bg-white/[0.03] rounded-lg border border-white/[0.06] ml-4">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    active={isActive(item.path)}
                    label={item.label}
                    icon={item.icon}
                  />
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <GlobalSearch />
              <AgentIndicator />
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="lg:hidden flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                active={isActive(item.path)}
                label={item.label}
                icon={item.icon}
                mobile
              />
            ))}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}

// Nav Link Component
function NavLink({
  to,
  active,
  label,
  icon,
  mobile
}: {
  to: string
  active: boolean
  label: string
  icon: string
  mobile?: boolean
}) {
  return (
    <Link
      to={to}
      className={`${mobile ? 'flex-shrink-0' : ''} px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
        active
          ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm'
          : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
      }`}
    >
      <NavIcon name={icon} className="w-4 h-4" />
      <span>{label}</span>
    </Link>
  )
}

// Nav Icons
function NavIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case 'dashboard':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      )
    case 'projects':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      )
    case 'tokens':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v12" />
          <path d="M8 10c2-1 6-1 8 0" />
          <path d="M8 14c2 1 6 1 8 0" />
        </svg>
      )
    case 'roster':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    default:
      return null
  }
}
