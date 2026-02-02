import { Link, useLocation } from 'react-router-dom'
import { AgentIndicator } from './AgentIndicator'

const navItems = [
  { path: '/', label: 'Agent View', icon: '', badge: false },
  { path: '/actions', label: 'My Actions', icon: '', badge: true },
  { path: '/roster', label: 'Roster', icon: '', badge: false },
  { path: '/memory', label: 'Memory', icon: '', badge: false },
  { path: '/tokens', label: 'Tokens', icon: '', badge: false },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const currentPath = location.pathname

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 text-sm font-bold text-white">
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
                    active={currentPath === item.path}
                    label={item.label}
                    icon={item.icon}
                    badge={item.badge}
                  />
                ))}
              </nav>

              {/* Legacy Link - Desktop */}
              <nav className="hidden lg:flex items-center gap-1 p-1 bg-white/[0.03] rounded-lg border border-white/[0.06] ml-2">
                <NavLink
                  to="/legacy"
                  active={currentPath === '/legacy'}
                  label="Kanban"
                  icon=""
                />
              </nav>
            </div>
            
            <AgentIndicator />
          </div>
          
          {/* Mobile Navigation */}
          <nav className="lg:hidden flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                active={currentPath === item.path}
                label={item.label}
                icon={item.icon}
                badge={item.badge}
                mobile
              />
            ))}
            <NavLink
              to="/legacy"
              active={currentPath === '/legacy'}
              label="Kanban"
              icon=""
              mobile
            />
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
  badge, 
  mobile 
}: { 
  to: string
  active: boolean
  label: string
  icon: string
  badge?: boolean
  mobile?: boolean
}) {
  return (
    <Link
      to={to}
      className={`${mobile ? 'flex-shrink-0' : ''} px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
        active
          ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/10 text-violet-300 border border-violet-500/20 shadow-sm'
          : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
      }`}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
      {badge && active && (
        <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/20">
          2
        </span>
      )}
      {badge && !active && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
        </span>
      )}
    </Link>
  )
}
