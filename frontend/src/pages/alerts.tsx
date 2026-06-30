import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../utils/api'

export default function Alerts() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/alerts')
        setAlerts(res.data.alerts || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const acknowledge = async (id: string) => {
    try {
      await api.patch(`/alerts/${id}/acknowledge`)
      toast.success('Alert acknowledged')
      setAlerts(prev => prev.filter(a => a._id !== id))
    } catch { toast.error('Failed') }
  }

  const escalate = async (id: string) => {
    const to = prompt('Specialist name:')
    if (!to) return
    try {
      await api.patch(`/alerts/${id}/escalate`, { escalatedTo: to })
      toast.success(`Escalated to ${to}`)
      setAlerts(prev => prev.filter(a => a._id !== id))
    } catch { toast.error('Failed') }
  }

  if (loading) return <div style={{ padding: 24, textAlign: 'center' }}>Loading alerts...</div>
  if (error) return <div style={{ padding: 24, color: 'red' }}>Error: {error}</div>
  if (alerts.length === 0) return <div style={{ padding: 40, textAlign: 'center', background: '#f9fafb', borderRadius: 12 }}>✅ No active alerts</div>

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 20 }}>Alerts ({alerts.length})</div>
      {alerts.map(a => {
        const patientName = typeof a.patient === 'object' ? a.patient.name : 'Unknown'
        const patientId = typeof a.patient === 'object' && a.patient._id ? a.patient._id : a.patient
        return (
          <div key={a._id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{patientName}</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{a.flags?.map((f:any) => f.detail).join(' • ') || 'Alert'}</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>{new Date(a.createdAt).toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => acknowledge(a._id)} style={{ padding: '6px 14px', fontSize: 12, background: '#e5e7eb', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Acknowledge</button>
                <button onClick={() => escalate(a._id)} style={{ padding: '6px 14px', fontSize: 12, background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Escalate</button>
                <button onClick={() => navigate(`/patients/${patientId}`)} style={{ padding: '6px 14px', fontSize: 12, background: '#eaf2f8', color: '#4a7fa7', border: 'none', borderRadius: 6, cursor: 'pointer' }}>View</button>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: a.severity === 'high' ? '#fee2e2' : '#fef3c7', color: a.severity === 'high' ? '#991b1b' : '#92400e' }}>
                {a.severity === 'high' ? ' High' : 'Medium'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
