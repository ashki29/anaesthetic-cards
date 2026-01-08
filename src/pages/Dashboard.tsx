import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Consultant, PreferenceCard } from '../lib/types'

interface SearchResult {
  type: 'consultant' | 'card'
  consultant: Consultant
  card?: PreferenceCard
}

export default function Dashboard() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentConsultants, setRecentConsultants] = useState<Consultant[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadRecentConsultants()
  }, [])

  useEffect(() => {
    if (query.trim()) {
      const timer = setTimeout(() => search(query), 300)
      return () => clearTimeout(timer)
    } else {
      setResults([])
    }
  }, [query])

  const loadRecentConsultants = async () => {
    const { data } = await supabase
      .from('consultants')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6)

    if (data) {
      setRecentConsultants(data)
    }
  }

  const search = async (searchQuery: string) => {
    setLoading(true)
    const searchResults: SearchResult[] = []

    // Search consultants
    const { data: consultants } = await supabase
      .from('consultants')
      .select('*')
      .ilike('name', `%${searchQuery}%`)
      .limit(5)

    if (consultants) {
      consultants.forEach(c => {
        searchResults.push({ type: 'consultant', consultant: c })
      })
    }

    // Search procedure cards
    const { data: cards } = await supabase
      .from('preference_cards')
      .select('*, consultant:consultants(*)')
      .ilike('procedure_name', `%${searchQuery}%`)
      .limit(10)

    if (cards) {
      cards.forEach((c: { consultant: Consultant } & PreferenceCard) => {
        searchResults.push({ type: 'card', consultant: c.consultant, card: c })
      })
    }

    setResults(searchResults)
    setLoading(false)
  }

  return (
    <div>
      {/* Search bar */}
      <div className="mb-6">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search consultants or procedures..."
            className="input pl-10 text-lg"
            autoFocus
          />
        </div>
      </div>

      {/* Search results */}
      {query && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-slate-500 mb-3">
            {loading ? 'Searching...' : `Results for "${query}"`}
          </h2>
          {results.length === 0 && !loading ? (
            <p className="text-slate-500 text-center py-8">
              No results found. Try a different search term.
            </p>
          ) : (
            <div className="space-y-2">
              {results.map((result, i) => (
                <Link
                  key={`${result.type}-${result.card?.id || result.consultant.id}-${i}`}
                  to={
                    result.type === 'card'
                      ? `/card/${result.card!.id}`
                      : `/consultant/${result.consultant.id}`
                  }
                  className="card block hover:border-blue-300 transition-colors"
                >
                  {result.type === 'card' ? (
                    <div>
                      <div className="font-medium">{result.card!.procedure_name}</div>
                      <div className="text-sm text-slate-500">
                        {result.consultant.name} - {result.consultant.specialty}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">{result.consultant.name}</div>
                      <div className="text-sm text-slate-500">
                        {result.consultant.specialty || 'No specialty set'}
                      </div>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick actions */}
      {!query && (
        <>
          <div className="flex gap-3 mb-6">
            <Link to="/consultant/new" className="btn btn-primary flex-1 text-center">
              + Add Consultant
            </Link>
            <Link to="/consultants" className="btn btn-secondary flex-1 text-center">
              View All
            </Link>
          </div>

          {/* Recent consultants */}
          <div>
            <h2 className="text-sm font-medium text-slate-500 mb-3">
              Recent Consultants
            </h2>
            {recentConsultants.length === 0 ? (
              <div className="card text-center py-8 text-slate-500">
                <p>No consultants yet.</p>
                <p className="text-sm mt-1">Add your first consultant to get started.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {recentConsultants.map((consultant) => (
                  <Link
                    key={consultant.id}
                    to={`/consultant/${consultant.id}`}
                    className="card hover:border-blue-300 transition-colors"
                  >
                    <div className="font-medium">{consultant.name}</div>
                    <div className="text-sm text-slate-500">
                      {consultant.specialty || 'No specialty set'}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
