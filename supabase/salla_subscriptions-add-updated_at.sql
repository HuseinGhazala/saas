-- إضافة updated_at (وإن وُجد trigger يحدّثه) لجدول salla_subscriptions
-- نفّذ في Supabase → SQL Editor إذا ظهر خطأ: record "new" has no field "updated_at"

ALTER TABLE public.salla_subscriptions
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
