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
