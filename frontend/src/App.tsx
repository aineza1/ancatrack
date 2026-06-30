import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Patients from './pages/patients'
import PatientDetail from './pages/PatientDetail'
import RecordVisit from './pages/RecordVisit'
import Alerts from './pages/alerts'
import Admin from './pages/Admin'
import TopNav from './components/layout/TopNav'
import ImportVisits from './pages/ImportVisits'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          success: { icon: null },
          error: { icon: null },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><TopNav /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/:id" element={<PatientDetail />} />
          <Route path="record-visit" element={<RecordVisit />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="admin" element={<Admin />} />
          <Route path="import-visits" element={<ImportVisits />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App
