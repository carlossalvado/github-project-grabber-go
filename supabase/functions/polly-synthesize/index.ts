
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para criar signature AWS v4
async function createSignature(
  method: string,
  url: string,
  headers: Record<string, string>,
  body: string,
  region: string,
  service: string,
  accessKey: string,
  secretKey: string
) {
  const encoder = new TextEncoder()
  
  // Hash do payload
  const payloadHash = await crypto.subtle.digest('SHA-256', encoder.encode(body))
  const payloadHashHex = Array.from(new Uint8Array(payloadHash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Canonical request
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map(key => `${key.toLowerCase()}:${headers[key]}\n`)
    .join('')
  
  const signedHeaders = Object.keys(headers)
    .sort()
    .map(key => key.toLowerCase())
    .join(';')

  const urlObj = new URL(url)
  const canonicalRequest = [
    method,
    urlObj.pathname,
    urlObj.search.slice(1),
    canonicalHeaders,
    signedHeaders,
    payloadHashHex
  ].join('\n')

  // String to sign
  const date = new Date()
  const dateStamp = date.toISOString().slice(0, 10).replace(/-/g, '')
  const timestamp = date.toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z'
  
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  
  const canonicalRequestHash = await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest))
  const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    timestamp,
    credentialScope,
    canonicalRequestHashHex
  ].join('\n')

  // Calculate signature
  const kDate = await crypto.subtle.importKey(
    'raw',
    encoder.encode(`AWS4${secretKey}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const kDateSig = await crypto.subtle.sign('HMAC', kDate, encoder.encode(dateStamp))
  
  const kRegion = await crypto.subtle.importKey(
    'raw',
    kDateSig,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const kRegionSig = await crypto.subtle.sign('HMAC', kRegion, encoder.encode(region))
  
  const kService = await crypto.subtle.importKey(
    'raw',
    kRegionSig,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const kServiceSig = await crypto.subtle.sign('HMAC', kService, encoder.encode(service))
  
  const kSigning = await crypto.subtle.importKey(
    'raw',
    kServiceSig,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', kSigning, encoder.encode(stringToSign))
  const signatureHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return {
    timestamp,
    signature: signatureHex,
    credentialScope,
    signedHeaders
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()
    
    if (!text) {
      throw new Error('No text provided')
    }

    console.log('🗣️ [POLLY] Sintetizando voz para:', text)

    const accessKey = Deno.env.get('AWS_ACCESS_KEY_ID')
    const secretKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')
    const region = Deno.env.get('AWS_REGION') || 'sa-east-1'

    if (!accessKey || !secretKey) {
      throw new Error('AWS credentials not configured')
    }

    // Preparar request para Amazon Polly
    const endpoint = `https://polly.${region}.amazonaws.com/v1/speech`
    const body = JSON.stringify({
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: 'Vitoria',
      Engine: 'neural',
      LanguageCode: 'pt-BR'
    })

    const headers = {
      'Content-Type': 'application/x-amz-json-1.0',
      'Host': `polly.${region}.amazonaws.com`,
      'X-Amz-Date': '',
      'X-Amz-Target': 'com.amazonaws.polly.service.Polly_20160610.SynthesizeSpeech'
    }

    // Criar assinatura AWS
    const { timestamp, signature, credentialScope, signedHeaders } = await createSignature(
      'POST',
      endpoint,
      headers,
      body,
      region,
      'polly',
      accessKey,
      secretKey
    )

    headers['X-Amz-Date'] = timestamp
    headers['Authorization'] = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

    // Fazer request para Polly
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ [POLLY] Erro AWS:', error)
      throw new Error(`AWS Polly error: ${error}`)
    }

    // Converter áudio para base64
    const audioBuffer = await response.arrayBuffer()
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)))

    console.log('✅ [POLLY] Síntese de voz completa')

    return new Response(
      JSON.stringify({ audioData: base64Audio }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [POLLY] Erro:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
