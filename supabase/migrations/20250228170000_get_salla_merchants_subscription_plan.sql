-- إضافة باقة الاشتراك (من salla_subscriptions) إلى قائمة تجار سلة
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
  subscription_plan_name TEXT,
  subscription_plan_type TEXT,
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
    s.plan_name AS subscription_plan_name,
    s.plan_type AS subscription_plan_type,
    m.app_status
  FROM public.salla_subscriptions s
  LEFT JOIN public.salla_merchants m ON m.merchant_id = s.merchant_id
  LEFT JOIN public.profiles p ON p.merchant_id = s.merchant_id
  ORDER BY s.created_at DESC NULLS LAST;
$$;

COMMENT ON FUNCTION public.get_salla_merchants() IS 'قائمة متاجر سلة مع المحاولات ومعلومات المتجر وباقة الاشتراك';
GRANT EXECUTE ON FUNCTION public.get_salla_merchants() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_salla_merchants() TO service_role;
