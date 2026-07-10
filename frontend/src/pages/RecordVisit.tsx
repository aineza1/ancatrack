import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'

const WHO_SBP_THRESHOLD = 140
const WHO_DBP_THRESHOLD = 90
const WHO_DBP_DELTA     = 15

export default function RecordVisit() {
  const navigate = useNavigate()

  // ── Existing patient visit state ──────────────────
  const [patients, setPatients]   = useState<any[]>([])
  const [doctors, setDoctors]     = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [visitForm, setVisitForm] = useState({
    date: new Date().toISOString().split('T')[0],
    ga: '', sbp: '', dbp: '',
    proteinuria: 'None', weight: '',
  })

  // ── New patient state ─────────────────────────────
  const [showNewPatient, setShowNewPatient] = useState(false)
  const [newPatientForm, setNewPatientForm] = useState({
    name: '', dob: '', edd: '',
    parity: 'G1P0', insurance: 'Mutuelle',
    phone: '', pin: '', assignedDoctor: '',
  })
  const [registeringPatient, setRegisteringPatient] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, dRes] = await Promise.all([
          api.get('/patients'),
          api.get('/users/doctors'),
        ])
        setPatients(pRes.data.patients || [])
        setDoctors(dRes.data.doctors || [])
      } catch {
        toast.error('Failed to load data')
      }
    }
    fetchData()
  }, [])

  // ── Alert preview logic ───────────────────────────
  const getAlertPreview = () => {
    if (!selectedPatient || !visitForm.sbp || !visitForm.dbp) return null
    const sbp = Number(visitForm.sbp)
    const dbp = Number(visitForm.dbp)
    const flags: string[] = []

    if (selectedPatient.visits?.length > 0) {
      const baseline = selectedPatient.visits[0]
      const delta = dbp - baseline.dbp
      if (delta >= WHO_DBP_DELTA) {
        flags.push(`DBP rose ${delta} mmHg from baseline`)
      }
    }
    if (sbp >= WHO_SBP_THRESHOLD) flags.push(`SBP ${sbp} mmHg ≥ ${WHO_SBP_THRESHOLD} mmHg`)
    if (dbp >= WHO_DBP_THRESHOLD) flags.push(`DBP ${dbp} mmHg ≥ ${WHO_DBP_THRESHOLD} mmHg`)

    const hasProteinuria = !['None', 'none', ''].includes(visitForm.proteinuria)
    const hasHighBP = flags.length > 0
    if (hasHighBP && hasProteinuria) {
      flags.push(`High BP + proteinuria ${visitForm.proteinuria} — pre-eclampsia criteria met`)
    }

    return flags.length > 0 ? flags : null
  }

  const alertFlags = getAlertPreview()

  // ── Submit visit ──────────────────────────────────
  const handleVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) { toast.error('Select a patient first'); return }
    setSubmitting(true)
    try {
      await api.post(`/patients/${selectedPatient._id}/visits`, {
        date:        visitForm.date,
        ga:          Number(visitForm.ga),
        sbp:         Number(visitForm.sbp),
        dbp:         Number(visitForm.dbp),
        proteinuria: visitForm.proteinuria,
        weight:      Number(visitForm.weight),
      })
      toast.success(`Visit recorded for ${selectedPatient.name}`)
      setVisitForm({
        date: new Date().toISOString().split('T')[0],
        ga: '', sbp: '', dbp: '', proteinuria: 'None', weight: '',
      })
      setSelectedPatient(null)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record visit')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Submit new patient ────────────────────────────
  const handleNewPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPatientForm.assignedDoctor) {
      toast.error('Please select an assigned doctor')
      return
    }
    setRegisteringPatient(true)
    try {
      const res = await api.post('/patients', {
        name:           newPatientForm.name,
        dob:            newPatientForm.dob,
        edd:            newPatientForm.edd,
        parity:         newPatientForm.parity,
        insurance:      newPatientForm.insurance,
        phone:          newPatientForm.phone,
        assignedDoctor: newPatientForm.assignedDoctor,
      })

      const patientId = res.data.patient._id

      if (newPatientForm.pin && newPatientForm.pin.length >= 4) {
        await api.patch(`/portal/${patientId}/set-pin`, { pin: newPatientForm.pin })
      }

      toast.success(`${newPatientForm.name} registered successfully`)

      // Refresh patient list and select the new patient
      const pRes = await api.get('/patients')
      setPatients(pRes.data.patients || [])

      // Auto-select new patient for visit recording
      const newPatient = pRes.data.patients.find((p: any) => p._id === patientId)
      if (newPatient) setSelectedPatient(newPatient)

      setNewPatientForm({
        name: '', dob: '', edd: '',
        parity: 'G1P0', insurance: 'Mutuelle',
        phone: '', pin: '', assignedDoctor: '',
      })
      setShowNewPatient(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to register patient')
    } finally {
      setRegisteringPatient(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px',
    border: '1px solid #e5e7eb', borderRadius: 8,
    fontSize: 13, outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box', background: '#fff',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600,
    color: '#4b5563', display: 'block', marginBottom: 5
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>
            Record visit
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
            Select a patient and enter today's readings
          </div>
        </div>
        <button onClick={() => navigate('/import-visits')} style={{
          background: '#f0fdf4', color: '#166534',
          border: '1px solid #86efac', borderRadius: 8,
          padding: '7px 14px', fontSize: 13,
          fontWeight: 600, cursor: 'pointer'
        }}>
          Import from Excel
        </button>
      </div>

      {/* Patient selection */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb',
        borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.06em', color: '#9ca3af' }}>
            Select patient
          </div>
          <button
            onClick={() => setShowNewPatient(!showNewPatient)}
            style={{
              fontSize: 12, fontWeight: 600, padding: '5px 12px',
              borderRadius: 7, cursor: 'pointer',
              background: showNewPatient ? '#fee2e2' : '#eff6ff',
              color: showNewPatient ? '#991b1b' : '#1d4ed8',
              border: `1px solid ${showNewPatient ? '#fecaca' : '#bfdbfe'}`,
            }}>
            {showNewPatient ? 'Cancel new patient' : '+ New patient'}
          </button>
        </div>

        {/* Existing patient dropdown */}
        {!showNewPatient && (
          <select
            style={inputStyle}
            value={selectedPatient?._id || ''}
            onChange={e => {
              const p = patients.find(p => p._id === e.target.value)
              setSelectedPatient(p || null)
            }}>
            <option value="">Select a patient...</option>
            {patients.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        )}

        {/* Selected patient info */}
        {selectedPatient && !showNewPatient && (
          <div style={{
            marginTop: 12, padding: '10px 14px',
            background: '#f0f9ff', borderRadius: 8,
            border: '1px solid #bae6fd',
            display: 'flex', gap: 20, fontSize: 13
          }}>
            <span style={{ color: '#6b7280' }}>
              DOB: <strong>{new Date(selectedPatient.dob)
                .toLocaleDateString('en-GB')}</strong>
            </span>
            <span style={{ color: '#6b7280' }}>
              Parity: <strong>{selectedPatient.parity}</strong>
            </span>
            <span style={{ color: '#6b7280' }}>
              Visits: <strong>{selectedPatient.visits?.length || 0}</strong>
            </span>
            {selectedPatient.visits?.length > 0 && (
              <span style={{ color: '#6b7280' }}>
                Last BP: <strong>
                  {selectedPatient.visits.at(-1).sbp}/
                  {selectedPatient.visits.at(-1).dbp}
                </strong>
              </span>
            )}
          </div>
        )}
      </div>

      {/* New patient form — inline */}
      {showNewPatient && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb',
          borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>

          <div style={{ fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 16 }}>
            New patient details
          </div>

          <form onSubmit={handleNewPatientSubmit}>
            <div style={{ display: 'grid',
              gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Full name *</label>
                <input style={inputStyle} required
                  placeholder="e.g. Mwiza Angel"
                  value={newPatientForm.name}
                  onChange={e => setNewPatientForm(f =>
                    ({ ...f, name: e.target.value }))} />
              </div>

              <div>
                <label style={labelStyle}>Date of birth *</label>
                <input style={inputStyle} type="date" required
                  value={newPatientForm.dob}
                  onChange={e => setNewPatientForm(f =>
                    ({ ...f, dob: e.target.value }))} />
              </div>

              <div>
                <label style={labelStyle}>Estimated due date *</label>
                <input style={inputStyle} type="date" required
                  value={newPatientForm.edd}
                  onChange={e => setNewPatientForm(f =>
                    ({ ...f, edd: e.target.value }))} />
              </div>

              <div>
                <label style={labelStyle}>Parity *</label>
                <select style={inputStyle}
                  value={newPatientForm.parity}
                  onChange={e => setNewPatientForm(f =>
                    ({ ...f, parity: e.target.value }))}>
                  {['G1P0','G2P1','G2P0','G3P2','G3P1',
                    'G3P0','G4P3','G4P2','G4P1','G5P4'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Insurance</label>
                <select style={inputStyle}
                  value={newPatientForm.insurance}
                  onChange={e => setNewPatientForm(f =>
                    ({ ...f, insurance: e.target.value }))}>
                  <option value="Mutuelle">Mutuelle</option>
                  <option value="RSSB">RSSB</option>
                  <option value="MMI">MMI</option>
                  <option value="Private">Private</option>
                  <option value="None">None</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Phone number</label>
                <input style={inputStyle} type="tel"
                  placeholder="+250780000000"
                  value={newPatientForm.phone}
                  onChange={e => setNewPatientForm(f =>
                    ({ ...f, phone: e.target.value }))} />
              </div>

              <div>
                <label style={labelStyle}>Portal PIN (4 digits)</label>
                <input style={inputStyle} type="password"
                  placeholder="Set a PIN for patient portal login"
                  maxLength={6}
                  value={newPatientForm.pin}
                  onChange={e => setNewPatientForm(f =>
                    ({ ...f, pin: e.target.value }))} />
              </div>
            </div>

            {/* Doctor assignment */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ ...labelStyle, marginBottom: 10 }}>
                Assign to doctor *
              </label>
              {doctors.length === 0 ? (
                <div style={{ fontSize: 13, color: '#9ca3af' }}>
                  Loading doctors...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {doctors.map(doc => (
                    <label key={doc._id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                      border: `1px solid ${newPatientForm.assignedDoctor === doc._id
                        ? '#4a7fa7' : '#e5e7eb'}`,
                      background: newPatientForm.assignedDoctor === doc._id
                        ? '#eaf2f8' : '#f9fafb',
                      transition: 'all 0.12s'
                    }}>
                      <input
                        type="radio"
                        name="assignedDoctor"
                        value={doc._id}
                        checked={newPatientForm.assignedDoctor === doc._id}
                        onChange={e => setNewPatientForm(f =>
                          ({ ...f, assignedDoctor: e.target.value }))}
                        style={{ accentColor: '#4a7fa7' }}
                      />
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: '#4a7fa7', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0
                      }}>
                        {doc.name.split(' ').map((n: string) => n[0])
                          .join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
                          {doc.name}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>
                          {doc.email}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={registeringPatient} style={{
                background: registeringPatient ? '#e5e7eb' : '#4a7fa7',
                color: registeringPatient ? '#9ca3af' : '#fff',
                border: 'none', borderRadius: 8,
                padding: '9px 20px', fontSize: 13, fontWeight: 600,
                cursor: registeringPatient ? 'not-allowed' : 'pointer',
              }}>
                {registeringPatient ? 'Registering...' : 'Register patient'}
              </button>
              <button type="button"
                onClick={() => setShowNewPatient(false)} style={{
                  background: 'transparent',
                  border: '1px solid #e5e7eb', borderRadius: 8,
                  padding: '9px 16px', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', color: '#6b7280'
                }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Visit form */}
      {!showNewPatient && (
        <form onSubmit={handleVisitSubmit}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>

            <div style={{ fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 16 }}>
              Visit details
            </div>

            <div style={{ display: 'grid',
              gridTemplateColumns: '1fr 1fr', gap: 14 }}>

              <div>
                <label style={labelStyle}>Visit date *</label>
                <input style={inputStyle} type="date" required
                  value={visitForm.date}
                  onChange={e => setVisitForm(f =>
                    ({ ...f, date: e.target.value }))} />
              </div>

              <div>
                <label style={labelStyle}>Gestational age (weeks) *</label>
                <input style={inputStyle} type="number" required
                  min={4} max={44} placeholder="e.g. 28"
                  value={visitForm.ga}
                  onChange={e => setVisitForm(f =>
                    ({ ...f, ga: e.target.value }))} />
              </div>

              <div>
                <label style={labelStyle}>Systolic BP (mmHg) *</label>
                <input style={inputStyle} type="number" required
                  min={60} max={250} placeholder="e.g. 120"
                  value={visitForm.sbp}
                  onChange={e => setVisitForm(f =>
                    ({ ...f, sbp: e.target.value }))} />
              </div>

              <div>
                <label style={labelStyle}>Diastolic BP (mmHg) *</label>
                <input style={inputStyle} type="number" required
                  min={40} max={150} placeholder="e.g. 80"
                  value={visitForm.dbp}
                  onChange={e => setVisitForm(f =>
                    ({ ...f, dbp: e.target.value }))} />
              </div>

              <div>
                <label style={labelStyle}>Proteinuria</label>
                <select style={inputStyle}
                  value={visitForm.proteinuria}
                  onChange={e => setVisitForm(f =>
                    ({ ...f, proteinuria: e.target.value }))}>
                  {['None','Trace','1+','2+','3+'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Weight (kg) *</label>
                <input style={inputStyle} type="number" required
                  min={30} max={200} placeholder="e.g. 65"
                  value={visitForm.weight}
                  onChange={e => setVisitForm(f =>
                    ({ ...f, weight: e.target.value }))} />
              </div>

            </div>
          </div>

          {/* Alert preview */}
          {alertFlags && (
            <div style={{
              background: '#fff5f5', border: '1px solid #fecaca',
              borderRadius: 12, padding: '14px 16px', marginBottom: 16
            }}>
              <div style={{ fontSize: 14, fontWeight: 700,
                color: '#991b1b', marginBottom: 6 }}>
                Alert preview — this visit will trigger an alert
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {alertFlags.map((flag, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#555' }}>
                    · {flag}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!alertFlags && visitForm.sbp && visitForm.dbp && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #86efac',
              borderRadius: 12, padding: '12px 16px', marginBottom: 16
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>
                Readings are within normal range — no alert will fire
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={submitting || !selectedPatient}
              style={{
                background: submitting || !selectedPatient
                  ? '#e5e7eb' : '#4a7fa7',
                color: submitting || !selectedPatient ? '#9ca3af' : '#fff',
                border: 'none', borderRadius: 8,
                padding: '10px 24px', fontSize: 14, fontWeight: 600,
                cursor: submitting || !selectedPatient
                  ? 'not-allowed' : 'pointer',
              }}>
              {submitting ? 'Recording...' : 'Record visit'}
            </button>
            <button type="button"
              onClick={() => navigate('/patients')} style={{
                background: 'transparent',
                border: '1px solid #e5e7eb', borderRadius: 8,
                padding: '10px 20px', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', color: '#6b7280'
              }}>
              Cancel
            </button>
          </div>
        </form>
      )}

    </div>
  )
}
