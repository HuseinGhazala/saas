import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSalla } from '../contexts/SallaContext'
import LuckyWheel from '../App'

export default function Dashboard() {
  const { user, profile, loading, isAuthenticated } = useAuth()
  const { sallaMerchantId, isSallaSession } = useSalla()
  const navigate = useNavigate()

  const canAccess = isAuthenticated || isSallaSession

  useEffect(() => {
    if (!loading && !canAccess) {
      navigate('/login', { replace: true })
    }
  }, [loading, canAccess, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900" dir="rtl">
        <p className="text-white font-bold">جاري التحميل...</p>
      </div>
    )
  }

  if (!canAccess) return null

  if (isSallaSession && sallaMerchantId) {
    return (
      <LuckyWheel
        merchantId={sallaMerchantId}
        ownerId={null}
        ownerSlug={null}
        ownerPlan="free"
      />
    )
  }

  if (!user) return null

  return (
    <LuckyWheel
      ownerId={user.id}
      ownerSlug={profile?.slug}
      ownerPlan={profile?.plan}
    />
  )
}
