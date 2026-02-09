-- Supabase Database Schema for LuckyWheel
-- انسخ هذا الكود في Supabase SQL Editor

-- جدول الإعدادات (Settings)
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول بيانات المستخدمين (User Data)
CREATE TABLE IF NOT EXISTS user_data (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الجوائز الفائزة (Wins)
CREATE TABLE IF NOT EXISTS wins (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  prize TEXT NOT NULL,
  coupon_code TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_user_data_timestamp ON user_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_wins_timestamp ON wins(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_data_email ON user_data(email);

-- تفعيل Row Level Security (RLS) - اختياري
-- يمكنك تفعيله إذا أردت حماية البيانات

-- ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE wins ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول (Policies) - للقراءة والكتابة العامة
-- يمكنك تعديلها حسب احتياجاتك

-- للقراءة العامة
-- CREATE POLICY "Allow public read access" ON settings FOR SELECT USING (true);
-- CREATE POLICY "Allow public read access" ON user_data FOR SELECT USING (true);
-- CREATE POLICY "Allow public read access" ON wins FOR SELECT USING (true);

-- للكتابة العامة
-- CREATE POLICY "Allow public insert access" ON settings FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public insert access" ON user_data FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public insert access" ON wins FOR INSERT WITH CHECK (true);

-- للتحديث (للإعدادات فقط)
-- CREATE POLICY "Allow public update access" ON settings FOR UPDATE USING (true);
