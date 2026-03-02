import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ========== Auth (SaaS) ==========
export const signUp = async (email, password, metadata = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata }
  })
  if (error) throw error
  return data
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback)
}

// ========== Profile (SaaS) ==========
export const getProfile = async (userId) => {
  if (!userId) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }
  return data
}

export const updateProfile = async (userId, updates) => {
  if (!userId) return false
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) {
    console.error('Error updating profile:', error)
    return false
  }
  return true
}

// ========== Plans (الباقات من Supabase — عدّل من جدول plans) ==========
/** جلب حدود باقة واحدة (RPC get_plan_limits). يُرجع null إذا فشل الطلب. */
export const getPlanLimitsFromSupabase = async (planId) => {
  try {
    const { data, error } = await supabase.rpc('get_plan_limits', { plan_id: planId || 'free' })
    if (error) return null
    return data
  } catch (e) {
    console.error('getPlanLimitsFromSupabase:', e)
    return null
  }
}

/** جلب كل الباقات من جدول plans (لصفحة الترقية أو لوحة التحكم). */
export const getPlansFromSupabase = async () => {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('price_monthly', { ascending: true })
    if (error) return null
    return data
  } catch (e) {
    console.error('getPlansFromSupabase:', e)
    return null
  }
}

// ========== Settings (بالنسبة لمالك مسجّل - SaaS) ==========
export const getSettings = async (ownerId) => {
  if (!ownerId) return null
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('data')
      .eq('owner_id', ownerId)
      .single()
    if (error) return null
    return data?.data ?? null
  } catch (e) {
    console.error('Error in getSettings:', e)
    return null
  }
}

export const saveSettings = async (ownerId, settings) => {
  if (!ownerId) return false
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({
        owner_id: ownerId,
        data: settings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'owner_id' })
    if (error) {
      console.error('Error saving settings:', error)
      return false
    }
    return true
  } catch (e) {
    console.error('Error in saveSettings:', e)
    return false
  }
}

// ========== العجلة العامة عبر slug (لرابط المشاركة) ==========
export const getWheelBySlug = async (slug) => {
  try {
    const { data, error } = await supabase.rpc('get_wheel_by_slug', { slug_param: slug })
    if (error) {
      console.error('Error get_wheel_by_slug:', error)
      return null
    }
    return data
  } catch (e) {
    console.error('Error in getWheelBySlug:', e)
    return null
  }
}

// ========== حفظ مشارك/جائزة من لوحة المالك (باستخدام owner_id) ==========
export const saveUserData = async (ownerId, userData) => {
  if (!ownerId) return false
  try {
    const { error } = await supabase.from('user_data').insert({
      owner_id: ownerId,
      name: userData.name,
      email: userData.email,
      phone: userData.phone
    })
    if (error) {
      console.error('Error saving user data:', error)
      return false
    }
    return true
  } catch (e) {
    console.error('Error in saveUserData:', e)
    return false
  }
}

export const saveWinData = async (ownerId, winData) => {
  if (!ownerId) return false
  try {
    const { error } = await supabase.from('wins').insert({
      owner_id: ownerId,
      name: winData.name,
      email: winData.email,
      phone: winData.phone,
      prize: winData.prize,
      coupon_code: winData.couponCode
    })
    if (error) {
      console.error('Error saving win data:', error)
      return false
    }
    return true
  } catch (e) {
    console.error('Error in saveWinData:', e)
    return false
  }
}

// ========== حفظ مشارك/جائزة من الصفحة العامة (باستخدام slug) ==========
export const saveUserDataForSlug = async (slug, userData) => {
  try {
    const { data, error } = await supabase.rpc('insert_user_data_for_slug', {
      slug_param: slug,
      p_name: userData.name,
      p_email: userData.email,
      p_phone: userData.phone
    })
    if (error) {
      console.error('Error saveUserDataForSlug:', error)
      return false
    }
    return data === true
  } catch (e) {
    console.error('Error in saveUserDataForSlug:', e)
    return false
  }
}

export const saveWinDataForSlug = async (slug, winData) => {
  try {
    const { data, error } = await supabase.rpc('insert_win_for_slug', {
      slug_param: slug,
      p_name: winData.name,
      p_email: winData.email,
      p_phone: winData.phone,
      p_prize: winData.prize,
      p_coupon_code: winData.couponCode ?? null
    })
    if (error) {
      console.error('Error saveWinDataForSlug:', error)
      return false
    }
    return data === true
  } catch (e) {
    console.error('Error in saveWinDataForSlug:', e)
    return false
  }
}

// ========== جلب البيانات (للمالك فقط) ==========
export const getAllUserData = async (ownerId) => {
  if (!ownerId) return []
  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('owner_id', ownerId)
      .order('timestamp', { ascending: false })
    if (error) return []
    return data || []
  } catch (e) {
    console.error('Error in getAllUserData:', e)
    return []
  }
}

export const getAllWins = async (ownerId) => {
  if (!ownerId) return []
  try {
    const { data, error } = await supabase
      .from('wins')
      .select('*')
      .eq('owner_id', ownerId)
      .order('timestamp', { ascending: false })
    if (error) return []
    return data || []
  } catch (e) {
    console.error('Error in getAllWins:', e)
    return []
  }
}

// تحديث القطع (الكوبونات) من الصفحة العامة بعد استخدام كوبون
export const updateSegmentsForSlug = async (slug, segments) => {
  try {
    const { data, error } = await supabase.rpc('update_segments_for_slug', {
      slug_param: slug,
      segments_json: segments
    })
    if (error) {
      console.error('Error updateSegmentsForSlug:', error)
      return false
    }
    return data === true
  } catch (e) {
    console.error('Error in updateSegmentsForSlug:', e)
    return false
  }
}

// ========== Salla Spin-to-Win: subscription attempts ==========

/**
 * جلب قائمة تجار سلة (لصفحة "تجار سلة")
 * يتطلب مستخدماً مسجلاً (authenticated).
 */
export const getSallaMerchants = async () => {
  try {
    const { data, error } = await supabase.rpc('get_salla_merchants')
    if (error) {
      console.error('Error getSallaMerchants:', error)
      return { data: [], error: error.message }
    }
    return { data: data ?? [], error: null }
  } catch (e) {
    console.error('Error in getSallaMerchants:', e)
    return { data: [], error: e.message }
  }
}

/**
 * Check if a merchant has spins left before allowing a spin.
 * Uses RPC so it works for anon (public wheel) and authenticated.
 * @param {number|string} merchantId - Salla merchant ID (bigint)
 * @returns {{ eligible: boolean, attemptsUsed?: number, attemptsAllowed?: number, error?: string }}
 */
export const checkSpinEligibility = async (merchantId) => {
  if (merchantId == null || merchantId === '') {
    return { eligible: false, error: 'merchant_id_required' }
  }
  try {
    const { data, error } = await supabase.rpc('get_spin_eligibility', {
      p_merchant_id: Number(merchantId)
    })

    if (error) {
      console.error('Error checkSpinEligibility:', error)
      return { eligible: false, error: error.message }
    }
    const allowed = data?.attempts_allowed ?? 0
    const used = data?.attempts_used ?? 0
    const eligible = used < allowed
    return {
      eligible,
      attemptsUsed: used,
      attemptsAllowed: allowed,
      ...(eligible ? {} : { error: allowed === 0 && used === 0 ? 'merchant_not_found' : 'attempts_exceeded' })
    }
  } catch (e) {
    console.error('Error in checkSpinEligibility:', e)
    return { eligible: false, error: e.message }
  }
}

/**
 * Atomically increment attempts_used by 1 for a merchant (after a successful spin).
 * Safe for concurrent spins: only increments if attempts_used < attempts_allowed.
 * @param {number|string} merchantId - Salla merchant ID (bigint)
 * @returns {{ success: boolean, attemptsUsed?: number, attemptsAllowed?: number, error?: string }}
 */
export const incrementAttemptsUsed = async (merchantId) => {
  if (merchantId == null || merchantId === '') {
    return { success: false, error: 'merchant_id_required' }
  }
  try {
    const { data, error } = await supabase.rpc('increment_attempts_used', {
      p_merchant_id: Number(merchantId)
    })

    if (error) {
      console.error('Error incrementAttemptsUsed:', error)
      return { success: false, error: error.message }
    }

    if (data?.success) {
      return {
        success: true,
        attemptsUsed: data.attempts_used,
        attemptsAllowed: data.attempts_allowed
      }
    }

    return {
      success: false,
      error: data?.reason ?? 'attempts_exceeded'
    }
  } catch (e) {
    console.error('Error in incrementAttemptsUsed:', e)
    return { success: false, error: e.message }
  }
}
