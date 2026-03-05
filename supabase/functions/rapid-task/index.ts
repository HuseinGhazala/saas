// استقبال أحداث ويب هوك سلة وحفظ/تحديث الاشتراكات في Supabase
// عند app.store.authorize: إنشاء حساب + إيميل فيه البريد والرقم السري ورابط الدخول (Resend)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const SALLA_USER_INFO_URL = "https://api.salla.dev/admin/v2/oauth2/user/info";
const LOGIN_URL = Deno.env.get("LOGIN_URL") || "https://luckywheelsass.pixelcodes.net/login";

function getMerchantId(body: Record<string, unknown>): number | null {
  const m = body.merchant;
  if (typeof m === "number" && !Number.isNaN(m)) return m;
  if (typeof m === "string") {
    const n = Number(m);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}

function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => chars[b % chars.length]).join("");
}

function isAsciiEmail(email: string): boolean {
  return /^[ -~]+@[ -~]+$/.test(email.trim());
}

async function sendWelcomeEmail(
  toEmail: string,
  name: string,
  password: string,
  resendApiKey: string
): Promise<{ ok: boolean; error?: string }> {
  const to = toEmail.trim();
  if (!isAsciiEmail(to)) {
    const msg = "عنوان البريد يحتوي على أحرف غير إنجليزية. Resend يقبل فقط عناوين مثل example@gmail.com";
    console.warn(msg);
    return { ok: false, error: msg };
  }
  // Resend: في وضع الاختبار يُرسل فقط لبريدك. لإرسال لأي متجر تحقق من دومين في resend.com/domains وضَع SALLA_WELCOME_EMAIL_FROM
  const from = Deno.env.get("SALLA_WELCOME_EMAIL_FROM") || "onboarding@resend.dev";
  const isTestingFrom = from.includes("resend.dev");
  const ownerEmail = Deno.env.get("RESEND_OWNER_EMAIL")?.trim().toLowerCase();
  if (isTestingFrom && ownerEmail && to.toLowerCase() !== ownerEmail) {
    console.warn("Resend: تم تخطي إرسال إيميل الترحيب (المستلم ليس RESEND_OWNER_EMAIL). للإرسال لجميع المتاجر تحقق من دومين وضَع SALLA_WELCOME_EMAIL_FROM.");
    return { ok: true };
  }
  if (isTestingFrom && !ownerEmail) {
    console.warn("Resend: تم تخطي إرسال إيميل الترحيب لتجنب 403. ضَع RESEND_OWNER_EMAIL=bريدك@example.com أو تحقق من دومين وضَع SALLA_WELCOME_EMAIL_FROM.");
    return { ok: true };
  }
  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
      <h2>مرحباً ${name} 👋</h2>
      <p>تم إنشاء حسابك في عجلة الحظ بنجاح. استخدم البيانات التالية للدخول إلى لوحة التحكم:</p>
      <table dir="rtl" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>البريد الإلكتروني:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${toEmail}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>كلمة المرور:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${password}</td></tr>
      </table>
      <p>احفظ هذه البيانات في مكان آمن. يمكنك تغيير كلمة المرور لاحقاً من لوحة التحكم.</p>
      <p><a href="${LOGIN_URL}" style="display: inline-block; background: #F59E0B; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px;">الدخول إلى لوحة التحكم</a></p>
      <p style="color: #666; font-size: 14px;">رابط الدخول: ${LOGIN_URL}</p>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
      <p style="color: #888; font-size: 12px;">عجلة الحظ — منصة سلة</p>
    </div>
  `;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        // نسخة BCC لصاحب التطبيق ليتأكد أن الإيميل يُرسل (يمكن تغييرها لاحقاً)
        bcc: ["husseinghazala39@gmail.com"],
        subject: "بيانات دخولك — عجلة الحظ",
        html,
      }),
    });
    const errBody = await res.text();
    if (!res.ok) {
      const msg = `Resend ${res.status}: ${errBody}`;
      console.error("Resend API error:", msg);
      if (res.status === 403) {
        console.warn(
          "Resend 403: لإرسال إيميلات لغير بريدك، تحقق من دومين في resend.com/domains وضَع SALLA_WELCOME_EMAIL_FROM إلى إيميل على هذا الدومين (مثل noreply@yourdomain.com)"
        );
      }
      return { ok: false, error: msg };
    }
    return { ok: true };
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    console.error("sendWelcomeEmail error:", e);
    return { ok: false, error: msg };
  }
}

/** استجابة سلة user/info: data.merchant أو data.store فيه معلومات المتجر */
interface SallaStoreInfo {
  email: string;
  name: string;
  store_name: string;
  store_url: string;
  current_plan: string;
  store_status: string;
}

async function fetchSallaUserInfo(accessToken: string): Promise<SallaStoreInfo | null> {
  try {
    const res = await fetch(SALLA_USER_INFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const json = await res.json().catch(() => ({}));
    const data = json?.data ?? json;

    if (!res.ok) {
      console.error("Salla user/info API error:", res.status, JSON.stringify(json).slice(0, 300));
      return null;
    }

    // دعم أكثر من شكل استجابة: data.merchant أو data.store أو بيانات مباشرة
    const merchant = data?.merchant ?? data?.store ?? data;
    const email = data?.email ?? merchant?.email ?? "";
    const userName = data?.name ?? merchant?.name ?? "";
    const storeName = String(merchant?.name ?? "").trim() || String(userName || "تاجر سلة").trim();
    const storeUrl = String(merchant?.domain ?? data?.domain ?? "").trim();
    const plan = String(merchant?.plan ?? data?.plan ?? "").trim();
    const status = String(merchant?.status ?? data?.status ?? "").trim();

    // حتى لو الإيميل فاضي نُرجع بيانات المتجر عشان نملّي salla_merchants (إنشاء الحساب يحتاج إيميل)
    return {
      email: String(email).trim(),
      name: String(userName || "تاجر سلة").trim(),
      store_name: storeName,
      store_url: storeUrl,
      current_plan: plan,
      store_status: status,
    };
  } catch (e) {
    console.error("fetchSallaUserInfo error:", e);
    return null;
  }
}

/** استخراج حقول تفاصيل الاشتراك من payload سلة (app.subscription.* أو app.installed) */
function buildSubscriptionDetails(
  data: Record<string, unknown>,
  status: "active" | "expired" | "canceled"
): Record<string, unknown> {
  const num = (v: unknown): number | null => {
    if (v === null || v === undefined) return null;
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    const n = Number(String(v).replace(/,/g, ""));
    return Number.isNaN(n) ? null : n;
  };
  const str = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));
  const dateStr = (v: unknown): string | null => (v === null || v === undefined ? null : String(v) || null);
  return {
    salla_subscription_id: num(data.subscription_id) ?? null,
    plan_id: str(data.id) ?? null,
    plan_type: str(data.plan_type) ?? null,
    plan_name: str(data.plan_name) ?? null,
    plan_period: str(data.plan_period) ?? null,
    start_date: dateStr(data.start_date) ?? null,
    end_date: dateStr(data.end_date) ?? null,
    price: num(data.price) ?? null,
    total: num(data.total) ?? null,
    price_before_discount: num(data.price_before_discount) ?? null,
    store_type: str(data.store_type) ?? null,
    status,
    raw_data: data,
  };
}

// عدد المحاولات حسب نوع الحدث/الباقة (تقدر تغيّر الأرقام لاحقاً)
function getAttemptsAllowed(event: string, data: Record<string, unknown>): number {
  if (
    event === "app.subscription.started" ||
    event === "app.subscription.renewed"
  ) {
    // من بيانات الباقة أو الـ features تقدر تحدّد العدد
    const features = data.features as Array<{ key: string; quantity: number }> | undefined;
    if (Array.isArray(features)) {
      const spins = features.find((f) => ["spins", "Spin", "دورات", "spin_count"].includes(String(f.key)) || String(f.key).toLowerCase() === "spin_count");
      if (spins?.quantity) return Math.max(1, Math.floor(Number(spins.quantity)));
    }
    return (parseInt(Deno.env.get("SALLA_DEFAULT_SPINS_SUBSCRIPTION") || "500", 10) || 500);
  }
  if (
    event === "app.store.authorize" ||
    event === "app.installed"
  ) {
    return (parseInt(Deno.env.get("SALLA_DEFAULT_SPINS_INSTALL") || "6", 10) || 6);
  }
  return 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: Record<string, unknown>;  
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // فحص وصول البريد: إرسال إيميل ترحيب تجريبي إلى بريدك (يتطلب TEST_EMAIL_SECRET + test_email في الـ body)
  const testEmail = typeof body.test_email !== "undefined" && body.test_email === true;
  const toEmail = typeof body.email === "string" ? body.email.trim() : "";
  const testSecret = Deno.env.get("TEST_EMAIL_SECRET");
  if (testEmail && toEmail && testSecret && body.secret === testSecret) {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(
        JSON.stringify({ ok: false, error: "RESEND_API_KEY not set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const name = typeof body.name === "string" ? body.name : "تاجر تجريبي";
    const password = generatePassword(12);
    const result = await sendWelcomeEmail(toEmail, name, password, resendKey);
    console.log("Test email:", result.ok ? "sent" : "failed", "to", toEmail, result.error ?? "");
    return new Response(
      JSON.stringify({
        ok: result.ok,
        test: true,
        message: result.ok ? `تم إرسال إيميل تجريبي إلى ${toEmail}. تحقق من صندوق الوارد والسبام.` : "فشل إرسال الإيميل (راجع لوجات الدالة).",
        ...(result.error && { resend_error: result.error }),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const event = (body.event as string) || "";
  const merchantId = getMerchantId(body);
  const data = (body.data as Record<string, unknown>) || {};

  if (!merchantId) {
    return new Response(
      JSON.stringify({ error: "Missing merchant" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event) {
      case "app.store.authorize":
      case "app.installed": {
        const attemptsAllowed = getAttemptsAllowed(event, data);
        const accessToken = event === "app.store.authorize" && data && typeof (data as { access_token?: string }).access_token === "string"
          ? (data as { access_token: string }).access_token
          : null;

        const storeInfo = accessToken ? await fetchSallaUserInfo(accessToken) : null;
        const merchantRow: Record<string, unknown> = {
          merchant_id: merchantId,
          access_token: accessToken ?? null,
          refresh_token: (data as { refresh_token?: string }).refresh_token ?? null,
          store_name: storeInfo?.store_name ?? null,
          store_url: storeInfo?.store_url || null,
          store_email: storeInfo?.email ?? null,
          current_plan: storeInfo?.current_plan || null,
          app_status: "enabled",
        };

        if (accessToken) {
          const { error: merchantErr } = await supabase
            .from("salla_merchants")
            .upsert(merchantRow, { onConflict: "merchant_id" });
          if (merchantErr) {
            console.error("salla_merchants upsert:", merchantErr);
            return new Response(JSON.stringify({ error: "salla_merchants: " + merchantErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
        } else {
          const { error: merchantErr2 } = await supabase
            .from("salla_merchants")
            .upsert({ merchant_id: merchantId, access_token: null, refresh_token: null, app_status: "enabled" }, { onConflict: "merchant_id" });
          if (merchantErr2) {
            console.error("salla_merchants upsert (no token):", merchantErr2);
            return new Response(JSON.stringify({ error: "salla_merchants (run salla_merchants-allow-null-tokens.sql): " + merchantErr2.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
        }
        const { data: profileRow } = await supabase.from("profiles").select("id").eq("merchant_id", merchantId).maybeSingle();
        const ownerId = profileRow?.id ?? null;
        const { error } = await supabase.from("salla_subscriptions").upsert(
          {
            merchant_id: merchantId,
            attempts_allowed: attemptsAllowed,
            attempts_used: 0,
            status: "active",
            store_type: typeof data.store_type === "string" ? data.store_type : null,
            raw_data: data,
            owner_id: ownerId,
          },
          { onConflict: "merchant_id" }
        );
        if (error) {
          console.error("salla_subscriptions upsert (authorize/installed):", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // إنشاء حساب + إيميل (البريد والرقم السري ورابط الدخول)
        if (accessToken && storeInfo?.email) {
          const tempPassword = generatePassword(12);
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: storeInfo.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { store_name: storeInfo.store_name || storeInfo.name, salla_merchant_id: merchantId },
          });
            if (!authError && authData?.user) {
              const { error: profileError } = await supabase
                .from("profiles")
                .update({
                  merchant_id: merchantId,
                  store_name: storeInfo.store_name || storeInfo.name || undefined,
                })
                .eq("id", authData.user.id);
              if (profileError) {
                console.error("profiles update merchant_id:", profileError);
              }
              await supabase.from("salla_subscriptions").update({ owner_id: authData.user.id }).eq("merchant_id", merchantId);
              const resendKey = Deno.env.get("RESEND_API_KEY");
            if (resendKey) {
              const sendResult = await sendWelcomeEmail(storeInfo.email, storeInfo.name, tempPassword, resendKey);
              if (!sendResult.ok) console.warn("Failed to send welcome email to", storeInfo.email, sendResult.error ?? "");
            } else {
              console.warn("RESEND_API_KEY not set — لم يتم إرسال إيميل الترحيب");
            }
          } else if (authError?.message?.toLowerCase().includes("already")) {
            const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
            const userByEmail = list?.users?.find((u) => u.email === storeInfo.email);
            if (userByEmail) {
              await supabase.from("profiles").update({ merchant_id: merchantId }).eq("id", userByEmail.id);
              await supabase.from("salla_subscriptions").update({ owner_id: userByEmail.id }).eq("merchant_id", merchantId);
            }
          } else if (authError) {
            console.error("createUser error:", authError);
          }
        }
        break;
      }
      case "app.trial.started": {
        const trialAttempts = 1;
        const details = buildSubscriptionDetails(data, "active");
        const { data: profileRow } = await supabase.from("profiles").select("id").eq("merchant_id", merchantId).maybeSingle();
        await supabase.from("salla_subscriptions").upsert(
          {
            merchant_id: merchantId,
            attempts_allowed: trialAttempts,
            attempts_used: 0,
            ...details,
            owner_id: profileRow?.id ?? null,
          },
          { onConflict: "merchant_id" }
        );
        break;
      }
      case "app.trial.expired":
      case "app.trial.canceled": {
        await supabase.from("salla_subscriptions").update({
          attempts_allowed: 0,
          status: event === "app.trial.expired" ? "expired" : "canceled",
          raw_data: data,
        }).eq("merchant_id", merchantId);
        break;
      }
      case "app.subscription.started":
      case "app.subscription.renewed": {
        const attemptsAllowed = getAttemptsAllowed(event, data);
        const details = buildSubscriptionDetails(data, "active");
        const { data: profileRow } = await supabase.from("profiles").select("id").eq("merchant_id", merchantId).maybeSingle();
        const ownerId = profileRow?.id ?? null;
        const { error } = await supabase.from("salla_subscriptions").upsert(
          {
            merchant_id: merchantId,
            attempts_allowed: attemptsAllowed,
            ...details,
            owner_id: ownerId,
          },
          { onConflict: "merchant_id" }
        );
        if (error) {
          console.error("salla_subscriptions upsert (subscription):", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // تحديث الباقة الحالية في salla_merchants إن وُجدت في الـ payload
        const planName = (details.plan_name as string) || (data as { plan?: string }).plan;
        if (planName && typeof planName === "string") {
          await supabase.from("salla_merchants").update({ current_plan: String(planName).trim() }).eq("merchant_id", merchantId);
        }
        break;
      }
      case "app.subscription.expired":
      case "app.subscription.canceled":
      case "app.uninstalled": {
        const newStatus = event === "app.subscription.expired" ? "expired" : event === "app.subscription.canceled" ? "canceled" : null;
        const updatePayload: Record<string, unknown> = { attempts_allowed: 0 };
        if (newStatus) {
          updatePayload.status = newStatus;
          updatePayload.raw_data = data;
        }
        const { error } = await supabase
          .from("salla_subscriptions")
          .update(updatePayload)
          .eq("merchant_id", merchantId);
        if (error) {
          console.error("salla_subscriptions update (expired/canceled):", error);
        }
        if (event === "app.uninstalled") {
          await supabase.from("salla_merchants").update({ app_status: "disabled" }).eq("merchant_id", merchantId);
        }
        break;
      }
      default:
        // أي حدث ثاني نستقبله ونجيب 200 عشان سلة ما تعيد المحاولة
        break;
    }

    // إذا بيانات المتجر فاضية والموجود توكن: نحدّث من API سلة (استدراك)
    const { data: merchantRow } = await supabase.from("salla_merchants").select("access_token, store_name, current_plan").eq("merchant_id", merchantId).maybeSingle();
    if (merchantRow?.access_token && (merchantRow.store_name == null || merchantRow.current_plan == null)) {
      const info = await fetchSallaUserInfo(merchantRow.access_token as string);
      if (info) {
        const upd: Record<string, unknown> = {};
        if (info.store_name?.trim()) upd.store_name = info.store_name.trim();
        if (info.store_url?.trim()) upd.store_url = info.store_url.trim();
        if (info.email?.trim()) upd.store_email = info.email.trim();
        if (info.current_plan?.trim()) upd.current_plan = info.current_plan.trim();
        if (Object.keys(upd).length > 0) {
          await supabase.from("salla_merchants").update(upd).eq("merchant_id", merchantId);
          console.log("تم استدراك بيانات المتجر من API سلة:", merchantId);
        }
      }
    }
  } catch (err) {
    console.error("rapid-task error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ ok: true, event }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
