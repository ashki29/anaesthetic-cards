import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Layout } from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Consultants from './pages/Consultants'
import ConsultantDetail from './pages/ConsultantDetail'
import NewConsultant from './pages/NewConsultant'
import CardView from './pages/CardView'
import CardEdit from './pages/CardEdit'
import Settings from './pages/Settings'
import Notices from './pages/Notices'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/notices" element={<Notices />} />
            <Route path="/consultants" element={<Consultants />} />
            <Route path="/consultant/new" element={<NewConsultant />} />
            <Route path="/consultant/:id" element={<ConsultantDetail />} />
            <Route path="/card/new" element={<CardEdit />} />
            <Route path="/card/:id" element={<CardView />} />
            <Route path="/card/:id/edit" element={<CardEdit />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
