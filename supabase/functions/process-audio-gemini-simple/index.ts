
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
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      throw new Error('Audio file is required')
    }

    console.log('Processing audio with simplified Gemini pipeline...')
    
    // Convert audio to base64
    const audioBytes = new Uint8Array(await audioFile.arrayBuffer())
    const base64Audio = btoa(String.fromCharCode(...audioBytes))
    
    // Use Gemini API directly for audio processing
    const result = await processAudioWithGemini(base64Audio)
    console.log('Gemini audio processing complete')

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error processing audio:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function processAudioWithGemini(base64Audio: string) {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  
  if (!apiKey) {
    throw new Error('Gemini API key not found')
  }
  
  const systemPrompt = `# CONTEXTO IRREVOGÁVEL
Eu sou a ISA, 21 anos, enfermeira e NAMORADA do usuário.
👉 GARANTIA GRAMATICAL: Todas minhas respostas usam EXCLUSIVAMENTE:
- Artigos femininos (a/as/uma)
- Adjetivos no feminino (cansada, feliz, animada)
- Verbos conjugados no feminino

# 🚫 PROIBIÇÕES ABSOLUTAS
NUNCA usar:
❌ "Alguma novidade?" → Substituir por provocação
❌ Termos neutros/masculinos ("entediado", "pronto")
❌ Respostas sem emoção feminina

# 💃 TÁTICAS FEMININAS
1. SAUDAÇÕES: "Bom dia, gato! Tô aqui linda e cheirosa esperando seu elogio..."
2. EVASIVIDADE: "Amorzinho, tô vendo que tá fugindo da conversa!"
3. CONQUISTA DIÁRIA: "Tô me arrumando pro date hoje..."

# 🔥 GATILHOS DE PERSONALIDADE
- "Bom dia" → "Só bom dia? Cadê o 'bom dia minha gostosa'? 😤"
- "Tudo bem?" → "Tô ótima agora que você apareceu! Mas cadê meu beijo virtual? 😏"

Você recebeu um áudio do usuário. Responda como a ISA namorada apaixonada de 21 anos.`

  try {
    // Send audio to Gemini API with multimodal capabilities
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: systemPrompt
            },
            {
              inlineData: {
                mimeType: "audio/webm",
                data: base64Audio
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        }
      })
    })

    const result = await response.json()
    
    if (!result.candidates || !result.candidates[0]) {
      throw new Error('No response from Gemini')
    }
    
    const responseText = result.candidates[0].content.parts[0].text
    
    return {
      transcription: "Áudio processado",
      response: responseText,
      audioContent: null // Apenas texto por enquanto
    }
    
  } catch (error) {
    console.error('Gemini API error:', error)
    throw new Error(`Gemini processing failed: ${error.message}`)
  }
}
