/**
 * ترجمة رسائل الخطأ (خصوصاً من Supabase Auth) للعربية
 */

const AUTH_ERROR_MAP = {
  // تسجيل الدخول
  'Invalid login credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  'invalid login credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  'Invalid Login Credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  'invalid_grant': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',

  // تأكيد البريد
  'Email not confirmed': 'يرجى تأكيد بريدك الإلكتروني من الرابط المرسل إليك ثم حاول مرة أخرى.',
  'email not confirmed': 'يرجى تأكيد بريدك الإلكتروني من الرابط المرسل إليك ثم حاول مرة أخرى.',

  // التسجيل
  'User already registered': 'هذا البريد الإلكتروني مسجل مسبقاً. جرّب تسجيل الدخول.',
  'user already registered': 'هذا البريد الإلكتروني مسجل مسبقاً. جرّب تسجيل الدخول.',
  'A user with this email already exists': 'هذا البريد الإلكتروني مسجل مسبقاً. جرّب تسجيل الدخول.',
  'Signup requires a valid password': 'كلمة المرور غير صالحة. استخدم 6 أحرف على الأقل.',
  'Password should be at least 6 characters': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.',
  'Unable to validate email address: invalid format': 'صيغة البريد الإلكتروني غير صحيحة.',

  // عامة
  'Network request failed': 'فشل الاتصال بالشبكة. تحقق من اتصالك وحاول مرة أخرى.',
  'Failed to fetch': 'فشل الاتصال بالخادم. تحقق من اتصالك وحاول مرة أخرى.',
  'Auth session missing': 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.',
  'session expired': 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.',
}

/**
 * يترجم رسالة خطأ (عادة من Supabase أو الشبكة) للعربية إن وُجدت، وإلا يرجع الرسالة كما هي أو الرسالة الافتراضية.
 * @param {string} [message] - رسالة الخطأ بالإنجليزية
 * @param {string} [defaultAr] - رسالة عربية افتراضية إذا لم تُطابق أي ترجمة
 * @returns {string}
 */
export function translateAuthError(message, defaultAr = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.') {
  if (!message || typeof message !== 'string') return defaultAr
  const trimmed = message.trim()
  if (AUTH_ERROR_MAP[trimmed]) return AUTH_ERROR_MAP[trimmed]
  // مطابقة جزئية لبعض العبارات الشائعة
  const lower = trimmed.toLowerCase()
  if (lower.includes('invalid login') || lower.includes('invalid_grant')) return AUTH_ERROR_MAP['Invalid login credentials']
  if (lower.includes('email not confirmed')) return AUTH_ERROR_MAP['Email not confirmed']
  if (lower.includes('already registered') || lower.includes('already exists')) return AUTH_ERROR_MAP['User already registered']
  if (lower.includes('password') && lower.includes('6 character')) return AUTH_ERROR_MAP['Password should be at least 6 characters']
  if (lower.includes('network') || lower.includes('fetch')) return AUTH_ERROR_MAP['Network request failed']
  if (lower.includes('session')) return AUTH_ERROR_MAP['Auth session missing']
  return defaultAr
}
