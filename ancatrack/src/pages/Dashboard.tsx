import { useNavigate } from 'react-router-dom'
import { PATIENTS } from '../utils/data'
import { evaluatePatient, formatDate } from '../utils/alertEngine'

export default function Dashboard() {
  const navigate = useNavigate()
  const alerts = PATIENTS.map(evaluatePatient).filter(Boolean)
  const highRisk = PATIENTS.filter(p => p.risk === 'high').length

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Total patients', value: PATIENTS.length, color: '#4a7fa7', sub: 'Active ANC' },
          { label: 'High risk', value: highRisk, color: '#dc2626', sub: 'Need attention' },
          { label: 'Unresolved alerts', value: alerts.length, color: '#d97706', sub: 'Today' },
          { label: 'Missed visits', value: 4, color: '#111', sub: 'This week' },
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

      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 10 }}>
        Unresolved alerts
      </div>
      <div style={{ marginBottom: 28 }}>
        {alerts.map(alert => alert && (
          <div key={alert.patient.id}
            onClick={() => navigate(`/patients/${alert.patient.id}`)}
            style={{
              background: alert.severity === 'high' ? '#fff5f5' : '#fffcf0',
              border: `1px solid ${alert.severity === 'high' ? '#fecaca' : '#fde68a'}`,
              borderRadius: 12, padding: '12px 16px',
              marginBottom: 8, cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
            }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
                {alert.patient.name}
              </div>
              <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>
                {alert.flags[0].detail}
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                {formatDate(alert.patient.visits[alert.patient.visits.length - 1].date)}
                · {alert.patient.ga} weeks GA
              </div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
              background: alert.severity === 'high' ? '#fee2e2' : '#fef3c7',
              color: alert.severity === 'high' ? '#991b1b' : '#92400e'
            }}>
              {alert.severity === 'high' ? 'High risk' : 'Medium'}
            </span>
          </div>
        ))}
      </div>

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
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px',
                  fontSize: 11, fontWeight: 700, color: '#9ca3af',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: '1px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PATIENTS.slice(0, 5).map(p => {
              const last = p.visits[p.visits.length - 1]
              const dotColor = p.risk === 'high' ? '#ef4444' : p.risk === 'medium' ? '#f59e0b' : '#22c55e'
              return (
                <tr key={p.id} onClick={() => navigate(`/patients/${p.id}`)}
                  style={{ cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%',
                      background: dotColor, display: 'inline-block', marginRight: 8 }} />
                    {p.name}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#6b7280' }}>{formatDate(last.date)}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>{last.sbp}/{last.dbp}</td>
                  <td style={{ padding: '12px 14px', color: '#6b7280' }}>{last.ga} wks</td>
                  <td style={{ padding: '12px 14px' }}>
                    <RiskBadge risk={p.risk} />
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

function RiskBadge({ risk }: { risk: string }) {
  const map: Record<string, [string, string]> = {
    high:   ['#fee2e2', '#991b1b'],
    medium: ['#fef3c7', '#92400e'],
    normal: ['#dcfce7', '#166534'],
  }
  const [bg, color] = map[risk] || ['#f3f4f6', '#4b5563']
  const label = risk === 'normal' ? 'Normal' : risk === 'high' ? 'High risk' : 'Medium'
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px',
      borderRadius: 20, background: bg, color }}>
      {label}
    </span>
  )
}
