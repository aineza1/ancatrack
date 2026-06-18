import toast from 'react-hot-toast'

const USERS = [
  { name: 'Dr. Uwase Aline',   role: 'Doctor', email: 'a.uwase@bugesera.rw',    status: 'Active' },
  { name: 'Nurse Mutesi Joy',  role: 'Nurse',  email: 'j.mutesi@bugesera.rw',   status: 'Active' },
  { name: 'Dr. Habimana Eric', role: 'Doctor', email: 'e.habimana@bugesera.rw', status: 'Active' },
  { name: 'Admin Kamanzi',     role: 'Admin',  email: 'kamanzi@bugesera.rw',    status: 'Active' },
]

export default function Admin() {
  const roleBadge = (role: string) => {
    const map: Record<string, [string, string]> = {
      Doctor: ['#e0f0fa', '#1a3a52'],
      Nurse:  ['#f3f4f6', '#4b5563'],
      Admin:  ['#fef3c7', '#92400e'],
    }
    const [bg, color] = map[role] || ['#f3f4f6', '#4b5563']
    return (
      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px',
        borderRadius: 20, background: bg, color }}>
        {role}
      </span>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const,
          letterSpacing: '0.06em', color: '#9ca3af' }}>
          User accounts ({USERS.length})
        </div>
        <button onClick={() => toast('Add user — coming soon')} style={{
          background: '#4a7fa7', color: '#fff', border: 'none',
          borderRadius: 8, padding: '7px 16px', fontSize: 13,
          fontWeight: 600, cursor: 'pointer'
        }}>
          + Add user
        </button>
      </div>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Name','Role','Email','Status',''].map((h, i) => (
                <th key={i} style={{ textAlign: 'left', padding: '10px 14px',
                  fontSize: 11, fontWeight: 700, color: '#9ca3af',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: '1px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {USERS.map(u => (
              <tr key={u.email} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600 }}>{u.name}</td>
                <td style={{ padding: '12px 14px' }}>{roleBadge(u.role)}</td>
                <td style={{ padding: '12px 14px', color: '#9ca3af' }}>{u.email}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px',
                    borderRadius: 20, background: '#dcfce7', color: '#166534' }}>
                    {u.status}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <button onClick={() => toast('Edit user — coming soon')} style={{
                    background: '#fff', color: '#4b5563', border: '1px solid #e5e7eb',
                    borderRadius: 7, padding: '5px 11px', fontSize: 11,
                    fontWeight: 600, cursor: 'pointer'
                  }}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
