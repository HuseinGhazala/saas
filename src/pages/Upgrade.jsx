import React from 'react'
import { Link } from 'react-router-dom'
import { Crown, Check, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { PLANS, PLAN_IDS, getPlanInfo } from '../lib/plans'

const PAYMENT_BASIC = import.meta.env.VITE_PAYMENT_BASIC_URL || ''
const PAYMENT_PRO = import.meta.env.VITE_PAYMENT_PRO_URL || ''
const WHATSAPP_UPGRADE = import.meta.env.VITE_WHATSAPP_UPGRADE || ''

function openPayment(planId) {
  if (planId === PLAN_IDS.BASIC && PAYMENT_BASIC) {
    window.open(PAYMENT_BASIC, '_blank')
    return
  }
  if (planId === PLAN_IDS.PRO && PAYMENT_PRO) {
    window.open(PAYMENT_PRO, '_blank')
    return
  }
  const wa = (WHATSAPP_UPGRADE || '').trim().replace(/\D/g, '')
  if (wa) {
    const msg = encodeURIComponent(`أريد الترقية إلى باقة ${getPlanInfo(planId).nameAr}`)
    window.open(`https://wa.me/${wa}?text=${msg}`, '_blank')
    return
  }
  alert('لم يتم إعداد رابط الدفع أو رقم واتساب للترقية. تواصل مع إدارة الموقع.')
}

export default function Upgrade() {
  const { profile, loading, isAuthenticated } = useAuth()
  const currentPlan = profile?.plan || 'free'

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
    <div
      className="min-h-screen bg-slate-900 text-white p-6"
      dir="rtl"
      style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Crown className="text-amber-400" size={28} />
            ترقية الباقة
          </h1>
          <Link
            to="/app"
            className="text-slate-400 hover:text-white text-sm flex items-center gap-1"
          >
            العودة للعجلة
            <ArrowRight size={16} />
          </Link>
        </div>

        <p className="text-slate-400 mb-8">
          باقتك الحالية: <span className="text-white font-bold">{getPlanInfo(currentPlan).nameAr}</span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[PLAN_IDS.FREE, PLAN_IDS.BASIC, PLAN_IDS.PRO].map((id) => {
            const p = PLANS[id]
            const isCurrent = id === currentPlan
            const isPaid = p.priceMonthly > 0
            return (
              <div
                key={id}
                className={`rounded-2xl border-2 p-6 flex flex-col ${
                  isCurrent
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-slate-600 bg-slate-800/50'
                }`}
              >
                <div className="font-bold text-lg mb-1">{p.nameAr}</div>
                <div className="text-slate-400 text-sm mb-4">
                  {p.maxSegments === 999 ? '∞' : p.maxSegments} قطاع ·{' '}
                  {p.maxSpinsPerMonth === -1 ? '∞' : p.maxSpinsPerMonth} دورة/شهر
                </div>
                <div className="text-2xl font-black text-amber-400 mb-6">
                  {p.priceMonthly === 0 ? 'مجاني' : `${p.priceMonthly} ر.س/شهر`}
                </div>
                {isCurrent && (
                  <div className="mt-auto pt-4 text-slate-400 text-sm flex items-center gap-2">
                    <Check size={16} /> الباقة الحالية
                  </div>
                )}
                {!isCurrent && isPaid && (
                  <button
                    type="button"
                    onClick={() => openPayment(id)}
                    className="mt-auto w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    اشترك الآن
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <p className="text-slate-500 text-sm mt-8 text-center">
          عند الدفع عبر الرابط يتم تفعيل الباقة خلال وقت قصير. للاستفسار تواصل معنا.
        </p>
      </div>
    </div>
  )
}
