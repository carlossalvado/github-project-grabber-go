import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYPAL-GIFT-CHECKOUT] ${step}${detailsStr}`);
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

    const { giftId } = await req.json();
    if (!giftId) throw new Error("Gift ID is required");
    logStep("Request body parsed", { giftId });

    // Fetch gift details from Supabase
    const { data: gift, error: giftError } = await supabaseClient
      .from("gifts")
      .select("*")
      .eq("id", giftId)
      .single();

    if (giftError) throw new Error(`Gift not found: ${giftError.message}`);
    logStep("Gift found", { name: gift.name, price: gift.price });

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
      const errorText = await authResponse.text();
      throw new Error(`PayPal auth failed: ${authResponse.status} - ${errorText}`);
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    logStep("PayPal access token obtained");

    // Determine success and cancel URLs
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const referer = req.headers.get("referer") || "";
    const currentPath = referer.includes("/chat-text-audio") ? "/chat-text-audio" : "/chat-trial";
    const successUrl = `${origin}${currentPath}?gift_success=true&gift_id=${giftId}&gift_name=${encodeURIComponent(gift.name)}`;
    const cancelUrl = `${origin}${currentPath}?gift_canceled=true`;

    // Create PayPal order for one-time payment
    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: (gift.price / 100).toFixed(2),
          },
          description: `Presente: ${gift.name}`,
          custom_id: `gift_${gift.id}_${user.id}`,
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
            brand_name: "Isa Date",
            locale: "pt-BR",
            landing_page: "LOGIN",
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
            return_url: successUrl,
            cancel_url: cancelUrl,
          },
        },
      },
    };

    const orderResponse = await fetch(`${paypalBaseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
        "PayPal-Request-Id": crypto.randomUUID(),
        "Prefer": "return=representation",
      },
      body: JSON.stringify(orderData),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      throw new Error(`PayPal order creation failed: ${orderResponse.status} - ${errorText}`);
    }

    const order = await orderResponse.json();
    logStep("PayPal order created", { orderId: order.id });

    const approvalUrl = order.links?.find((link: any) => link.rel === "approve")?.href;
    
    if (!approvalUrl) {
      throw new Error("No approval URL found in PayPal response");
    }

    logStep("PayPal gift checkout created successfully", { url: approvalUrl });

    return new Response(JSON.stringify({ 
      url: approvalUrl,
      order_id: order.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-paypal-gift-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});