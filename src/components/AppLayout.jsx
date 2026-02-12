import React, { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AppLayout() {
  const { loading, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [loading, isAuthenticated, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900" dir="rtl">
        <p className="text-white font-bold">جاري التحميل...</p>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return <Outlet />
}
