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

async function verifyWebhookSignature(
  body: string,
  headers: Headers,
  webhookId: string,
  clientId: string,
  clientSecret: string,
  baseUrl: string
): Promise<boolean> {
  try {
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
      logStep("Webhook signature verification failed: Could not get access token.");
      return false;
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    const verificationData = {
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
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
  const purchaseUnit = event.resource?.purchase_units?.[0];
  if (!purchaseUnit) {
    logStep("No purchase_units found in payment resource");
    return;
  }
  
  const customId = purchaseUnit.custom_id;
  logStep("Processing payment capture completed", { paymentId: event.resource.id, customId });

  if (!customId) {
    logStep("No custom_id found in payment");
    return;
  }

  const parts = customId.split('_');
  const type = parts[0];

  try {
    if (type === "audio" && parts[1] === "credits") {
      const userId = parts[2];
      const creditAmount = parseInt(parts[3], 10);
      if (isNaN(creditAmount)) throw new Error(`Invalid credit amount in custom_id: ${parts[3]}`);
      
      const { error } = await supabaseClient.rpc('add_audio_credits', {
        user_uuid: userId,
        credit_amount: creditAmount,
        session_id: event.resource.id
      });
      if (error) throw error;
      logStep("Audio credits added successfully", { userId, amount: creditAmount });
    
    } else if (type === "voice" && parts[1] === "credits") {
      const userId = parts[2];
      const creditAmount = parseInt(parts[3], 10);
      if (isNaN(creditAmount)) throw new Error(`Invalid credit amount in custom_id: ${parts[3]}`);

      const { error } = await supabaseClient.rpc('add_voice_credits', {
        user_uuid: userId,
        credit_amount: creditAmount,
        session_id: event.resource.id
      });
      if (error) throw error;
      logStep("Voice credits added successfully", { userId, amount: creditAmount });
    
    } else if (type === "gift") {
      const giftId = parts[1];
      const userId = parts[2];
      
      const { error } = await supabaseClient.from("user_purchased_gifts").insert({
        user_id: userId,
        gift_id: giftId,
        price: Math.round(parseFloat(purchaseUnit.amount.value) * 100),
        purchase_date: new Date().toISOString()
      });
      if (error) throw error;
      logStep("Gift purchase recorded successfully", { userId, giftId });
    } else {
      logStep("Unknown custom_id format", { customId });
    }
  } catch (error) {
    logStep("Error processing payment capture logic", { error: error.message, customId });
  }
}

async function handleSubscriptionActivated(supabaseClient: any, event: any) {
  logStep("Processing subscription activated", { subscriptionId: event.resource.id });
  
  const subscriberEmail = event.resource.subscriber?.email_address;
  if (!subscriberEmail) {
    logStep("No subscriber email found");
    return;
  }

  await supabaseClient
    .from("profiles")
    .update({ 
      plan_active: true,
      updated_at: new Date().toISOString()
    })
    .eq("email", subscriberEmail);

  logStep("User subscription activated in profiles table", { email: subscriberEmail });
}

async function handleSubscriptionCancelledOrSuspended(supabaseClient: any, event: any, eventType: string) {
  logStep(`Processing ${eventType}`, { subscriptionId: event.resource.id });
  
  const subscriberEmail = event.resource.subscriber?.email_address;
  if (!subscriberEmail) {
    logStep("No subscriber email found");
    return;
  }

  await supabaseClient
    .from("profiles")
    .update({ 
      plan_active: false,
      updated_at: new Date().toISOString()
    })
    .eq("email", subscriberEmail);

  logStep(`User subscription marked as inactive for ${eventType}`, { email: subscriberEmail });
}

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

    if (!paypalClientId || !paypalClientSecret || !paypalWebhookId) {
      throw new Error("PayPal credentials or Webhook ID not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.text();
    const event = JSON.parse(body);
    
    logStep("Webhook event received", { eventType: event.event_type, id: event.id });

    const signatureVerified = await verifyWebhookSignature(
      body, req.headers, paypalWebhookId, paypalClientId, paypalClientSecret, paypalBaseUrl
    );
      
    if (!signatureVerified) {
      logStep("Webhook signature verification failed");
      return new Response("Webhook signature verification failed", { status: 400 });
    }
    logStep("Webhook signature verified");

    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCaptureCompleted(supabaseClient, event);
        break;
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(supabaseClient, event);
        break;
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelledOrSuspended(supabaseClient, event, 'CANCELLED');
        break;
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionCancelledOrSuspended(supabaseClient, event, 'SUSPENDED');
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