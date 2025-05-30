
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { agentId } = await req.json()
    
    if (!agentId) {
      throw new Error('Agent ID é obrigatório')
    }

    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY')
    if (!elevenLabsApiKey) {
      throw new Error('Chave da API ElevenLabs não configurada')
    }

    // Get signed URL from ElevenLabs
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`, {
      method: 'GET',
      headers: {
        'xi-api-key': elevenLabsApiKey,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erro da API ElevenLabs: ${errorText}`)
    }

    const result = await response.json()

    return new Response(
      JSON.stringify({ signedUrl: result.signed_url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Erro ao obter URL assinada:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
