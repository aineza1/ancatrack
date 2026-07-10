import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import loginBg from '../assets/prenatal visits.png'
import logo from '../assets/logo.png'
import { useLanguage } from '../hooks/useLanguage'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function PatientLogin() {
  const [name, setName]       = useState('')
  const [pin, setPin]         = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { language, toggleLanguage, t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/portal/login`, { name, pin })
      localStorage.setItem('patientToken', res.data.token)
      localStorage.setItem('patientInfo', JSON.stringify(res.data.patient))
      toast.success(`Welcome, ${res.data.patient.name}`)
      navigate('/patient')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: '9px 12px',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 8,
    fontSize: 13,
    color: '#111',
    fontFamily: 'inherit',
    width: '100%',
    outline: 'none',
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(4px)',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: '#1f2937',
    display: 'block',
    marginBottom: 5,
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 24,
      backgroundImage: `url(${loginBg})`,
      backgroundSize: 'cover', backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat', position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(74, 127, 167, 0.55)', zIndex: 0,
      }} />

      <div style={{
        maxWidth: 400, width: '100%',
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 20, padding: '40px 32px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        position: 'relative', zIndex: 1,
        border: '1px solid rgba(255,255,255,0.3)',
      }}>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button onClick={toggleLanguage} style={{
            fontSize: 12, fontWeight: 600, padding: '4px 12px',
            borderRadius: 20, cursor: 'pointer',
            background: 'rgba(74,127,167,0.12)',
            color: '#4a7fa7',
            border: '1px solid rgba(74,127,167,0.3)'
          }}>
            {language === 'en' ? 'Kinyarwanda' : 'English'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <img src={logo} alt="AncaTrack"
            style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#111', lineHeight: 1.2 }}>
              {t('appName')}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              {t('appSubtitle')}
            </div>
          </div>
        </div>

        <p style={{ fontSize: 13, color: '#4b5563', marginBottom: 2,
          fontWeight: 500, marginTop: 16 }}>
          {t('loginTitle')}
        </p>
        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 28 }}>
          {t('loginSubtitle')}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>{t('fullName')}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('fullNamePlaceholder')}
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>{t('pin')}</label>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder={t('pinPlaceholder')}
              required
              maxLength={6}
              style={inputStyle}
            />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '11px 16px',
            background: '#4a7fa7', color: '#fff',
            border: 'none', borderRadius: 8,
            fontSize: 14, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'background 0.12s',
          }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#3d6d91' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#4a7fa7' }}
          >
            {loading ? t('checking') : t('viewRecord')}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#6b7280' }}>
          {t('noPin')}
        </div>

        <div style={{ marginTop: 10, textAlign: 'center' }}>
          <span onClick={() => navigate('/login')}
            style={{ fontSize: 12, color: '#4a7fa7', cursor: 'pointer', fontWeight: 500 }}>
            {t('staffLogin')}
          </span>
        </div>
      </div>
    </div>
  )
}
