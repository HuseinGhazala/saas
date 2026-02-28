# ضبط الباقات (سلة)

## 1. في لوحة تطبيق سلة (Partner)

- من **تطبيقك → التسعير / الباقات** حدّد للباقات **ميزة (Feature)** باسم واحد من:
  - `spins`
  - `Spin`
  - `دورات`
  - `spin_count`
- **الكمية (quantity)** = عدد دورات العجلة المسموح بها للباقة (شهرياً أو حسب فترة الاشتراك).

مثال: باقة "أساسي" → feature key = `spins`, quantity = `500`.  
باقة "برو" → feature key = `spins`, quantity = `2000`.

عند بدء أو تجديد الاشتراك، سلة ترسل ويب هوك فيه `data.features` والدالة تقرأ الكمية من الميزة اللي اسم ها أحد المذكورة أعلاه.

---

## 2. القيم الافتراضية (بدون features)

| الحدث | الافتراضي | متغير البيئة (Secrets) |
|--------|-----------|------------------------|
| تثبيت التطبيق (`app.store.authorize` / `app.installed`) | **6** (باقة مجانية) | `SALLA_DEFAULT_SPINS_INSTALL` |
| بدء/تجديد اشتراك (`app.subscription.started` / `renewed`) | 500 | `SALLA_DEFAULT_SPINS_SUBSCRIPTION` |
| بدء تجربة (`app.trial.started`) | 50 | `SALLA_TRIAL_SPINS` |

يمكن إضافة هذه المتغيرات في **Supabase → Project Settings → Edge Functions → Secrets** وتعديل الأرقام دون تغيير الكود.

---

## 3. أحداث الباقات والتجربة

| الحدث | الإجراء |
|--------|---------|
| `app.store.authorize` / `app.installed` | تعيين `attempts_allowed` (من feature أو الافتراضي) و `attempts_used = 0` |
| `app.subscription.started` / `app.subscription.renewed` | تحديث `attempts_allowed` من الـ features أو الافتراضي (بدون مسح `attempts_used`) |
| `app.trial.started` | نفس منطق التثبيت/الاشتراك — يُنفّذ عند إضافة دعم هذا الحدث في الدالة |
| `app.trial.expired` / `app.trial.canceled` | جعل `attempts_allowed = 0` — يُنفّذ عند إضافة دعم هذه الأحداث |
| `app.subscription.expired` / `canceled` / `app.uninstalled` | جعل `attempts_allowed = 0` |

---

## 4. إضافة أحداث التجربة (trial) في الكود

لتفعيل `app.trial.started` و `app.trial.expired` و `app.trial.canceled` يلزم إضافة الـ cases المناسبة في `rapid-task/index.ts` واستدعاء `getAttemptsAllowed` لحدث التجربة ثم تحديث `salla_subscriptions` كما في أحداث الاشتراك.
