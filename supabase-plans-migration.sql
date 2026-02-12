-- إضافة الباقات (Plans) للمشروع
-- نفّذ هذا الملف في Supabase SQL Editor بعد supabase-saas-schema.sql

-- إضافة عمود الباقة لجدول profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';

-- تحديث المستخدمين الحاليين إلى الباقة المجانية إن لم تُحدد
UPDATE public.profiles SET plan = 'free' WHERE plan IS NULL;
