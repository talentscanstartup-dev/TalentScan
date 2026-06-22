import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import App from './App'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import AdminDashboard from './pages/AdminDashboard'
import CompanyAdminDashboard from './pages/CompanyAdminDashboard'
import JobsPage from './pages/JobsPage'
import TicketsPage from './pages/TicketsPage'
import ResumeBuilderPage from './pages/ResumeBuilderPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ThemeProvider } from './contexts/ThemeContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/criar-curriculo" element={<ResumeBuilderPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/company-admin" element={<ProtectedRoute allowedRoles={['COMPANY']}><CompanyAdminDashboard /></ProtectedRoute>} />
          <Route path="/vagas-empresas" element={<ProtectedRoute allowedRoles={['COMPANY']}><JobsPage /></ProtectedRoute>} />
          <Route path="/tickets" element={<ProtectedRoute><TicketsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  </React.StrictMode>
)

