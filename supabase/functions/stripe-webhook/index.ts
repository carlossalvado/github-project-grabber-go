
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

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    // Get the raw body
    const body = await req.text();
    
    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified", { eventType: event.type });
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(`Webhook signature verification failed: ${err.message}`, {
        status: 400,
      });
    }

    // Handle the event
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

  if (session.mode === 'subscription' && session.customer && session.subscription) {
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id;
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
    
    // Get customer details
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return;
    
    // Get subscription details
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
    
    // Deactivate subscription in our system
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

  // Get the price ID to determine the plan
  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) {
    logStep("No price ID found for subscription", { subscriptionId: subscription.id });
    return;
  }
  
  // Find the corresponding plan in our database
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
    // Find user by email
    const { data: userData } = await supabaseClient.auth.admin.listUsers();
    const user = userData?.users?.find((u: any) => u.email === email);
    
    if (!user) {
      logStep("User not found", { email });
      return;
    }

    // Update profiles table
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

    // Update or create subscription record
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
