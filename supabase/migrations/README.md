# Supabase Migrations

هذا المجلد يحتوي على migrations تُنفَّذ عبر Supabase CLI.

## التشغيل

```bash
# ربط المشروع (مرة واحدة)
supabase link --project-ref <PROJECT_REF>

# تطبيق كل الـ migrations على قاعدة البيانات البعيدة
supabase db push
```

أو محلياً:

```bash
supabase db reset   # يطبّق كل الـ migrations على قاعدة محلية
```

## ترتيب الاعتماديات

- **يُفترض** أن الجداول `profiles` و `settings` موجودة (من `supabase-saas-schema.sql`).
- **يُفترض** أن عمود `profiles.plan` موجود (من `supabase-plans-migration.sql`).
- إذا لم تكن طبّقت المخطط أو خطوة الباقات بعد، نفّذها من SQL Editor أولاً، ثم استخدم `supabase db push` لتشغيل الـ migrations في هذا المجلد.

## الملفات

| الملف | الوصف |
|-------|--------|
| `20250228120000_settings_enforce_plan_permissions.sql` | Trigger يفرض قيود الباقة على الإعدادات (يُستبدل لاحقاً بالـ trigger في 20250228130000). |
| `20250228130000_plans_table_and_trigger_from_plans.sql` | جدول **plans** + تعبئة free/basic/pro + دالة **get_plan_limits** + تحديث الـ trigger لقراءة الصلاحيات من الجدول. بعدها يمكنك **تعديل الباقات من Supabase**. |

## تعديل الباقات من Supabase

بعد تشغيل migration `20250228130000`:

1. **Table Editor:** Dashboard → Table Editor → جدول **plans** → عدّل أي صف (مثلاً `max_segments`, `max_spins_per_month`, `can_custom_logo`, الأسعار).
2. **SQL Editor:** مثلاً `UPDATE plans SET max_spins_per_month = 200 WHERE id = 'basic';`

الـ trigger على **settings** يقرأ صلاحيات الباقة من جدول **plans** عند كل حفظ، فالتعديل يُطبَّق فوراً.
