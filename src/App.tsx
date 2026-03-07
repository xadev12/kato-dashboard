import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { NowTab } from './pages/NowTab'
import { Projects } from './pages/Projects'
import { ProjectDetail } from './pages/ProjectDetail'
import { TokenDashboard } from './pages/TokenDashboard'
import { AgentRoster } from './pages/AgentRoster'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Now Tab (default) */}
          <Route path="/" element={<NowTab />} />

          {/* Pipeline Tab — placeholder until Phase 2 */}
          <Route path="/pipeline" element={<PipelinePlaceholder />} />

          {/* Secondary pages */}
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/tokens" element={<TokenDashboard />} />
          <Route path="/roster" element={<AgentRoster />} />

          {/* Legacy redirects */}
          <Route path="/legacy" element={<Navigate to="/" replace />} />
          <Route path="/actions" element={<Navigate to="/" replace />} />
          <Route path="/memory" element={<Navigate to="/" replace />} />
          <Route path="/activity" element={<Navigate to="/" replace />} />
          <Route path="/calendar" element={<Navigate to="/" replace />} />
          <Route path="/search" element={<Navigate to="/" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

function PipelinePlaceholder() {
  return (
    <div className="py-12 text-center animate-fade-in">
      <div
        className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
        style={{ background: 'var(--bg-muted)' }}
      >
        <svg className="w-6 h-6" style={{ color: 'var(--text-tertiary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" />
          <polyline points="16 6 21 12 16 18" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        Pipeline
      </h2>
      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
        Full product factory view coming in Phase 2
      </p>
    </div>
  )
}
