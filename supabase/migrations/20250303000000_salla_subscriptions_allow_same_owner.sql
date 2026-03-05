-- إزالة القيد الفريد على owner_id في salla_subscriptions
-- نفس المستخدم يمكنه ربط أكثر من متجر (merchant_id) — يمنع خطأ 23505 عند إعادة تثبيت أو متاجر متعددة

DROP INDEX IF EXISTS public.idx_salla_sub_owner;

ALTER TABLE public.salla_subscriptions
  DROP CONSTRAINT IF EXISTS idx_salla_sub_owner;
