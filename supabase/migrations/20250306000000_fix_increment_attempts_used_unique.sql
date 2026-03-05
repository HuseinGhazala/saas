-- إصلاح: وجود أكثر من دالة بنفس الاسم increment_attempts_used(bigint) يسبب "function is not unique"
-- حذف كل النسخ من كل الـ schemas ثم إعادة إنشاء نسخة واحدة في public

DO $$
DECLARE
  r RECORD;
  args text;
BEGIN
  FOR r IN (
    SELECT n.nspname AS schema_name,
           p.proname AS func_name,
           pg_get_function_identity_arguments(p.oid) AS identity_args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'increment_attempts_used'
  ) LOOP
    args := r.identity_args;
    EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', r.schema_name, r.func_name, args);
  END LOOP;
END $$;

-- إعادة إنشاء الدالة مرة واحدة
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
