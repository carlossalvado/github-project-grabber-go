import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYPAL-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const paypalClientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const paypalClientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
    const paypalBaseUrl = Deno.env.get("PAYPAL_BASE_URL") || "https://api-m.sandbox.paypal.com";

    if (!paypalClientId || !paypalClientSecret) {
      throw new Error("PayPal credentials not configured");
    }

    logStep("PayPal credentials verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { planId } = await req.json();
    logStep("Request body parsed", { planId });

    // Fetch plan details from Supabase
    const { data: plan, error: planError } = await supabaseClient
      .from("plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (planError) throw new Error(`Plan not found: ${planError.message}`);
    logStep("Plan found", { planName: plan.name, price: plan.price });

    // Update user's profile with selected plan
    await supabaseClient
      .from("profiles")
      .update({ 
        plan_name: plan.name, 
        plan_active: false,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    logStep("User profile updated with selected plan");

    // Get PayPal access token
    const authResponse = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Language": "en_US",
        "Authorization": `Basic ${btoa(`${paypalClientId}:${paypalClientSecret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!authResponse.ok) {
      throw new Error(`PayPal auth failed: ${authResponse.status}`);
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    logStep("PayPal access token obtained");

    // Determine success and cancel URLs
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const successUrl = `${origin}/?checkout=success`;
    const cancelUrl = `${origin}/?checkout=canceled`;

    // Create PayPal subscription
    const subscriptionData = {
      plan_id: plan.paypal_plan_id || "P-DEFAULT-PLAN", // Use PayPal plan ID
      subscriber: {
        email_address: user.email,
      },
      application_context: {
        brand_name: "Your App Name",
        locale: "pt-BR",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        payment_method: {
          payer_selected: "PAYPAL",
          payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
        },
        return_url: successUrl,
        cancel_url: cancelUrl,
      },
    };

    const subscriptionResponse = await fetch(`${paypalBaseUrl}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
        "PayPal-Request-Id": crypto.randomUUID(),
        "Prefer": "return=representation",
      },
      body: JSON.stringify(subscriptionData),
    });

    if (!subscriptionResponse.ok) {
      const errorText = await subscriptionResponse.text();
      throw new Error(`PayPal subscription creation failed: ${subscriptionResponse.status} - ${errorText}`);
    }

    const subscription = await subscriptionResponse.json();
    logStep("PayPal subscription created", { subscriptionId: subscription.id });

    // Find approval URL
    const approvalUrl = subscription.links?.find((link: any) => link.rel === "approve")?.href;
    
    if (!approvalUrl) {
      throw new Error("No approval URL found in PayPal response");
    }

    logStep("PayPal checkout session created successfully", { url: approvalUrl });

    return new Response(JSON.stringify({ 
      url: approvalUrl,
      subscription_id: subscription.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-paypal-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});