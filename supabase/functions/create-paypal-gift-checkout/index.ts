// Caminho: supabase/functions/create-picpay-gift-checkout/index.ts
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
    // === VALIDAÇÃO DA SECRET ADICIONADA AQUI ===
    const picpayToken = Deno.env.get("PICPAY_API_TOKEN");
    if (!picpayToken) {
      throw new Error("A Secret 'PICPAY_API_TOKEN' não foi encontrada nas configurações do projeto Supabase.");
    }
    // ===========================================

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { giftId, recipientId } = await req.json();
    if (!giftId) throw new Error("O ID do presente (giftId) é obrigatório");
    if (!recipientId) throw new Error("O ID do destinatário (recipientId) é obrigatório");

    const authHeader = req.headers.get("Authorization")!;
    const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) throw new Error("Usuário não autenticado");

    const { data: buyerProfile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("full_name, cpf, phone")
      .eq("id", user.id)
      .single();

    if (profileError || !buyerProfile || !buyerProfile.full_name || !buyerProfile.cpf || !buyerProfile.phone) {
      throw new Error("Dados do comprador (nome, CPF, telefone) estão incompletos no perfil.");
    }

    const { data: gift, error: giftError } = await supabaseClient
      .from("gifts")
      .select("price")
      .eq("id", giftId)
      .single();

    if (giftError || !gift) throw new Error("Presente não encontrado");

    const nameParts = buyerProfile.full_name.split(" ");
    const firstName = nameParts.shift() || "";
    const lastName = nameParts.join(" ") || " ";

    const picpayPayload = {
      referenceId: `gift_${giftId}_from_${user.id}_to_${recipientId}_${Date.now()}`,
      callbackUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/picpay-webhook`,
      returnUrl: `${req.headers.get("origin")}/chat/text-audio?gift_success=true`,
      value: gift.price / 100,
      buyer: {
        firstName,
        lastName,
        document: buyerProfile.cpf,
        email: user.email!,
        phone: buyerProfile.phone,
      },
    };

    const picpayResponse = await fetch("https://appws.picpay.com/ecommerce/public/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-picpay-token": picpayToken, // Usando a variável validada
      },
      body: JSON.stringify(picpayPayload),
    });

    const picpayData = await picpayResponse.json();
    if (!picpayResponse.ok) {
      console.error("PicPay API Error Body:", picpayData);
      throw new Error(`Erro na API do PicPay: ${picpayData.message || 'Erro de validação.'}`);
    }

    return new Response(JSON.stringify({ url: picpayData.paymentUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Erro fatal na função:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});