import React, { useEffect, useState } from 'react'
import { Outlet, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSalla } from '../contexts/SallaContext'
import { signOut } from '../lib/supabase'
import { LogOut } from 'lucide-react'

export default function AppLayout() {
  const { loading, isAuthenticated, profile } = useAuth()
  const { sallaMerchantId, clearSallaSession, isSallaSession } = useSalla()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const canAccess = isAuthenticated || isSallaSession

  // زر تسجيل الخروج يظهر فقط لعميل سلة (اللي ثبّت التطبيق في متجره)، مش للاند يوزر
  const isSallaMerchant = isSallaSession || !!(isAuthenticated && profile?.merchant_id)

  useEffect(() => {
    if (!loading && !canAccess) {
      navigate('/login', { replace: true })
    }
  }, [loading, canAccess, navigate])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      if (isSallaSession) {
        clearSallaSession()
        navigate('/', { replace: true })
      } else {
        await signOut()
        navigate('/login', { replace: true })
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900" dir="rtl">
        <p className="text-white font-bold">جاري التحميل...</p>
      </div>
    )
  }

  if (!canAccess) return null

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <header className="flex items-center justify-between px-4 py-3 bg-slate-800/90 border-b border-slate-700 sticky top-0 z-50 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-slate-300 text-sm">
          {profile?.slug && <span className="font-medium">/{profile.slug}</span>}
          {isSallaSession && sallaMerchantId && (
            <span className="font-medium">سلة · {sallaMerchantId}</span>
          )}
          {isAuthenticated && (
            <Link
              to="/app/salla-merchants"
              className="font-medium text-amber-400 hover:text-amber-300 transition-colors"
            >
              تجار سلة
            </Link>
          )}
        </div>
        {isSallaMerchant && (
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-red-600/90 text-white font-bold transition-colors disabled:opacity-50"
            title="تسجيل الخروج"
          >
            <LogOut size={18} />
            {loggingOut ? 'جاري الخروج...' : 'تسجيل الخروج'}
          </button>
        )}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
