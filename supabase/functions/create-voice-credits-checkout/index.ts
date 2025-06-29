
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY não configurada");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error("Usuário não autenticado");
    }

    console.log("Criando checkout para créditos de voz para usuário:", user.email);

    // Buscar produto de créditos de voz da tabela
    let productData = {
      name: "4 Créditos de Chamada de Voz",
      credits: 4,
      price: 999 // valor padrão
    };

    try {
      const { data: product, error: productError } = await supabaseClient
        .from('voice_credit_products')
        .select('name, credits, price')
        .single();

      if (product && !productError) {
        productData = {
          name: product.name,
          credits: product.credits,
          price: product.price
        };
        console.log("Produto encontrado na base de dados:", productData);
      } else {
        console.log("Produto não encontrado, usando valores padrão:", productData);
      }
    } catch (productError) {
      console.log("Erro ao buscar produto, usando valores padrão:", productData);
    }

    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Detectar a página atual baseada no referer
    const referer = req.headers.get("referer") || "";
    let successUrl = `${req.headers.get("origin")}/chat-text-audio?voice_credits_success=true&credits=${productData.credits}`;
    let cancelUrl = `${req.headers.get("origin")}/chat-text-audio?voice_credits_canceled=true`;
    
    if (referer.includes("/chat-trial")) {
      successUrl = `${req.headers.get("origin")}/chat-trial?voice_credits_success=true&credits=${productData.credits}`;
      cancelUrl = `${req.headers.get("origin")}/chat-trial?voice_credits_canceled=true`;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: productData.name,
              description: `${productData.credits} créditos para realizar chamadas de voz com IA`,
            },
            unit_amount: productData.price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        credits: productData.credits.toString(),
        user_id: user.id,
        credit_type: "voice",
      },
    });

    console.log("Checkout session criada:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Erro:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
