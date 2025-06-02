
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audioStoragePath, chatMessageId } = await req.json()
    
    if (!audioStoragePath || !chatMessageId) {
      throw new Error('audioStoragePath e chatMessageId são obrigatórios')
    }

    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY')
    if (!elevenLabsApiKey) {
      throw new Error('Chave da API ElevenLabs não configurada')
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    console.log('Downloading audio from storage path:', audioStoragePath)

    // Download audio file from storage
    const { data: audioData, error: downloadError } = await supabase.storage
      .from('chat_audio')
      .download(audioStoragePath)

    if (downloadError) {
      console.error('Error downloading audio:', downloadError)
      throw new Error(`Erro ao baixar áudio: ${downloadError.message}`)
    }

    console.log('Audio downloaded successfully, size:', audioData.size)

    // Convert to form data for ElevenLabs
    const formData = new FormData()
    formData.append('file', audioData, 'audio.webm')
    formData.append('model_id', 'scribe_v1')

    console.log('Sending to ElevenLabs for transcription')

    // Send to ElevenLabs Speech-to-Text
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API error:', errorText)
      throw new Error(`Erro da API ElevenLabs: ${errorText}`)
    }

    const result = await response.json()
    const transcription = result.text || ''

    console.log('Transcription completed:', transcription)

    // Update chat message with transcription
    const { error: updateError } = await supabase
      .from('chat_messages')
      .update({
        transcription: transcription,
        status: 'transcribed',
        updated_at: new Date().toISOString()
      })
      .eq('id', chatMessageId)

    if (updateError) {
      console.error('Error updating message:', updateError)
      throw new Error(`Erro ao atualizar mensagem: ${updateError.message}`)
    }

    console.log('Message updated successfully with transcription')

    return new Response(
      JSON.stringify({ 
        success: true,
        transcription: transcription,
        messageId: chatMessageId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro na transcrição:', error)
    
    // Try to update message with error status if chatMessageId is available
    try {
      const { chatMessageId } = await req.json()
      if (chatMessageId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
        
        await supabase
          .from('chat_messages')
          .update({
            status: 'error',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', chatMessageId)
      }
    } catch (updateError) {
      console.error('Error updating message with error status:', updateError)
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
