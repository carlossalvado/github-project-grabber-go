
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
    const { audio, hmacKey } = await req.json()
    
    if (!audio) {
      throw new Error('Dados de áudio não fornecidos')
    }

    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY')
    if (!elevenLabsApiKey) {
      throw new Error('Chave da API ElevenLabs não configurada')
    }

    // Convert base64 to binary
    const binaryAudio = Uint8Array.from(atob(audio), c => c.charCodeAt(0))
    
    // Prepare form data for ElevenLabs
    const formData = new FormData()
    const blob = new Blob([binaryAudio], { type: 'audio/webm' })
    formData.append('file', blob, 'audio.webm')
    formData.append('model_id', 'scribe_v1')

    // Prepare headers with HMAC authentication
    const headers: Record<string, string> = {
      'xi-api-key': elevenLabsApiKey,
    }

    if (hmacKey) {
      headers['Authorization'] = `HMAC ${hmacKey}`
    }

    // Send to ElevenLabs Speech-to-Text
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erro da API ElevenLabs: ${errorText}`)
    }

    const result = await response.json()

    return new Response(
      JSON.stringify({ text: result.text || '' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro na transcrição:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
