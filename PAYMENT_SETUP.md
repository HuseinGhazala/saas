# إعداد الدفع والاشتراك

## ماذا يحدث عندما يضغط العميل "اشترك الآن"؟

1. يفتح **صفحة الترقية** من لوحة التحكم: "ترقية الباقة والدفع" أو من الرابط `/app/upgrade`.
2. يختار باقة **أساسي** أو **برو** ويضغط **اشترك الآن**.
3. حسب الإعداد:
   - إذا وُجد **رابط دفع** (Stripe / Moyasar) يُفتح في تاب جديد للدفع.
   - إذا وُجد **رقم واتساب** يُفتح واتساب مع رسالة جاهزة للترقية.
   - إذا لم يُضبط أي منهما تظهر رسالة للمستخدم.

---

## الإعداد (متغيرات البيئة)

أضف في ملف `.env` في جذر المشروع:

```env
# روابط الدفع — ضع رابط صفحة الدفع لكل باقة (Stripe Payment Link أو Moyasar)
VITE_PAYMENT_BASIC_URL=https://buy.stripe.com/xxxxx
VITE_PAYMENT_PRO_URL=https://buy.stripe.com/yyyyy

# أو رقم واتساب للتواصل للترقية (بدون + أو 00)
VITE_WHATSAPP_UPGRADE=966512345678
```

- **VITE_PAYMENT_BASIC_URL**: رابط دفع باقة أساسي (يُفتح عند "اشترك الآن - أساسي").
- **VITE_PAYMENT_PRO_URL**: رابط دفع باقة برو.
- **VITE_WHATSAPP_UPGRADE**: رقم واتساب للترقية؛ إذا لم تضع روابط دفع، يُفتح واتساب بهذا الرقم مع رسالة "أريد الترقية إلى باقة أساسي/برو".

بعد التعديل أعد بناء المشروع: `npm run build`.

---

## تفعيل الباقة بعد الدفع

### الطريقة 1: يدوياً (من Supabase)

بعد استلام المبلغ (تحويل أو بطاقة):

1. افتح **Supabase** → **Table Editor** → **profiles**.
2. ابحث عن المستخدم (حسب البريد أو الاسم).
3. عدّل عمود **plan** إلى `basic` أو `pro` حسب الباقة المشتراة.

### الطريقة 2: تلقائياً (Webhook)

مع **Stripe** أو **Moyasar** يمكن تفعيل الباقة تلقائياً بعد الدفع:

1. أنشئ **Stripe Payment Link** (أو منتج/سعر) لباقة أساسي وباقة برو، وضعهما في `VITE_PAYMENT_BASIC_URL` و `VITE_PAYMENT_PRO_URL`.
2. في Stripe Dashboard: **Developers** → **Webhooks** → أضف endpoint يشير إلى دالة على السيرفر (مثلاً Supabase Edge Function).
3. الدالة عند حدث `checkout.session.completed` تقرأ `client_reference_id` أو metadata (مثلاً `user_id` أو `email`)، ثم تحدّث في Supabase:
   - جدول **profiles** → عمود **plan** = `basic` أو `pro` حسب المنتج المُشترى.

مثال منطق (داخل Edge Function أو Backend):

```js
// بعد التحقق من توقيع Stripe
const userId = session.client_reference_id  // أو من metadata
await supabaseAdmin.from('profiles').update({ plan: 'basic' }).eq('id', userId)
```

مع **Moyasar** الفكرة نفسها: webhook بعد الدفع الناجح ثم تحديث `profiles.plan`.

---

## ملخص للمستخدم النهائي

- يذهب إلى **لوحة التحكم** → يضغط **ترقية الباقة والدفع** أو يفتح `/app/upgrade`.
- يختار باقة ويرى السعر، ثم يضغط **اشترك الآن**.
- إما يدفع عبر الرابط (Stripe/Moyasar) وإما يتواصل عبر واتساب حسب إعدادك.
- بعد الدفع تُفعّل الباقة يدوياً من Supabase أو تلقائياً عبر الـ webhook.
