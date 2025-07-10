import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PAYPAL-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook function started");

    const paypalClientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const paypalClientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
    const paypalWebhookId = Deno.env.get("PAYPAL_WEBHOOK_ID");
    const paypalBaseUrl = Deno.env.get("PAYPAL_BASE_URL") || "https://api-m.sandbox.paypal.com";

    if (!paypalClientId || !paypalClientSecret) {
      throw new Error("PayPal credentials not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.text();
    const event = JSON.parse(body);
    
    logStep("Webhook event received", { eventType: event.event_type, id: event.id });

    // Verify webhook signature (optional but recommended)
    if (paypalWebhookId) {
      const headers = req.headers;
      const verification = await verifyWebhookSignature(
        body,
        headers,
        paypalWebhookId,
        paypalClientId,
        paypalClientSecret,
        paypalBaseUrl
      );
      
      if (!verification) {
        throw new Error("Webhook signature verification failed");
      }
      logStep("Webhook signature verified");
    }

    // Handle different PayPal webhook events
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCaptureCompleted(supabaseClient, event);
        break;
        
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(supabaseClient, event);
        break;
        
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(supabaseClient, event);
        break;
        
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionSuspended(supabaseClient, event);
        break;
        
      default:
        logStep("Unhandled event type", { eventType: event.event_type });
        break;
    }

    logStep("Webhook processed successfully");

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in paypal-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function verifyWebhookSignature(
  body: string,
  headers: Headers,
  webhookId: string,
  clientId: string,
  clientSecret: string,
  baseUrl: string
): Promise<boolean> {
  try {
    // Get PayPal access token
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Language": "en_US",
        "Authorization": `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!authResponse.ok) {
      return false;
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Verify webhook signature
    const verificationData = {
      auth_algo: headers.get("paypal-auth-algo"),
      cert_id: headers.get("paypal-cert-id"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: JSON.parse(body),
    };

    const verifyResponse = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(verificationData),
    });

    const verifyResult = await verifyResponse.json();
    return verifyResult.verification_status === "SUCCESS";
  } catch (error) {
    logStep("Webhook signature verification error", { error: error.message });
    return false;
  }
}

async function handlePaymentCaptureCompleted(supabaseClient: any, event: any) {
  logStep("Processing payment capture completed", { paymentId: event.resource.id });
  
  const customId = event.resource.purchase_units?.[0]?.custom_id;
  if (!customId) {
    logStep("No custom_id found in payment");
    return;
  }

  // Parse custom_id to determine the type of purchase
  if (customId.startsWith("audio_credits_")) {
    const userId = customId.split("_")[2];
    await supabaseClient.rpc('add_audio_credits', {
      user_uuid: userId,
      credit_amount: 20, // Default amount, could be parsed from custom_id
      session_id: event.resource.id
    });
    logStep("Audio credits added", { userId, amount: 20 });
  } else if (customId.startsWith("voice_credits_")) {
    const userId = customId.split("_")[2];
    await supabaseClient.rpc('add_voice_credits', {
      user_uuid: userId,
      credit_amount: 4, // Default amount, could be parsed from custom_id
      session_id: event.resource.id
    });
    logStep("Voice credits added", { userId, amount: 4 });
  } else if (customId.startsWith("gift_")) {
    const parts = customId.split("_");
    const giftId = parts[1];
    const userId = parts[2];
    
    // Record gift purchase
    await supabaseClient.from("user_purchased_gifts").insert({
      user_id: userId,
      gift_id: giftId,
      price: parseFloat(event.resource.amount.value) * 100, // Convert to cents
      purchase_date: new Date().toISOString()
    });
    logStep("Gift purchase recorded", { userId, giftId });
  }
}

async function handleSubscriptionActivated(supabaseClient: any, event: any) {
  logStep("Processing subscription activated", { subscriptionId: event.resource.id });
  
  const subscriberEmail = event.resource.subscriber?.email_address;
  if (!subscriberEmail) {
    logStep("No subscriber email found");
    return;
  }

  // Update user profile to activate plan
  await supabaseClient
    .from("profiles")
    .update({ 
      plan_active: true,
      updated_at: new Date().toISOString()
    })
    .eq("id", (await supabaseClient.auth.admin.getUserByEmail(subscriberEmail)).data?.user?.id);

  logStep("User subscription activated", { email: subscriberEmail });
}

async function handleSubscriptionCancelled(supabaseClient: any, event: any) {
  logStep("Processing subscription cancelled", { subscriptionId: event.resource.id });
  
  const subscriberEmail = event.resource.subscriber?.email_address;
  if (!subscriberEmail) {
    logStep("No subscriber email found");
    return;
  }

  // Update user profile to deactivate plan
  await supabaseClient
    .from("profiles")
    .update({ 
      plan_active: false,
      updated_at: new Date().toISOString()
    })
    .eq("id", (await supabaseClient.auth.admin.getUserByEmail(subscriberEmail)).data?.user?.id);

  logStep("User subscription cancelled", { email: subscriberEmail });
}

async function handleSubscriptionSuspended(supabaseClient: any, event: any) {
  logStep("Processing subscription suspended", { subscriptionId: event.resource.id });
  
  const subscriberEmail = event.resource.subscriber?.email_address;
  if (!subscriberEmail) {
    logStep("No subscriber email found");
    return;
  }

  // Update user profile to deactivate plan
  await supabaseClient
    .from("profiles")
    .update({ 
      plan_active: false,
      updated_at: new Date().toISOString()
    })
    .eq("id", (await supabaseClient.auth.admin.getUserByEmail(subscriberEmail)).data?.user?.id);

  logStep("User subscription suspended", { email: subscriberEmail });
}