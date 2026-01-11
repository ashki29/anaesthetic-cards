import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { PreferenceCard, Consultant, User } from '../lib/types'

export default function CardView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [card, setCard] = useState<PreferenceCard | null>(null)
  const [consultant, setConsultant] = useState<Consultant | null>(null)
  const [editor, setEditor] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadCard = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }

    const { data: cardData } = await supabase
      .from('preference_cards')
      .select('*')
      .eq('id', id)
      .single()

    if (cardData) {
      setCard(cardData)

      const { data: consultantData } = await supabase
        .from('consultants')
        .select('*')
        .eq('id', cardData.consultant_id)
        .single()

      if (consultantData) {
        setConsultant(consultantData)
      }

      if (cardData.last_edited_by) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', cardData.last_edited_by)
          .single()

        if (userData) {
          setEditor(userData)
        }
      }
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCard()
  }, [loadCard])

  const handleDelete = async () => {
    if (!confirm('Delete this preference card?')) return

    if (!id) return

    const { error } = await supabase
      .from('preference_cards')
      .delete()
      .eq('id', id)

    if (!error && consultant) {
      navigate(`/consultant/${consultant.id}`)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Loading...</div>
  }

  if (!card || !consultant) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">Card not found</p>
        <Link to="/dashboard" className="text-blue-600 hover:underline">
          Back to dashboard
        </Link>
      </div>
    )
  }

  const drugs = card.drugs || {}
  const equipment = card.equipment || {}
  const positioning = card.positioning || {}

  return (
    <div>
      {/* Back link */}
      <Link
        to={`/consultant/${consultant.id}`}
        className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {consultant.name}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{card.procedure_name}</h1>
          <p className="text-slate-500">
            {consultant.name} - {consultant.specialty}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/card/${id}/edit`} className="btn btn-primary text-sm">
            Edit
          </Link>
          <button onClick={handleDelete} className="btn btn-secondary text-sm text-red-600">
            Delete
          </button>
        </div>
      </div>

      {/* Drugs section */}
      <Section title="Drugs & Medications" icon="💊">
        <Field label="Induction" value={drugs.induction} />
        <Field label="Muscle Relaxant" value={drugs.muscle_relaxant} />
        <Field label="Maintenance" value={drugs.maintenance} />
        <Field label="Infusions" value={drugs.infusions?.join(', ')} />
        <Field label="Analgesics" value={drugs.analgesics} />
        <Field label="Antiemetics" value={drugs.antiemetics} />
        <Field label="Other" value={drugs.other} />
      </Section>

      {/* Equipment section */}
      <Section title="Equipment & Lines" icon="🔧">
        <Field label="Airway" value={equipment.airway} />
        <Field label="Lines" value={equipment.lines} />
        <Field label="Monitoring" value={equipment.monitoring} />
        <Field label="Machine/Equipment" value={equipment.machine} />
        <Field label="Ventilator" value={equipment.ventilator} />
        <Field label="Other" value={equipment.other} />
      </Section>

      {/* Positioning section */}
      <Section title="Positioning & Prep" icon="🛏️">
        <Field label="Position" value={positioning.position} />
        <Field label="Warming" value={positioning.warming} />
        <Field label="Catheter" value={positioning.catheter} />
        <Field label="NGT" value={positioning.ngt} />
        <Field label="Other" value={positioning.other} />
      </Section>

      {/* Notes section */}
      {card.notes && (
        <Section title="Additional Notes" icon="📝">
          <p className="text-slate-700 whitespace-pre-wrap">{card.notes}</p>
        </Section>
      )}

      {/* Last edited */}
      <div className="text-sm text-slate-400 mt-6">
        Last updated: {new Date(card.updated_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
        {editor && ` by ${editor.display_name}`}
      </div>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="card mb-4">
      <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h2>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div>
      <span className="text-sm text-slate-500">{label}:</span>
      <span className="ml-2 text-slate-700">{value}</span>
    </div>
  )
}
