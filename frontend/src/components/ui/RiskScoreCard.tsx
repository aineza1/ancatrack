import { calculateRiskScore } from '../../utils/alertEngine'
import type { Patient } from '../../types'
import { useIsMobile } from '../../hooks/useIsMobile'

interface Props {
  patient: Patient
}

export default function RiskScoreCard({ patient }: Props) {
  const { score, band, breakdown, dominantFactor } = calculateRiskScore(patient)
  const isMobile = useIsMobile()

  const bandColors: Record<string, { bar: string; bg: string; text: string; border: string }> = {
    low:    { bar: '#22c55e', bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
    medium: { bar: '#f59e0b', bg: '#fffcf0', text: '#92400e', border: '#fde68a' },
    high:   { bar: '#b91c1c', bg: '#fff5f5', text: '#991b1b', border: '#fecaca' },
  }

  const colors = bandColors[band]

  return (
    <div style={{
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: 12,
      padding: isMobile ? '14px 14px' : '18px 20px',
    }}>

      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'flex-start',
        gap: isMobile ? 10 : 0,
        marginBottom: 16
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const,
            letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 4 }}>
            Pre-eclampsia risk score
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: isMobile ? 34 : 42, fontWeight: 800, color: colors.text, lineHeight: 1 }}>
              {score}
            </span>
            <span style={{ fontSize: 16, color: '#9ca3af', fontWeight: 500 }}>/100</span>
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            Driven by: <strong>{dominantFactor}</strong>
          </div>
        </div>
        <span style={{
          fontSize: 13, fontWeight: 700, padding: '6px 14px',
          borderRadius: 20, background: colors.text, color: '#fff',
          letterSpacing: '0.03em', textTransform: 'uppercase' as const,
          alignSelf: isMobile ? 'flex-start' : 'auto'
        }}>
          {band === 'low' ? 'Low risk' : band === 'medium' ? 'Medium risk' : 'High risk'}
        </span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ background: '#e5e7eb', borderRadius: 8, height: 10, overflow: 'hidden' }}>
          <div style={{
            width: `${score}%`,
            height: '100%',
            background: colors.bar,
            borderRadius: 8,
            transition: 'width 0.6s ease'
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between',
          fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
          <span>0 — Low</span>
          <span>30 — Medium</span>
          <span>60 — High</span>
          <span>100</span>
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const,
        letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 8 }}>
        Score breakdown
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {breakdown.map((item, i) => (
          isMobile ? (

            <div key={i} style={{
              padding: '9px 10px',
              background: item.points > 0 ? 'rgba(255,255,255,0.7)' : 'transparent',
              borderRadius: 8,
              fontSize: 12
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: '#374151' }}>{item.factor}</span>
                <span style={{
                  fontWeight: 700,
                  color: item.points > 0 ? colors.text : '#9ca3af'
                }}>
                  {item.points}/{item.maxPoints}
                </span>
              </div>
              <div style={{ background: '#e5e7eb', borderRadius: 4, height: 5, marginBottom: 4 }}>
                <div style={{
                  width: `${(item.points / item.maxPoints) * 100}%`,
                  height: '100%',
                  background: item.points === 0 ? '#d1d5db' : colors.bar,
                  borderRadius: 4,
                  transition: 'width 0.4s ease'
                }} />
              </div>
              <span style={{ color: '#6b7280', fontSize: 11 }}>{item.reason}</span>
            </div>
          ) : (

            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '160px 1fr 60px',
              alignItems: 'center',
              gap: 10,
              padding: '7px 10px',
              background: item.points > 0 ? 'rgba(255,255,255,0.7)' : 'transparent',
              borderRadius: 8,
              fontSize: 12
            }}>
              <span style={{ fontWeight: 600, color: '#374151' }}>{item.factor}</span>
              <div>
                <div style={{ background: '#e5e7eb', borderRadius: 4, height: 5, marginBottom: 3 }}>
                  <div style={{
                    width: `${(item.points / item.maxPoints) * 100}%`,
                    height: '100%',
                    background: item.points === 0 ? '#d1d5db' : colors.bar,
                    borderRadius: 4,
                    transition: 'width 0.4s ease'
                  }} />
                </div>
                <span style={{ color: '#6b7280', fontSize: 11 }}>{item.reason}</span>
              </div>
              <span style={{
                textAlign: 'right' as const,
                fontWeight: 700,
                color: item.points > 0 ? colors.text : '#9ca3af'
              }}>
                {item.points}/{item.maxPoints}
              </span>
            </div>
          )
        ))}
      </div>

      <div style={{
        marginTop: 14,
        padding: '10px 12px',
        background: 'rgba(255,255,255,0.6)',
        borderRadius: 8,
        fontSize: 11,
        color: '#6b7280',
        lineHeight: 1.5
      }}>
        <strong>Note:</strong> This score is a clinical decision support tool based on WHO antenatal
        care guidelines and BP trajectory methodology. It does not replace physician judgment.
        {band === 'high' && ' Consider urgent review and possible referral.'}
        {band === 'medium' && ' Monitor closely at next scheduled visit.'}
        {band === 'low' && ' Continue routine ANC schedule.'}
      </div>
    </div>
  )
}
