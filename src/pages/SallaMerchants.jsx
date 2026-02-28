import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSallaMerchants } from '../lib/supabase'
import { Store, ArrowRight, RefreshCw } from 'lucide-react'

export default function SallaMerchants() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await getSallaMerchants()
    setLoading(false)
    if (err) {
      setError(err)
      setList([])
      return
    }
    setList(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    load()
  }, [])

  const formatDate = (d) => {
    if (!d) return '—'
    try {
      return new Date(d).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return '—'
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Store size={24} />
          تجار سلة
        </h1>
        <div className="flex items-center gap-2">
          <Link
            to="/app"
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
          >
            <ArrowRight size={16} />
            العودة للعجلة
          </Link>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
            title="تحديث"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            تحديث
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
          {error}
        </div>
      )}

      {loading && list.length === 0 ? (
        <div className="py-12 text-center text-slate-400">جاري التحميل...</div>
      ) : list.length === 0 ? (
        <div className="py-12 text-center text-slate-400 rounded-lg bg-slate-800/50 border border-slate-700">
          لا يوجد تجار مسجّلون من سلة حتى الآن.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-800/50">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800">
                  <th className="px-4 py-3 text-slate-300 font-semibold">رقم المتجر</th>
                  <th className="px-4 py-3 text-slate-300 font-semibold">اسم المتجر</th>
                  <th className="px-4 py-3 text-slate-300 font-semibold">المحاولات المسموحة</th>
                  <th className="px-4 py-3 text-slate-300 font-semibold">المحاولات المستخدمة</th>
                  <th className="px-4 py-3 text-slate-300 font-semibold">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row) => (
                  <tr key={row.merchant_id} className="border-b border-slate-700/80 hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-white font-mono">{row.merchant_id}</td>
                    <td className="px-4 py-3 text-slate-200">{row.store_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-200">{row.attempts_allowed ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-200">{row.attempts_used ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-sm">{formatDate(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
