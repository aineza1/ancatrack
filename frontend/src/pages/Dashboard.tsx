import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Chart, registerables } from 'chart.js'
import api from '../utils/api'

Chart.register(...registerables)

function RiskBadge({ isHigh }: { isHigh: boolean }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
      background: isHigh ? '#fee2e2' : '#dcfce7',
      color:      isHigh ? '#991b1b' : '#166534'
    }}>
      {isHigh ? 'High risk' : 'Normal'}
    </span>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<any[]>([])
  const [alerts, setAlerts]     = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const dashChartRef      = useRef<HTMLCanvasElement>(null)
  const dashChartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, aRes] = await Promise.all([
          api.get('/patients'),
          api.get('/alerts'),
        ])
        setPatients(pRes.data.patients || [])
        setAlerts(aRes.data.alerts?.filter((a: any) => a.status === 'active') || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!patients.length || !dashChartRef.current) return
    if (dashChartInstance.current) dashChartInstance.current.destroy()

    const labels = patients.map((p: any) => p.name.split(' ')[0])
    const sbps   = patients.map((p: any) => p.visits?.at(-1)?.sbp ?? 0)
    const dbps   = patients.map((p: any) => p.visits?.at(-1)?.dbp ?? 0)

    dashChartInstance.current = new Chart(dashChartRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Systolic (SBP)',
            data: sbps,
            backgroundColor: sbps.map((v: number) => v >= 140 ? 'rgba(239,68,68,0.75)' : 'rgba(74,127,167,0.75)'),
            borderRadius: 5,
          },
          {
            label: 'Diastolic (DBP)',
            data: dbps,
            backgroundColor: dbps.map((v: number) => v >= 90 ? 'rgba(239,68,68,0.45)' : 'rgba(74,127,167,0.4)'),
            borderRadius: 5,
          },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12, color: '#6b7280' } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} mmHg` } }
        },
        scales: {
          y: {
            min: 60, max: 170,
            ticks: { callback: v => v + ' mmHg', font: { size: 11 }, color: '#9ca3af' },
            grid: { color: 'rgba(0,0,0,0.04)' }
          },
          x: {
            ticks: { font: { size: 11 }, color: '#6b7280' },
            grid: { display: false }
          }
        }
      }
    })

    return () => { dashChartInstance.current?.destroy() }
  }, [patients])

  if (loading) return <div style={{ padding: 24, textAlign: 'center' }}>Loading dashboard...</div>
  if (error)   return <div style={{ padding: 24, color: 'red' }}>Error: {error}</div>
  if (patients.length === 0) return <div style={{ padding: 24, textAlign: 'center' }}>No patients found. Run <code>npm run seed</code>.</div>

  const highRisk = patients.filter((p: any) => {
    const last = p.visits?.at(-1)
    return last && (last.sbp >= 140 || last.dbp >= 90)
  }).length

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Total patients',    value: patients.length, color: '#4a7fa7', sub: 'Active ANC' },
          { label: 'High risk',         value: highRisk,        color: '#dc2626', sub: 'Need attention' },
          { label: 'Unresolved alerts', value: alerts.length,   color: '#d97706', sub: 'Today' },
          { label: 'Missed visits',     value: 0,               color: '#111',    sub: 'This week' },
        ].map(card => (
          <div key={card.label} style={{
            background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: 12, padding: '14px 18px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: card.color, lineHeight: 1 }}>
              {card.value}
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: '#fff', border: '1px solid #e5e7eb',
        borderRadius: 12, padding: 18, marginBottom: 28
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
            Latest BP readings — all patients
          </span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>
            Red = above WHO threshold (≥ 140/90 mmHg)
          </span>
        </div>
        <div style={{ position: 'relative', height: 200 }}>
          <canvas ref={dashChartRef} />
        </div>
      </div>

      {alerts.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 10 }}>
            Unresolved alerts
          </div>
          <div style={{ marginBottom: 28 }}>
            {alerts.map((alert: any) => {
              const p    = alert.patient
              const last = p?.visits?.at(-1)
              return (
                <div key={alert._id}
                  onClick={() => navigate(`/patients/${p?._id}`)}
                  style={{
                    background: alert.severity === 'high' ? '#fff5f5' : '#fffcf0',
                    border: `1px solid ${alert.severity === 'high' ? '#fecaca' : '#fde68a'}`,
                    borderRadius: 12, padding: '12px 16px',
                    marginBottom: 8, cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
                  }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
                      {p?.name ?? 'Unknown patient'}
                    </div>
                    <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>
                      {alert.flags?.[0]?.detail}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                      {last ? new Date(last.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      {last ? ` · ${last.ga} weeks GA` : ''}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
                    background: alert.severity === 'high' ? '#fee2e2' : '#fef3c7',
                    color:      alert.severity === 'high' ? '#991b1b' : '#92400e'
                  }}>
                    {alert.severity === 'high' ? 'High risk' : 'Medium'}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Recent patients table */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.06em', color: '#9ca3af' }}>Recent patients</div>
        <span onClick={() => navigate('/patients')}
          style={{ fontSize: 13, color: '#4a7fa7', cursor: 'pointer' }}>View all</span>
      </div>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Name','Last visit','BP','GA','Risk'].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '10px 14px',
                  fontSize: 11, fontWeight: 700, color: '#9ca3af',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: '1px solid #e5e7eb'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {patients.slice(0, 5).map((p: any) => {
              const last   = p.visits?.at(-1)
              const isHigh = last && (last.sbp >= 140 || last.dbp >= 90)
              const dotColor = isHigh ? '#ef4444' : '#22c55e'
              return (
                <tr key={p._id}
                  onClick={() => navigate(`/patients/${p._id}`)}
                  style={{ cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%',
                      background: dotColor, display: 'inline-block', marginRight: 8 }} />
                    {p.name}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#6b7280' }}>
                    {last ? new Date(last.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: isHigh ? '#dc2626' : '#111' }}>
                    {last ? `${last.sbp}/${last.dbp}` : '—'}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#6b7280' }}>
                    {last ? `${last.ga} wks` : '—'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <RiskBadge isHigh={isHigh} />
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
