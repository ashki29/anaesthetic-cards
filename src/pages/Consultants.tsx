import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Consultant } from '../lib/types'

export default function Consultants() {
  const { team } = useAuth()
  const [consultants, setConsultants] = useState<Consultant[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [error, setError] = useState<string>('')
  const [reloadNonce, setReloadNonce] = useState(0)

  useEffect(() => {
    let alive = true

    const run = async () => {
      if (!team?.id) return
      setLoading(true)
      setError('')
      try {
        const { data, error } = await supabase
          .from('consultants')
          .select('*')
          .eq('team_id', team.id)
          .order('name')

        if (!alive) return

        if (error) {
          setError(error.message)
          return
        }
        setConsultants(data ?? [])
      } catch (err) {
        if (!alive) return
        setError(err instanceof Error ? err.message : 'Failed to load consultants')
      } finally {
        if (alive) setLoading(false)
      }
    }

    void run()
    return () => {
      alive = false
    }
  }, [team?.id, reloadNonce])

  const specialties = [...new Set(consultants.map(c => c.specialty).filter(Boolean))]

  const filteredConsultants = filter
    ? consultants.filter(c => c.specialty === filter)
    : consultants

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-500">Loading consultants...</div>
    )
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <p className="text-slate-700 font-medium">Couldn’t load consultants</p>
        <p className="text-sm text-red-600 mt-2 break-words">{error}</p>
        <button
          onClick={() => setReloadNonce((n) => n + 1)}
          className="btn btn-primary mt-6"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Consultants</h1>
        <Link to="/consultant/new" className="btn btn-primary">
          + Add
        </Link>
      </div>

      {/* Filter by specialty */}
      {specialties.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('')}
            className={`px-3 py-1 rounded-full text-sm ${
              !filter
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {specialties.map((specialty) => (
            <button
              key={specialty}
              onClick={() => setFilter(specialty)}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === specialty
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {specialty}
            </button>
          ))}
        </div>
      )}

      {filteredConsultants.length === 0 ? (
        <div className="card text-center py-12 text-slate-500">
          <p>No consultants found.</p>
          <Link to="/consultant/new" className="text-blue-600 hover:underline mt-2 inline-block">
            Add your first consultant
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredConsultants.map((consultant) => (
            <Link
              key={consultant.id}
              to={`/consultant/${consultant.id}`}
              className="card block hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{consultant.name}</div>
                  <div className="text-sm text-slate-500">
                    {consultant.specialty || 'No specialty set'}
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
