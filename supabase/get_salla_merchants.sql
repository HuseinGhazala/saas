-- قائمة تجار سلة (لصفحة "تجار سلة" في لوحة التحكم)
-- يُنفّذ مرة واحدة في Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.get_salla_merchants()
RETURNS TABLE (
  merchant_id BIGINT,
  attempts_allowed INT,
  attempts_used INT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  store_name TEXT
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
    p.store_name
  FROM public.salla_subscriptions s
  LEFT JOIN public.profiles p ON p.merchant_id = s.merchant_id
  ORDER BY s.created_at DESC NULLS LAST;
$$;

COMMENT ON FUNCTION public.get_salla_merchants() IS 'قائمة متاجر سلة مع المحاولات واسم المتجر من profiles';

-- السماح للمستخدمين المسجلين باستدعاء الدالة (اختياري: غيّر لـ authenticated فقط)
GRANT EXECUTE ON FUNCTION public.get_salla_merchants() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_salla_merchants() TO service_role;
