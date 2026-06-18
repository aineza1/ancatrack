import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Bell, ClipboardPlus, Settings } from 'lucide-react'
import { PATIENTS } from '../../utils/data'
import { evaluatePatient } from '../../utils/alertEngine'

export default function TopNav() {
  const alertCount = PATIENTS.map(evaluatePatient).filter(Boolean).length

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { to: '/patients',  label: 'Patients',  icon: <Users size={15} /> },
    { to: '/alerts',    label: 'Alerts',    icon: <Bell size={15} />, badge: alertCount },
    { to: '/visit',     label: 'Record visit', icon: <ClipboardPlus size={15} /> },
    { to: '/admin',     label: 'Admin',     icon: <Settings size={15} /> },
  ]

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: '56px', background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: 0, zIndex: 100,
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
    }}>

      <NavLink to="/dashboard" style={{
        display: 'flex', alignItems: 'center', gap: '9px',
        marginRight: '32px', textDecoration: 'none'
      }}>
        <div style={{
          width: 32, height: 32, background: '#4a7fa7',
          borderRadius: 8, display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <svg viewBox="0 0 24 24" width={18} height={18}
            fill="none" stroke="#fff" strokeWidth={2}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>
          AncaTrack
        </span>
      </NavLink>

      <div style={{ display: 'flex', alignItems: 'center', height: '100%', flex: 1, gap: 2 }}>
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
            {link.badge && link.badge > 0 && (
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 13, color: '#4b5563', fontWeight: 500 }}>
          Dr. Uwase
        </span>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: '#4a7fa7', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer'
        }}>
          DU
        </div>
      </div>
    </nav>
  )
}
