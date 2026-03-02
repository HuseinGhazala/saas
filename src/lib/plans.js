/**
 * تعريف الباقات والحدود لكل باقة
 */

export const PLAN_IDS = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
  SALLA: 'salla'  // متجر سلة — الحدود من اشتراك سلة (المحاولات من API)، والباقي مفتوح
}

export const PLANS = {
  [PLAN_IDS.FREE]: {
    id: PLAN_IDS.FREE,
    nameAr: 'مجاني',
    nameEn: 'Free',
    maxSegments: 2,
    maxSpinsPerMonth: 6,
    canCustomLogo: false,
    canCustomSounds: false,
    canSocialLinks: false,
    canCustomWheelStyle: false,
    canCustomBackground: false,
    canFooterSettings: false,
    priceMonthly: 0,
    priceYearly: 0
  },
  [PLAN_IDS.BASIC]: {
    id: PLAN_IDS.BASIC,
    nameAr: 'أساسي',
    nameEn: 'Basic',
    maxSegments: 4,
    maxSpinsPerMonth: 100,
    canCustomLogo: true,
    canCustomSounds: true,
    canSocialLinks: true,
    canCustomWheelStyle: true,
    canCustomBackground: true,
    canFooterSettings: true,
    priceMonthly: 29,
    priceYearly: 290
  },
  [PLAN_IDS.PRO]: {
    id: PLAN_IDS.PRO,
    nameAr: 'برو',
    nameEn: 'Pro',
    maxSegments: 999,
    maxSpinsPerMonth: -1,
    canCustomLogo: true,
    canCustomSounds: true,
    canSocialLinks: true,
    canCustomWheelStyle: true,
    canCustomBackground: true,
    canFooterSettings: true,
    priceMonthly: 99,
    priceYearly: 990
  },
  [PLAN_IDS.SALLA]: {
    id: PLAN_IDS.SALLA,
    nameAr: 'سلة',
    nameEn: 'Salla',
    maxSegments: 999,
    maxSpinsPerMonth: -1,
    canCustomLogo: true,
    canCustomSounds: true,
    canSocialLinks: true,
    canCustomWheelStyle: true,
    canCustomBackground: true,
    canFooterSettings: true,
    priceMonthly: 0,
    priceYearly: 0
  }
}

/**
 * @param {string} planId - معرف الباقة (free, basic, pro)
 * @returns {object} حدود الباقة
 */
export function getPlanLimits(planId) {
  const plan = PLANS[planId] || PLANS[PLAN_IDS.FREE]
  return {
    maxSegments: plan.maxSegments,
    maxSpinsPerMonth: plan.maxSpinsPerMonth,
    canCustomLogo: plan.canCustomLogo,
    canCustomSounds: plan.canCustomSounds,
    canSocialLinks: plan.canSocialLinks,
    canCustomWheelStyle: plan.canCustomWheelStyle,
    canCustomBackground: plan.canCustomBackground,
    canFooterSettings: plan.canFooterSettings
  }
}

export function getPlanInfo(planId) {
  return PLANS[planId] || PLANS[PLAN_IDS.FREE]
}

/**
 * التحقق من إمكانية إضافة قطاع آخر
 */
export function canAddSegment(planId, currentCount) {
  const { maxSegments } = getPlanLimits(planId)
  return currentCount < maxSegments
}
