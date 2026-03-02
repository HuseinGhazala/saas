-- إضافة حقول معلومات المتجر وحالة التطبيق لجدول salla_merchants
-- تُملأ من ويب هوك سلة + استدعاء API معلومات المستخدم/المتجر (user/info)

-- إذا الجدول غير موجود (يُنشأ يدوياً أو من مشروع آخر) لا يحدث خطأ — نفّذ ALTER فقط
ALTER TABLE public.salla_merchants
  ADD COLUMN IF NOT EXISTS store_name TEXT,
  ADD COLUMN IF NOT EXISTS store_url TEXT,
  ADD COLUMN IF NOT EXISTS store_email TEXT,
  ADD COLUMN IF NOT EXISTS current_plan TEXT,
  ADD COLUMN IF NOT EXISTS app_status TEXT;

COMMENT ON COLUMN public.salla_merchants.store_name IS 'اسم المتجر من سلة';
COMMENT ON COLUMN public.salla_merchants.store_url IS 'رابط المتجر (الدومين) من سلة';
COMMENT ON COLUMN public.salla_merchants.store_email IS 'الإيميل المسجّل للمتجر (من صلّح التطبيق)';
COMMENT ON COLUMN public.salla_merchants.current_plan IS 'الباقة الحالية المفعّلة في سلة (مثل: pro, basic)';
COMMENT ON COLUMN public.salla_merchants.app_status IS 'حالة التطبيق على المتجر: enabled | disabled (معطّل عند إلغاء التثبيت)';

-- تغيير نوع الإرجاع يتطلب حذف الدالة ثم إعادة إنشائها
DROP FUNCTION IF EXISTS public.get_salla_merchants();

CREATE OR REPLACE FUNCTION public.get_salla_merchants()
RETURNS TABLE (
  merchant_id BIGINT,
  attempts_allowed INT,
  attempts_used INT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  store_name TEXT,
  store_url TEXT,
  store_email TEXT,
  current_plan TEXT,
  app_status TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.merchant_id,
    s.attempts_allowed,
    s.attempts_used,
    s.created_at,
    s.updated_at,
    COALESCE(m.store_name, p.store_name) AS store_name,
    m.store_url,
    m.store_email,
    m.current_plan,
    m.app_status
  FROM public.salla_subscriptions s
  LEFT JOIN public.salla_merchants m ON m.merchant_id = s.merchant_id
  LEFT JOIN public.profiles p ON p.merchant_id = s.merchant_id
  ORDER BY s.created_at DESC NULLS LAST;
$$;

COMMENT ON FUNCTION public.get_salla_merchants() IS 'قائمة متاجر سلة مع المحاولات ومعلومات المتجر (الاسم، الرابط، الإيميل، الباقة، حالة التطبيق)';
GRANT EXECUTE ON FUNCTION public.get_salla_merchants() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_salla_merchants() TO service_role;
