import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LuckyWheel from '../App'

export default function Dashboard() {
  const { user, profile, loading, isAuthenticated } = useAuth()
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

  // النظام موحّد لسلة فقط — يجب أن يكون الحساب مرتبطاً بمتجر سلة (تثبيت التطبيق من متجر سلة)
  if (!profile?.merchant_id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-900 text-white p-6" dir="rtl" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
        <h2 className="text-xl font-bold text-amber-400">عجلة الحظ لمتاجر سلة فقط</h2>
        <p className="text-slate-300 text-center max-w-md">
          لتستخدم العجلة يجب تثبيت التطبيق من متجر تطبيقات سلة في لوحة تحكم متجرك. بعد التثبيت ستستلم بريداً بكلمة المرور ورابط الدخول.
        </p>
        <a
          href="https://salla.sa"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-400 hover:text-amber-300 font-bold underline"
        >
          الذهاب إلى سلة ←
        </a>
      </div>
    )
  }

  return (
    <LuckyWheel
      ownerId={user.id}
      ownerSlug={profile.slug}
      ownerPlan="salla"
      merchantId={profile.merchant_id}
    />
  )
}
