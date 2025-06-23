
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("*** WEBHOOK RECEIVED ***");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    
    logStep("Stripe keys verified");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    const body = await req.text();
    
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature!,
        webhookSecret,
        undefined,
        Stripe.createSubtleCryptoProvider()
      );
      logStep("Assinatura do webhook verificada", { eventId: event.id, eventType: event.type });
    } catch (err) {
      logStep("Erro na verificação da assinatura", { error: err.message });
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabaseClient, stripe, event);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(supabaseClient, stripe, event);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabaseClient, stripe, event);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabaseClient, stripe, event);
        break;
      default:
        logStep("Unhandled event type", { eventType: event.type });
    }

    logStep("*** WEBHOOK PROCESSED SUCCESSFULLY ***");
    
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("*** WEBHOOK ERROR ***", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleCheckoutCompleted(supabaseClient: any, stripe: Stripe, event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  logStep("Processing checkout completed", { sessionId: session.id });

  // Check if this is an audio credit purchase
  if (session.metadata?.credits && session.metadata?.user_id && session.metadata?.credit_type === 'audio') {
    const credits = parseInt(session.metadata.credits);
    const userId = session.metadata.user_id;
    
    logStep("Processing audio credits purchase", { userId, credits, sessionId: session.id });
    
    const { error } = await supabaseClient.rpc('add_audio_credits', {
      user_uuid: userId,
      credit_amount: credits,
      session_id: session.id
    });

    if (error) {
      logStep("Error adding audio credits", { error });
    } else {
      logStep("Audio credits added successfully", { userId, credits });
    }
    return;
  }

  // Check if this is a voice credit purchase
  if (session.metadata?.credits && session.metadata?.user_id && session.metadata?.credit_type === 'voice') {
    const credits = parseInt(session.metadata.credits);
    const userId = session.metadata.user_id;
    
    logStep("Processing voice credits purchase", { userId, credits, sessionId: session.id });
    
    const { error } = await supabaseClient.rpc('add_voice_credits', {
      user_uuid: userId,
      credit_amount: credits,
      session_id: session.id
    });

    if (error) {
      logStep("Error adding voice credits", { error });
    } else {
      logStep("Voice credits added successfully", { userId, credits });
    }
    return;
  }

  // Handle subscription payments
  if (session.mode === 'subscription' && session.customer && session.subscription) {
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
    
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return;
    
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    await processSubscriptionUpdate(supabaseClient, stripe, customer, subscription);
  }
}

async function handlePaymentSucceeded(supabaseClient: any, stripe: Stripe, event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  logStep("Processing payment succeeded", { invoiceId: invoice.id });

  if (invoice.subscription && invoice.customer) {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer.id;
    const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
    
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return;
    
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    await processSubscriptionUpdate(supabaseClient, stripe, customer, subscription);
  }
}

async function handleSubscriptionUpdated(supabaseClient: any, stripe: Stripe, event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  logStep("Processing subscription updated", { subscriptionId: subscription.id });

  if (subscription.customer) {
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return;
    
    await processSubscriptionUpdate(supabaseClient, stripe, customer, subscription);
  }
}

async function handleSubscriptionDeleted(supabaseClient: any, stripe: Stripe, event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  logStep("Processing subscription deleted", { subscriptionId: subscription.id });

  if (subscription.customer) {
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return;
    
    if (customer.email) {
      await updateUserSubscriptionStatus(supabaseClient, customer.email, false, null, null);
    }
  }
}

async function processSubscriptionUpdate(supabaseClient: any, stripe: Stripe, customer: Stripe.Customer, subscription: Stripe.Subscription) {
  if (!customer.email) {
    logStep("No email found for customer", { customerId: customer.id });
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) {
    logStep("No price ID found for subscription", { subscriptionId: subscription.id });
    return;
  }
  
  const { data: planData } = await supabaseClient
    .from('plans')
    .select('*')
    .eq('stripe_price_id', priceId)
    .maybeSingle();
  
  const planName = planData?.name || subscription.metadata.plan_name || "Plano Pago";
  const isActive = subscription.status === 'active';
  
  logStep("Updating user subscription", { 
    email: customer.email, 
    planName, 
    isActive,
    subscriptionStatus: subscription.status 
  });

  await updateUserSubscriptionStatus(
    supabaseClient, 
    customer.email, 
    isActive, 
    planName,
    subscription.id
  );
}

async function updateUserSubscriptionStatus(
  supabaseClient: any, 
  email: string, 
  isActive: boolean, 
  planName: string | null,
  subscriptionId: string | null
) {
  try {
    const { data: userData } = await supabaseClient.auth.admin.listUsers();
    const user = userData?.users?.find((u: any) => u.email === email);
    
    if (!user) {
      logStep("User not found", { email });
      return;
    }

    const { error: profileError } = await supabaseClient
      .from("profiles")
      .update({
        plan_name: planName,
        plan_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    if (profileError) {
      logStep("Error updating profiles", { error: profileError });
    } else {
      logStep("Successfully updated profiles", { userId: user.id, planName, planActive: isActive });
    }

    if (isActive && planName) {
      const { data: planData } = await supabaseClient
        .from('plans')
        .select('id')
        .eq('name', planName)
        .maybeSingle();

      const { error: subError } = await supabaseClient
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          plan_id: planData?.id || 0,
          plan_name: planName,
          status: "active",
          start_date: new Date().toISOString(),
          end_date: null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (subError) {
        logStep("Error updating subscriptions", { error: subError });
      } else {
        logStep("Successfully updated subscriptions", { userId: user.id });
      }
    }

  } catch (error) {
    logStep("Error in updateUserSubscriptionStatus", { error: error.message });
  }
}
