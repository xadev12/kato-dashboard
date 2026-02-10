import { useEffect, useState, useMemo } from 'react';

// Enhanced Opportunity interface with source, category, and action status
interface Opportunity {
  id: string;
  type: 'blocker' | 'ready' | 'opportunity' | 'suggestion' | 'deadline' | 'idea' | 'system';
  category?: 'project' | 'system' | 'external' | 'roadmap';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  project?: string;
  source?: string;
  action: string;
  discoveredAt: string;
  expiresAt: string;
  // Action tracking
  status?: 'active' | 'acted' | 'dismissed' | 'expired';
  actedAt?: string;
  dismissedAt?: string;
}

interface OpportunityScanData {
  lastScan: string;
  items: Opportunity[];
  scanCount: number;
  metrics?: {
    conversionRate: number;
    totalSeen: number;
    totalConverted: number;
    totalIgnored: number;
    currentActive: number;
  };
}

export function OpportunityScan({ data }: { data?: OpportunityScanData }) {
  const [lastScanAgo, setLastScanAgo] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  // Local action state (acts/dismisses) — in production this would persist to backend
  const [actionState, setActionState] = useState<Record<string, 'acted' | 'dismissed'>>({});

  useEffect(() => {
    if (!data?.lastScan) return;

    const updateAgo = () => {
      const diff = Date.now() - new Date(data.lastScan).getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) setLastScanAgo('just now');
      else if (minutes < 60) setLastScanAgo(`${minutes}m ago`);
      else setLastScanAgo(`${Math.floor(minutes / 60)}h ago`);
    };

    updateAgo();
    const interval = setInterval(updateAgo, 60000);
    return () => clearInterval(interval);
  }, [data?.lastScan]);

  const opportunities = data?.items || [];

  // Split into active vs archived based on local action state
  const { activeOpportunities, archivedOpportunities } = useMemo(() => {
    const active: Opportunity[] = [];
    const archived: Opportunity[] = [];

    for (const opp of opportunities) {
      const localStatus = actionState[opp.id];
      if (localStatus) {
        archived.push({ ...opp, status: localStatus });
      } else if (opp.status === 'acted' || opp.status === 'dismissed' || opp.status === 'expired') {
        archived.push(opp);
      } else {
        active.push(opp);
      }
    }

    return { activeOpportunities: active, archivedOpportunities: archived };
  }, [opportunities, actionState]);

  // Sort: P0/ROADMAP items first, then by priority, then blockers first
  const sortedOpportunities = useMemo(() => {
    const items = showArchive ? archivedOpportunities : activeOpportunities;

    return [...items].sort((a, b) => {
      // P0/ROADMAP items always first
      const aIsP0 = a.source === 'ROADMAP' || a.category === 'roadmap' || a.priority === 'high';
      const bIsP0 = b.source === 'ROADMAP' || b.category === 'roadmap' || b.priority === 'high';
      if (aIsP0 && !bIsP0) return -1;
      if (!aIsP0 && bIsP0) return 1;

      // Then blockers
      if (a.type === 'blocker' && b.type !== 'blocker') return -1;
      if (a.type !== 'blocker' && b.type === 'blocker') return 1;

      // Then by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    });
  }, [activeOpportunities, archivedOpportunities, showArchive]);

  const handleAct = (id: string) => {
    setActionState(prev => ({ ...prev, [id]: 'acted' }));
    setExpandedId(null);
  };

  const handleDismiss = (id: string) => {
    setActionState(prev => ({ ...prev, [id]: 'dismissed' }));
    setExpandedId(null);
  };

  // Conversion metrics
  const metrics = data?.metrics;
  const actedCount = Object.values(actionState).filter(s => s === 'acted').length + (metrics?.totalConverted || 0);
  const dismissedCount = Object.values(actionState).filter(s => s === 'dismissed').length + (metrics?.totalIgnored || 0);

  const getTypeIcon = (type: Opportunity['type']) => {
    switch (type) {
      case 'blocker': return <BlockerIcon className="w-4 h-4" />;
      case 'ready': return <ReadyIcon className="w-4 h-4" />;
      case 'deadline': return <DeadlineIcon className="w-4 h-4" />;
      case 'opportunity': return <OpportunityIcon className="w-4 h-4" />;
      case 'suggestion': return <SuggestionIcon className="w-4 h-4" />;
      case 'idea': return <IdeaIcon className="w-4 h-4" />;
      case 'system': return <SystemTaskIcon className="w-4 h-4" />;
      default: return <OpportunityIcon className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: Opportunity['type']) => {
    switch (type) {
      case 'blocker': return { bg: 'var(--error-muted)', color: 'var(--error)', border: 'rgba(184, 122, 122, 0.2)' };
      case 'ready': return { bg: 'var(--success-muted)', color: 'var(--success)', border: 'rgba(122, 158, 126, 0.2)' };
      case 'deadline': return { bg: 'var(--warning-muted)', color: 'var(--warning)', border: 'rgba(201, 169, 89, 0.2)' };
      case 'opportunity': return { bg: 'rgba(139, 115, 85, 0.08)', color: 'var(--accent-primary)', border: 'rgba(139, 115, 85, 0.15)' };
      case 'suggestion': return { bg: 'var(--bg-muted)', color: 'var(--text-secondary)', border: 'var(--border-subtle)' };
      case 'idea': return { bg: 'rgba(139, 125, 184, 0.08)', color: '#8B7DB8', border: 'rgba(139, 125, 184, 0.15)' };
      case 'system': return { bg: 'var(--success-muted)', color: 'var(--success)', border: 'rgba(122, 158, 126, 0.2)' };
      default: return { bg: 'var(--bg-muted)', color: 'var(--text-secondary)', border: 'var(--border-subtle)' };
    }
  };

  const getPriorityColor = (priority: Opportunity['priority']) => {
    switch (priority) {
      case 'high': return 'var(--error)';
      case 'medium': return 'var(--warning)';
      case 'low': return 'var(--text-tertiary)';
    }
  };

  const getSourceColor = (source?: string) => {
    switch (source) {
      case 'ROADMAP': return { bg: 'rgba(139, 115, 85, 0.08)', color: 'var(--accent-primary)' };
      case 'Project': return { bg: 'var(--warning-muted)', color: 'var(--warning)' };
      case 'External': return { bg: 'rgba(139, 125, 184, 0.08)', color: '#8B7DB8' };
      case 'System': return { bg: 'var(--success-muted)', color: 'var(--success)' };
      default: return { bg: 'var(--bg-muted)', color: 'var(--text-tertiary)' };
    }
  };

  const displayedItems = sortedOpportunities.slice(0, 8);
  const remainingCount = sortedOpportunities.length - displayedItems.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Opportunity Scan</h2>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {showArchive ? 'History & dismissed items' : 'Productive opportunities detected'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Last scan: {lastScanAgo || 'never'}</span>
          <span
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{ background: 'rgba(139, 115, 85, 0.08)', color: 'var(--accent-primary)', border: '1px solid rgba(139, 115, 85, 0.15)' }}
          >
            #{data?.scanCount || 0}
          </span>
        </div>
      </div>

      {/* Conversion Metrics Bar */}
      {(actedCount > 0 || dismissedCount > 0) && (
        <div
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[10px]"
          style={{ background: 'var(--bg-muted)' }}
        >
          <span style={{ color: 'var(--text-tertiary)' }}>Tracking:</span>
          <span className="flex items-center gap-1" style={{ color: 'var(--success)' }}>
            <ReadyIcon className="w-3 h-3" /> {actedCount} acted
          </span>
          <span className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            <DismissIcon className="w-3 h-3" /> {dismissedCount} dismissed
          </span>
          <span style={{ color: 'var(--text-tertiary)' }}>
            {activeOpportunities.length} active
          </span>
        </div>
      )}

      {/* Archive Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowArchive(false)}
          className="px-2.5 py-1 rounded-lg text-xs transition-all duration-200"
          style={{
            background: !showArchive ? 'var(--bg-secondary)' : 'transparent',
            color: !showArchive ? 'var(--text-primary)' : 'var(--text-tertiary)',
            border: !showArchive ? '1px solid var(--border-subtle)' : '1px solid transparent',
            boxShadow: !showArchive ? 'var(--shadow-sm)' : 'none'
          }}
        >
          Active ({activeOpportunities.length})
        </button>
        <button
          onClick={() => setShowArchive(true)}
          className="px-2.5 py-1 rounded-lg text-xs transition-all duration-200"
          style={{
            background: showArchive ? 'var(--bg-secondary)' : 'transparent',
            color: showArchive ? 'var(--text-primary)' : 'var(--text-tertiary)',
            border: showArchive ? '1px solid var(--border-subtle)' : '1px solid transparent',
            boxShadow: showArchive ? 'var(--shadow-sm)' : 'none'
          }}
        >
          Archive ({archivedOpportunities.length})
        </button>
      </div>

      {/* Opportunities List */}
      <div className="space-y-2">
        {displayedItems.length === 0 ? (
          <EmptyState
            icon={<ScanIcon className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />}
            title={showArchive ? 'No archived items' : 'No opportunities detected'}
            subtitle={showArchive ? 'Acted or dismissed items appear here' : 'System is running smoothly'}
          />
        ) : (
          displayedItems.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opp={opp}
                isExpanded={expandedId === opp.id}
                onToggle={() => setExpandedId(expandedId === opp.id ? null : opp.id)}
                onAct={showArchive ? undefined : () => handleAct(opp.id)}
                onDismiss={showArchive ? undefined : () => handleDismiss(opp.id)}
                getTypeColor={getTypeColor}
                getTypeIcon={getTypeIcon}
                getPriorityColor={getPriorityColor}
                getSourceColor={getSourceColor}
              />
          ))
        )}
      </div>

      {remainingCount > 0 && (
        <div className="text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
          +{remainingCount} more {showArchive ? 'archived' : 'opportunities'}
        </div>
      )}
    </div>
  );
}

function OpportunityCard({
  opp,
  isExpanded,
  onToggle,
  onAct,
  onDismiss,
  getTypeColor,
  getTypeIcon,
  getPriorityColor,
  getSourceColor
}: {
  opp: Opportunity;
  isExpanded: boolean;
  onToggle: () => void;
  onAct?: () => void;
  onDismiss?: () => void;
  getTypeColor: (type: Opportunity['type']) => { bg: string; color: string; border: string };
  getTypeIcon: (type: Opportunity['type']) => React.ReactNode;
  getPriorityColor: (priority: Opportunity['priority']) => string;
  getSourceColor: (source?: string) => { bg: string; color: string };
}) {
  const typeColor = getTypeColor(opp.type);
  const sourceColor = getSourceColor(opp.source);
  const isArchived = opp.status === 'acted' || opp.status === 'dismissed' || opp.status === 'expired';

  return (
    <button
      onClick={onToggle}
      className="w-full text-left p-3 rounded-xl transition-all duration-300 cursor-pointer"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
        opacity: isArchived ? 0.7 : 1
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="p-2 rounded-lg"
          style={{ background: typeColor.bg, color: typeColor.color, border: `1px solid ${typeColor.border}` }}
        >
          {getTypeIcon(opp.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{opp.title}</h4>
            <span className="text-[10px] uppercase" style={{ color: getPriorityColor(opp.priority) }}>
              {opp.priority}
            </span>
            <ChevronIcon
              className={`w-3 h-3 ml-auto flex-shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              style={{ color: 'var(--text-tertiary)' }}
            />
          </div>
          <p
            className={`text-xs mb-2 ${isExpanded ? '' : 'line-clamp-2'}`}
            style={{ color: 'var(--text-secondary)' }}
          >
            {opp.description}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-1.5 py-0.5 rounded text-[10px]"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
            >
              {opp.action}
            </span>
            {/* Source badge */}
            {opp.source && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{ background: sourceColor.bg, color: sourceColor.color }}
              >
                {opp.source}
              </span>
            )}
            {/* Category badge */}
            {opp.category && (
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{opp.category}</span>
            )}
            {opp.project && (
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{opp.project}</span>
            )}
            {/* Archive status badge */}
            {isArchived && opp.status && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px]"
                style={{
                  background: opp.status === 'acted' ? 'var(--success-muted)' : 'var(--bg-muted)',
                  color: opp.status === 'acted' ? 'var(--success)' : 'var(--text-muted)'
                }}
              >
                {opp.status}
              </span>
            )}
          </div>
          {isExpanded && (
            <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-2 text-[10px]">
                <span style={{ color: 'var(--text-muted)' }}>Discovered:</span>
                <span style={{ color: 'var(--text-secondary)' }}>{new Date(opp.discoveredAt).toLocaleString()}</span>
              </div>
              {opp.expiresAt && (
                <div className="flex items-center gap-2 text-[10px]">
                  <span style={{ color: 'var(--text-muted)' }}>Expires:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{new Date(opp.expiresAt).toLocaleString()}</span>
                </div>
              )}
              {/* Action buttons */}
              {(onAct || onDismiss) && (
                <div className="flex items-center gap-2 mt-2">
                  {onAct && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onAct(); }}
                      className="px-3 py-1 rounded-lg text-[11px] font-medium transition-all duration-200"
                      style={{ background: 'var(--success-muted)', color: 'var(--success)', border: '1px solid rgba(122, 158, 126, 0.2)' }}
                    >
                      Act on it
                    </button>
                  )}
                  {onDismiss && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                      className="px-3 py-1 rounded-lg text-[11px] transition-all duration-200"
                      style={{ background: 'var(--bg-muted)', color: 'var(--text-tertiary)', border: '1px solid var(--border-subtle)' }}
                    >
                      Later
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// Kato's Autonomous Queue Component
interface KatoTask {
  id: string;
  type: 'current' | 'planned' | 'upcoming' | 'system';
  title: string;
  project?: string;
  projectId?: string;
  status: string;
  assignedAgent?: string;
  startedAt?: string;
  estimatedComplete?: string;
  plannedFor?: string;
  reason?: string;
}

interface KatoQueueData {
  lastUpdated: string;
  tasks: KatoTask[];
  mode: 'autonomous' | 'manual';
}

export function KatoQueue({ data }: { data?: KatoQueueData }) {
  const [lastUpdateAgo, setLastUpdateAgo] = useState('');

  useEffect(() => {
    if (!data?.lastUpdated) return;

    const updateAgo = () => {
      const diff = Date.now() - new Date(data.lastUpdated).getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) setLastUpdateAgo('just now');
      else if (minutes < 60) setLastUpdateAgo(`${minutes}m ago`);
      else setLastUpdateAgo(`${Math.floor(minutes / 60)}h ago`);
    };

    updateAgo();
    const interval = setInterval(updateAgo, 60000);
    return () => clearInterval(interval);
  }, [data?.lastUpdated]);

  const tasks = data?.tasks || [];
  const currentTasks = tasks.filter(t => t.type === 'current');
  const plannedTasks = tasks.filter(t => t.type === 'planned' || t.type === 'upcoming');
  const systemTasks = tasks.filter(t => t.type === 'system');

  const getTaskIcon = (type: KatoTask['type']) => {
    switch (type) {
      case 'current': return <CurrentIcon className="w-3.5 h-3.5" />;
      case 'planned': return <PlannedIcon className="w-3.5 h-3.5" />;
      case 'upcoming': return <UpcomingIcon className="w-3.5 h-3.5" />;
      case 'system': return <SystemIcon className="w-3.5 h-3.5" />;
    }
  };

  const getTaskColor = (type: KatoTask['type']) => {
    switch (type) {
      case 'current': return { bg: 'var(--warning-muted)', color: 'var(--warning)' };
      case 'planned': return { bg: 'rgba(139, 115, 85, 0.08)', color: 'var(--accent-primary)' };
      case 'upcoming': return { bg: 'var(--bg-muted)', color: 'var(--text-secondary)' };
      case 'system': return { bg: 'var(--success-muted)', color: 'var(--success)' };
      default: return { bg: 'var(--bg-muted)', color: 'var(--text-secondary)' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--warning)' }} />
            <div className="absolute inset-0 w-2 h-2 rounded-full animate-ping opacity-75" style={{ background: 'var(--warning)' }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Kato's Queue</h2>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Autonomous planning & execution</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Updated {lastUpdateAgo || 'never'}</span>
          <span
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{
              background: data?.mode === 'autonomous' ? 'var(--success-muted)' : 'var(--bg-muted)',
              color: data?.mode === 'autonomous' ? 'var(--success)' : 'var(--text-tertiary)',
              border: `1px solid ${data?.mode === 'autonomous' ? 'rgba(122, 158, 126, 0.2)' : 'var(--border-subtle)'}`
            }}
          >
            {data?.mode === 'autonomous' ? 'Auto' : 'Manual'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-2">
        <div className="flex-1 p-2 rounded-lg text-center" style={{ background: 'var(--bg-muted)' }}>
          <div className="text-lg font-semibold" style={{ color: 'var(--warning)' }}>{currentTasks.length}</div>
          <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Active</div>
        </div>
        <div className="flex-1 p-2 rounded-lg text-center" style={{ background: 'var(--bg-muted)' }}>
          <div className="text-lg font-semibold" style={{ color: 'var(--accent-primary)' }}>{plannedTasks.length}</div>
          <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Planned</div>
        </div>
        <div className="flex-1 p-2 rounded-lg text-center" style={{ background: 'var(--bg-muted)' }}>
          <div className="text-lg font-semibold" style={{ color: 'var(--success)' }}>{systemTasks.length}</div>
          <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>System</div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
        {tasks.length === 0 ? (
          <EmptyState
            icon={<QueueIcon className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />}
            title="Queue is empty"
            subtitle="Waiting for new tasks"
          />
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} getTaskIcon={getTaskIcon} getTaskColor={getTaskColor} />
          ))
        )}
      </div>
    </div>
  );
}

function getEstimatedTimeLeft(estimatedComplete?: string): string | null {
  if (!estimatedComplete) return null;
  const diff = new Date(estimatedComplete).getTime() - Date.now();
  if (diff <= 0) return 'overdue';
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `~${minutes}m left`;
  const hours = Math.floor(minutes / 60);
  return `~${hours}h left`;
}

function getTaskProgress(startedAt?: string, estimatedComplete?: string): number | null {
  if (!startedAt || !estimatedComplete) return null;
  const start = new Date(startedAt).getTime();
  const end = new Date(estimatedComplete).getTime();
  const now = Date.now();
  if (end <= start) return 100;
  const progress = Math.round(((now - start) / (end - start)) * 100);
  return Math.min(Math.max(progress, 0), 100);
}

const AGENT_COLORS: Record<string, string> = {
  kato: '#8B7355',
  yuki: '#8B7DB8',
  koji: '#C9A959',
  sora: '#7A9E7E',
  karin: '#B87A7A',
};

function AgentAvatar({ name }: { name: string }) {
  const color = AGENT_COLORS[name.toLowerCase()] || '#999999';
  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: color }}
    >
      <span className="text-[9px] font-bold text-white">{initial}</span>
    </div>
  );
}

function TaskCard({
  task,
  getTaskIcon,
  getTaskColor,
}: {
  task: KatoTask;
  getTaskIcon: (type: KatoTask['type']) => React.ReactNode;
  getTaskColor: (type: KatoTask['type']) => { bg: string; color: string };
}) {
  const progress = getTaskProgress(task.startedAt, task.estimatedComplete);
  const timeLeft = getEstimatedTimeLeft(task.estimatedComplete);
  const taskColor = getTaskColor(task.type);

  return (
    <div
      className="p-2.5 rounded-lg transition-all duration-200"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded" style={{ background: taskColor.bg, color: taskColor.color }}>
          {getTaskIcon(task.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
          <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
            {task.project && <span>{task.project}</span>}
            {task.assignedAgent && (
              <span className="flex items-center gap-1" style={{ color: 'var(--accent-primary)' }}>
                <AgentAvatar name={task.assignedAgent} />
                {task.assignedAgent}
              </span>
            )}
            {task.reason && <span style={{ color: 'var(--text-muted)' }}>{task.reason}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{
              background: task.status === 'in_progress' ? 'var(--warning-muted)' : 'var(--bg-muted)',
              color: task.status === 'in_progress' ? 'var(--warning)' : 'var(--text-tertiary)'
            }}
          >
            {task.status}
          </span>
          {timeLeft && (
            <span className="text-[9px]" style={{ color: timeLeft === 'overdue' ? 'var(--error)' : 'var(--text-tertiary)' }}>
              {timeLeft}
            </span>
          )}
        </div>
      </div>
      {/* Progress bar for current tasks */}
      {task.type === 'current' && progress !== null && (
        <div className="mt-2 ml-9">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: progress >= 100 ? 'var(--error)' : 'var(--warning)'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div
      className="p-6 rounded-xl text-center"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div
        className="w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center"
        style={{ background: 'var(--bg-muted)' }}
      >
        {icon}
      </div>
      <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{subtitle}</p>
    </div>
  );
}

// Icons
function ScanIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function BlockerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function ReadyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DeadlineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function OpportunityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function SuggestionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

function IdeaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  );
}

function SystemTaskIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function DismissIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function QueueIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function CurrentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function PlannedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function UpcomingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function SystemIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function ChevronIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
