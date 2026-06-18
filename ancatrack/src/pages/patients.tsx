import { useNavigate } from 'react-router-dom'
import { PATIENTS } from '../utils/data'
import { formatDate } from '../utils/alertEngine'

export default function Patients() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.06em', color: '#9ca3af' }}>
          All patients ({PATIENTS.length})
        </div>
        <button onClick={() => navigate('/visit')} style={{
          background: '#4a7fa7', color: '#fff', border: 'none',
          borderRadius: 8, padding: '7px 16px', fontSize: 13,
          fontWeight: 600, cursor: 'pointer', display: 'flex',
          alignItems: 'center', gap: 6
        }}>
          + New patient
        </button>
      </div>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Name','EDD','GA','Last BP','Visits','Risk'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px',
                  fontSize: 11, fontWeight: 700, color: '#9ca3af',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: '1px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PATIENTS.map(p => {
              const last = p.visits[p.visits.length - 1]
              const dotColor = p.risk === 'high' ? '#ef4444' : p.risk === 'medium' ? '#f59e0b' : '#22c55e'
              const badgeMap: Record<string,[string,string]> = {
                high: ['#fee2e2','#991b1b'],
                medium: ['#fef3c7','#92400e'],
                normal: ['#dcfce7','#166534']
              }
              const [bg, color] = badgeMap[p.risk]
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
                  <td style={{ padding: '12px 14px', color: '#6b7280' }}>{formatDate(p.edd)}</td>
                  <td style={{ padding: '12px 14px', color: '#6b7280' }}>{p.ga} wks</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>{last.sbp}/{last.dbp}</td>
                  <td style={{ padding: '12px 14px', color: '#6b7280' }}>{p.visits.length}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px',
                      borderRadius: 20, background: bg, color }}>
                      {p.risk === 'normal' ? 'Normal' : p.risk === 'high' ? 'High risk' : 'Medium'}
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
