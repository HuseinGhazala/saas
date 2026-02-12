import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../lib/supabase'
import { Mail, Lock, UserPlus, Loader2, Gift } from 'lucide-react'

export default function Signup() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [storeName, setStoreName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signUp(email, password, { store_name: storeName || 'متجري' })
      navigate('/app', { replace: true })
    } catch (err) {
      const msg = (err?.message || '').toLowerCase()
      if (msg.includes('rate limit') || msg.includes('rate_limit') || msg.includes('email rate limit')) {
        setError('تم تجاوز الحد المسموح من طلبات التسجيل حالياً. يرجى المحاولة بعد ٣٠–٦٠ دقيقة أو التواصل معنا.')
      } else {
        setError(err.message || 'فشل إنشاء الحساب')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      dir="rtl"
      style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
    >
      <div className="w-full max-w-md bg-slate-800/80 rounded-2xl border border-slate-700 p-8 shadow-xl">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Gift className="text-amber-400" size={28} />
          <h1 className="text-2xl font-bold text-white">إنشاء حساب</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 text-red-200 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">اسم المتجر (اختياري)</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              placeholder="متجري"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 pr-10 pl-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">كلمة المرور (6 أحرف على الأقل)</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 pr-10 pl-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <><UserPlus size={20} /> إنشاء الحساب</>}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-400 text-sm">
          لديك حساب؟{' '}
          <Link to="/login" className="text-amber-400 hover:underline font-medium">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  )
}
