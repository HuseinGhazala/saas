import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * صفحة دخول التاجر من سلة: سلة توجّه التاجر إلى هذا الرابط مع merchant_id أو merchant في الـ URL.
 * نوجّهه لتسجيل الدخول بالبريد والرقم السري المرسلين بعد التثبيت.
 */
export default function SallaEntry() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    navigate('/login?from=salla', { replace: true })
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900" dir="rtl">
      <p className="text-white font-bold">جاري التحويل...</p>
    </div>
  )
}
