import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function Patients() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/patients')
        setPatients(res.data.patients || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  if (loading) return <div style={{ padding: 24, textAlign: 'center' }}>Loading patients...</div>
  if (error) return <div style={{ padding: 24, color: 'red' }}>Error: {error}</div>
  if (patients.length === 0) return <div style={{ padding: 24, textAlign: 'center' }}>No patients found.</div>

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af' }}>All patients ({patients.length})</div>
        <button onClick={() => navigate('/record-visit')} style={{ background: '#4a7fa7', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ New patient</button>
      </div>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: '#f9fafb' }}>
            {['Name','EDD','GA','Last BP','Visits','Risk'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#9ca3af' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {patients.map(p => {
              const visits = p.visits || []
              const last = visits[visits.length - 1]
              const isHigh = last && (last.sbp >= 140 || last.dbp >= 90)
              return (
                <tr key={p._id} onClick={() => navigate(`/patients/${p._id}`)} style={{ cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 14px' }}>{p.name}</td>
                  <td style={{ padding: '12px 14px', color: '#6b7280' }}>{p.edd ? new Date(p.edd).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '12px 14px', color: '#6b7280' }}>{visits.length > 0 ? `${visits[visits.length - 1].ga} wks` : '—'}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>{last ? `${last.sbp}/${last.dbp}` : '—'}</td>
                  <td style={{ padding: '12px 14px', color: '#6b7280' }}>{visits.length}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: isHigh ? '#fee2e2' : '#dcfce7', color: isHigh ? '#991b1b' : '#166534' }}>
                      {isHigh ? 'High risk' : 'Normal'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
