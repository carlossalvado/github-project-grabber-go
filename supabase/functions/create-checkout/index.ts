
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
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
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

    const { planId } = await req.json();
    if (!planId) throw new Error("Plan ID is required");
    logStep("Received plan ID", { planId });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get plan details from database
    const { data: planData, error: planError } = await supabaseClient
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (planError) throw new Error(`Error fetching plan: ${planError.message}`);
    if (!planData) throw new Error("Plan not found");
    logStep("Plan data retrieved", { planData });

    // Atualizar o perfil do usuário com o nome do plano selecionado
    // Mas marque como inativo até confirmarmos o pagamento
    const { error: profileUpdateError } = await supabaseClient
      .from('profiles')
      .update({
        plan_name: planData.name,
        plan_active: false, // Inicialmente como falso até confirmar pagamento
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    if (profileUpdateError) {
      logStep("Error updating user profile", { error: profileUpdateError.message });
    } else {
      logStep("User profile updated with selected plan", { planName: planData.name });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check if user already exists as a customer in Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      // Create new customer in Stripe
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = newCustomer.id;
      logStep("Created new Stripe customer", { customerId });
    }

    // Get price ID from the request or use the one from plan data
    const priceId = planData.stripe_price_id;
    if (!priceId) throw new Error("No price ID specified for this plan");
    
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/chat?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/home?checkout=canceled`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      subscription_data: {
        trial_period_days: planData.trial_days > 0 ? planData.trial_days : undefined,
        metadata: {
          user_id: user.id,
          plan_id: planId,
          plan_name: planData.name,
        },
      },
    });

    logStep("Checkout session created", { sessionId: checkoutSession.id, url: checkoutSession.url });

    return new Response(
      JSON.stringify({ url: checkoutSession.url, sessionId: checkoutSession.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in create-checkout:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
