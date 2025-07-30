import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Preço por crédito de voz (em centavos), igual à sua função do PayPal.
const VOICE_CREDIT_PRICE = 20;

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

    const { amount } = await req.json();
    if (!amount) throw new Error("A quantidade (amount) é obrigatória");
    if (amount < 50) throw new Error("A quantidade mínima é 50 créditos");

    // Autenticação do usuário
    const authHeader = req.headers.get("Authorization")!;
    const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) throw new Error("Usuário não encontrado");

    const totalPrice = amount * VOICE_CREDIT_PRICE;

    // Adapte o corpo da requisição (buyer) conforme a documentação da API PicPay
    const picpayPayload = {
      referenceId: `voice_${amount}_${user.id}_${new Date().getTime()}`,
      callbackUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/picpay-webhook`,
      returnUrl: `${req.headers.get("origin")}/profile?checkout=success`,
      value: totalPrice / 100, // O valor deve ser em Reais (ex: 10.00)
      buyer: {
        firstName: user.user_metadata?.name?.split(' ')[0] || "Comprador",
        lastName: user.user_metadata?.name?.split(' ').slice(1).join(' ') || "Teste",
        document: "123.456.789-10", // Obtenha o CPF do seu usuário
        email: user.email,
        phone: "+55 27 12345-6789" // Obtenha o telefone do seu usuário
      },
    };

    const picpayResponse = await fetch("https://appws.picpay.com/ecommerce/public/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-picpay-token": Deno.env.get("X_PICPAY_TOKEN")!,
      },
      body: JSON.stringify(picpayPayload),
    });

    const picpayData = await picpayResponse.json();
    if (!picpayResponse.ok) {
      console.error("PicPay API Error:", picpayData);
      throw new Error(`Erro na API do PicPay: ${picpayData.message}`);
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