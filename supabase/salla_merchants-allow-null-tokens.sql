-- السماح بقيم NULL لـ access_token و refresh_token حتى نستطيع إدراج المتجر قبل وصول التوكن (مثلاً من حدث app.installed)
-- نفّذ مرة واحدة في Supabase SQL Editor

ALTER TABLE public.salla_merchants
  ALTER COLUMN access_token DROP NOT NULL,
  ALTER COLUMN refresh_token DROP NOT NULL;
