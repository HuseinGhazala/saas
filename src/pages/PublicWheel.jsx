import React from 'react'
import { useParams } from 'react-router-dom'
import LuckyWheel from '../App'

export default function PublicWheel() {
  const { slug } = useParams()

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white" dir="rtl" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
        <p className="text-xl font-bold">رابط العجلة غير صحيح.</p>
      </div>
    )
  }

  return <LuckyWheel slug={slug} />
}
