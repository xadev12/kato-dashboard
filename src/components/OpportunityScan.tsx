import { useEffect, useState } from 'react';

interface Opportunity {
  id: string;
  type: 'blocker' | 'ready' | 'opportunity' | 'suggestion' | 'deadline';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  project?: string;
  action: string;
  discoveredAt: string;
  expiresAt: string;
}

interface OpportunityScanData {
  lastScan: string;
  items: Opportunity[];
  scanCount: number;
}

export function OpportunityScan({ data }: { data?: OpportunityScanData }) {
  const [lastScanAgo, setLastScanAgo] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
  
  const getTypeIcon = (type: Opportunity['type']) => {
    switch (type) {
      case 'blocker': return <BlockerIcon className="w-4 h-4" />;
      case 'ready': return <ReadyIcon className="w-4 h-4" />;
      case 'deadline': return <DeadlineIcon className="w-4 h-4" />;
      case 'opportunity': return <OpportunityIcon className="w-4 h-4" />;
      case 'suggestion': return <SuggestionIcon className="w-4 h-4" />;
      default: return <OpportunityIcon className="w-4 h-4" />;
    }
  };
  
  const getTypeColor = (type: Opportunity['type']) => {
    switch (type) {
      case 'blocker': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'ready': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'deadline': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'opportunity': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'suggestion': return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };
  
  const getPriorityColor = (priority: Opportunity['priority']) => {
    switch (priority) {
      case 'high': return 'text-rose-400';
      case 'medium': return 'text-amber-400';
      case 'low': return 'text-gray-400';
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Opportunity Scan</h2>
          <p className="text-xs text-gray-500">Productive opportunities detected</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Last scan: {lastScanAgo || 'never'}</span>
          <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-xs font-medium border border-cyan-500/20">
            #{data?.scanCount || 0}
          </span>
        </div>
      </div>
      
      {/* Opportunities List */}
      <div className="space-y-2">
        {opportunities.length === 0 ? (
          <EmptyState 
            icon={<ScanIcon className="w-5 h-5 text-gray-400" />}
            title="No opportunities detected"
            subtitle="System is running smoothly"
          />
        ) : (
          opportunities.slice(0, 5).map((opp) => (
              <OpportunityCard
                key={opp.id}
                opp={opp}
                isExpanded={expandedId === opp.id}
                onToggle={() => setExpandedId(expandedId === opp.id ? null : opp.id)}
                getTypeColor={getTypeColor}
                getTypeIcon={getTypeIcon}
                getPriorityColor={getPriorityColor}
              />
          ))
        )}
      </div>

      {opportunities.length > 5 && (
        <div className="text-center text-xs text-gray-500">
          +{opportunities.length - 5} more opportunities
        </div>
      )}
    </div>
  );
}

function OpportunityCard({
  opp,
  isExpanded,
  onToggle,
  getTypeColor,
  getTypeIcon,
  getPriorityColor
}: {
  opp: Opportunity;
  isExpanded: boolean;
  onToggle: () => void;
  getTypeColor: (type: Opportunity['type']) => string;
  getTypeIcon: (type: Opportunity['type']) => React.ReactNode;
  getPriorityColor: (priority: Opportunity['priority']) => string;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full text-left p-3 rounded-xl bg-[#111111] border border-white/[0.06] hover:border-white/[0.1] transition-all group cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${getTypeColor(opp.type)}`}>
          {getTypeIcon(opp.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-gray-200 truncate">{opp.title}</h4>
            <span className={`text-[10px] uppercase ${getPriorityColor(opp.priority)}`}>
              {opp.priority}
            </span>
            <ChevronIcon className={`w-3 h-3 text-gray-500 ml-auto flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
          <p className={`text-xs text-gray-500 mb-2 ${isExpanded ? '' : 'line-clamp-2'}`}>{opp.description}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.05] text-gray-400">
              {opp.action}
            </span>
            {opp.project && (
              <span className="text-[10px] text-gray-600">{opp.project}</span>
            )}
          </div>
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-1.5">
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-gray-600">Discovered:</span>
                <span className="text-gray-400">{new Date(opp.discoveredAt).toLocaleString()}</span>
              </div>
              {opp.expiresAt && (
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-gray-600">Expires:</span>
                  <span className="text-gray-400">{new Date(opp.expiresAt).toLocaleString()}</span>
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
      case 'current': return 'text-amber-400 bg-amber-500/10';
      case 'planned': return 'text-cyan-400 bg-cyan-500/10';
      case 'upcoming': return 'text-gray-400 bg-gray-500/10';
      case 'system': return 'text-emerald-400 bg-emerald-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-amber-400 animate-ping opacity-75" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Kato's Queue</h2>
            <p className="text-xs text-gray-500">Autonomous planning & execution</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Updated {lastUpdateAgo || 'never'}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
            data?.mode === 'autonomous' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
          }`}>
            {data?.mode === 'autonomous' ? 'Auto' : 'Manual'}
          </span>
        </div>
      </div>
      
      {/* Stats */}
      <div className="flex gap-2">
        <div className="flex-1 p-2 rounded-lg bg-white/[0.03] text-center">
          <div className="text-lg font-semibold text-amber-400">{currentTasks.length}</div>
          <div className="text-[10px] text-gray-500">Active</div>
        </div>
        <div className="flex-1 p-2 rounded-lg bg-white/[0.03] text-center">
          <div className="text-lg font-semibold text-cyan-400">{plannedTasks.length}</div>
          <div className="text-[10px] text-gray-500">Planned</div>
        </div>
        <div className="flex-1 p-2 rounded-lg bg-white/[0.03] text-center">
          <div className="text-lg font-semibold text-emerald-400">{systemTasks.length}</div>
          <div className="text-[10px] text-gray-500">System</div>
        </div>
      </div>
      
      {/* Task List */}
      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
        {tasks.length === 0 ? (
          <EmptyState
            icon={<QueueIcon className="w-5 h-5 text-gray-400" />}
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
  kato: 'bg-cyan-500',
  yuki: 'bg-violet-500',
  koji: 'bg-amber-500',
  sora: 'bg-emerald-500',
  karin: 'bg-rose-500',
};

function AgentAvatar({ name }: { name: string }) {
  const color = AGENT_COLORS[name.toLowerCase()] || 'bg-gray-500';
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className={`w-5 h-5 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
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
  getTaskColor: (type: KatoTask['type']) => string;
}) {
  const progress = getTaskProgress(task.startedAt, task.estimatedComplete);
  const timeLeft = getEstimatedTimeLeft(task.estimatedComplete);

  return (
    <div className="p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
      <div className="flex items-center gap-3">
        <div className={`p-1.5 rounded ${getTaskColor(task.type)}`}>
          {getTaskIcon(task.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-200 truncate">{task.title}</p>
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            {task.project && <span>{task.project}</span>}
            {task.assignedAgent && (
              <span className="flex items-center gap-1 text-cyan-400">
                <AgentAvatar name={task.assignedAgent} />
                {task.assignedAgent}
              </span>
            )}
            {task.reason && <span className="text-gray-600">{task.reason}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            task.status === 'in_progress'
              ? 'bg-amber-500/10 text-amber-400'
              : 'bg-gray-500/10 text-gray-400'
          }`}>
            {task.status}
          </span>
          {timeLeft && (
            <span className={`text-[9px] ${timeLeft === 'overdue' ? 'text-rose-400' : 'text-gray-500'}`}>
              {timeLeft}
            </span>
          )}
        </div>
      </div>
      {/* Progress bar for current tasks */}
      {task.type === 'current' && progress !== null && (
        <div className="mt-2 ml-9">
          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progress >= 100 ? 'bg-rose-500' : 'bg-amber-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="p-6 rounded-xl bg-[#111111] border border-white/[0.06] text-center">
      <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-white/[0.05] flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-white mb-1">{title}</h3>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}

// Icons
function ScanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

function QueueIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
