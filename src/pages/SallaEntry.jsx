import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSalla } from '../contexts/SallaContext'

/**
 * صفحة دخول التاجر من سلة: سلة توجّه التاجر إلى هذا الرابط مع merchant_id أو merchant في الـ URL.
 * نحفظ الـ merchant_id في الجلسة ونوجّهه لـ /app
 */
export default function SallaEntry() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setSallaMerchantId } = useSalla()

  useEffect(() => {
    const merchantId = searchParams.get('merchant_id') || searchParams.get('merchant')
    if (merchantId) {
      setSallaMerchantId(merchantId)
    }
    navigate('/app', { replace: true })
  }, [searchParams, setSallaMerchantId, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900" dir="rtl">
      <p className="text-white font-bold">جاري التحويل...</p>
    </div>
  )
}
