-- إصلاح: جعل merchant_id فريداً حتى يعمل الـ upsert من ويب هوك سلة
-- نفّذ هذا الملف مرة واحدة في Supabase → SQL Editor

-- إضافة قيد فريد على merchant_id (مطلوب للـ upsert)
ALTER TABLE public.salla_subscriptions
ADD CONSTRAINT salla_subscriptions_merchant_id_key UNIQUE (merchant_id);
