-- إضافة حقول تفاصيل الاشتراك من ويب هوك سلة (يُملأها rapid-task)
-- سلة ترسل: subscription_id, plan_type, plan_name, plan_period, start_date, end_date, price, total, price_before_discount, store_type

ALTER TABLE public.salla_subscriptions
  ADD COLUMN IF NOT EXISTS salla_subscription_id BIGINT,
  ADD COLUMN IF NOT EXISTS plan_id TEXT,
  ADD COLUMN IF NOT EXISTS plan_type TEXT,
  ADD COLUMN IF NOT EXISTS plan_name TEXT,
  ADD COLUMN IF NOT EXISTS plan_period TEXT,
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS total NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS price_before_discount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS store_type TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS raw_data JSONB,
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

COMMENT ON COLUMN public.salla_subscriptions.salla_subscription_id IS 'معرف الاشتراك في سلة (من data.subscription_id)';
COMMENT ON COLUMN public.salla_subscriptions.plan_id IS 'معرف الباقة (من data.id إن وُجد)';
COMMENT ON COLUMN public.salla_subscriptions.plan_type IS 'نوع الباقة: recurring, once, on_demand, free';
COMMENT ON COLUMN public.salla_subscriptions.plan_name IS 'اسم الباقة من سلة';
COMMENT ON COLUMN public.salla_subscriptions.plan_period IS 'مدة الباقة بالأشهر';
COMMENT ON COLUMN public.salla_subscriptions.start_date IS 'تاريخ بداية الاشتراك';
COMMENT ON COLUMN public.salla_subscriptions.end_date IS 'تاريخ نهاية الاشتراك';
COMMENT ON COLUMN public.salla_subscriptions.price IS 'سعر الباقة';
COMMENT ON COLUMN public.salla_subscriptions.total IS 'الإجمالي مع الضريبة';
COMMENT ON COLUMN public.salla_subscriptions.price_before_discount IS 'السعر قبل الخصم';
COMMENT ON COLUMN public.salla_subscriptions.store_type IS 'نوع المتجر: development, demo, live';
COMMENT ON COLUMN public.salla_subscriptions.status IS 'حالة الاشتراك: active, expired, canceled';
COMMENT ON COLUMN public.salla_subscriptions.raw_data IS 'الـ payload الخام من ويب هوك سلة';
COMMENT ON COLUMN public.salla_subscriptions.owner_id IS 'صاحب الحساب في Supabase (من profiles.merchant_id)';
