import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Filter, FileText, MessageSquare, Folder, Clock, ArrowRight } from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  content: string
  source: 'memory' | 'session' | 'project' | 'townsquare' | 'roadmap'
  path?: string
  timestamp?: string
  relevance: number
}

const SOURCES = [
  { id: 'memory', label: 'Memory', icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'session', label: 'Sessions', icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { id: 'project', label: 'Projects', icon: Folder, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: 'townsquare', label: 'Town Square', icon: MessageSquare, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { id: 'roadmap', label: 'Roadmap', icon: Clock, color: 'text-pink-400', bg: 'bg-pink-400/10' },
]

export function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [inputValue, setInputValue] = useState(query)

  useEffect(() => {
    if (query) {
      performSearch(query)
    }
  }, [query])

  const performSearch = async (searchQuery: string) => {
    setLoading(true)
    try {
      // Mock results - will be replaced with API
      const mockResults = [
        {
          id: '1',
          title: 'Move iOS Pipeline Configuration',
          content: 'Pipeline for Activity Feed feature with stages: idea → prd → review → spec → implementation → qa → deploy',
          source: 'project' as const,
          path: '/projects/move-activity-feed/pipeline.json',
          relevance: 0.95,
        },
        {
          id: '2',
          title: 'CLI-Direct Coding Pattern',
          content: 'All coding tasks use CLI agents in isolated git worktrees. Priority: Codex > Claude Code > Kimi',
          source: 'memory' as const,
          path: '/Users/devl/clawd/MEMORY.md',
          timestamp: '2026-02-04',
          relevance: 0.88,
        },
        {
          id: '3',
          title: 'Kato Dashboard Architecture',
          content: 'React + TypeScript frontend with Express backend. SQLite for local data, syncs with real sources.',
          source: 'project' as const,
          path: '/kato-dashboard/README.md',
          relevance: 0.82,
        },
        {
          id: '4',
          title: '60-Day Sprint Goals',
          content: 'Targets: $5K/month income by Apr 6, 10kg weight loss (91.9→81.9kg), Horoscope/MBTI app live',
          source: 'roadmap' as const,
          path: '/Users/devl/clawd/ROADMAP.md',
          relevance: 0.78,
        },
        {
          id: '5',
          title: 'Colosseum Hackathon Update',
          content: 'Agent status: claimed and linked to X. Project: SKILLISSUE by skillissue-builder',
          source: 'townsquare' as const,
          path: '/Users/devl/clawd/TOWN-SQUARE.md',
          timestamp: '2026-02-05',
          relevance: 0.72,
        },
      ] as SearchResult[]

      const filtered = mockResults.filter(r =>
        (selectedSources.length === 0 || selectedSources.includes(r.source)) &&
        (r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
         r.content.toLowerCase().includes(searchQuery.toLowerCase()))
      )

      setResults(filtered)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchParams({ q: inputValue })
  }

  const toggleSource = (source: string) => {
    setSelectedSources(prev =>
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    )
  }

  const openResult = (result: SearchResult) => {
    if (result.path) {
      // Open file in default application
      window.open(`file://${result.path}`, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-3 mb-4">
            <Search className="w-6 h-6 text-blue-400" />
            Search Results
          </h1>

          {/* Search Input */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search across all your OpenClaw data..."
              className="w-full pl-12 pr-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:border-blue-500/50"
            />
          </form>
        </div>

        {/* Source Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex items-center gap-2 mr-4">
            <Filter className="w-4 h-4 text-[var(--text-tertiary)]" />
            <span className="text-sm text-[var(--text-secondary)]">Filter by source:</span>
          </div>
          {SOURCES.map(source => {
            const Icon = source.icon
            const isSelected = selectedSources.includes(source.id)
            return (
              <button
                key={source.id}
                onClick={() => toggleSource(source.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
                  isSelected
                    ? `${source.bg} ${source.color} border border-current`
                    : 'bg-white/5 text-[var(--text-secondary)] border border-white/10 hover:bg-white/10'
                }`}
              >
                <Icon className="w-3 h-3" />
                {source.label}
              </button>
            )
          })}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
          </div>
        ) : results.length === 0 ? (
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] p-12 text-center">
            <Search className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--text-secondary)] mb-2">
              {query ? `No results for "${query}"` : 'Enter a search term'}
            </h3>
            <p className="text-[var(--text-tertiary)]">
              {query 
                ? 'Try different keywords or filters'
                : 'Search across memories, projects, tasks, and more'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-[var(--text-tertiary)] mb-4">
              <span>{results.length} results for "{query}"</span>
              <span>Sorted by relevance</span>
            </div>

            {results.map(result => {
              const source = SOURCES.find(s => s.id === result.source)
              const Icon = source?.icon || FileText

              return (
                <div
                  key={result.id}
                  onClick={() => openResult(result)}
                  className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] p-4 hover:border-[var(--border-medium)] cursor-pointer group transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${source?.bg} ${source?.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-[var(--text-primary)] group-hover:text-blue-400 transition-colors">
                          {result.title}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${source?.bg} ${source?.color}`}>
                          {source?.label}
                        </span>
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {(result.relevance * 100).toFixed(0)}% match
                        </span>
                      </div>

                      <p className="text-sm text-[var(--text-secondary)] mb-2">{result.content}</p>

                      <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                        {result.path && (
                          <span className="truncate max-w-md">{result.path}</span>
                        )}
                        {result.timestamp && (
                          <>
                            <span>•</span>
                            <span>{result.timestamp}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <ArrowRight className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
