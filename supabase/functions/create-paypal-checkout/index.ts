import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYPAL-SUBSCRIPTION] ${step}${detailsStr}`);
};

async function getPayPalAccessToken(paypalBaseUrl: string, paypalClientId: string, paypalClientSecret: string) {
  const auth = btoa(`${paypalClientId}:${paypalClientSecret}`);
  const response = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) {
    const errorText = await response.text();
    logStep("Failed to get PayPal access token", { error: errorText });
    throw new Error("Failed to get PayPal access token");
  }
  const data = await response.json();
  return data.access_token;
}

async function authenticateUser(req: Request, client: any) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error } = await client.auth.getUser(token);
    if (error || !user) throw new Error("User not authenticated or token is invalid");
    return user;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started for SUBSCRIPTION checkout");

    const paypalClientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const paypalClientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
    const paypalBaseUrl = Deno.env.get("PAYPAL_BASE_URL") || "https://api-m.sandbox.paypal.com";

    if (!paypalClientId || !paypalClientSecret) {
      throw new Error("PayPal credentials not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { planId } = await req.json();
    if (!planId) throw new Error("planId is required");

    const user = await authenticateUser(req, supabaseClient);
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { data: plan, error: planError } = await supabaseClient
      .from("plans")
      .select("paypal_plan_id")
      .eq("id", planId)
      .single();

    if (planError || !plan?.paypal_plan_id) {
      throw new Error(`Plan or PayPal Plan ID not found for planId: ${planId}`);
    }

    logStep("Plan data retrieved", { paypalPlanId: plan.paypal_plan_id });

    const accessToken = await getPayPalAccessToken(paypalBaseUrl, paypalClientId, paypalClientSecret);
    logStep("PayPal access token obtained");

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const successUrl = `${origin}/profile?checkout=success`;
    const cancelUrl = `${origin}/profile?checkout=canceled`;

    const subscriptionData = {
      plan_id: plan.paypal_plan_id,
      subscriber: {
        email_address: user.email,
      },
      application_context: {
        brand_name: "Isa Date",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        return_url: successUrl,
        cancel_url: cancelUrl,
      },
    };

    const subscriptionResponse = await fetch(`${paypalBaseUrl}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify(subscriptionData),
    });

    if (!subscriptionResponse.ok) {
      const errorText = await subscriptionResponse.text();
      logStep("PayPal subscription creation failed", { status: subscriptionResponse.status, error: errorText });
      throw new Error(`PayPal subscription creation failed: ${errorText}`);
    }

    const subscriptionResult = await subscriptionResponse.json();
    logStep("PayPal subscription created", { subscriptionId: subscriptionResult.id });

    const approvalUrl = subscriptionResult.links?.find((link: any) => link.rel === "approve")?.href;
    if (!approvalUrl) {
      logStep("CRITICAL: No approval URL found in response", { response: subscriptionResult });
      throw new Error("No approval URL found in PayPal subscription response");
    }

    logStep("PayPal subscription checkout created successfully", { url: approvalUrl });

    return new Response(JSON.stringify({ url: approvalUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("FATAL ERROR", { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});