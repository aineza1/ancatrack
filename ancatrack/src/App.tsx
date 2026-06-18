import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import TopNav from './components/layout/TopNav'
import Dashboard from './pages/Dashboard'
import Patients from './pages/patients'
import PatientDetail from './pages/PatientDetail'
import Alerts from './pages/alerts'
import RecordVisit from './pages/RecordVisit'
import Admin from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <TopNav />
      <div style={{ marginTop: '56px' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:id" element={<PatientDetail />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/visit" element={<RecordVisit />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
      <Toaster position="bottom-right" />
    </BrowserRouter>
  )
}
