import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import loginBg from '../assets/prenatal visits.png'

const API_URL = 'http://localhost:5000/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      })

      const { token, user } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      toast.success(`Welcome, ${user.name}`)
      navigate('/')
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    padding: '9px 12px',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 8,
    fontSize: 13,
    color: '#111',
    fontFamily: 'inherit',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.12s',
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(4px)',
  }

  const labelStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: '#1f2937',
    display: 'block',
    marginBottom: 5,
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',

        backgroundImage: `url(${loginBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
      }}
    >

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(74, 127, 167, 0.55)',
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: 420,
          width: '100%',
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 20,
          padding: '40px 32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          position: 'relative',
          zIndex: 1,
          border: '1px solid rgba(255,255,255,0.3)',
        }}
      >

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              background: '#4a7fa7',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width={22}
              height={22}
              fill="none"
              stroke="#fff"
              strokeWidth={2}
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>
            AncaTrack
          </span>
        </div>

        <p
          style={{
            fontSize: 13,
            color: '#4b5563',
            marginBottom: 28,
            fontWeight: 400,
          }}
        >
          Antenatal Care Clinical Decision Support
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="a.uwase@bugesera.rw"
              required
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px 16px',
              background: '#4a7fa7',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = '#3d6d91'
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = '#4a7fa7'
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#6b7280' }}>
          Secure · Confidential · ANC Coordination
        </div>
      </div>
    </div>
  )
}
