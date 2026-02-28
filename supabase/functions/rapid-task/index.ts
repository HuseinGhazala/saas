// استقبال أحداث ويب هوك سلة وحفظ/تحديث الاشتراكات في Supabase
// عند app.store.authorize: دعوة المستخدم عبر Supabase (إيميل من سوبابيز) + ربط merchant_id
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
      const spins = features.find((f) => f.key === "spins" || f.key === "Spin");
      if (spins?.quantity) return Math.max(100, Number(spins.quantity));
    }
    return 500; // افتراضي عند بدء/تجديد اشتراك
  }
  if (
    event === "app.store.authorize" ||
    event === "app.installed"
  ) {
    return 100; // تثبيت جديد: عدد تجريبي
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

        // دعوة المستخدم عبر Supabase — الإيميل يخرج من سوبابيز (إعدادات SMTP في المشروع)
        const accessToken = event === "app.store.authorize" && data && typeof (data as { access_token?: string }).access_token === "string"
          ? (data as { access_token: string }).access_token
          : null;
        if (accessToken) {
          const userInfo = await fetchSallaUserInfo(accessToken);
          if (userInfo?.email) {
            const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(userInfo.email, {
              data: { store_name: userInfo.name, salla_merchant_id: merchantId },
              redirectTo: LOGIN_URL,
            });
            if (!inviteError && inviteData?.user) {
              const { error: profileError } = await supabase
                .from("profiles")
                .update({
                  merchant_id: merchantId,
                  store_name: userInfo.name || undefined,
                })
                .eq("id", inviteData.user.id);
              if (profileError) {
                console.error("profiles update merchant_id:", profileError);
              }
            } else if (inviteError?.message?.toLowerCase().includes("already")) {
              // المستخدم مسجل مسبقاً — نربط merchant_id بملفه
              const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
              const userByEmail = list?.users?.find((u) => u.email === userInfo.email);
              if (userByEmail) {
                await supabase.from("profiles").update({ merchant_id: merchantId }).eq("id", userByEmail.id);
              }
            } else if (inviteError) {
              console.error("inviteUserByEmail error:", inviteError);
            }
          }
        }
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
