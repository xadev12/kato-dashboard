import { useState } from 'react'

// Types for search results
interface SearchResult {
  title: string
  description: string
  url: string
}

interface SearchResponse {
  success: boolean
  results?: SearchResult[]
  error?: string
}

export function WebSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`)
      }

      const data: SearchResponse = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Search failed')
      }

      // Limit to max 10 results
      setResults(data.results?.slice(0, 10) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Web Search</h1>
        <p className="text-[var(--text-secondary)] text-sm">Search the web using Brave Search API</p>
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search the web..."
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] 
                         focus:outline-none focus:border-violet-500/30 focus:ring-1 focus:ring-violet-500/20
                         transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {/* Search icon */}
            <svg 
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)] pointer-events-none"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-[var(--text-primary)] font-medium
                       hover:from-violet-500 hover:to-purple-500 
                       active:from-violet-700 active:to-purple-700
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 shadow-lg shadow-violet-500/20
                       flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium">Search Error</p>
            <p className="text-sm text-rose-300/80">{error}</p>
          </div>
        </div>
      )}

      {/* Results Section */}
      <div className="space-y-4">
        {/* Results count */}
        {hasSearched && !isLoading && !error && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">
              {results.length > 0 ? `Found ${results.length} result${results.length !== 1 ? 's' : ''}` : 'No results found'}
            </span>
            {results.length === 10 && (
              <span className="text-violet-400 text-xs">Showing top 10 results</span>
            )}
          </div>
        )}

        {/* Results list */}
        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] 
                           transition-all duration-300 hover:border-[var(--border-medium)] hover:shadow-lg hover:shadow-violet-500/5"
              >
                {/* Subtle gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 opacity-0 
                                transition-opacity duration-300 group-hover:opacity-100" />
                
                <div className="relative z-10 p-5">
                  {/* Title link */}
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-lg font-semibold text-violet-400 hover:text-violet-300 
                               transition-colors mb-2 line-clamp-1"
                  >
                    {result.title}
                  </a>
                  
                  {/* Description */}
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3 line-clamp-2">
                    {result.description}
                  </p>
                  
                  {/* URL */}
                  <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span className="truncate">{result.url}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {hasSearched && !isLoading && !error && results.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-muted)] border border-[var(--border-subtle)] 
                            flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-[var(--text-secondary)] mb-1">No results found</p>
            <p className="text-sm text-[var(--text-tertiary)]">Try adjusting your search terms</p>
          </div>
        )}

        {/* Initial state */}
        {!hasSearched && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 
                            border border-[var(--border-subtle)] flex items-center justify-center">
              <svg className="w-10 h-10 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-[var(--text-secondary)] mb-2">Ready to search</p>
            <p className="text-sm text-[var(--text-tertiary)]">Enter a query above to search the web</p>
          </div>
        )}
      </div>
    </div>
  )
}
