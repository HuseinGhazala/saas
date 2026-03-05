# قائمة التحقق قبل اختبار التكامل مع سلة

## 1. قاعدة البيانات (Supabase)

- [ ] **salla_merchants**: الأعمدة `access_token` و `refresh_token` تقبل NULL  
  إذا ظهر خطأ `null value in column "access_token"`: نفّذ من SQL Editor محتوى الملف  
  `supabase/salla_merchants-allow-null-tokens.sql`

- [ ] **salla_subscriptions**: لا يوجد قيد UNIQUE على `owner_id`  
  إذا ظهر خطأ `duplicate key ... idx_salla_sub_owner`: نفّذ الـ migration  
  `supabase/migrations/20250303000000_salla_subscriptions_allow_same_owner.sql`  
  أو من SQL Editor:
  ```sql
  DROP INDEX IF EXISTS public.idx_salla_sub_owner;
  ALTER TABLE public.salla_subscriptions DROP CONSTRAINT IF EXISTS idx_salla_sub_owner;
  ```

- [ ] **salla_subscriptions**: يحتوي على الأعمدة `updated_at`, `plan_name`, `plan_type` (من migrations سابقة).

- [ ] **جدول plans**: موجود وتوجد فيه الباقات (free, basic, pro) مع الصلاحيات الصحيحة.

- [ ] **الدوال**: `get_salla_merchants`, `get_spin_eligibility`, `increment_attempts_used`, `get_wheel_by_slug`, `get_plan_limits` موجودة والصلاحيات (anon/authenticated) مضبوطة.

---

## 2. إعداد Edge Function (rapid-task)

في **Supabase Dashboard → Project Settings → Edge Functions → Secrets**:

- [ ] **RESEND_API_KEY**: مفتاح API من Resend.
- [ ] **SALLA_WELCOME_EMAIL_FROM**: بريد مرسل تم تحققه في Resend (مثل `noreply@luckywheelsass.pixelcodes.net`) حتى لا يظهر خطأ 403.
- [ ] (اختياري) **LOGIN_URL**: رابط صفحة الدخول، مثلاً `https://luckywheelsass.pixelcodes.net/login`.

ثم تأكد أن الدالة منشورة:

```bash
npx supabase functions deploy rapid-task
```

---

## 3. إعداد سلة (بوابة شركاء سلة)

- [ ] **نمط المصادقة**: اختيار **النمط السهل** حتى ترسل سلة حدث `app.store.authorize` مع توكن سلة (وليس ory_).
- [ ] **رابط الويب هوك**: مضبوط على  
  `https://pjgvvgewjgsxufxtbrzv.supabase.co/functions/v1/rapid-task`
- [ ] (إن وُجد) **Callback URL**: للدخول من واجهة سلة، مثلاً  
  `https://luckywheelsass.pixelcodes.net/salla/entry`

---

## 4. التطبيق (الفرونت إند)

- [ ] **VITE_SUPABASE_URL** و **VITE_SUPABASE_ANON_KEY** مضبوطان في `.env` أو في بيئة النشر.
- [ ] صفحة **تسجيل الدخول** تعمل على الرابط الموجود في إيميل الترحيب (نفس LOGIN_URL).
- [ ] صفحة **تجار سلة** تستدعي `get_salla_merchants()` وتظهر البيانات (محاولات، اسم متجر، باقة، إلخ).
- [ ] صفحة **العجلة** (بالـ slug) تستدعي `get_spin_eligibility(merchant_id)` و `increment_attempts_used(merchant_id)` وأن عدد المحاولات يحدَّث بعد كل لف.

---

## 5. اختبار سريع

1. من متجر تجريبي في سلة: تثبيت التطبيق (أو إعادة تفعيل مع النمط السهل).
2. التحقق في Supabase:
   - **Auth → Users**: ظهور مستخدم جديد بالبريد المسجّل في المتجر.
   - **Table Editor → salla_merchants**: صف للمتجر مع `store_name`, `store_email`, `current_plan` إن وردت من سلة.
   - **Table Editor → salla_subscriptions**: صف بنفس `merchant_id` و `attempts_allowed` (مثلاً 6 أو 100 حسب الباقة).
3. **Edge Functions → rapid-task → Logs**: عدم وجود خطأ 23503 (foreign key) أو 23505 (unique owner_id) أو 403 من Resend؛ ووجود رسالة مثل `Welcome email sent to ...` عند نجاح الإرسال.
4. فتح رابط العجلة (slug) وتجربة لف: أن يقلّ عدد المحاولات في الواجهة وفي جدول `salla_subscriptions.attempts_used`.

---

إذا كل النقاط أعلاه ✓ فالتكامل جاهز للاختبار الكامل.
