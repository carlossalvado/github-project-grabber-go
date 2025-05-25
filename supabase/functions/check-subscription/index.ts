
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "sk_test_51RMxX0KSV6QLg5fRHS75xPgwbtveXgQCq6rIIfp9BXKUSbiRWhrFv9tep68eFEGgtnXs8M4TEH4EDbLWdL0OYP0P00EEXnPOGe";
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Initialize Supabase client with the service role key for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check if user exists as a customer in Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      
      return new Response(
        JSON.stringify({ 
          hasActiveSubscription: false,
          planName: null,
          planActive: false,
          paymentConfirmed: false
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      expand: ["data.default_payment_method"],
    });

    if (subscriptions.data.length === 0) {
      logStep("No active subscriptions found for customer");
      
      return new Response(
        JSON.stringify({ 
          hasActiveSubscription: false,
          planName: null,
          planActive: false,
          paymentConfirmed: false
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get the active subscription details
    const activeSubscription = subscriptions.data[0];
    logStep("Found active subscription", { 
      subscriptionId: activeSubscription.id,
      status: activeSubscription.status,
      periodEnd: new Date(activeSubscription.current_period_end * 1000).toISOString()
    });

    // Get the price ID to determine the plan
    const priceId = activeSubscription.items.data[0]?.price.id;
    if (!priceId) throw new Error("No price ID found for subscription");
    
    // Find the corresponding plan in our database
    const { data: planData } = await supabaseClient
      .from('plans')
      .select('*')
      .eq('stripe_price_id', priceId)
      .maybeSingle();
    
    const planId = planData?.id;
    const planName = planData?.name || "Plano Desconhecido";
    logStep("Determined plan ID and name", { priceId, planId, planName });

    // *** CRÍTICO: FORÇAR ATUALIZAÇÃO OBRIGATÓRIA DO PLAN_ACTIVE PARA TRUE ***
    logStep("*** PAYMENT CONFIRMED IN STRIPE - FORCING plan_active = TRUE ***");
    
    try {
      // STEP 1: FORCE UPDATE profiles table with plan_active = TRUE (MANDATORY)
      const { error: profileUpdateError } = await supabaseClient
        .from("profiles")
        .update({
          plan_name: planName,
          plan_active: true,  // *** FORÇA TRUE SEMPRE ***
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (profileUpdateError) {
        logStep("*** CRITICAL ERROR updating profiles table ***", { error: profileUpdateError });
        throw new Error(`Failed to update profiles: ${profileUpdateError.message}`);
      }
      
      logStep("*** SUCCESS: profiles.plan_active = TRUE CONFIRMED ***", { 
        userId: user.id,
        planName,
        planActive: true
      });

      // STEP 2: Update subscriptions table
      const { data: existingSubscription } = await supabaseClient
        .from("subscriptions")
        .select("id")
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingSubscription) {
        const { error: subUpdateError } = await supabaseClient
          .from("subscriptions")
          .update({
            plan_id: planId,
            plan_name: planName,
            status: "active",
            start_date: new Date(activeSubscription.current_period_start * 1000).toISOString(),
            end_date: new Date(activeSubscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
          
        if (subUpdateError) {
          logStep("ERROR updating subscriptions table", { error: subUpdateError });
        } else {
          logStep("SUCCESS: subscriptions table updated");
        }
      } else {
        const { error: subInsertError } = await supabaseClient
          .from("subscriptions")
          .insert({
            user_id: user.id,
            plan_id: planId,
            plan_name: planName,
            status: "active",
            start_date: new Date(activeSubscription.current_period_start * 1000).toISOString(),
            end_date: new Date(activeSubscription.current_period_end * 1000).toISOString()
          });
          
        if (subInsertError) {
          logStep("ERROR inserting into subscriptions table", { error: subInsertError });
        } else {
          logStep("SUCCESS: new subscription record created");
        }
      }
      
    } catch (updateError) {
      logStep("*** CRITICAL FAILURE ***", { error: updateError.message });
      throw updateError; // Re-throw to return error response
    }

    // *** SEMPRE RETORNAR SUCCESS QUANDO STRIPE CONFIRMA PAGAMENTO ***
    logStep("*** PAYMENT FULLY CONFIRMED - plan_active = TRUE guaranteed ***");
    
    return new Response(
      JSON.stringify({
        hasActiveSubscription: true,
        planId,
        planName,
        planActive: true,  // SEMPRE TRUE quando Stripe confirma
        subscriptionId: activeSubscription.id,
        periodEnd: new Date(activeSubscription.current_period_end * 1000).toISOString(),
        status: "active",
        paymentConfirmed: true
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("*** FATAL ERROR in check-subscription ***", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
