import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, X, FileText, MessageSquare, Folder, Clock, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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
  { id: 'memory', label: 'Memory', icon: FileText, color: 'text-blue-400' },
  { id: 'session', label: 'Sessions', icon: MessageSquare, color: 'text-purple-400' },
  { id: 'project', label: 'Projects', icon: Folder, color: 'text-emerald-400' },
  { id: 'townsquare', label: 'Town Square', icon: MessageSquare, color: 'text-amber-400' },
  { id: 'roadmap', label: 'Roadmap', icon: Clock, color: 'text-pink-400' },
]

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Keyboard shortcut: Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      // This will be replaced with actual API call
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
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.content.toLowerCase().includes(searchQuery.toLowerCase())
      )

      setResults(filtered)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      performSearch(query)
    }, 300)
    return () => clearTimeout(timeout)
  }, [query, performSearch])

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false)
    setQuery('')
    
    // Navigate based on source
    switch (result.source) {
      case 'project':
        navigate(`/projects`)
        break
      case 'memory':
        navigate('/memory')
        break
      default:
        navigate('/search', { state: { query, result } })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex])
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-[var(--text-secondary)] transition-colors"
      >
        <Search className="w-4 h-4" />
        <span>Search...</span>
        <kbd className="ml-2 px-1.5 py-0.5 bg-white/10 rounded text-xs">⌘K</kbd>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Search Modal */}
      <div className="relative w-full max-w-2xl bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-subtle)] shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-[var(--border-subtle)]">
          <Search className="w-5 h-5 text-[var(--text-tertiary)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search memories, projects, tasks..."
            className="flex-1 bg-transparent text-lg placeholder:text-[var(--text-tertiary)] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-white/10 rounded"
            >
              <X className="w-4 h-4 text-[var(--text-tertiary)]" />
            </button>
          )}
          <kbd className="px-2 py-1 bg-white/10 rounded text-xs text-[var(--text-tertiary)]">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-[var(--text-tertiary)]">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto mb-2" />
              Searching...
            </div>
          ) : results.length === 0 ? (
            query ? (
              <div className="p-8 text-center text-[var(--text-tertiary)]">
                No results found for "{query}"
              </div>
            ) : (
              <div className="p-4">
                <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Recent</div>
                <div className="space-y-1">
                  {['Move iOS Pipeline', 'Kato Dashboard', '60-Day Sprint', 'CLI-Direct Pattern'].map((item, i) => (
                    <button
                      key={i}
                      onClick={() => setQuery(item)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <Clock className="w-4 h-4" />
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className="py-2">
              {results.map((result, index) => {
                const source = SOURCES.find(s => s.id === result.source)
                const Icon = source?.icon || FileText
                const isSelected = index === selectedIndex

                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full px-4 py-3 flex items-start gap-3 text-left transition-colors ${
                      isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className={`p-2 rounded-lg bg-white/5 ${source?.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--text-primary)]">{result.title}</span>
                        <span className={`text-xs ${source?.color}`}>{source?.label}</span>
                      </div>
                      <p className="text-sm text-[var(--text-tertiary)] mt-0.5 line-clamp-2">{result.content}</p>
                      {result.path && (
                        <p className="text-xs text-[var(--text-tertiary)] mt-1 truncate">{result.path}</p>
                      )}
                    </div>
                    {isSelected && (
                      <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] mt-1" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-primary)] border-t border-[var(--border-subtle)] text-xs text-[var(--text-tertiary)]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1 bg-white/10 rounded">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 bg-white/10 rounded">↵</kbd> Select
            </span>
          </div>
          <span>{results.length} results</span>
        </div>
      </div>
    </div>
  )
}
