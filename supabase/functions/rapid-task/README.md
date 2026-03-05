# rapid-task — ويب هوك سلة

هذه الدالة تستقبل أحداث سلة (Webhooks) وتحدّث جدول `salla_subscriptions` في Supabase.

## قبل التشغيل

1. **إنشاء الجدول في Supabase**  
   نفّذ الملف `supabase/salla_subscriptions-table.sql` من مجلد المشروع في **Supabase → SQL Editor** إذا الجدول غير موجود.

2. **نشر الدالة**
   ```bash
   npx supabase functions deploy rapid-task
   ```
   (أو من مشروع Supabase مربوط: `supabase functions deploy rapid-task`)

3. **رابط الويب هوك في سلة**  
   في تطبيقك في بوابة شركاء سلة، ضع رابط الويب هوك:
   ```
   https://pjgvvgewjgsxufxtbrzv.supabase.co/functions/v1/rapid-task
   ```

## الأحداث المعالجة

| الحدث | الإجراء |
|--------|---------|
| `app.store.authorize` | إضافة/تحديث المتجر بـ 100 محاولة افتراضية |
| `app.installed` | نفس الأعلى |
| `app.subscription.started` / `app.subscription.renewed` | تحديث المحاولات المسموحة (مثلاً 500 أو من الـ features) |
| `app.subscription.expired` / `app.subscription.canceled` / `app.uninstalled` | جعل المحاولات المسموحة = 0 |

المتغيرات `SUPABASE_URL` و `SUPABASE_SERVICE_ROLE_KEY` تُضبط تلقائياً عند النشر على Supabase.

## فحص وصول البريد (إيميل ترحيب تجريبي)

للتأكد أن الإيميل يصل بدون تثبيت التطبيق من سلة:

1. في **Supabase → Edge Functions → Secrets** أضف:
   - **Name:** `TEST_EMAIL_SECRET`  
   - **Value:** كلمة سر تختارها أنت (مثل `my-test-secret-123`).

2. بعد نشر الدالة، أرسل طلب POST للرابط:
   ```
   https://pjgvvgewjgsxufxtbrzv.supabase.co/functions/v1/rapid-task
   ```
   مع الـ body (JSON):
   ```json
   {
     "test_email": true,
     "email": "بريدك@example.com",
     "secret": "نفس قيمة TEST_EMAIL_SECRET",
     "name": "اسم تجريبي"
   }
   ```

3. إذا كان الإعداد صحيحاً سترد الدالة بـ `ok: true` وستستلم على البريد المذكور إيميل ترحيب بنفس شكل إيميل التاجر (بيانات دخول ورابط لوحة التحكم). تحقق من صندوق الوارد والسبام.
