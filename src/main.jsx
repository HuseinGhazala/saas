import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SallaProvider } from './contexts/SallaContext'
import AppLayout from './components/AppLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Upgrade from './pages/Upgrade'
import PublicWheel from './pages/PublicWheel'
import SallaEntry from './pages/SallaEntry'
import SallaMerchants from './pages/SallaMerchants'
import NotFound from './pages/NotFound'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: { direction: 'rtl', fontFamily: "'IBM Plex Sans Arabic', sans-serif" },
        success: { iconTheme: { primary: '#10b981' } },
        error: { iconTheme: { primary: '#ef4444' } }
      }}
    />
    <AuthProvider>
      <SallaProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/salla/entry" element={<SallaEntry />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Navigate to="/login" replace />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="upgrade" element={<Upgrade />} />
            <Route path="salla-merchants" element={<SallaMerchants />} />
          </Route>
          <Route path="/w/:slug" element={<PublicWheel />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </SallaProvider>
    </AuthProvider>
  </React.StrictMode>,
)
