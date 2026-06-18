import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { PATIENTS } from '../utils/data'
import { evaluatePatient, formatDate } from '../utils/alertEngine'

export default function Alerts() {
  const navigate = useNavigate()
  const alerts = PATIENTS.map(evaluatePatient).filter(Boolean)

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 16 }}>
        Active alerts ({alerts.length})
      </div>

      {alerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#9ca3af' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No active alerts</div>
          <div style={{ fontSize: 13 }}>All patients are within safe blood pressure ranges.</div>
        </div>
      ) : alerts.map(alert => alert && (
        <div key={alert.patient.id}
          style={{
            background: alert.severity === 'high' ? '#fff5f5' : '#fffcf0',
            border: `1px solid ${alert.severity === 'high' ? '#fecaca' : '#fde68a'}`,
            borderRadius: 12, padding: '14px 16px', marginBottom: 10,
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16
          }}>
          <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/patients/${alert.patient.id}`)}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
              {alert.patient.name} — {alert.flags[0].type.replace(/_/g, ' ').toLowerCase()}
            </div>
            <div style={{ fontSize: 13, color: '#555', marginTop: 3 }}>{alert.flags[0].detail}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 5 }}>
              {formatDate(alert.patient.visits[alert.patient.visits.length - 1].date)}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
              background: alert.severity === 'high' ? '#fee2e2' : '#fef3c7',
              color: alert.severity === 'high' ? '#991b1b' : '#92400e'
            }}>
              {alert.severity === 'high' ? 'High' : 'Medium'}
            </span>
            <button onClick={() => toast.success(`Alert resolved for ${alert.patient.name}`)}
              style={{ background: '#dcfce7', color: '#166534', border: 'none',
                borderRadius: 7, padding: '5px 11px', fontSize: 11,
                fontWeight: 600, cursor: 'pointer' }}>
              Resolve
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
