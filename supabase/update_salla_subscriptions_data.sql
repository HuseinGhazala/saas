-- تعديل بيانات salla_subscriptions (المحاولات المسموحة والمستخدمة)
-- نفّذ في Supabase → SQL Editor حسب الحاجة.

-- 1) عرض البيانات الحالية قبل التعديل
-- SELECT merchant_id, attempts_allowed, attempts_used, status, created_at FROM public.salla_subscriptions ORDER BY merchant_id;

-- 2) ضبط المحاولات لجميع المتاجر: مسموح = 6، مستخدم = 0 (مثل الباقة المجانية/التثبيت)
UPDATE public.salla_subscriptions
SET
  attempts_allowed = 6,
  attempts_used = 0,
  status = 'active',
  updated_at = NOW()
WHERE true;

-- 3) أو لتعديل متجر واحد فقط (غيّر 1164633945 إلى merchant_id الفعلي):
-- UPDATE public.salla_subscriptions
-- SET attempts_allowed = 6, attempts_used = 0, updated_at = NOW()
-- WHERE merchant_id = 1164633945;

-- 4) التحقق بعد التعديل
-- SELECT merchant_id, attempts_allowed, attempts_used, status, updated_at FROM public.salla_subscriptions ORDER BY merchant_id;
