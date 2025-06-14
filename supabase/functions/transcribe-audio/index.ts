
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
    console.log('🎤 [TRANSCRIBE] Starting transcription process...')
    
    // Parse request body
    let body;
    try {
      body = await req.json()
    } catch (parseError) {
      console.error('❌ [TRANSCRIBE] Error parsing request body:', parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { audioData } = body
    
    if (!audioData) {
      console.error('❌ [TRANSCRIBE] audioData not provided')
      return new Response(
        JSON.stringify({ error: 'audioData is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('📊 [TRANSCRIBE] Audio data length:', audioData.length)

    // Check OpenAI API key
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      console.error('❌ [TRANSCRIBE] OPENAI_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Convert base64 to binary
    let audioBytes: Uint8Array
    try {
      // Remove data URL prefix if present
      const cleanBase64 = audioData.replace(/^data:audio\/[^;]+;base64,/, '')
      console.log('🔄 [TRANSCRIBE] Converting base64 to binary...')
      
      const binaryString = atob(cleanBase64)
      audioBytes = new Uint8Array(binaryString.length)
      
      for (let i = 0; i < binaryString.length; i++) {
        audioBytes[i] = binaryString.charCodeAt(i)
      }
      
      console.log('📦 [TRANSCRIBE] Audio converted:', audioBytes.length, 'bytes')
      
      if (audioBytes.length === 0) {
        throw new Error('Empty audio data after conversion')
      }
    } catch (error) {
      console.error('❌ [TRANSCRIBE] Error decoding base64:', error)
      return new Response(
        JSON.stringify({ error: 'Invalid audio format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Prepare form data for OpenAI Whisper
    const formData = new FormData()
    const audioBlob = new Blob([audioBytes], { type: 'audio/webm' })
    formData.append('file', audioBlob, 'audio.webm')
    formData.append('model', 'whisper-1')
    formData.append('language', 'pt')

    console.log('🚀 [TRANSCRIBE] Sending to OpenAI...')

    // Send to OpenAI Whisper with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    let response;
    try {
      response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: formData,
        signal: controller.signal,
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.error('❌ [TRANSCRIBE] Fetch error:', fetchError)
      
      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Request timeout' }),
          {
            status: 408,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
      
      return new Response(
        JSON.stringify({ error: 'Network error connecting to OpenAI' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    clearTimeout(timeoutId)

    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text()
      } catch {
        errorText = 'Unknown error'
      }
      
      console.error('❌ [TRANSCRIBE] OpenAI error:', response.status, errorText)
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'OpenAI quota exceeded. Try again later.' }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      } else if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Invalid OpenAI API key' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      } else if (response.status === 413) {
        return new Response(
          JSON.stringify({ error: 'Audio file too large' }),
          {
            status: 413,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      } else {
        return new Response(
          JSON.stringify({ error: `OpenAI error (${response.status}): ${errorText}` }),
          {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    let result;
    try {
      result = await response.json()
    } catch (jsonError) {
      console.error('❌ [TRANSCRIBE] Error parsing OpenAI response:', jsonError)
      return new Response(
        JSON.stringify({ error: 'Invalid response from OpenAI' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('✅ [TRANSCRIBE] Transcription complete')

    if (!result.text || result.text.trim() === '') {
      console.warn('⚠️ [TRANSCRIBE] Empty transcription')
      return new Response(
        JSON.stringify({ transcription: 'Could not transcribe audio.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ transcription: result.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [TRANSCRIBE] Unexpected error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal transcription error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
