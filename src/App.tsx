import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { MissionControl } from './pages/MissionControl'
import { Projects } from './pages/Projects'
import { ProjectDetail } from './pages/ProjectDetail'
import { TokenDashboard } from './pages/TokenDashboard'
import { AgentRoster } from './pages/AgentRoster'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Main Dashboard - Mission Control */}
          <Route path="/" element={<MissionControl />} />

          {/* Projects */}
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />

          {/* Tokens */}
          <Route path="/tokens" element={<TokenDashboard />} />

          {/* Agent Roster */}
          <Route path="/roster" element={<AgentRoster />} />

          {/* Redirects for removed pages */}
          <Route path="/legacy" element={<Navigate to="/" replace />} />
          <Route path="/actions" element={<Navigate to="/" replace />} />
          <Route path="/memory" element={<Navigate to="/" replace />} />
          <Route path="/activity" element={<Navigate to="/" replace />} />
          <Route path="/calendar" element={<Navigate to="/" replace />} />
          <Route path="/search" element={<Navigate to="/" replace />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
