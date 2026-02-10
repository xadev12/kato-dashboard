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
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header 
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{ 
          background: 'rgba(250, 249, 247, 0.85)',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2.5">
                <div 
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ background: 'var(--accent-primary)' }}
                >
                  K
                </div>
                <span 
                  className="text-lg font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Kato
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav 
                className="hidden lg:flex items-center gap-1 p-1 rounded-lg ml-4"
                style={{ 
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
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
          <nav 
            className="lg:hidden flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
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
      className={`${mobile ? 'flex-shrink-0' : ''} px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap`}
      style={{
        background: active ? 'rgba(139, 115, 85, 0.1)' : 'transparent',
        color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
        border: active ? '1px solid rgba(139, 115, 85, 0.15)' : '1px solid transparent',
        boxShadow: active ? 'var(--shadow-sm)' : 'none'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = 'var(--text-primary)'
          e.currentTarget.style.background = 'var(--bg-muted)'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = 'var(--text-secondary)'
          e.currentTarget.style.background = 'transparent'
        }
      }}
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
