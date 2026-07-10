import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Chart, registerables } from 'chart.js'
import logo from '../assets/logo.png'
import { useLanguage } from '../hooks/useLanguage'

Chart.register(...registerables)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function PatientDashboard() {
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const navigate  = useNavigate()
  const chartRef  = useRef<HTMLCanvasElement>(null)
  const chartInst = useRef<Chart | null>(null)
  const { language, toggleLanguage, t } = useLanguage()

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem('patientToken')
        if (!token) { navigate('/patient-login'); return }
        const res = await axios.get(`${API_URL}/portal/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setPatient(res.data.patient)
      } catch {
        localStorage.removeItem('patientToken')
        navigate('/patient-login')
      } finally {
        setLoading(false)
      }
    }
    fetchMe()
  }, [navigate])

  useEffect(() => {
    if (!patient || !chartRef.current) return
    if (chartInst.current) chartInst.current.destroy()

    const visits = patient.visits || []
    if (visits.length < 2) return

    const labels  = visits.map((_: any, i: number) => `Visit ${i + 1}`)
    const dbpData = visits.map((v: any) => v.dbp)
    const sbpData = visits.map((v: any) => v.sbp)

    chartInst.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Diastolic (DBP)',
            data: dbpData,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239,68,68,0.08)',
            borderWidth: 2.5,
            pointRadius: 5,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            tension: 0.35,
            fill: true,
          },
          {
            label: 'Systolic (SBP)',
            data: sbpData,
            borderColor: '#4a7fa7',
            backgroundColor: 'rgba(74,127,167,0.06)',
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: '#4a7fa7',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            tension: 0.35,
            fill: false,
          },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 11 }, boxWidth: 12, color: '#6b7280' }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} mmHg`
            }
          }
        },
        scales: {
          x: {
            ticks: { font: { size: 11 }, color: '#9ca3af' },
            grid: { color: 'rgba(0,0,0,0.04)' }
          },
          y: {
            min: 60, max: 170,
            ticks: {
              font: { size: 11 }, color: '#9ca3af',
              callback: v => v + ' mmHg'
            },
            grid: { color: 'rgba(0,0,0,0.04)' }
          }
        }
      }
    })

    return () => { chartInst.current?.destroy() }
  }, [patient])

  const handleLogout = () => {
    localStorage.removeItem('patientToken')
    localStorage.removeItem('patientInfo')
    navigate('/patient-login')
  }

  if (loading) return (
    <div style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>
      Loading your health record...
    </div>
  )
  if (!patient) return null

  const visits   = patient.visits || []
  const latest   = visits[visits.length - 1]
  const baseline = visits[0]
  const doctor   = patient.assignedDoctor

  const isHighRisk = latest && (latest.sbp >= 140 || latest.dbp >= 90)
  const isMedium   = latest && !isHighRisk && (
    (baseline && (latest.dbp - baseline.dbp) >= 10) ||
    (latest.proteinuria && latest.proteinuria !== 'None')
  )

  const statusColor  = isHighRisk ? '#991b1b' : isMedium ? '#92400e' : '#166534'
  const statusBg     = isHighRisk ? '#fee2e2' : isMedium ? '#fef3c7' : '#dcfce7'
  const statusBorder = isHighRisk ? '#fecaca' : isMedium ? '#fde68a' : '#bbf7d0'

const riskExplanation = () => {
  if (!latest) return null
  const dbpRise = baseline ? latest.dbp - baseline.dbp : 0
  const hasProteinuria = latest.proteinuria && latest.proteinuria !== 'None'

  if (isHighRisk && hasProteinuria) {
    return (
      <div>
        <div style={{ marginBottom: 8, color: '#991b1b', fontSize: 14, fontWeight: 600 }}>
          {t('riskHighProteinuriaHeading')}
        </div>
        <ul style={{ margin: '4px 0 0 0', paddingLeft: 20, fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
          <li>{t('riskHighProteinuria1')}</li>
          <li>{t('riskHighProteinuria2')}</li>
          <li>{t('riskHighProteinuria3')}</li>
          <li><strong>{t('riskHighProteinuria4')}</strong></li>
        </ul>
      </div>
    )
  }

  if (isHighRisk) {
    return (
      <div>
        <div style={{ marginBottom: 8, color: '#991b1b', fontSize: 14, fontWeight: 600 }}>
          {t('riskHighHeading')}
        </div>
        <ul style={{ margin: '4px 0 0 0', paddingLeft: 20, fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
          <li>{t('riskHigh1')}</li>
          <li>{t('riskHigh2')}</li>
          <li><strong>{t('riskHigh3')}</strong></li>
        </ul>
      </div>
    )
  }

  if (dbpRise >= 10) {
    return (
      <div>
        <div style={{ marginBottom: 8, color: '#d97706', fontSize: 14, fontWeight: 600 }}>
          {t('riskRisingHeading')}
        </div>
        <ul style={{ margin: '4px 0 0 0', paddingLeft: 20, fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
          <li>{t('riskRising1')}</li>
          <li>{t('riskRising2')}</li>
          <li>{t('riskRising3')}</li>
        </ul>
      </div>
    )
  }

  if (hasProteinuria) {
    return (
      <div>
        <div style={{ marginBottom: 8, color: '#d97706', fontSize: 14, fontWeight: 600 }}>
          {t('riskProteinuriaHeading')}
        </div>
        <ul style={{ margin: '4px 0 0 0', paddingLeft: 20, fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
          <li>{t('riskProteinuria1')}</li>
          <li>{t('riskProteinuria2')}</li>
        </ul>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 8, color: '#16a34a', fontSize: 14, fontWeight: 600 }}>
        {t('riskNormalHeading')}
      </div>
      <ul style={{ margin: '4px 0 0 0', paddingLeft: 20, fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
        <li>{t('riskNormal1')}</li>
        <li>{t('riskNormal2')}</li>
      </ul>
      <ul style={{ margin: '4px 0 0 0', paddingLeft: 35, fontSize: 13, color: '#374151', lineHeight: 1.8 }}>
        <li>{t('riskNormalSymptom1')}</li>
        <li>{t('riskNormalSymptom2')}</li>
        <li>{t('riskNormalSymptom3')}</li>
        <li>{t('riskNormalSymptom4')}</li>
        <li>{t('riskNormalSymptom5')}</li>
      </ul>
    </div>
  )
}

  const nextVisitDate = latest
    ? new Date(new Date(latest.date).getTime() + 28 * 24 * 60 * 60 * 1000)
        .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Not scheduled yet'

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    })

  return (
    <div style={{ minHeight: '100vh', background: '#f7f9fc' }}>

      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={logo} alt="AncaTrack"
            style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>
              {t('appName')}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>
              {t('patientPortal')}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={toggleLanguage} style={{
            fontSize: 12, fontWeight: 600, padding: '4px 12px',
            borderRadius: 20, cursor: 'pointer',
            background: 'rgba(74,127,167,0.1)',
            color: '#4a7fa7',
            border: '1px solid rgba(74,127,167,0.3)'
          }}>
            {language === 'en' ? 'Kinyarwanda' : 'English'}
          </button>
          <span style={{ fontSize: 13, color: '#4b5563', fontWeight: 500 }}>
            {patient.name}
          </span>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '6px 12px', fontSize: 13,
            color: '#dc2626', background: 'transparent',
            border: '1px solid #dc2626', borderRadius: 6,
            cursor: 'pointer'
          }}>
            {t('signOut')}
          </button>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#4a7fa7', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, color: '#fff'
          }}>
            {patient.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>

        <div style={{
          background: statusBg, border: `1px solid ${statusBorder}`,
          borderRadius: 12, padding: '14px 16px', marginBottom: 20
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 4
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: statusColor }}>
              {t(isHighRisk ? 'statusHighHeading' : isMedium ? 'statusMediumHeading' : 'statusNormalHeading')}
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '3px 9px',
              borderRadius: 20, background: statusColor, color: '#fff',
              whiteSpace: 'nowrap' as const, marginLeft: 12
            }}>
              {t(isHighRisk ? 'needsAttention' : isMedium ? 'monitorClosely' : 'normal')}
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>
            {t(isHighRisk ? 'statusHighText' : isMedium ? 'statusMediumText' : 'statusNormalText')}
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 14, marginBottom: 20
        }}>
          <div style={{
            background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: 12, padding: '16px 18px'
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 10
            }}>
              {t('whatThisMeans')}
            </div>
            <div style={{ lineHeight: 1.7 }}>
              {riskExplanation()}
            </div>
            {isHighRisk && (
              <div style={{
                marginTop: 12, padding: '10px 12px',
                background: '#fff5f5', borderRadius: 8,
                fontSize: 12, color: '#991b1b', fontWeight: 600,
                lineHeight: 1.5
              }}>
                {t('emergencyWarning')}
              </div>
            )}
          </div>

          {doctor && (
            <div style={{
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: 12, padding: '16px 18px'
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 14
              }}>
                {t('yourDoctor')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: '#4a7fa7', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0
                }}>
                  {doctor.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>
                    {doctor.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
                    Nyamata District Hospital
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
                    {t('forEmergencies')}
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: 16, paddingTop: 14,
                borderTop: '1px solid #f4f4f4'
              }}>
                <div style={{
                  fontSize: 11, color: '#9ca3af',
                  fontWeight: 600, marginBottom: 4
                }}>
                  {t('nextVisit')}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
                  {nextVisitDate}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
                  {t('nextVisitNote')}
                </div>
              </div>
            </div>
          )}
        </div>

        {latest && (
          <div style={{
            background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: 12, padding: '16px 18px', marginBottom: 20
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 14
            }}>
              {t('latestReading')} — {formatDate(latest.date)}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12
            }}>
              {[
                { label: t('bloodPressure'),      value: `${latest.sbp}/${latest.dbp}`, unit: 'mmHg',  highlight: !!isHighRisk },
                { label: t('weeksPregnantLabel'),  value: `${latest.ga}`,               unit: t('weeksPregnant'), highlight: false },
                { label: t('proteinInUrine'),      value: latest.proteinuria,            unit: '',       highlight: latest.proteinuria !== 'None' },
                { label: t('weight'),              value: `${latest.weight}`,            unit: 'kg',     highlight: false },
              ].map(item => (
                <div key={item.label} style={{
                  background: '#f9fafb', borderRadius: 10, padding: '12px 14px'
                }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: 22, fontWeight: 700,
                    color: item.highlight ? '#dc2626' : '#111'
                  }}>
                    {item.value}
                    <span style={{
                      fontSize: 12, fontWeight: 400,
                      color: '#9ca3af', marginLeft: 4
                    }}>
                      {item.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {visits.length >= 2 && (
          <div style={{
            background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: 12, padding: '16px 18px', marginBottom: 20
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 4
            }}>
              {t('bpOverTime')}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>
              {t('bpChartNote')}
            </div>
            <div style={{ position: 'relative', height: 200 }}>
              <canvas ref={chartRef} />
            </div>
          </div>
        )}

        <div style={{
          background: '#fff', border: '1px solid #e5e7eb',
          borderRadius: 12, padding: '16px 18px'
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 14
          }}>
            {t('visitHistory')} ({visits.length} {t('visits')})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {visits.slice().reverse().map((v: any, i: number) => {
              const isHigh = v.sbp >= 140 || v.dbp >= 90
              return (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 100px',
                  alignItems: 'center', gap: 12,
                  padding: '10px 14px',
                  background: isHigh ? '#fff5f5' : '#f9fafb',
                  borderRadius: 8,
                  border: `1px solid ${isHigh ? '#fecaca' : '#f0f0f0'}`
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
                      {formatDate(v.date)}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                      {v.ga} {t('weeksPregnant')}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 700,
                    color: isHigh ? '#dc2626' : '#111'
                  }}>
                    {v.sbp}/{v.dbp}
                    <span style={{
                      fontSize: 11, fontWeight: 400,
                      color: '#9ca3af', marginLeft: 4
                    }}>mmHg</span>
                  </div>
                  <div>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      padding: '2px 8px', borderRadius: 20,
                      background: v.proteinuria === 'None' ? '#dcfce7' : '#fee2e2',
                      color: v.proteinuria === 'None' ? '#166534' : '#991b1b'
                    }}>
                      {v.proteinuria}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' as const }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      padding: '3px 9px', borderRadius: 20,
                      background: isHigh ? '#fee2e2' : '#dcfce7',
                      color: isHigh ? '#991b1b' : '#166534'
                    }}>
                      {isHigh ? t('high') : t('normal')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{
          marginTop: 20, textAlign: 'center' as const,
          fontSize: 12, color: '#9ca3af'
        }}>
          {t('footer')}
        </div>

      </div>
    </div>
  )
}
