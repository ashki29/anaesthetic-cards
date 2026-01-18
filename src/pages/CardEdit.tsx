import { useState, useEffect, useCallback } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Consultant, DrugPreferences, EquipmentPreferences, PositioningPreferences, RegionalPreferences } from '../lib/types'

export default function CardEdit() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const consultantId = searchParams.get('consultant')
  const isNew = !id

  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [consultant, setConsultant] = useState<Consultant | null>(null)
  const [procedureName, setProcedureName] = useState('')
  const [procedureCategory, setProcedureCategory] = useState('')
  const [notes, setNotes] = useState('')

  // Drugs
  const [induction, setInduction] = useState('')
  const [muscleRelaxant, setMuscleRelaxant] = useState('')
  const [maintenance, setMaintenance] = useState('')
  const [infusions, setInfusions] = useState('')
  const [analgesics, setAnalgesics] = useState('')
  const [antiemetics, setAntiemetics] = useState('')
  const [antibiotics, setAntibiotics] = useState('')
  const [drugsOther, setDrugsOther] = useState('')

  // Equipment
  const [airway, setAirway] = useState('')
  const [lines, setLines] = useState('')
  const [monitoring, setMonitoring] = useState('')
  const [machine, setMachine] = useState('')
  const [ventilator, setVentilator] = useState('')
  const [equipmentOther, setEquipmentOther] = useState('')

  // Positioning
  const [position, setPosition] = useState('')
  const [warming, setWarming] = useState('')
  const [catheter, setCatheter] = useState('')
  const [ngt, setNgt] = useState('')
  const [positioningOther, setPositioningOther] = useState('')

  // Regional anaesthesia
  const [regionalDetails, setRegionalDetails] = useState('')

  const loadConsultant = useCallback(async (cId: string) => {
    const { data } = await supabase
      .from('consultants')
      .select('*')
      .eq('id', cId)
      .single()

    if (data) {
      setConsultant(data)
    }
    setLoading(false)
  }, [])

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
      setProcedureName(cardData.procedure_name)
      setProcedureCategory(cardData.procedure_category || '')
      setNotes(cardData.notes || '')

      const drugs = cardData.drugs || {}
      setInduction(drugs.induction || '')
      setMuscleRelaxant(drugs.muscle_relaxant || '')
      setMaintenance(drugs.maintenance || '')
      setInfusions(drugs.infusions?.join('\n') || '')
      setAnalgesics(drugs.analgesics || '')
      setAntiemetics(drugs.antiemetics || '')
      setAntibiotics(drugs.antibiotics || '')
      setDrugsOther(drugs.other || '')

      const equipment = cardData.equipment || {}
      setAirway(equipment.airway || '')
      setLines(equipment.lines || '')
      setMonitoring(equipment.monitoring || '')
      setMachine(equipment.machine || '')
      setVentilator(equipment.ventilator || '')
      setEquipmentOther(equipment.other || '')

      const positioning = cardData.positioning || {}
      setPosition(positioning.position || '')
      setWarming(positioning.warming || '')
      setCatheter(positioning.catheter || '')
      setNgt(positioning.ngt || '')
      setPositioningOther(positioning.other || '')

      const regional = cardData.regional || {}
      setRegionalDetails(regional.details || '')

      const { data: consultantData } = await supabase
        .from('consultants')
        .select('*')
        .eq('id', cardData.consultant_id)
        .single()

      if (consultantData) {
        setConsultant(consultantData)
      }
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    if (isNew && consultantId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadConsultant(consultantId)
    } else if (id) {
      void loadCard()
    }
  }, [id, consultantId, isNew, loadConsultant, loadCard])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!consultant || !user) return

    setSaving(true)
    setError('')

    const drugs: DrugPreferences = {}
    if (induction) drugs.induction = induction
    if (muscleRelaxant) drugs.muscle_relaxant = muscleRelaxant
    if (maintenance) drugs.maintenance = maintenance
    if (infusions) drugs.infusions = infusions.split('\n').filter(Boolean)
    if (analgesics) drugs.analgesics = analgesics
    if (antiemetics) drugs.antiemetics = antiemetics
    if (antibiotics) drugs.antibiotics = antibiotics
    if (drugsOther) drugs.other = drugsOther

    const equipment: EquipmentPreferences = {}
    if (airway) equipment.airway = airway
    if (lines) equipment.lines = lines
    if (monitoring) equipment.monitoring = monitoring
    if (machine) equipment.machine = machine
    if (ventilator) equipment.ventilator = ventilator
    if (equipmentOther) equipment.other = equipmentOther

    const positioning: PositioningPreferences = {}
    if (position) positioning.position = position
    if (warming) positioning.warming = warming
    if (catheter) positioning.catheter = catheter
    if (ngt) positioning.ngt = ngt
    if (positioningOther) positioning.other = positioningOther

    const regional: RegionalPreferences = {}
    if (regionalDetails) regional.details = regionalDetails

    const cardData = {
      consultant_id: consultant.id,
      procedure_name: procedureName,
      procedure_category: procedureCategory || null,
      drugs,
      equipment,
      positioning,
      regional,
      notes: notes || null,
      last_edited_by: user.id,
    }

    if (isNew) {
      const { data, error: insertError } = await supabase
        .from('preference_cards')
        .insert(cardData)
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        setSaving(false)
      } else if (data) {
        navigate(`/card/${data.id}`)
      }
    } else {
      if (!id) {
        setError('Missing card id')
        setSaving(false)
        return
      }
      const { error: updateError } = await supabase
        .from('preference_cards')
        .update(cardData)
        .eq('id', id)

      if (updateError) {
        setError(updateError.message)
        setSaving(false)
      } else {
        navigate(`/card/${id}`)
      }
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
          Select a consultant
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        to={isNew ? `/consultant/${consultant.id}` : `/card/${id}`}
        className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      <h1 className="text-2xl font-bold mb-2">
        {isNew ? 'New Preference Card' : 'Edit Preference Card'}
      </h1>
      <p className="text-slate-500 mb-6">{consultant.name}</p>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="card">
          <h2 className="font-semibold mb-4">Procedure</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Procedure Name *</label>
              <input
                type="text"
                value={procedureName}
                onChange={(e) => setProcedureName(e.target.value)}
                className="input"
                placeholder="e.g., CABG, Total Hip Replacement, Lap Chole"
                required
              />
            </div>
            <div>
              <label className="label">Category (optional)</label>
              <input
                type="text"
                value={procedureCategory}
                onChange={(e) => setProcedureCategory(e.target.value)}
                className="input"
                placeholder="e.g., Major, Emergency, Day case"
              />
            </div>
          </div>
        </div>

        {/* Drugs */}
        <div className="card">
          <h2 className="font-semibold mb-4">Drugs & Medications</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Induction</label>
              <input
                type="text"
                value={induction}
                onChange={(e) => setInduction(e.target.value)}
                className="input"
                placeholder="e.g., Propofol 1-2mg/kg, Fentanyl 2-3mcg/kg"
              />
            </div>
            <div>
              <label className="label">Muscle Relaxant</label>
              <input
                type="text"
                value={muscleRelaxant}
                onChange={(e) => setMuscleRelaxant(e.target.value)}
                className="input"
                placeholder="e.g., Rocuronium 0.6mg/kg"
              />
            </div>
            <div>
              <label className="label">Maintenance</label>
              <input
                type="text"
                value={maintenance}
                onChange={(e) => setMaintenance(e.target.value)}
                className="input"
                placeholder="e.g., Sevoflurane 1-2%, TIVA"
              />
            </div>
            <div>
              <label className="label">Infusions (one per line)</label>
              <textarea
                value={infusions}
                onChange={(e) => setInfusions(e.target.value)}
                className="input min-h-[80px]"
                placeholder="e.g., Remifentanil 0.1-0.25mcg/kg/min&#10;Propofol TCI"
              />
            </div>
            <div>
              <label className="label">Analgesics</label>
              <input
                type="text"
                value={analgesics}
                onChange={(e) => setAnalgesics(e.target.value)}
                className="input"
                placeholder="e.g., Paracetamol 1g, Morphine 0.1mg/kg"
              />
            </div>
            <div>
              <label className="label">Antiemetics</label>
              <input
                type="text"
                value={antiemetics}
                onChange={(e) => setAntiemetics(e.target.value)}
                className="input"
                placeholder="e.g., Ondansetron 4mg, Dexamethasone 4mg"
              />
            </div>
            <div>
              <label className="label">Antibiotics</label>
              <input
                type="text"
                value={antibiotics}
                onChange={(e) => setAntibiotics(e.target.value)}
                className="input"
                placeholder="e.g., Co-amoxiclav 1.2g, Cefuroxime 1.5g"
              />
            </div>
            <div>
              <label className="label">Other Drugs</label>
              <input
                type="text"
                value={drugsOther}
                onChange={(e) => setDrugsOther(e.target.value)}
                className="input"
                placeholder="e.g., Tranexamic acid 1g, antibiotics"
              />
            </div>
          </div>
        </div>

        {/* Equipment */}
        <div className="card">
          <h2 className="font-semibold mb-4">Equipment & Lines</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Airway</label>
              <input
                type="text"
                value={airway}
                onChange={(e) => setAirway(e.target.value)}
                className="input"
                placeholder="e.g., ETT 8.0, video laryngoscope available"
              />
            </div>
            <div>
              <label className="label">Lines</label>
              <textarea
                value={lines}
                onChange={(e) => setLines(e.target.value)}
                className="input min-h-[80px]"
                placeholder="e.g., 20G + 16G peripheral, Right IJ CVC, Arterial line radial"
              />
            </div>
            <div>
              <label className="label">Monitoring</label>
              <input
                type="text"
                value={monitoring}
                onChange={(e) => setMonitoring(e.target.value)}
                className="input"
                placeholder="e.g., 5-lead ECG, SpO2, ETCO2, IBP, CVP, TOE"
              />
            </div>
            <div>
              <label className="label">Machine/Equipment</label>
              <input
                type="text"
                value={machine}
                onChange={(e) => setMachine(e.target.value)}
                className="input"
                placeholder="e.g., Check defibrillator, cell saver, BIS"
              />
            </div>
            <div>
              <label className="label">Ventilator Settings</label>
              <input
                type="text"
                value={ventilator}
                onChange={(e) => setVentilator(e.target.value)}
                className="input"
                placeholder="e.g., Volume control, TV 6-8ml/kg"
              />
            </div>
            <div>
              <label className="label">Other Equipment</label>
              <input
                type="text"
                value={equipmentOther}
                onChange={(e) => setEquipmentOther(e.target.value)}
                className="input"
                placeholder="Any other equipment requirements"
              />
            </div>
          </div>
        </div>

        {/* Positioning */}
        <div className="card">
          <h2 className="font-semibold mb-4">Positioning & Prep</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Position</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="input"
                placeholder="e.g., Supine, arms tucked"
              />
            </div>
            <div>
              <label className="label">Warming</label>
              <input
                type="text"
                value={warming}
                onChange={(e) => setWarming(e.target.value)}
                className="input"
                placeholder="e.g., Bair hugger upper body, fluid warmer"
              />
            </div>
            <div>
              <label className="label">Catheter</label>
              <input
                type="text"
                value={catheter}
                onChange={(e) => setCatheter(e.target.value)}
                className="input"
                placeholder="e.g., IDC after induction, IDC not required"
              />
            </div>
            <div>
              <label className="label">NGT</label>
              <input
                type="text"
                value={ngt}
                onChange={(e) => setNgt(e.target.value)}
                className="input"
                placeholder="e.g., Not routinely required, Insert after intubation"
              />
            </div>
            <div>
              <label className="label">Other Prep</label>
              <input
                type="text"
                value={positioningOther}
                onChange={(e) => setPositioningOther(e.target.value)}
                className="input"
                placeholder="Any other positioning or prep requirements"
              />
            </div>
          </div>
        </div>

        {/* Regional anaesthesia */}
        <div className="card">
          <h2 className="font-semibold mb-4">Regional Anaesthesia</h2>
          <div>
            <label className="label">Plan / Block</label>
            <textarea
              value={regionalDetails}
              onChange={(e) => setRegionalDetails(e.target.value)}
              className="input min-h-[80px]"
              placeholder="e.g., Spinal L3/4 0.5% heavy bupivacaine 2.5ml, Femoral catheter"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h2 className="font-semibold mb-4">Additional Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input min-h-[120px]"
            placeholder="Any other preferences, quirks, or important information..."
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Saving...' : isNew ? 'Create Card' : 'Save Changes'}
          </button>
          <Link
            to={isNew ? `/consultant/${consultant.id}` : `/card/${id}`}
            className="btn btn-secondary"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
