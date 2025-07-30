import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { planId } = await req.json();
    if (!planId) throw new Error("planId is required");

    // Lógica para autenticar o usuário (igual às suas outras funções)
    // ...

    const { data: plan } = await supabaseClient
      .from("plans")
      .select("name, price")
      .eq("id", planId)
      .single();

    if (!plan) {
      throw new Error(`Plan not found for planId: ${planId}`);
    }

    const picpayResponse = await fetch("https://appws.picpay.com/ecommerce/public/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-picpay-token": Deno.env.get("X_PICPAY_TOKEN")!,
      },
      body: JSON.stringify({
        // Adapte o corpo da requisição conforme a documentação da API PicPay
        // Exemplo:
        referenceId: `plan_${planId}_${user.id}`,
        callbackUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/picpay-webhook`,
        returnUrl: `${req.headers.get("origin")}/profile?checkout=success`,
        value: plan.price / 100,
        buyer: {
          // Dados do comprador
        },
      }),
    });

    const picpayData = await picpayResponse.json();
    if (!picpayResponse.ok) {
      throw new Error(`PicPay API error: ${picpayData.message}`);
    }

    return new Response(JSON.stringify({ url: picpayData.paymentUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});