import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function NewConsultant() {
  const { team } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!team) {
      setError('Team not loaded yet. Try refreshing the page.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const insertPromise = supabase
        .from('consultants')
        .insert({
          team_id: team.id,
          name,
          specialty,
          notes: notes || null,
        })
        .select('id')
        .single()

      const timeoutMs = 15000
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs / 1000}s. Please try again.`)), timeoutMs)
      })

      const { data, error: insertError } = await Promise.race([
        insertPromise,
        timeoutPromise,
      ])

      if (insertError) {
        const lower = insertError.message.toLowerCase()
        const looksLikeNotFound =
          lower.includes('schema cache') ||
          lower.includes('not found') ||
          lower.includes('could not find')

        const message = looksLikeNotFound
          ? `${insertError.message} If you’re seeing a 404 in the browser Network tab, this usually means PostgREST can’t see the table (schema not applied) or the Supabase URL is wrong.`
          : insertError.message

        setError(message)
        return
      }

      const newId = (data as { id?: string } | null)?.id
      if (!newId) {
        setError(
          'Consultant may have been created, but the app could not read it back. This is usually an RLS policy issue. Try refreshing and checking the Consultants list.'
        )
        return
      }

      navigate(`/consultant/${newId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Link
        to="/consultants"
        className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      <h1 className="text-2xl font-bold mb-6">Add Consultant</h1>

      <div className="card">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="label">Name *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="e.g., Dr Smith, Mr Jones"
              required
            />
          </div>

          <div>
            <label htmlFor="specialty" className="label">Specialty</label>
            <input
              id="specialty"
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="input"
              placeholder="e.g., Cardiac, Orthopaedics, General Surgery"
            />
          </div>

          <div>
            <label htmlFor="notes" className="label">General Notes</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input min-h-[100px]"
              placeholder="Any general notes about this consultant (e.g., prefers morning lists, always wants art line first...)"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Adding...' : 'Add Consultant'}
            </button>
            <Link to="/consultants" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
