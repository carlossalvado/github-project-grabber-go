
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
    const { chatId, fileType = 'audio/webm' } = await req.json()
    
    // Get user from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Verify user token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid token')
    }

    if (!chatId) {
      throw new Error('Chat ID é obrigatório')
    }

    // Generate unique message ID
    const messageId = crypto.randomUUID()
    
    // Create file path: chat_audio/{user_id}/{chat_id}/{message_id}_input.webm
    const filePath = `${user.id}/${chatId}/${messageId}_input.webm`
    
    console.log('Generating signed URL for path:', filePath)

    // Generate signed upload URL
    const { data, error } = await supabase.storage
      .from('chat_audio')
      .createSignedUploadUrl(filePath)

    if (error) {
      console.error('Error generating signed URL:', error)
      throw error
    }

    console.log('Signed URL generated successfully')

    return new Response(
      JSON.stringify({ 
        signedUrl: data.signedUrl,
        path: filePath,
        messageId: messageId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in get-signed-upload-url:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
