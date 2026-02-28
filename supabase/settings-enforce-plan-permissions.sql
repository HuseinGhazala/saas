-- ============================================================
-- رفع صلاحيات الباقة على Supabase: فرض قيود الباقة المجانية على الإعدادات
-- نفّذ هذا الملف في Supabase SQL Editor بعد supabase-plans-migration.sql
-- ============================================================
-- (نفس المحتوى موجود في supabase/migrations/20250228120000_settings_enforce_plan_permissions.sql
--  ليعمل تلقائياً مع: supabase db push)
-- ============================================================
-- عند الحفظ (INSERT/UPDATE) على settings نتحقق من profiles.plan للمالك:
-- إذا الباقة = free نفرض: لا شعار، شكل عجلة كلاسيكي فقط، خلفية لون افتراضي فقط،
-- أصوات افتراضية، لا روابط سوشيال، لا إعدادات فوتر.
-- الباقات basic و pro لا تتأثر (يُحفظ ما يرسله العميل).
-- ============================================================

CREATE OR REPLACE FUNCTION public.settings_enforce_plan_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_plan TEXT;
  default_bg JSONB := '{"type":"color","color":"#0f172a","desktopImage":null,"mobileImage":null}'::jsonb;
  default_win_sound TEXT := 'https://www.soundjay.com/human/sounds/applause-01.mp3';
  default_lose_sound TEXT := 'https://www.soundjay.com/misc/sounds/fail-trombone-01.mp3';
BEGIN
  SELECT COALESCE(plan, 'free') INTO user_plan
  FROM profiles
  WHERE id = NEW.owner_id
  LIMIT 1;

  IF user_plan = 'free' THEN
    -- الباقة المجانية: فرض القيم المسموحة فقط
    NEW.data := jsonb_set(NEW.data, '{logo}', 'null'::jsonb);
    NEW.data := jsonb_set(NEW.data, '{wheelStyle}', '"classic"'::jsonb);
    NEW.data := jsonb_set(NEW.data, '{backgroundSettings}', default_bg);
    NEW.data := jsonb_set(NEW.data, '{winSound}', to_jsonb(default_win_sound::text));
    NEW.data := jsonb_set(NEW.data, '{loseSound}', to_jsonb(default_lose_sound::text));
    NEW.data := jsonb_set(NEW.data, '{socialLinks}', '{}'::jsonb);
    NEW.data := jsonb_set(NEW.data, '{footerSettings}', '{"description":"","links":[],"taxId":"","businessPlatformId":"","storeName":""}'::jsonb);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS settings_enforce_plan_trigger ON public.settings;
CREATE TRIGGER settings_enforce_plan_trigger
  BEFORE INSERT OR UPDATE OF data ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.settings_enforce_plan_permissions();

COMMENT ON FUNCTION public.settings_enforce_plan_permissions() IS 'يفرض قيود الباقة المجانية على data عند حفظ settings (شعار، شكل العجلة، خلفية، أصوات، سوشيال، فوتر)';
