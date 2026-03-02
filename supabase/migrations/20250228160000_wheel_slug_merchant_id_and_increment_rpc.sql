-- 1) إرجاع owner_id و merchant_id مع إعدادات العجلة عند التحميل بالـ slug (للمحاولات وتحديث العدد في سلة)
CREATE OR REPLACE FUNCTION public.get_wheel_by_slug(slug_param TEXT)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (s.data || jsonb_build_object(
    'owner_id', s.owner_id,
    'merchant_id', p.merchant_id
  ))
  FROM settings s
  JOIN profiles p ON p.id = s.owner_id
  WHERE p.slug = slug_param
  LIMIT 1;
$$;

-- 2) دالة خصم محاولة من اشتراك سلة (للعجلة العامة والخاصة) + منح الصلاحية لـ anon
CREATE OR REPLACE FUNCTION public.increment_attempts_used(p_merchant_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
BEGIN
  UPDATE public.salla_subscriptions
  SET attempts_used = attempts_used + 1
  WHERE merchant_id = p_merchant_id
    AND attempts_used < attempts_allowed
  RETURNING *
  INTO v_row;

  IF v_row.merchant_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', CASE
        WHEN EXISTS (SELECT 1 FROM public.salla_subscriptions WHERE merchant_id = p_merchant_id)
        THEN 'attempts_exceeded'
        ELSE 'merchant_not_found'
      END
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'attempts_used', v_row.attempts_used,
    'attempts_allowed', v_row.attempts_allowed
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_attempts_used(bigint) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_attempts_used(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_attempts_used(bigint) TO service_role;

COMMENT ON FUNCTION public.increment_attempts_used(bigint) IS 'خصم محاولة واحدة من اشتراك المتجر في سلة (يُستدعى بعد كل دوران ناجح)';

-- 3) جلب عدد المحاولات المسموحة والمستخدمة (للعرض وللتحقق قبل الدوران) — يعمل للزائر والمسجّل
CREATE OR REPLACE FUNCTION public.get_spin_eligibility(p_merchant_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allowed int;
  v_used int;
BEGIN
  SELECT attempts_allowed, attempts_used INTO v_allowed, v_used
  FROM public.salla_subscriptions
  WHERE merchant_id = p_merchant_id
  LIMIT 1;
  RETURN jsonb_build_object(
    'attempts_allowed', COALESCE(v_allowed, 0),
    'attempts_used', COALESCE(v_used, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_spin_eligibility(bigint) TO anon;
GRANT EXECUTE ON FUNCTION public.get_spin_eligibility(bigint) TO authenticated;
COMMENT ON FUNCTION public.get_spin_eligibility(bigint) IS 'جلب المحاولات المسموحة والمستخدمة للمتجر (للعرض والتحقق قبل الدوران)';
