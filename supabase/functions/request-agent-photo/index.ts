import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { photo_id } = await req.json();
    if (!photo_id) {
      throw new Error("O ID da foto é obrigatório.");
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { data: photoData, error: photoError } = await supabase
      .from('agent_photos')
      .select('credit_cost, photo_url')
      .eq('id', photo_id)
      .single();

    if (photoError || !photoData) {
      throw new Error("Foto não encontrada ou erro ao buscar custo.");
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (profileError || !profileData) {
      throw new Error("Perfil do usuário não encontrado.");
    }

    if (profileData.credits < photoData.credit_cost) {
      return new Response(JSON.stringify({ error: 'Créditos insuficientes.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const newCreditTotal = profileData.credits - photoData.credit_cost;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: newCreditTotal })
      .eq('id', user.id);

    if (updateError) {
      throw new Error("Erro ao atualizar os créditos do usuário.");
    }

    return new Response(JSON.stringify({ photo_url: photoData.photo_url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});