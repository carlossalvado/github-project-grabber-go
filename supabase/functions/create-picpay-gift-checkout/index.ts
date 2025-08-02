import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const picpayToken = Deno.env.get("PICPAY_API_TOKEN");
    if (!picpayToken) throw new Error("A Secret 'PICPAY_API_TOKEN' não foi encontrada.");

    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    
    const { giftId, recipientId } = await req.json();
    if (!giftId || !recipientId) throw new Error("giftId e recipientId são obrigatórios.");

    const authHeader = req.headers.get("Authorization")!;
    const { data: { user } } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) throw new Error("Usuário não autenticado.");

    const { data: buyerProfile } = await supabaseClient.from("profiles").select("full_name, cpf, phone").eq("id", user.id).single();
    if (!buyerProfile?.full_name || !buyerProfile?.cpf || !buyerProfile?.phone) {
      throw new Error("Dados do comprador (nome, CPF, telefone) estão incompletos no perfil.");
    }
    
    const { data: gift } = await supabaseClient.from("gifts").select("price").eq("id", giftId).single();
    if (!gift) throw new Error("Presente não encontrado.");

    const nameParts = buyerProfile.full_name.split(" ");
    const referenceId = `GIFT-${giftId.substring(0, 8)}-${Date.now()}`;

    const picpayPayload = {
      referenceId,
      callbackUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/picpay-webhook`,
      returnUrl: `${req.headers.get("origin")}/chat/text-audio?gift_success=true`,
      value: gift.price / 100,
      buyer: {
        firstName: nameParts.shift() || "",
        lastName: nameParts.join(" ") || " ",
        document: buyerProfile.cpf,
        email: user.email!,
        phone: buyerProfile.phone,
      },
      "paymentMethods": ["PIX"]
    };

    const picpayResponse = await fetch("https://appws.picpay.com/ecommerce/public/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-picpay-token": picpayToken },
      body: JSON.stringify(picpayPayload),
    });

    const picpayData = await picpayResponse.json();
    if (!picpayResponse.ok) {
      const errorMessage = picpayData.errors?.[0]?.message || picpayData.message || 'Erro de validação.';
      throw new Error(`Erro na API do PicPay: ${errorMessage}`);
    }

    if (!picpayData.qrcode?.base64 || !picpayData.paymentUrl) {
      throw new Error("A resposta da API do PicPay não continha os dados do PIX.");
    }

    return new Response(JSON.stringify({ 
      paymentUrl: picpayData.paymentUrl,
      qrCode: picpayData.qrcode.base64
    }), {
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