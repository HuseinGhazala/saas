import React from 'react'
import { Link } from 'react-router-dom'
import { Home, AlertCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 text-slate-100"
      dir="rtl"
      style={{
        fontFamily: "'IBM Plex Sans Arabic', sans-serif",
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      }}
    >
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex flex-col items-center gap-4">
          <span className="text-8xl md:text-9xl font-black text-amber-500/80 select-none" style={{ textShadow: '4px 4px 0px rgba(245, 158, 11, 0.3)' }}>
            404
          </span>
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <AlertCircle size={24} />
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              الصفحة غير موجودة
            </h1>
          </div>
        </div>

        <p className="text-slate-400 text-lg">
          الرابط الذي تبحث عنه غير صحيح أو تم نقل الصفحة.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold transition-colors border border-amber-400"
          >
            <Home size={20} />
            الرئيسية
          </Link>
          <Link
            to="/app"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition-colors border border-slate-600"
          >
            لوحة التحكم
          </Link>
        </div>
      </div>
    </div>
  )
}
