import React, { createContext, useContext, useState, useEffect } from 'react'

const SALLA_MERCHANT_KEY = 'salla_merchant_id'

const SallaContext = createContext(null)

export function SallaProvider({ children }) {
  const [sallaMerchantId, setSallaMerchantIdState] = useState(null)

  useEffect(() => {
    const stored = sessionStorage.getItem(SALLA_MERCHANT_KEY)
    if (stored) {
      const n = Number(stored)
      if (!Number.isNaN(n)) setSallaMerchantIdState(n)
    }
  }, [])

  const setSallaMerchantId = (id) => {
    if (id == null || id === '') {
      sessionStorage.removeItem(SALLA_MERCHANT_KEY)
      setSallaMerchantIdState(null)
    } else {
      const n = Number(id)
      if (!Number.isNaN(n)) {
        sessionStorage.setItem(SALLA_MERCHANT_KEY, String(n))
        setSallaMerchantIdState(n)
      }
    }
  }

  const clearSallaSession = () => {
    sessionStorage.removeItem(SALLA_MERCHANT_KEY)
    setSallaMerchantIdState(null)
  }

  const value = {
    sallaMerchantId,
    setSallaMerchantId,
    clearSallaSession,
    isSallaSession: sallaMerchantId != null
  }

  return (
    <SallaContext.Provider value={value}>
      {children}
    </SallaContext.Provider>
  )
}

export function useSalla() {
  const ctx = useContext(SallaContext)
  if (!ctx) throw new Error('useSalla must be used within SallaProvider')
  return ctx
}
