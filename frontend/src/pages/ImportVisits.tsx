import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'

interface ImportResult {
  row: number
  patientName: string
  status: 'imported' | 'skipped'
  action?: 'visit_added' | 'patient_created'
  alert?: string
  reason?: string
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })

export default function ImportVisits() {
  const navigate = useNavigate()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [file, setFile]           = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [results, setResults]     = useState<ImportResult[] | null>(null)
  const [summary, setSummary]     = useState<{ imported: number; skipped: number; message: string } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setResults(null)
      setSummary(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await api.post('/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setResults(res.data.results)
      setSummary({
        imported: res.data.imported,
        skipped:  res.data.skipped,
        message:  res.data.message,
      })

      if (res.data.imported > 0) {
        toast.success(res.data.message)
      } else {
        toast.error('No visits were imported. Check the skipped rows below')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setResults(null)
    setSummary(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/record-visit')} style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
          padding: '5px 11px', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', color: '#4b5563'
        }}>Back</button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>Import visits</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            Upload an Excel or CSV file to import multiple visits at once
          </div>
        </div>
      </div>

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe',
        borderRadius: 12, padding: '14px 16px', marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e40af', marginBottom: 8 }}>
          Required columns in your Excel file
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12, color: '#1e40af' }}>
          {[
            ['patientName', 'Full name of the patient'],
            ['dob',         'Date of birth'],
            ['edd',         'Estimated due date'],
            ['parity',      'e.g. G2P1'],
            ['insurance',   'Mutuelle or None'],
            ['visitDate',   'Date of visit'],
            ['ga',          'Gestational age in weeks'],
            ['sbp',         'Systolic BP'],
            ['dbp',         'Diastolic BP'],
            ['proteinuria', 'None / Trace / 1+ / 2+ / 3+'],
            ['weight',      'Weight in kg'],
            ['notes',       'Optional notes'],
          ].map(([col, desc]) => (
            <div key={col} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <code style={{
                background: '#dbeafe', padding: '1px 6px',
                borderRadius: 4, fontSize: 11, fontWeight: 700,
                whiteSpace: 'nowrap' as const
              }}>{col}</code>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb',
        borderRadius: 12, padding: 24, marginBottom: 20 }}>

        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${file ? '#86efac' : '#d1d5db'}`,
            borderRadius: 10, padding: '32px 24px', textAlign: 'center',
            cursor: 'pointer', marginBottom: 16,
            background: file ? '#f0fdf4' : '#fafafa',
            transition: 'all 0.15s'
          }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 4 }}>
            {file ? file.name : 'Click to select file'}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>
            {file
              ? `${(file.size / 1024).toFixed(1)} KB`
              : 'Accepts .xlsx, .xls, or .csv — max 5 MB'}
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            style={{
              background: !file || uploading ? '#e5e7eb' : '#4a7fa7',
              color:      !file || uploading ? '#9ca3af' : '#fff',
              border: 'none', borderRadius: 8, padding: '9px 20px',
              fontSize: 13, fontWeight: 600,
              cursor: !file || uploading ? 'not-allowed' : 'pointer',
              transition: 'background 0.12s'
            }}>
            {uploading ? 'Importing...' : 'Import visits'}
          </button>

          {file && !uploading && (
            <button onClick={handleReset} style={{
              background: 'transparent', border: '1px solid #e5e7eb',
              borderRadius: 8, padding: '9px 16px', fontSize: 13,
              fontWeight: 600, cursor: 'pointer', color: '#6b7280'
            }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {summary && (
        <div>

          <div style={{
            background: summary.imported > 0 ? '#f0fdf4' : '#fff5f5',
            border: `1px solid ${summary.imported > 0 ? '#86efac' : '#fecaca'}`,
            borderRadius: 12, padding: '14px 16px', marginBottom: 16
          }}>
            <div style={{ fontSize: 14, fontWeight: 700,
              color: summary.imported > 0 ? '#166534' : '#991b1b' }}>
              {summary.message}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
              {summary.imported} imported · {summary.skipped} skipped
            </div>
            {summary.imported > 0 && (
              <button onClick={() => navigate('/patients')} style={{
                marginTop: 10, background: '#4a7fa7', color: '#fff',
                border: 'none', borderRadius: 7, padding: '6px 14px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer'
              }}>
                View patients
              </button>
            )}
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const,
            letterSpacing: '0.06em', color: '#9ca3af', marginBottom: 8 }}>
            Row breakdown
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {results?.map((r, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '50px 1fr 100px',
                alignItems: 'center', gap: 12,
                padding: '10px 14px',
                background: r.status === 'imported' ? '#f0fdf4' : '#fff5f5',
                border: `1px solid ${r.status === 'imported' ? '#bbf7d0' : '#fecaca'}`,
                borderRadius: 8, fontSize: 13
              }}>
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
                  Row {r.row}
                </span>

                <div>
                  <span style={{ fontWeight: 600, color: '#111' }}>{r.patientName}</span>
                  {r.status === 'imported' && (
                    <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>
                      {r.action === 'patient_created' ? '· new patient created' : '· visit added'}
                      {r.alert && (
                        <span style={{ marginLeft: 6, color: '#dc2626', fontWeight: 600 }}>
                          · {r.alert}
                        </span>
                      )}
                    </span>
                  )}
                  {r.status === 'skipped' && (
                    <span style={{ fontSize: 12, color: '#dc2626', marginLeft: 8 }}>
                      · {r.reason}
                    </span>
                  )}
                </div>

                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px',
                  borderRadius: 20, textAlign: 'center' as const,
                  background: r.status === 'imported' ? '#dcfce7' : '#fee2e2',
                  color:      r.status === 'imported' ? '#166534'  : '#991b1b'
                }}>
                  {r.status === 'imported' ? 'Imported' : 'Skipped'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
