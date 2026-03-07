import { useState, useCallback } from 'react'
import { useNowData } from '../hooks/useNowData'
import { NeedsYou } from '../components/now/NeedsYou'
import { ActiveWork } from '../components/now/ActiveWork'
import { ReadyForDeploy } from '../components/now/ReadyForDeploy'
import { MappedOutWork } from '../components/now/MappedOutWork'
import { AgentStatusSection } from '../components/now/AgentStatusSection'
import { TokenUsageSection } from '../components/now/TokenUsageSection'
import { ProgressLog } from '../components/now/ProgressLog'
import { RecentlyCompleted } from '../components/now/RecentlyCompleted'
import { CollapsibleSection } from '../components/now/CollapsibleSection'
import { DetailDrawer } from '../components/now/DetailDrawer'
import type { DrawerContent } from '../types/now'

export function NowTab() {
  const data = useNowData()
  const [drawerContent, setDrawerContent] = useState<DrawerContent | null>(null)

  const openDrawer = useCallback((content: DrawerContent) => {
    setDrawerContent(content)
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawerContent(null)
  }, [])

  if (data.loading) {
    return <LoadingSkeleton />
  }

  if (data.error && !data.needsYou.length && !data.kanbanTasks.length) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm" style={{ color: 'var(--error)' }}>{data.error}</p>
        <button onClick={data.refresh} className="btn btn-secondary btn-sm mt-3">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2 animate-fade-in pb-8">
      {/* Section 1: Needs You (pinned, never collapses) */}
      <NeedsYou items={data.needsYou} />

      {/* Section 2: Active Work Kanban (always visible) */}
      <ActiveWork
        tasks={data.kanbanTasks}
        projects={data.projectSummaries}
        onOpenDrawer={openDrawer}
      />

      {/* Section 3: Ready for Deploy (always visible when non-empty) */}
      <ReadyForDeploy items={data.deployReady} />

      {/* Section 4: Mapped Out Work (collapsed by default) */}
      <CollapsibleSection
        title="Mapped Out Work"
        count={data.mappedOut.reduce((s, p) => s + p.tasks.length, 0)}
      >
        <MappedOutWork projects={data.mappedOut} />
      </CollapsibleSection>

      {/* Section 5: Agent Status (expanded by default) */}
      <CollapsibleSection title="Agent Status" count={data.agents.length} defaultExpanded>
        <AgentStatusSection
          agents={data.agents}
          workerQueue={data.workerQueue}
          modelHealth={data.modelHealth}
          onOpenDrawer={openDrawer}
        />
      </CollapsibleSection>

      {/* Section 6: Token Usage (collapsed by default) */}
      <CollapsibleSection title="Token Usage">
        <TokenUsageSection budget={data.tokenBudget} />
      </CollapsibleSection>

      {/* Section 7: Progress Log (collapsed by default) */}
      <CollapsibleSection title="Progress Log" count={data.progressLog.length}>
        <ProgressLog events={data.progressLog} />
      </CollapsibleSection>

      {/* Section 8: Recently Completed (collapsed by default) */}
      <CollapsibleSection title="Recently Completed" count={data.recentlyCompleted.length}>
        <RecentlyCompleted items={data.recentlyCompleted} />
      </CollapsibleSection>

      {/* Detail Drawer */}
      <DetailDrawer content={drawerContent} onClose={closeDrawer} />
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Needs You skeleton */}
      <div className="h-6 w-32 rounded" style={{ background: 'var(--bg-muted)' }} />
      <div className="h-20 rounded-lg" style={{ background: 'var(--bg-muted)' }} />

      {/* Active Work skeleton */}
      <div className="h-6 w-28 rounded mt-6" style={{ background: 'var(--bg-muted)' }} />
      <div className="space-y-2">
        <div className="h-10 rounded-lg" style={{ background: 'var(--bg-muted)' }} />
        <div className="h-10 rounded-lg" style={{ background: 'var(--bg-muted)' }} />
      </div>
      <div className="grid grid-cols-3 gap-3 mt-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-2">
            <div className="h-5 w-24 rounded" style={{ background: 'var(--bg-muted)' }} />
            <div className="h-16 rounded-lg" style={{ background: 'var(--bg-muted)' }} />
            <div className="h-16 rounded-lg" style={{ background: 'var(--bg-muted)' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
