import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, LogIn, Gift } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Landing() {
  const { isAuthenticated } = useAuth()

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 text-slate-100"
      dir="rtl"
      style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}
    >
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="flex items-center justify-center gap-3">
          <Gift className="text-yellow-400" size={48} />
          <h1 className="text-4xl md:text-5xl font-black text-white" style={{ textShadow: '4px 4px 0px #F59E0B' }}>
            عجلة الحظ
          </h1>
        </div>
        <p className="text-slate-300 text-lg">
          عجلة حظ لمتاجر سلة — جوائز حقيقية ومشاركة برابط واحد.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isAuthenticated ? (
            <Link
              to="/app"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold transition-colors border border-amber-400"
            >
              <Gift size={20} />
              عجلتي
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold transition-colors border border-amber-400"
            >
              <LogIn size={20} />
              تسجيل الدخول
            </Link>
          )}
        </div>

        <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
          <Sparkles size={16} className="text-yellow-400" />
          ثبّت التطبيق من متجر سلة ثم سجّل الدخول بالبريد والرقم السري المرسلين
        </p>
      </div>
    </div>
  )
}
