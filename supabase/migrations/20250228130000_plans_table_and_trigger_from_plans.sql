-- جدول الباقات على Supabase — يمكنك تعديل القيم من SQL Editor أو من لوحة التحكم لاحقاً
-- يُنفَّذ مع: supabase db push

-- إزالة الجدول إن وُجد (هيكل قديم) ثم إنشاؤه من جديد بالأعمدة الصحيحة
DROP TABLE IF EXISTS public.plans CASCADE;

-- جدول الباقات
CREATE TABLE public.plans (
  id TEXT PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  max_segments INT NOT NULL DEFAULT 2,
  max_spins_per_month INT NOT NULL DEFAULT 6,
  can_custom_logo BOOLEAN NOT NULL DEFAULT false,
  can_custom_sounds BOOLEAN NOT NULL DEFAULT false,
  can_custom_social_links BOOLEAN NOT NULL DEFAULT false,
  can_custom_wheel_style BOOLEAN NOT NULL DEFAULT false,
  can_custom_background BOOLEAN NOT NULL DEFAULT false,
  can_footer_settings BOOLEAN NOT NULL DEFAULT false,
  price_monthly INT NOT NULL DEFAULT 0,
  price_yearly INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.plans IS 'تعريف الباقات والحدود — عدّل القيم من Supabase لتغيير الصلاحيات والأسعار';

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_select_all" ON public.plans FOR SELECT USING (true);

-- القيم الافتراضية (مطابقة لـ plans.js)
INSERT INTO public.plans (id, name_ar, name_en, max_segments, max_spins_per_month, can_custom_logo, can_custom_sounds, can_custom_social_links, can_custom_wheel_style, can_custom_background, can_footer_settings, price_monthly, price_yearly)
VALUES
  ('free', 'مجاني', 'Free', 2, 6, false, false, false, false, false, false, 0, 0),
  ('basic', 'أساسي', 'Basic', 4, 100, true, true, true, true, true, true, 29, 290),
  ('pro', 'برو', 'Pro', 999, -1, true, true, true, true, true, true, 99, 990)
ON CONFLICT (id) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  max_segments = EXCLUDED.max_segments,
  max_spins_per_month = EXCLUDED.max_spins_per_month,
  can_custom_logo = EXCLUDED.can_custom_logo,
  can_custom_sounds = EXCLUDED.can_custom_sounds,
  can_custom_social_links = EXCLUDED.can_custom_social_links,
  can_custom_wheel_style = EXCLUDED.can_custom_wheel_style,
  can_custom_background = EXCLUDED.can_custom_background,
  can_footer_settings = EXCLUDED.can_footer_settings,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  updated_at = NOW();

-- دالة لجلب حدود الباقة (للفرونت إند أو للاستخدام من دوال أخرى). إن لم تُوجد الباقة تُرجع حدود المجاني.
CREATE OR REPLACE FUNCTION public.get_plan_limits(plan_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', p.id,
    'nameAr', p.name_ar,
    'nameEn', p.name_en,
    'maxSegments', p.max_segments,
    'maxSpinsPerMonth', p.max_spins_per_month,
    'canCustomLogo', p.can_custom_logo,
    'canCustomSounds', p.can_custom_sounds,
    'canSocialLinks', p.can_custom_social_links,
    'canCustomWheelStyle', p.can_custom_wheel_style,
    'canCustomBackground', p.can_custom_background,
    'canFooterSettings', p.can_footer_settings,
    'priceMonthly', p.price_monthly,
    'priceYearly', p.price_yearly
  ) INTO result
  FROM plans p
  WHERE p.id = COALESCE(plan_id, 'free')
  LIMIT 1;
  IF result IS NULL THEN
    SELECT jsonb_build_object(
      'id', 'free',
      'nameAr', 'مجاني',
      'nameEn', 'Free',
      'maxSegments', 2,
      'maxSpinsPerMonth', 6,
      'canCustomLogo', false,
      'canCustomSounds', false,
      'canSocialLinks', false,
      'canCustomWheelStyle', false,
      'canCustomBackground', false,
      'canFooterSettings', false,
      'priceMonthly', 0,
      'priceYearly', 0
    ) INTO result;
  END IF;
  RETURN result;
END;
$$;

GRANT SELECT ON public.plans TO anon;
GRANT SELECT ON public.plans TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_plan_limits(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_plan_limits(TEXT) TO authenticated;

COMMENT ON FUNCTION public.get_plan_limits(TEXT) IS 'جلب حدود الباقة بصيغة jsonb (للفرونت إند)';

-- تحديث الـ trigger
CREATE OR REPLACE FUNCTION public.settings_enforce_plan_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_plan_id TEXT;
  plan_can_logo BOOLEAN;
  plan_can_sounds BOOLEAN;
  plan_can_social BOOLEAN;
  plan_can_wheel_style BOOLEAN;
  plan_can_background BOOLEAN;
  plan_can_footer BOOLEAN;
  default_bg JSONB := '{"type":"color","color":"#0f172a","desktopImage":null,"mobileImage":null}'::jsonb;
  default_win_sound TEXT := 'https://www.soundjay.com/human/sounds/applause-01.mp3';
  default_lose_sound TEXT := 'https://www.soundjay.com/misc/sounds/fail-trombone-01.mp3';
BEGIN
  SELECT COALESCE(p.plan, 'free') INTO user_plan_id
  FROM profiles p
  WHERE p.id = NEW.owner_id
  LIMIT 1;

  SELECT
    COALESCE(pl.can_custom_logo, false),
    COALESCE(pl.can_custom_sounds, false),
    COALESCE(pl.can_custom_social_links, false),
    COALESCE(pl.can_custom_wheel_style, false),
    COALESCE(pl.can_custom_background, false),
    COALESCE(pl.can_footer_settings, false)
  INTO plan_can_logo, plan_can_sounds, plan_can_social, plan_can_wheel_style, plan_can_background, plan_can_footer
  FROM plans pl
  WHERE pl.id = user_plan_id
  LIMIT 1;

  IF NOT plan_can_logo THEN
    NEW.data := jsonb_set(NEW.data, '{logo}', 'null'::jsonb);
  END IF;
  IF NOT plan_can_wheel_style THEN
    NEW.data := jsonb_set(NEW.data, '{wheelStyle}', '"classic"'::jsonb);
  END IF;
  IF NOT plan_can_background THEN
    NEW.data := jsonb_set(NEW.data, '{backgroundSettings}', default_bg);
  END IF;
  IF NOT plan_can_sounds THEN
    NEW.data := jsonb_set(NEW.data, '{winSound}', to_jsonb(default_win_sound::text));
    NEW.data := jsonb_set(NEW.data, '{loseSound}', to_jsonb(default_lose_sound::text));
  END IF;
  IF NOT plan_can_social THEN
    NEW.data := jsonb_set(NEW.data, '{socialLinks}', '{}'::jsonb);
  END IF;
  IF NOT plan_can_footer THEN
    NEW.data := jsonb_set(NEW.data, '{footerSettings}', '{"description":"","links":[],"taxId":"","businessPlatformId":"","storeName":""}'::jsonb);
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.settings_enforce_plan_permissions() IS 'يفرض قيود الباقة على data حسب جدول plans (يقرأ الصلاحيات من plans)';
