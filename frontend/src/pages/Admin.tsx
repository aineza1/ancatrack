import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const ROLES = ['doctor', 'nurse', 'admin'] as const
type Role = typeof ROLES[number]

interface User {
  _id: string
  name: string
  email: string
  role: Role
  facility: string
  isActive: boolean
  createdAt: string
}

export default function Admin() {
  const [users, setUsers]       = useState<User[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'nurse' as Role,
    facility: 'Bugesera District Hospital'
  })

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users')
      setUsers(res.data.users || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await api.post('/users', form)
      setUsers(prev => [res.data.user, ...prev])
      setForm({ name: '', email: '', password: '', role: 'nurse', facility: 'Bugesera District Hospital' })
      setShowForm(false)
      toast.success(`${res.data.user.name} added successfully`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (user: User) => {
    try {
      const res = await api.patch(`/users/${user._id}/toggle`)
      setUsers(prev => prev.map(u => u._id === user._id ? res.data.user : u))
      toast.success(`${user.name} ${res.data.user.isActive ? 'activated' : 'deactivated'}`)
    } catch {
      toast.error('Failed to update user')
    }
  }

  const roleBadge = (role: Role) => {
    const map = {
      admin:  ['#ede9fe', '#5b21b6'],
      doctor: ['#dbeafe', '#1e40af'],
      nurse:  ['#dcfce7', '#166534'],
    }
    const [bg, color] = map[role]
    return (
      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px',
        borderRadius: 20, background: bg, color,
        textTransform: 'capitalize' as const }}>
        {role}
      </span>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px',
    border: '1px solid #e5e7eb', borderRadius: 8,
    fontSize: 13, outline: 'none', fontFamily: 'inherit'
  }

  if (loading) return <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>

 if (error) return (
  <div style={{ padding: 24 }}>
    <div style={{ color: '#dc2626', background: '#fff5f5', border: '1px solid #fecaca',
      borderRadius: 12, padding: '14px 16px' }}>
      <strong>Access denied:</strong> You do not have permission for this action.
    </div>
  </div>
)

  const byRole = (role: Role) => users.filter(u => u.role === role)

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>User management</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
            {users.length} users · {users.filter(u => u.isActive).length} active
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          background: '#4a7fa7', color: '#fff', border: 'none',
          borderRadius: 8, padding: '8px 16px', fontSize: 13,
          fontWeight: 600, cursor: 'pointer'
        }}>
          {showForm ? 'Cancel' : '+ Add user'}
        </button>
      </div>

      {/* Add user form */}
      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb',
          borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 16 }}>
            New user
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4b5563',
                  display: 'block', marginBottom: 5 }}>Full name</label>
                <input style={inputStyle} placeholder="Dr. Uwase Aline" required
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4b5563',
                  display: 'block', marginBottom: 5 }}>Email</label>
                <input style={inputStyle} type="email" placeholder="a.uwase@bugesera.rw" required
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4b5563',
                  display: 'block', marginBottom: 5 }}>Password</label>
                <input style={inputStyle} type="password" placeholder="Min 6 characters" required
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4b5563',
                  display: 'block', marginBottom: 5 }}>Role</label>
                <select style={inputStyle}
                  value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4b5563',
                  display: 'block', marginBottom: 5 }}>Facility</label>
                <input style={inputStyle} placeholder="Bugesera District Hospital"
                  value={form.facility} onChange={e => setForm(f => ({ ...f, facility: e.target.value }))} />
              </div>
            </div>
            <button type="submit" disabled={submitting} style={{
              background: '#4a7fa7', color: '#fff', border: 'none',
              borderRadius: 8, padding: '9px 20px', fontSize: 13,
              fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1
            }}>
              {submitting ? 'Adding...' : 'Add user'}
            </button>
          </form>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
        {(['doctor','nurse','admin'] as Role[]).map(role => (
          <div key={role} style={{ background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600,
              textTransform: 'uppercase', marginBottom: 4 }}>{role}s</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#111' }}>
              {byRole(role).length}
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>
              {byRole(role).filter(u => u.isActive).length} active
            </div>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Name','Email','Role','Facility','Status','Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px',
                  fontSize: 11, fontWeight: 700, color: '#9ca3af',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: '1px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: '#4a7fa7', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0
                    }}>
                      {user.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    {user.name}
                  </div>
                </td>
                <td style={{ padding: '12px 14px', color: '#6b7280' }}>{user.email}</td>
                <td style={{ padding: '12px 14px' }}>{roleBadge(user.role)}</td>
                <td style={{ padding: '12px 14px', color: '#6b7280' }}>{user.facility}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
                    background: user.isActive ? '#dcfce7' : '#f3f4f6',
                    color:      user.isActive ? '#166534' : '#6b7280'
                  }}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <button onClick={() => handleToggle(user)} style={{
                    fontSize: 12, fontWeight: 600, padding: '4px 12px',
                    borderRadius: 6, cursor: 'pointer', border: '1px solid',
                    background: 'transparent',
                    borderColor: user.isActive ? '#fca5a5' : '#86efac',
                    color:       user.isActive ? '#dc2626' : '#16a34a'
                  }}>
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
