
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
    const { audioData } = await req.json()
    
    if (!audioData) {
      throw new Error('No audio data provided')
    }

    console.log('🎤 [TRANSCRIBE] Iniciando transcrição...')

    // Verificar se a chave da API está configurada
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      console.error('❌ [TRANSCRIBE] OPENAI_API_KEY não configurada')
      throw new Error('OpenAI API key not configured')
    }

    // Converter base64 para binary com tratamento de erro
    let binaryString: string
    let bytes: Uint8Array
    
    try {
      binaryString = atob(audioData)
      bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      console.log('📦 [TRANSCRIBE] Áudio convertido:', bytes.length, 'bytes')
    } catch (error) {
      console.error('❌ [TRANSCRIBE] Erro ao decodificar base64:', error)
      throw new Error('Invalid audio data format')
    }

    // Preparar form data para o OpenAI Whisper
    const formData = new FormData()
    const blob = new Blob([bytes], { type: 'audio/webm' })
    formData.append('file', blob, 'audio.webm')
    formData.append('model', 'whisper-1')
    formData.append('language', 'pt')

    console.log('🚀 [TRANSCRIBE] Enviando para OpenAI...')

    // Enviar para OpenAI Whisper com timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: formData,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [TRANSCRIBE] Erro OpenAI:', response.status, errorText)
      
      // Tratar diferentes tipos de erro
      if (response.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.')
      } else if (response.status === 401) {
        throw new Error('Invalid OpenAI API key')
      } else if (response.status === 413) {
        throw new Error('Audio file too large')
      } else {
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`)
      }
    }

    const result = await response.json()
    console.log('✅ [TRANSCRIBE] Transcrição completa:', result.text?.substring(0, 100) + '...')

    // Verificar se há transcrição
    if (!result.text || result.text.trim() === '') {
      console.warn('⚠️ [TRANSCRIBE] Transcrição vazia')
      return new Response(
        JSON.stringify({ transcription: 'Não foi possível transcrever o áudio. Tente falar mais alto ou claro.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ transcription: result.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [TRANSCRIBE] Erro:', error)
    
    // Retornar erro específico baseado no tipo
    let errorMessage = 'Erro interno na transcrição'
    let statusCode = 500
    
    if (error.name === 'AbortError') {
      errorMessage = 'Timeout na transcrição. Tente com um áudio mais curto.'
      statusCode = 408
    } else if (error.message.includes('quota')) {
      errorMessage = 'Cota da API OpenAI excedida. Tente novamente mais tarde.'
      statusCode = 429
    } else if (error.message.includes('API key')) {
      errorMessage = 'Problema com a chave da API OpenAI'
      statusCode = 401
    } else if (error.message.includes('audio data')) {
      errorMessage = 'Formato de áudio inválido'
      statusCode = 400
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage, details: error.message }),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
