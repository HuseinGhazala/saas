-- جدول اشتراكات سلة (للمتاجر اللي تثبت التطبيق من متجر سلة)
-- نفّذ هذا الملف في Supabase SQL Editor إذا الجدول غير موجود.

CREATE TABLE IF NOT EXISTS public.salla_subscriptions (
  merchant_id BIGINT PRIMARY KEY,
  attempts_allowed INT NOT NULL DEFAULT 0,
  attempts_used INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- تحديث updated_at عند التعديل (اختياري)
CREATE OR REPLACE FUNCTION public.salla_subscriptions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS salla_subscriptions_updated_at ON public.salla_subscriptions;
CREATE TRIGGER salla_subscriptions_updated_at
  BEFORE UPDATE ON public.salla_subscriptions
  FOR EACH ROW
  EXECUTE PROCEDURE public.salla_subscriptions_updated_at();

COMMENT ON TABLE public.salla_subscriptions IS 'اشتراكات متاجر سلة: عدد المحاولات المسموحة والمستخدمة للعجلة';
