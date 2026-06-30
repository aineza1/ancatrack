import { useParams, useNavigate } from 'react-router-dom'
import { evaluatePatient, formatDate, calculateRiskScore } from '../utils/alertEngine'
import RiskScoreCard from '../components/ui/RiskScoreCard'
import toast from 'react-hot-toast'
import { useEffect, useRef, useState } from 'react'
import { Chart, registerables } from 'chart.js'
import api from '../utils/api'
import { useIsMobile } from '../hooks/useIsMobile'

Chart.register(...registerables)

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')
  const [patient, setPatient]     = useState<any>(null)
  const [alerts, setAlerts]       = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/patients/${id}`)
        setPatient(res.data.patient)
        setAlerts(res.data.alerts || [])
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load patient')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  useEffect(() => {
    if (!patient || !chartRef.current) return
    if (chartInstance.current) chartInstance.current.destroy()

    const labels  = patient.visits.map((v: any, i: number) => `Visit ${i + 1} (${v.ga}w)`)
    const sbpData = patient.visits.map((v: any) => v.sbp)
    const dbpData = patient.visits.map((v: any) => v.dbp)
    const isBar   = chartType === 'bar'

    const dangerPlugin = {
      id: 'dangerZone',
      afterDraw(chart: Chart) {
        const { ctx, chartArea: { left, right }, scales: { y } } = chart
        ;[90, 140].forEach(threshold => {
          const yPos = y.getPixelForValue(threshold)
          ctx.save()
          ctx.setLineDash([5, 4])
          ctx.strokeStyle = 'rgba(239,68,68,0.35)'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(left, yPos)
          ctx.lineTo(right, yPos)
          ctx.stroke()
          ctx.restore()
        })
      }
    }

    chartInstance.current = new Chart(chartRef.current, {
      type: chartType,
      data: {
        labels,
        datasets: [
          {
            label: 'SBP',
            data: sbpData,
            borderColor: '#4a7fa7',
            backgroundColor: isBar ? 'rgba(74,127,167,0.75)' : 'rgba(74,127,167,0.08)',
            borderWidth: isBar ? 0 : 2.5,
            pointRadius: isBar ? 0 : 5,
            pointBackgroundColor: '#4a7fa7',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            tension: 0.35,
            fill: !isBar,
          },
          {
            label: 'DBP',
            data: dbpData,
            borderColor: '#ef4444',
            backgroundColor: isBar ? 'rgba(239,68,68,0.75)' : 'rgba(239,68,68,0.08)',
            borderWidth: isBar ? 0 : 2.5,
            pointRadius: isBar ? 0 : 5,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            tension: 0.35,
            fill: !isBar,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} mmHg` } }
        },
        scales: {
          x: { ticks: { font: { size: 11 }, color: '#9ca3af' }, grid: { color: 'rgba(0,0,0,0.04)' } },
          y: {
            min: 60, max: 170,
            ticks: { font: { size: 11 }, color: '#9ca3af', callback: v => v + ' mmHg' },
            grid: { color: 'rgba(0,0,0,0.04)' }
          }
        }
      },
      plugins: isBar ? [] : [dangerPlugin]
    })

    return () => { chartInstance.current?.destroy() }
  }, [patient, chartType])

  const handleAcknowledge = async (alertId: string) => {
    try {
      await api.patch(`/alerts/${alertId}/acknowledge`)
      setAlerts(prev => prev.filter((a: any) => a._id !== alertId))
      toast.success(`Alert acknowledged for ${patient.name}`)
    } catch {
      toast.error('Failed to acknowledge alert')
    }
  }

  const handleEscalate = async (alertId: string) => {
    try {
      await api.patch(`/alerts/${alertId}/escalate`, { escalatedTo: 'Obstetrics / Specialist Dept' })
      setAlerts(prev => prev.filter((a: any) => a._id !== alertId))
      toast.error(`${patient.name} flagged for specialist review`)
    } catch {
      toast.error('Failed to escalate alert')
    }
  }

  if (loading) return <div style={{ padding: 24, textAlign: 'center' }}>Loading patient...</div>
  if (error)   return (
    <div style={{ padding: 24 }}>
      <p style={{ color: '#dc2626', marginBottom: 12 }}>{error}</p>
      <button onClick={() => navigate('/patients')}
        style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
          padding: '5px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
        ← Back to patients
      </button>
    </div>
  )
  if (!patient) return null

  const patientForEngine = {
    ...patient,
    id:  patient._id,
    dob: typeof patient.dob === 'string' ? patient.dob : new Date(patient.dob).toISOString(),
    visits: patient.visits.map((v: any) => ({
      ...v,
      date: typeof v.date === 'string' ? v.date : new Date(v.date).toISOString(),
    }))
  }

  const alertResult = evaluatePatient(patientForEngine)
  const { band }    = calculateRiskScore(patientForEngine)
  const latest      = patient.visits[patient.visits.length - 1]
  const baseline    = patient.visits[0]

  const dotColor = band === 'high' ? '#ef4444' : band === 'medium' ? '#f59e0b' : '#22c55e'
  const badgeMap: Record<string, [string, string]> = {
    high:   ['#fee2e2', '#991b1b'],
    medium: ['#fef3c7', '#92400e'],
    low:    ['#dcfce7', '#166534'],
  }
  const [badgeBg, badgeColor] = badgeMap[band]

  return (
    <div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 24px', background: '#f9fafb',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <button onClick={() => navigate('/patients')} style={{
          background: '#fff', border: '1px solid #e5e7eb',
          borderRadius: 8, padding: '5px 11px', fontSize: 12,
          fontWeight: 600, cursor: 'pointer', color: '#4b5563'
        }}>← Patients</button>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#111', flex: 1 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor,
            display: 'inline-block', marginRight: 8 }} />
          {patient.name}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px',
          borderRadius: 20, background: badgeBg, color: badgeColor }}>
          {band === 'low' ? 'Normal' : band === 'high' ? 'High risk' : 'Medium'}
        </span>
      </div>

      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>

        {alerts.map((alert: any) => (
          <div key={alert._id} style={{
            background: '#fff5f5', border: '1px solid #fecaca',
            borderRadius: 12, padding: '14px 16px', marginBottom: 16
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#991b1b', marginBottom: 4 }}>
               {alert.flags.some((f: any) => f.type === 'COMBINED_RISK')
                ? 'Combined pre-eclampsia risk — WHO criteria met'
                : 'BP trajectory alert — WHO threshold exceeded'}
            </div>
            <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>
              {alert.flags.map((f: any) => f.detail).join(' · ')}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => handleAcknowledge(alert._id)}
                style={{ background: '#dcfce7', color: '#166534', border: 'none',
                  borderRadius: 7, padding: '6px 14px', fontSize: 12,
                  fontWeight: 600, cursor: 'pointer' }}>
                Mark acknowledged
              </button>
              <button onClick={() => handleEscalate(alert._id)}
                style={{ background: '#fff', color: '#991b1b', border: '1px solid #fca5a5',
                  borderRadius: 7, padding: '6px 14px', fontSize: 12,
                  fontWeight: 600, cursor: 'pointer' }}>
                Flag for escalation
              </button>
            </div>
          </div>
        ))}

        {alerts.length === 0 && alertResult && (
          <div style={{
            background: '#fffcf0', border: '1px solid #fde68a',
            borderRadius: 12, padding: '14px 16px', marginBottom: 16
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>
               {alertResult.flags.some(f => f.type === 'COMBINED_RISK')
                ? 'Combined pre-eclampsia risk — WHO criteria met'
                : 'BP trajectory alert — WHO threshold exceeded'}
            </div>
            <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>
              {alertResult.flags.map(f => f.detail).join(' · ')}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <RiskScoreCard patient={patientForEngine} />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 14, marginBottom: 20
       }}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const,
              letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 12 }}>Patient info</div>
            {[
              ['Full name',     patient.name],
              ['Date of birth', formatDate(patient.dob)],
              ['EDD',           formatDate(patient.edd)],
              ['Parity',        patient.parity],
              ['Insurance',     patient.insurance],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between',
                padding: '5px 0', borderBottom: '1px solid #f4f4f4', fontSize: 13 }}>
                <span style={{ color: '#9ca3af' }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const,
              letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 12 }}>
              Latest visit — {formatDate(latest.date)}
            </div>
            {[
              ['GA',          `${latest.ga} weeks`],
              ['SBP',         `${latest.sbp} mmHg`],
              ['DBP',         `${latest.dbp} mmHg`],
              ['Proteinuria', latest.proteinuria],
              ['Weight',      `${latest.weight} kg`],
            ].map(([k, v]) => {
              const isDanger = (k === 'SBP' && latest.sbp >= 140) || (k === 'DBP' && latest.dbp >= 90)
              const isWarn   = k === 'Proteinuria' && latest.proteinuria !== 'None'
              return (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between',
                  padding: '5px 0', borderBottom: '1px solid #f4f4f4', fontSize: 13 }}>
                  <span style={{ color: '#9ca3af' }}>{k}</span>
                  <span style={{ fontWeight: 600,
                    color: isDanger ? '#dc2626' : isWarn ? '#d97706' : '#111' }}>
                    {v}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb',
          borderRadius: 12, padding: 18, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
              Blood pressure across visits
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['line', 'bar'] as const).map(t => (
                <button key={t} onClick={() => setChartType(t)} style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12,
                  cursor: 'pointer', fontWeight: 500,
                  background: chartType === t ? '#4a7fa7' : '#fff',
                  color:      chartType === t ? '#fff'    : '#6b7280',
                  border: `1px solid ${chartType === t ? '#4a7fa7' : '#e5e7eb'}`
                }}>
                  {t === 'line' ? 'Trend' : 'Per visit'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative', height: 200 }}>
            <canvas ref={chartRef} />
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
            {[
              { color: '#4a7fa7',            label: 'Systolic (SBP)' },
              { color: '#ef4444',            label: 'Diastolic (DBP)' },
              { color: 'rgba(239,68,68,0.3)', label: 'Danger zone ≥ 140/90' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}>
                <div style={{ width: 16, height: 2.5, borderRadius: 2, background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const,
          letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 10 }}>
          Visit history
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {patient.visits.map((v: any, i: number) => {
            const visitDelta = i === 0 ? null : v.dbp - baseline.dbp
            const isFlagged  = visitDelta !== null && visitDelta >= 15
            const deltaColor = visitDelta === null ? '#9ca3af' : isFlagged ? '#dc2626' : visitDelta >= 8 ? '#d97706' : '#9ca3af'
            const deltaLabel = visitDelta === null ? 'Baseline' : `+${visitDelta} mmHg${isFlagged ? ' ↑' : ''}`
            const rowDot     = isFlagged ? '#ef4444' : v.dbp >= 90 || v.sbp >= 140 ? '#f59e0b' : '#22c55e'
            const protColor  = v.proteinuria === 'None'
              ? ['#dcfce7','#166534']
              : v.proteinuria === 'Trace'
                ? ['#fef3c7','#92400e']
                : ['#fee2e2','#991b1b']
            return (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '8px 130px 90px 70px 80px 1fr',
                gap: 10, alignItems: 'center',
                padding: '10px 14px',
                background: isFlagged ? '#fff5f5' : '#f9fafb',
                border: `1px solid ${isFlagged ? '#fecaca' : '#f0f0f0'}`,
                borderRadius: 8, fontSize: 13
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%',
                  background: rowDot, display: 'inline-block' }} />
                <span style={{ color: '#6b7280' }}>{formatDate(v.date)}</span>
                <span style={{ fontWeight: 600,
                  color: v.sbp >= 140 || v.dbp >= 90 ? '#dc2626' : '#111' }}>
                  {v.sbp} / {v.dbp}
                </span>
                <span style={{ color: '#9ca3af' }}>{v.ga} wks</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px',
                  borderRadius: 20, background: protColor[0], color: protColor[1] }}>
                  {v.proteinuria}
                </span>
                <span style={{ fontWeight: 700, fontSize: 12,
                  color: deltaColor, textAlign: 'right' }}>
                  {deltaLabel}
                </span>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
