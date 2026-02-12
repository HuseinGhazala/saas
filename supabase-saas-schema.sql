-- ============================================================
-- مخطط Supabase لنسخة SaaS من عجلة الحظ (متعدد المستأجرين)
-- ============================================================
-- 1. نفّذ هذا الملف في Supabase SQL Editor بعد تفعيل Auth.
-- 2. يفترض أنك إمّا تبدأ من صفر أو أنك هاجرت البيانات القديمة.
-- ============================================================

-- جدول الملفات الشخصية للمتاجر (مرتبط بـ auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  store_name TEXT NOT NULL DEFAULT 'متجري',
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الإعدادات (صف واحد لكل مالك)
CREATE TABLE IF NOT EXISTS public.settings (
  id SERIAL PRIMARY KEY,
  owner_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول بيانات المشاركين (مع مالك العجلة)
CREATE TABLE IF NOT EXISTS public.user_data (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الجوائز الفائزة (مع مالك العجلة)
CREATE TABLE IF NOT EXISTS public.wins (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  prize TEXT NOT NULL,
  coupon_code TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس
CREATE INDEX IF NOT EXISTS idx_settings_owner ON settings(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_data_owner ON user_data(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_data_timestamp ON user_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_data_email ON user_data(email);
CREATE INDEX IF NOT EXISTS idx_wins_owner ON wins(owner_id);
CREATE INDEX IF NOT EXISTS idx_wins_timestamp ON wins(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug);

-- دالة: جلب إعدادات العجلة عبر slug (للرابط العام)
CREATE OR REPLACE FUNCTION public.get_wheel_by_slug(slug_param TEXT)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.data
  FROM settings s
  JOIN profiles p ON p.id = s.owner_id
  WHERE p.slug = slug_param
  LIMIT 1;
$$;

-- دالة: إدراج مشارك جديد من الرابط العام (باستخدام slug)
CREATE OR REPLACE FUNCTION public.insert_user_data_for_slug(
  slug_param TEXT,
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  oid UUID;
BEGIN
  SELECT id INTO oid FROM profiles WHERE slug = slug_param LIMIT 1;
  IF oid IS NULL THEN RETURN FALSE; END IF;
  INSERT INTO user_data (owner_id, name, email, phone) VALUES (oid, p_name, p_email, p_phone);
  RETURN TRUE;
END;
$$;

-- دالة: إدراج جائزة فائزة من الرابط العام (باستخدام slug)
CREATE OR REPLACE FUNCTION public.insert_win_for_slug(
  slug_param TEXT,
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_prize TEXT,
  p_coupon_code TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  oid UUID;
BEGIN
  SELECT id INTO oid FROM profiles WHERE slug = slug_param LIMIT 1;
  IF oid IS NULL THEN RETURN FALSE; END IF;
  INSERT INTO wins (owner_id, name, email, phone, prize, coupon_code)
  VALUES (oid, p_name, p_email, p_phone, p_prize, p_coupon_code);
  RETURN TRUE;
END;
$$;

-- إنشاء ملف تلقائي عند تسجيل مستخدم جديد (Auth trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  c INT;
BEGIN
  base_slug := LOWER(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'store_name', SPLIT_PART(NEW.email, '@', 1)), '[^a-z0-9]+', '-', 'g'));
  base_slug := TRIM(BOTH '-' FROM base_slug);
  IF LENGTH(base_slug) < 2 THEN base_slug := 'store-' || SUBSTRING(NEW.id::TEXT, 1, 8); END IF;
  final_slug := base_slug;
  c := 0;
  WHILE EXISTS (SELECT 1 FROM profiles WHERE slug = final_slug) LOOP
    c := c + 1;
    final_slug := base_slug || '-' || c;
  END LOOP;
  INSERT INTO profiles (id, slug, store_name)
  VALUES (NEW.id, final_slug, COALESCE(NEW.raw_user_meta_data->>'store_name', 'متجري'));
  INSERT INTO settings (owner_id, data)
  VALUES (NEW.id, '{}'::jsonb);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== Row Level Security (RLS) ==========
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE wins ENABLE ROW LEVEL SECURITY;

-- profiles: المستخدم يرى ويعدّل ملفه فقط
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- القراءة العامة للملف (slug فقط) للتحقق من وجود العجلة
DROP POLICY IF EXISTS "profiles_public_select_slug" ON profiles;
CREATE POLICY "profiles_public_select_slug" ON profiles FOR SELECT USING (true);

-- settings: المالك فقط
DROP POLICY IF EXISTS "settings_all_own" ON settings;
CREATE POLICY "settings_all_own" ON settings
  FOR ALL USING (auth.uid() = owner_id);

-- user_data: المالك فقط
DROP POLICY IF EXISTS "user_data_all_own" ON user_data;
CREATE POLICY "user_data_all_own" ON user_data
  FOR ALL USING (auth.uid() = owner_id);

-- wins: المالك فقط
DROP POLICY IF EXISTS "wins_all_own" ON wins;
CREATE POLICY "wins_all_own" ON wins
  FOR ALL USING (auth.uid() = owner_id);

-- السماح للدوال SECURITY DEFINER بالكتابة (يتم من داخل الدوال)
-- لا حاجة لسياسة إضافية للـ anon على user_data/wins لأن الإدراج يتم عبر الدوال.

-- منح صلاحيات الاستدعاء للدوال (للمستخدم المجهول والمصادق)
GRANT EXECUTE ON FUNCTION public.get_wheel_by_slug(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_wheel_by_slug(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_user_data_for_slug(TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.insert_user_data_for_slug(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_win_for_slug(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.insert_win_for_slug(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- تحديث القطع/الكوبونات من الرابط العام (بعد استخدام كوبون)
CREATE OR REPLACE FUNCTION public.update_segments_for_slug(slug_param TEXT, segments_json JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  oid UUID;
BEGIN
  SELECT id INTO oid FROM profiles WHERE slug = slug_param LIMIT 1;
  IF oid IS NULL THEN RETURN FALSE; END IF;
  UPDATE settings SET data = jsonb_set(data, '{segments}', segments_json), updated_at = NOW() WHERE owner_id = oid;
  RETURN TRUE;
END;
$$;
GRANT EXECUTE ON FUNCTION public.update_segments_for_slug(TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.update_segments_for_slug(TEXT, JSONB) TO authenticated;
