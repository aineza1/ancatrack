import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { PATIENTS } from '../utils/data'

export default function RecordVisit() {
  const navigate = useNavigate()
  const [patientId, setPatientId] = useState('')
  const [sbp, setSbp] = useState('')
  const [dbp, setDbp] = useState('')
  const [proteinuria, setProteinuria] = useState('None')
  const [ga, setGa] = useState('')
  const [weight, setWeight] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const WHO_DBP_DELTA = 15
  const WHO_SBP_THRESHOLD = 140
  const WHO_DBP_THRESHOLD = 90

  const warnings: string[] = []
  if (Number(sbp) >= WHO_SBP_THRESHOLD) warnings.push(`SBP ${sbp} mmHg ≥ 140 mmHg threshold`)
  if (Number(dbp) >= WHO_DBP_THRESHOLD) warnings.push(`DBP ${dbp} mmHg ≥ 90 mmHg threshold`)
  if (patientId) {
    const patient = PATIENTS.find(p => p.id === Number(patientId))
    if (patient && patient.visits.length > 0) {
      const baseDBP = patient.visits[0].dbp
      if (Number(dbp) - baseDBP >= WHO_DBP_DELTA) {
        warnings.push(`DBP rose ${Number(dbp) - baseDBP} mmHg from baseline — trajectory alert will fire`)
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!patientId) { toast.error('Please select a patient'); return }
    toast.success('Visit saved successfully')
    setTimeout(() => {
      if (warnings.length > 0) toast.error('Alert generated — check the Alerts page')
    }, 800)
  }

  const inputStyle = {
    padding: '9px 12px', border: '1px solid #e5e7eb',
    borderRadius: 8, fontSize: 13, color: '#111',
    fontFamily: 'inherit', width: '100%',
    outline: 'none'
  }

  const labelStyle = {
    fontSize: 12, fontWeight: 600, color: '#4b5563',
    display: 'block', marginBottom: 5
  }

  return (
    <div style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const,
        letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 20 }}>
        Record ANC visit
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb',
        borderRadius: 12, padding: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Patient</label>
              <select style={inputStyle} value={patientId}
                onChange={e => setPatientId(e.target.value)} required>
                <option value="">Select patient...</option>
                {PATIENTS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Visit date</label>
              <input style={inputStyle} type="date" value={date}
                onChange={e => setDate(e.target.value)} required />
            </div>

            <div>
              <label style={labelStyle}>Gestational age (weeks)</label>
              <input style={inputStyle} type="number" placeholder="e.g. 28"
                value={ga} onChange={e => setGa(e.target.value)} required />
            </div>

            <div>
              <label style={labelStyle}>Systolic BP (mmHg)</label>
              <input style={inputStyle} type="number" placeholder="e.g. 120"
                value={sbp} onChange={e => setSbp(e.target.value)} required />
            </div>

            <div>
              <label style={labelStyle}>Diastolic BP (mmHg)</label>
              <input style={inputStyle} type="number" placeholder="e.g. 80"
                value={dbp} onChange={e => setDbp(e.target.value)} required />
            </div>

            <div>
              <label style={labelStyle}>Proteinuria</label>
              <select style={inputStyle} value={proteinuria}
                onChange={e => setProteinuria(e.target.value)}>
                {['None','Trace','1+','2+','3+'].map(v => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Weight (kg)</label>
              <input style={inputStyle} type="number" placeholder="e.g. 65"
                value={weight} onChange={e => setWeight(e.target.value)} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Clinical notes (optional)</label>
              <input style={inputStyle} type="text" placeholder="Any observations..."
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>

          {/* Live alert preview */}
          {warnings.length > 0 && (
            <div style={{ background: '#fff5f5', border: '1px solid #fecaca',
              borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b', marginBottom: 4 }}>
                Alert preview — this visit will trigger:
              </div>
              {warnings.map((w, i) => (
                <div key={i} style={{ fontSize: 12, color: '#555' }}>• {w}</div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" style={{
              background: '#4a7fa7', color: '#fff', border: 'none',
              borderRadius: 8, padding: '9px 20px', fontSize: 13,
              fontWeight: 600, cursor: 'pointer'
            }}>Save visit</button>
            <button type="button" onClick={() => navigate('/patients')} style={{
              background: '#fff', color: '#4b5563', border: '1px solid #e5e7eb',
              borderRadius: 8, padding: '9px 16px', fontSize: 13,
              fontWeight: 600, cursor: 'pointer'
            }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
