# إعداد بريد Hostinger في Supabase (Custom SMTP)

استخدم القيم التالية في **Supabase** → **Project Settings** → **Auth** → **SMTP Settings** → **Enable custom SMTP**.

---

## القيم اللي تدخلها في Supabase

| الحقل في Supabase | القيمة |
|-------------------|--------|
| **Sender email address** | `whheak@miral-trading.com` |
| **Sender name** | `عجلة الحظ` أو `Miral Trading` (أي اسم يظهر للمستخدم) |
| **Host** | `smtp.hostinger.com` |
| **Port number** | `465` |
| **Username** | `whheak@miral-trading.com` |
| **Password** | كلمة مرور بريد `whheak@miral-trading.com` (نفس اللي بتستخدمها في تطبيق البريد أو في Hostinger) |
| **Minimum interval per user** | اتركها مثل 60 (ثانية) |

---

## ملاحظات

1. **كلمة المرور**: لازم تكون كلمة مرور حساب البريد `whheak@miral-trading.com` اللي معرّفة في Hostinger. لو نسيتها: من لوحة Hostinger → **Email Accounts** → اختر الحساب → **Reset password** أو **Manage**.
2. **Port 465** مع Hostinger يستخدم SSL/TLS، Supabase عادة يتعامل معها تلقائياً لما تختار المنفذ الصحيح.
3. بعد **Save changes** جرّب إنشاء حساب جديد من التطبيق؛ لو الإعدادات صح، الإيميل هيتبعت من `whheak@miral-trading.com` ومش هيظهر خطأ rate limit من Supabase بنفس الشكل السابق.
