import { useState, useEffect } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, Bell, ClipboardPlus, Settings, LogOut, Menu, X } from 'lucide-react'
import api from '../../utils/api'
import { useIsMobile } from '../../hooks/useIsMobile'

export default function TopNav() {
  const [alertCount, setAlertCount] = useState(0)
  const [userName, setUserName] = useState('User')
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setUserName(user.name || 'User')
      } catch {
        setUserName('User')
      }
    }
  }, [])

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await api.get('/alerts')
        const alerts = response.data.alerts || []
        const activeAlerts = alerts.filter((a: any) => a.status === 'active')
        setAlertCount(activeAlerts.length)
      } catch (error) {
        console.error('Failed to fetch alerts:', error)
        setAlertCount(0)
      }
    }
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const links = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { to: '/patients', label: 'Patients', icon: <Users size={15} /> },
    { to: '/alerts', label: 'Alerts', icon: <Bell size={15} />, badge: alertCount },
    { to: '/record-visit', label: 'Record Visit', icon: <ClipboardPlus size={15} /> },
    { to: '/admin', label: 'Admin', icon: <Settings size={15} /> },
  ]

  const navHeight = 56

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: navHeight, background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center',
        padding: '0 16px', zIndex: 100,
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
      }}>
        <NavLink to="/" style={{
          display: 'flex', alignItems: 'center', gap: '9px',
          marginRight: isMobile ? 'auto' : '32px', textDecoration: 'none'
        }}>
          <div style={{
            width: 32, height: 32, background: '#4a7fa7',
            borderRadius: 8, display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <svg viewBox="0 0 24 24" width={18} height={18}
              fill="none" stroke="#fff" strokeWidth={2}>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          {(!isMobile || true) && (
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111', whiteSpace: 'nowrap' }}>
              AncaTrack
            </span>
          )}
        </NavLink>

        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', height: '100%', flex: 1, gap: 2, overflow: 'hidden' }}>
            {links.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', fontSize: 13.5, fontWeight: 500,
                  color: isActive ? '#4a7fa7' : '#111',
                  background: isActive ? '#eaf2f8' : 'transparent',
                  borderRadius: 8, textDecoration: 'none',
                  transition: 'background 0.12s',
                  whiteSpace: 'nowrap'
                })}
              >
                {link.icon}
                {link.label}
                {link.badge !== undefined && link.badge > 0 && (
                  <span style={{
                    background: '#fee2e2', color: '#991b1b',
                    fontSize: 10, fontWeight: 700,
                    padding: '2px 6px', borderRadius: 20
                  }}>
                    {link.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, marginLeft: isMobile ? 8 : 0 }}>
          {!isMobile && (
            <>
              <span style={{ fontSize: 13, color: '#4b5563', fontWeight: 500, whiteSpace: 'nowrap' }}>
                {userName}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '6px 12px', fontSize: 13,
                  color: '#dc2626', background: 'transparent',
                  border: '1px solid #dc2626', borderRadius: 6,
                  cursor: 'pointer', whiteSpace: 'nowrap'
                }}
              >
                <LogOut size={14} />
                Logout
              </button>
            </>
          )}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#4a7fa7', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, color: '#fff', flexShrink: 0
          }}>
            {userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>

          {isMobile && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: 'transparent', border: 'none',
                cursor: 'pointer', padding: 4, display: 'flex',
                color: '#111'
              }}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </nav>

      {isMobile && menuOpen && (
        <div style={{
          position: 'fixed', top: navHeight, left: 0, right: 0,
          background: '#fff', borderBottom: '1px solid #e5e7eb',
          zIndex: 99, boxShadow: '0 4px 8px rgba(0,0,0,0.06)',
          display: 'flex', flexDirection: 'column', padding: 8
        }}>
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', fontSize: 14, fontWeight: 500,
                color: isActive ? '#4a7fa7' : '#111',
                background: isActive ? '#eaf2f8' : 'transparent',
                borderRadius: 8, textDecoration: 'none', marginBottom: 2
              })}
            >
              {link.icon}
              {link.label}
              {link.badge !== undefined && link.badge > 0 && (
                <span style={{
                  background: '#fee2e2', color: '#991b1b',
                  fontSize: 10, fontWeight: 700,
                  padding: '2px 6px', borderRadius: 20, marginLeft: 'auto'
                }}>
                  {link.badge}
                </span>
              )}
            </NavLink>
          ))}
          <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 6, paddingTop: 10, paddingLeft: 14 }}>
            <div style={{ fontSize: 13, color: '#4b5563', fontWeight: 500, marginBottom: 10 }}>
              {userName}
            </div>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', fontSize: 13,
                color: '#dc2626', background: 'transparent',
                border: '1px solid #dc2626', borderRadius: 6,
                cursor: 'pointer', marginLeft: 0
              }}
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      )}

      <div style={{ paddingTop: navHeight }}>
        <Outlet />
      </div>
    </>
  )
}
