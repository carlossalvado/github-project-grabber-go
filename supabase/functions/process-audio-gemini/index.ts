
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
    const format = formData.get('format') as string || 'webm'

    if (!audioFile) {
      throw new Error('Audio file is required')
    }

    console.log('Processing audio with Gemini pipeline...')
    
    // Convert audio file to bytes
    const audioBytes = new Uint8Array(await audioFile.arrayBuffer())
    
    // Step 1: Speech-to-Text with Google Cloud
    const transcription = await speechToText(audioBytes, format)
    console.log('Transcription:', transcription)

    if (!transcription) {
      throw new Error('Could not transcribe audio')
    }

    // Step 2: Generate response with Gemini
    const geminiResponse = await generateGeminiResponse(transcription)
    console.log('Gemini response:', geminiResponse)

    // Step 3: Text-to-Speech with Google Cloud
    const audioResponse = await textToSpeech(geminiResponse)
    console.log('Generated audio response')

    // Return audio as base64
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioResponse)))

    return new Response(
      JSON.stringify({ 
        transcription,
        response: geminiResponse,
        audioContent: base64Audio 
      }),
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

async function speechToText(audioBytes: Uint8Array, format: string): Promise<string> {
  try {
    const credentialsJSON = Deno.env.get('GOOGLE_CLOUD_CREDENTIALS_JSON')
    
    if (!credentialsJSON) {
      throw new Error('Google Cloud credentials not found')
    }

    let credentials
    try {
      credentials = JSON.parse(credentialsJSON)
    } catch (parseError) {
      console.error('Failed to parse Google Cloud credentials:', parseError)
      throw new Error('Invalid Google Cloud credentials format')
    }
    
    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion': await createJWT(credentials)
      })
    })
    
    const tokenData = await tokenResponse.json()
    
    if (!tokenData.access_token) {
      throw new Error('Failed to get access token')
    }

    // Configure audio encoding based on format
    let encoding = 'WEBM_OPUS'
    if (format.toLowerCase().includes('mp3')) encoding = 'MP3'
    if (format.toLowerCase().includes('wav')) encoding = 'LINEAR16'

    const requestBody = {
      config: {
        encoding,
        languageCode: 'pt-BR',
        enableAutomaticPunctuation: true,
        model: 'latest_long'
      },
      audio: {
        content: btoa(String.fromCharCode(...audioBytes))
      }
    }

    const response = await fetch('https://speech.googleapis.com/v1/speech:recognize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const result = await response.json()
    
    if (result.results && result.results.length > 0) {
      return result.results[0].alternatives[0].transcript
    }
    
    return ''
  } catch (error) {
    console.error('Speech-to-Text error:', error)
    throw new Error(`Speech-to-Text failed: ${error.message}`)
  }
}

async function generateGeminiResponse(userText: string): Promise<string> {
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

Responda como a ISA namorada apaixonada de 21 anos.`

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nUsuário disse: "${userText}"`
          }]
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
    
    return result.candidates[0].content.parts[0].text
  } catch (error) {
    console.error('Gemini API error:', error)
    throw new Error(`Gemini response failed: ${error.message}`)
  }
}

async function textToSpeech(text: string): Promise<ArrayBuffer> {
  try {
    const credentialsJSON = Deno.env.get('GOOGLE_CLOUD_CREDENTIALS_JSON')
    
    if (!credentialsJSON) {
      throw new Error('Google Cloud credentials not found')
    }

    let credentials
    try {
      credentials = JSON.parse(credentialsJSON)
    } catch (parseError) {
      console.error('Failed to parse Google Cloud credentials:', parseError)
      throw new Error('Invalid Google Cloud credentials format')
    }
    
    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion': await createJWT(credentials)
      })
    })
    
    const tokenData = await tokenResponse.json()
    
    if (!tokenData.access_token) {
      throw new Error('Failed to get access token')
    }

    const requestBody = {
      input: { text },
      voice: {
        languageCode: 'pt-BR',
        ssmlGender: 'FEMALE',
        name: 'pt-BR-Wavenet-A'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0
      }
    }

    const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const result = await response.json()
    
    if (!result.audioContent) {
      throw new Error('No audio content received')
    }
    
    // Decode base64 audio content
    const audioContent = result.audioContent
    const binaryString = atob(audioContent)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    
    return bytes.buffer
  } catch (error) {
    console.error('Text-to-Speech error:', error)
    throw new Error(`Text-to-Speech failed: ${error.message}`)
  }
}

async function createJWT(credentials: any): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const unsignedToken = `${encodedHeader}.${encodedPayload}`
  
  // Import private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    new TextEncoder().encode(credentials.private_key),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  )

  // Sign the token
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(unsignedToken)
  )

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  return `${unsignedToken}.${encodedSignature}`
}
