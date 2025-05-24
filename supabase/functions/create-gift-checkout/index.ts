
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
  console.log(`[CREATE-GIFT-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Initialize Supabase client with the service role key for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { giftId } = await req.json();
    if (!giftId) throw new Error("Gift ID is required");
    logStep("Received gift ID", { giftId });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get gift details from database
    const { data: giftData, error: giftError } = await supabaseClient
      .from('gifts')
      .select('*')
      .eq('id', giftId)
      .single();
    
    if (giftError) throw new Error(`Error fetching gift: ${giftError.message}`);
    if (!giftData) throw new Error("Gift not found");
    logStep("Gift data retrieved", { giftData });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check if user already exists as a customer in Stripe (same as create-checkout)
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      // Create new customer in Stripe (same as create-checkout)
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = newCustomer.id;
      logStep("Created new Stripe customer", { customerId });
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    // Create checkout session for one-time payment (diferente dos planos que usam mode: "subscription")
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: giftData.stripe_price_id ? [
        {
          price: giftData.stripe_price_id, // Use the stripe_price_id from database if available
          quantity: 1,
        }
      ] : [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Presente: ${giftData.name}`,
              description: giftData.description,
              metadata: {
                gift_id: giftId,
                gift_name: giftData.name
              }
            },
            unit_amount: giftData.price, // giftData.price is already in cents
          },
          quantity: 1,
        }
      ],
      mode: "payment", // One-time payment, diferente de "subscription" dos planos
      success_url: `${origin}/modern-chat?gift_success=true&gift_id=${giftId}&gift_name=${encodeURIComponent(giftData.name)}`,
      cancel_url: `${origin}/modern-chat?gift_canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: {
        user_id: user.id,
        gift_id: giftId,
        gift_name: giftData.name,
        type: 'gift_purchase'
      },
    });

    logStep("Gift checkout session created", { sessionId: checkoutSession.id, url: checkoutSession.url });

    return new Response(
      JSON.stringify({ url: checkoutSession.url, sessionId: checkoutSession.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in create-gift-checkout:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
