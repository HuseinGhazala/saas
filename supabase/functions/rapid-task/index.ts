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

async function sendWelcomeEmail(
  toEmail: string,
  name: string,
  password: string,
  resendApiKey: string
): Promise<boolean> {
  const from = Deno.env.get("SALLA_WELCOME_EMAIL_FROM") || "onboarding@resend.dev";
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
        to: [toEmail],
        subject: "بيانات دخولك — عجلة الحظ",
        html,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error("Resend API error:", res.status, errBody);
      return false;
    }
    return true;
  } catch (e) {
    console.error("sendWelcomeEmail error:", e);
    return false;
  }
}

async function fetchSallaUserInfo(accessToken: string): Promise<{ email: string; name: string } | null> {
  try {
    const res = await fetch(SALLA_USER_INFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data;
    if (!data?.email) return null;
    return {
      email: String(data.email).trim(),
      name: String(data.name || data.merchant?.name || "تاجر سلة").trim(),
    };
  } catch (e) {
    console.error("fetchSallaUserInfo error:", e);
    return null;
  }
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
        if (accessToken) {
          const { error: merchantErr } = await supabase
            .from("salla_merchants")
            .upsert({ merchant_id: merchantId, access_token: accessToken, refresh_token: (data as { refresh_token?: string }).refresh_token ?? "" }, { onConflict: "merchant_id" });
          if (merchantErr) {
            console.error("salla_merchants upsert:", merchantErr);
            return new Response(JSON.stringify({ error: "salla_merchants: " + merchantErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
        } else {
          const { error: merchantErr2 } = await supabase
            .from("salla_merchants")
            .upsert({ merchant_id: merchantId, access_token: null, refresh_token: null }, { onConflict: "merchant_id" });
          if (merchantErr2) {
            console.error("salla_merchants upsert (no token):", merchantErr2);
            return new Response(JSON.stringify({ error: "salla_merchants (run salla_merchants-allow-null-tokens.sql): " + merchantErr2.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
        }
        const { error } = await supabase.from("salla_subscriptions").upsert(
          {
            merchant_id: merchantId,
            attempts_allowed: attemptsAllowed,
            attempts_used: 0,
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
        if (accessToken) {
          const userInfo = await fetchSallaUserInfo(accessToken);
          if (userInfo?.email) {
            const tempPassword = generatePassword(12);
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
              email: userInfo.email,
              password: tempPassword,
              email_confirm: true,
              user_metadata: { store_name: userInfo.name, salla_merchant_id: merchantId },
            });
            if (!authError && authData?.user) {
              const { error: profileError } = await supabase
                .from("profiles")
                .update({
                  merchant_id: merchantId,
                  store_name: userInfo.name || undefined,
                })
                .eq("id", authData.user.id);
              if (profileError) {
                console.error("profiles update merchant_id:", profileError);
              }
              const resendKey = Deno.env.get("RESEND_API_KEY");
              if (resendKey) {
                const sent = await sendWelcomeEmail(userInfo.email, userInfo.name, tempPassword, resendKey);
                if (!sent) console.warn("Failed to send welcome email to", userInfo.email);
              } else {
                console.warn("RESEND_API_KEY not set — لم يتم إرسال إيميل الترحيب");
              }
            } else if (authError?.message?.toLowerCase().includes("already")) {
              const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
              const userByEmail = list?.users?.find((u) => u.email === userInfo.email);
              if (userByEmail) {
                await supabase.from("profiles").update({ merchant_id: merchantId }).eq("id", userByEmail.id);
              }
            } else if (authError) {
              console.error("createUser error:", authError);
            }
          }
        }
        break;
      }
      case "app.trial.started": {
        const trialAttempts = 1; // التجربة = محاولة واحدة فقط
        await supabase.from("salla_subscriptions").upsert(
          { merchant_id: merchantId, attempts_allowed: trialAttempts, attempts_used: 0 },
          { onConflict: "merchant_id" }
        );
        break;
      }
      case "app.trial.expired":
      case "app.trial.canceled": {
        await supabase.from("salla_subscriptions").update({ attempts_allowed: 0 }).eq("merchant_id", merchantId);
        break;
      }
      case "app.subscription.started":
      case "app.subscription.renewed": {
        const attemptsAllowed = getAttemptsAllowed(event, data);
        const { error } = await supabase.from("salla_subscriptions").upsert(
          {
            merchant_id: merchantId,
            attempts_allowed: attemptsAllowed,
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
        break;
      }
      case "app.subscription.expired":
      case "app.subscription.canceled":
      case "app.uninstalled": {
        const { error } = await supabase
          .from("salla_subscriptions")
          .update({ attempts_allowed: 0 })
          .eq("merchant_id", merchantId);
        if (error) {
          console.error("salla_subscriptions update (expired/canceled):", error);
        }
        break;
      }
      default:
        // أي حدث ثاني نستقبله ونجيب 200 عشان سلة ما تعيد المحاولة
        break;
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
