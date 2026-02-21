import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { AuthProvider } from './contexts/AuthContext'
import AppLayout from './components/AppLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Upgrade from './pages/Upgrade'
import PublicWheel from './pages/PublicWheel'

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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="upgrade" element={<Upgrade />} />
          </Route>
          <Route path="/w/:slug" element={<PublicWheel />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    <Analytics />
  </React.StrictMode>,
)
