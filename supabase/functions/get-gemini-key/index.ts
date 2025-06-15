
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔑 [GET-GEMINI-KEY] Iniciando busca da chave API...');
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!geminiApiKey) {
      console.error('❌ [GET-GEMINI-KEY] GEMINI_API_KEY não encontrada');
      throw new Error('GEMINI_API_KEY não configurada no servidor')
    }

    console.log('✅ [GET-GEMINI-KEY] Chave encontrada, retornando...');
    
    return new Response(
      JSON.stringify({ 
        apiKey: geminiApiKey,
        success: true 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ [GET-GEMINI-KEY] Erro:', error.message)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
