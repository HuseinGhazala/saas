import React from 'react'
import { Link } from 'react-router-dom'
import { Crown, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Upgrade() {
  const { loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900" dir="rtl">
        <p className="text-white font-bold">جاري التحميل...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-900 text-white p-6" dir="rtl">
        <p className="text-xl font-bold">يجب تسجيل الدخول أولاً</p>
        <Link to="/login" className="text-amber-400 hover:underline">تسجيل الدخول</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-900 text-white p-6" dir="rtl" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
      <h1 className="text-2xl font-black flex items-center gap-2">
        <Crown className="text-amber-400" size={28} />
        الاشتراك والترقية عبر سلة
      </h1>
      <p className="text-slate-300 text-center max-w-md">
        عجلة الحظ لمتاجر سلة فقط. <strong>الاشتراكات والترقيات تتم عبر سلة فقط:</strong> لترقية الباقة أو إدارة أو تجديد اشتراكك استخدم <strong>متجر تطبيقات سلة</strong> من لوحة تحكم متجرك في سلة.
      </p>
      <a
        href="https://salla.sa"
        target="_blank"
        rel="noopener noreferrer"
        className="text-amber-400 hover:text-amber-300 font-bold underline"
      >
        الذهاب إلى سلة
      </a>
      <Link to="/app" className="text-amber-400 hover:underline font-bold flex items-center gap-1">
        العودة للعجلة <ArrowRight size={18} />
      </Link>
    </div>
  )
}
