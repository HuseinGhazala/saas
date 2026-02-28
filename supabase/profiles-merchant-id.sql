-- ربط حساب Supabase بتاجر سلة (merchant_id)
-- نفّذ هذا الملف في Supabase SQL Editor مرة واحدة.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS merchant_id BIGINT UNIQUE;

COMMENT ON COLUMN public.profiles.merchant_id IS 'رقم متجر سلة عند الدخول من تطبيق سلة';
