
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
    const { textToSynthesize, chatMessageId, userId, chatId, voiceId = 'XB0fDUnXU5powFXDhCwa' } = await req.json()
    
    if (!textToSynthesize || !chatMessageId || !userId || !chatId) {
      throw new Error('textToSynthesize, chatMessageId, userId e chatId são obrigatórios')
    }

    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY')
    if (!elevenLabsApiKey) {
      throw new Error('Chave da API ElevenLabs não configurada')
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    console.log('Generating speech for text:', textToSynthesize)

    // Generate speech with ElevenLabs
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: textToSynthesize,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API error:', errorText)
      throw new Error(`Erro da API ElevenLabs: ${errorText}`)
    }

    console.log('Speech generated successfully')

    // Get audio buffer
    const audioBuffer = await response.arrayBuffer()
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' })

    // Create file path for response audio
    const responseAudioPath = `${userId}/${chatId}/${chatMessageId}_output.mp3`

    console.log('Uploading audio to storage path:', responseAudioPath)

    // Upload audio to storage
    const { error: uploadError } = await supabase.storage
      .from('chat_audio')
      .upload(responseAudioPath, audioBlob, {
        contentType: 'audio/mpeg',
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading audio:', uploadError)
      throw new Error(`Erro ao fazer upload do áudio: ${uploadError.message}`)
    }

    console.log('Audio uploaded successfully')

    // Get public URL for the audio
    const { data: urlData } = supabase.storage
      .from('chat_audio')
      .getPublicUrl(responseAudioPath)

    // Update chat message with response
    const { error: updateError } = await supabase
      .from('chat_messages')
      .update({
        llm_response_text: textToSynthesize,
        response_audio_url: responseAudioPath,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', chatMessageId)

    if (updateError) {
      console.error('Error updating message:', updateError)
      throw new Error(`Erro ao atualizar mensagem: ${updateError.message}`)
    }

    console.log('Message updated successfully with response')

    return new Response(
      JSON.stringify({ 
        success: true,
        audioUrl: urlData.publicUrl,
        responseText: textToSynthesize,
        messageId: chatMessageId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Erro na geração de áudio:', error)
    
    // Try to update message with error status
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
