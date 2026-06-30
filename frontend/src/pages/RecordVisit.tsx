import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../utils/api'

export default function RecordVisit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any>(null)

  const [formData, setFormData] = useState({
    patientId: id || '',
    date: new Date().toISOString().split('T')[0],
    ga: '',
    sbp: '',
    dbp: '',
    proteinuria: 'None',
    weight: '',
    notes: '',
  })

  const WHO_DBP_DELTA = 15
  const WHO_SBP_THRESHOLD = 140
  const WHO_DBP_THRESHOLD = 90

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await api.get('/patients')
        setPatients(response.data.patients || [])
        if (id) {
          const patient = response.data.patients.find((p: any) => p._id === id)
          if (patient) setSelectedPatient(patient)
        }
      } catch (error) {
        console.error('Failed to fetch patients:', error)
      }
    }
    fetchPatients()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (name === 'patientId') {
      const patient = patients.find(p => p._id === value)
      setSelectedPatient(patient || null)
    }
  }

  const warnings: string[] = []
  const sbpNum = Number(formData.sbp)
  const dbpNum = Number(formData.dbp)

  if (sbpNum >= WHO_SBP_THRESHOLD) {
    warnings.push(`SBP ${sbpNum} mmHg ≥ 140 mmHg threshold`)
  }
  if (dbpNum >= WHO_DBP_THRESHOLD) {
    warnings.push(`DBP ${dbpNum} mmHg ≥ 90 mmHg threshold`)
  }
  if (selectedPatient && selectedPatient.visits && selectedPatient.visits.length > 0) {
    const baseDBP = selectedPatient.visits[0].dbp
    if (dbpNum - baseDBP >= WHO_DBP_DELTA) {
      warnings.push(`DBP rose ${dbpNum - baseDBP} mmHg from baseline — trajectory alert will fire`)
    }
  }

  const hasProteinuria = formData.proteinuria !== 'None'
  const hasHighBP = warnings.some(w => w.includes('SBP') || w.includes('DBP'))
  if (hasHighBP && hasProteinuria) {
    warnings.push(` Combined risk: High BP + proteinuria (${formData.proteinuria}) — meets pre-eclampsia criteria`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.patientId) {
      toast.error('Please select a patient')
      return
    }

    setLoading(true)
    try {
      const payload = {
        date: formData.date,
        ga: Number(formData.ga),
        sbp: Number(formData.sbp),
        dbp: Number(formData.dbp),
        proteinuria: formData.proteinuria,
        weight: Number(formData.weight),
        notes: formData.notes,
      }

      const response = await api.post(`/patients/${formData.patientId}/visits`, payload)

      if (response.data.alert) {
        toast.success('Visit recorded! Alert triggered.')
      } else {
        toast.success('Visit recorded successfully!')
      }

      navigate(`/patients/${formData.patientId}`)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record visit')
    } finally {
      setLoading(false)
    }
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
        {id ? 'Record ANC visit' : 'Register patient & record visit'}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb',
        borderRadius: 12, padding: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>Record visit</div>
          <button onClick={() => navigate('/import-visits')} style={{
            background: '#f0fdf4', color: '#166534', border: '1px solid #86efac',
            borderRadius: 8, padding: '7px 14px', fontSize: 13,
            fontWeight: 600, cursor: 'pointer'
      }}>
         Import from Excel
        </button>
        </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Patient</label>
              <select style={inputStyle} name="patientId" value={formData.patientId}
                onChange={handleChange} required>
                <option value="">Select patient...</option>
                {patients.map((p: any) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Visit date</label>
              <input style={inputStyle} type="date" name="date" value={formData.date}
                onChange={handleChange} required />
            </div>

            <div>
              <label style={labelStyle}>Gestational age (weeks)</label>
              <input style={inputStyle} type="number" name="ga" placeholder="e.g. 28"
                value={formData.ga} onChange={handleChange} required min="4" max="44" />
            </div>

            <div>
              <label style={labelStyle}>Systolic BP (mmHg)</label>
              <input style={inputStyle} type="number" name="sbp" placeholder="e.g. 120"
                value={formData.sbp} onChange={handleChange} required />
            </div>

            <div>
              <label style={labelStyle}>Diastolic BP (mmHg)</label>
              <input style={inputStyle} type="number" name="dbp" placeholder="e.g. 80"
                value={formData.dbp} onChange={handleChange} required />
            </div>

            <div>
              <label style={labelStyle}>Proteinuria</label>
              <select style={inputStyle} name="proteinuria" value={formData.proteinuria}
                onChange={handleChange}>
                {['None','Trace','1+','2+','3+'].map(v => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Weight (kg)</label>
              <input style={inputStyle} type="number" name="weight" placeholder="e.g. 65"
                value={formData.weight} onChange={handleChange} step="0.1" />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Clinical notes (optional)</label>
              <input style={inputStyle} type="text" name="notes" placeholder="Any observations..."
                value={formData.notes} onChange={handleChange} />
            </div>
          </div>

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
            <button type="submit" disabled={loading} style={{
              background: '#4a7fa7', color: '#fff', border: 'none',
              borderRadius: 8, padding: '9px 20px', fontSize: 13,
              fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}>
              {loading ? 'Saving...' : id ? 'Save visit' : 'Register patient'}
            </button>
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
