-- Salla Spin-to-Win: atomic increment of attempts_used
-- Run in Supabase SQL Editor if not applied via migrations.
-- Table salla_subscriptions must exist with: merchant_id (bigint), attempts_allowed (int), attempts_used (int, default 0).

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

COMMENT ON FUNCTION public.increment_attempts_used(bigint) IS
  'Atomically increments attempts_used by 1 for a merchant only if attempts_used < attempts_allowed. Safe for concurrent spins.';
