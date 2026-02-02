import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { AgentDashboard } from './pages/AgentDashboard'
import { ProjectDetail } from './pages/ProjectDetail'
import { MyActions } from './pages/MyActions'
import { AgentRoster } from './pages/AgentRoster'
import { MemoryManager } from './pages/MemoryManager'
import { TokenDashboard } from './pages/TokenDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<AgentDashboard />} />
          <Route path="/legacy" element={<Dashboard />} />
          <Route path="/actions" element={<MyActions />} />
          <Route path="/roster" element={<AgentRoster />} />
          <Route path="/memory" element={<MemoryManager />} />
          <Route path="/tokens" element={<TokenDashboard />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
