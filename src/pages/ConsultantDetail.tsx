import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Consultant, PreferenceCard } from '../lib/types'

export default function ConsultantDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [consultant, setConsultant] = useState<Consultant | null>(null)
  const [cards, setCards] = useState<PreferenceCard[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (id) {
      loadConsultant()
    }
  }, [id])

  const loadConsultant = async () => {
    if (!id) {
      setLoading(false)
      return
    }

    const { data: consultantData } = await supabase
      .from('consultants')
      .select('*')
      .eq('id', id)
      .single()

    if (consultantData) {
      setConsultant(consultantData)
      setName(consultantData.name)
      setSpecialty(consultantData.specialty)
      setNotes(consultantData.notes || '')

      const { data: cardsData } = await supabase
        .from('preference_cards')
        .select('*')
        .eq('consultant_id', id)
        .order('procedure_name')

      if (cardsData) {
        setCards(cardsData)
      }
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!id) return

    const { error } = await supabase
      .from('consultants')
      .update({ name, specialty, notes: notes || null })
      .eq('id', id)

    if (!error) {
      setConsultant({ ...consultant!, name, specialty, notes })
      setEditing(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this consultant and all their preference cards?')) return

    if (!id) return

    const { error } = await supabase
      .from('consultants')
      .delete()
      .eq('id', id)

    if (!error) {
      navigate('/consultants')
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Loading...</div>
  }

  if (!consultant) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">Consultant not found</p>
        <Link to="/consultants" className="text-blue-600 hover:underline">
          Back to consultants
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Back link */}
      <Link
        to="/consultants"
        className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All Consultants
      </Link>

      {/* Consultant info */}
      <div className="card mb-6">
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Specialty</label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="input"
                placeholder="e.g., Cardiac, Orthopaedics, General"
              />
            </div>
            <div>
              <label className="label">General Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input min-h-[80px]"
                placeholder="Any general notes about this consultant..."
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="btn btn-primary">
                Save
              </button>
              <button onClick={() => setEditing(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">{consultant.name}</h1>
                <p className="text-slate-500">{consultant.specialty || 'No specialty set'}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
            {consultant.notes && (
              <p className="mt-3 text-slate-600 text-sm">{consultant.notes}</p>
            )}
          </div>
        )}
      </div>

      {/* Preference cards */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Preference Cards</h2>
        <Link
          to={`/card/new?consultant=${id}`}
          className="btn btn-primary text-sm"
        >
          + Add Procedure
        </Link>
      </div>

      {cards.length === 0 ? (
        <div className="card text-center py-8 text-slate-500">
          <p>No preference cards yet.</p>
          <Link
            to={`/card/new?consultant=${id}`}
            className="text-blue-600 hover:underline mt-2 inline-block"
          >
            Add the first procedure
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {cards.map((card) => (
            <Link
              key={card.id}
              to={`/card/${card.id}`}
              className="card block hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{card.procedure_name}</div>
                  {card.procedure_category && (
                    <div className="text-sm text-slate-500">{card.procedure_category}</div>
                  )}
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
