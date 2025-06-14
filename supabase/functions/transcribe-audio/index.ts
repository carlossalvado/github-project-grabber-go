
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
    const body = await req.json()
    const { audioData } = body
    
    if (!audioData) {
      console.error('❌ [TRANSCRIBE] audioData não fornecido')
      throw new Error('audioData é obrigatório')
    }

    console.log('🎤 [TRANSCRIBE] Iniciando transcrição...')
    console.log('📊 [TRANSCRIBE] Tamanho dos dados de áudio:', audioData.length)

    // Verificar se a chave da API está configurada
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      console.error('❌ [TRANSCRIBE] OPENAI_API_KEY não configurada')
      throw new Error('OpenAI API key não configurada')
    }

    // Converter base64 para binary
    let audioBytes: Uint8Array
    try {
      // Remove possíveis prefixos de data URL
      const cleanBase64 = audioData.replace(/^data:audio\/[^;]+;base64,/, '')
      const binaryString = atob(cleanBase64)
      audioBytes = new Uint8Array(binaryString.length)
      
      for (let i = 0; i < binaryString.length; i++) {
        audioBytes[i] = binaryString.charCodeAt(i)
      }
      
      console.log('📦 [TRANSCRIBE] Áudio convertido:', audioBytes.length, 'bytes')
      
      if (audioBytes.length === 0) {
        throw new Error('Dados de áudio vazios após conversão')
      }
    } catch (error) {
      console.error('❌ [TRANSCRIBE] Erro ao decodificar base64:', error)
      throw new Error('Formato de áudio inválido')
    }

    // Preparar form data para o OpenAI Whisper
    const formData = new FormData()
    const audioBlob = new Blob([audioBytes], { type: 'audio/webm' })
    formData.append('file', audioBlob, 'audio.webm')
    formData.append('model', 'whisper-1')
    formData.append('language', 'pt')

    console.log('🚀 [TRANSCRIBE] Enviando para OpenAI...')

    // Enviar para OpenAI Whisper com timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

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
      
      if (response.status === 429) {
        throw new Error('Cota da OpenAI excedida. Tente novamente mais tarde.')
      } else if (response.status === 401) {
        throw new Error('Chave da OpenAI inválida')
      } else if (response.status === 413) {
        throw new Error('Arquivo de áudio muito grande')
      } else {
        throw new Error(`Erro da OpenAI (${response.status}): ${errorText}`)
      }
    }

    const result = await response.json()
    console.log('✅ [TRANSCRIBE] Transcrição completa')

    if (!result.text || result.text.trim() === '') {
      console.warn('⚠️ [TRANSCRIBE] Transcrição vazia')
      return new Response(
        JSON.stringify({ transcription: 'Não foi possível transcrever o áudio.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ transcription: result.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [TRANSCRIBE] Erro:', error)
    
    let errorMessage = 'Erro interno na transcrição'
    let statusCode = 500
    
    if (error.name === 'AbortError') {
      errorMessage = 'Timeout na transcrição'
      statusCode = 408
    } else if (error.message.includes('cota') || error.message.includes('quota')) {
      errorMessage = 'Cota da OpenAI excedida'
      statusCode = 429
    } else if (error.message.includes('API key')) {
      errorMessage = 'Problema com a chave da OpenAI'
      statusCode = 401
    } else if (error.message.includes('áudio')) {
      errorMessage = 'Problema com o arquivo de áudio'
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
