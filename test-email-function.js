// Script simples para testar a função de envio de email via Resend
// Execute com: node test-email-function.js

const testEmail = async () => {
  const SUPABASE_URL = 'https://hedxxbsieoazrmbayzab.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZHh4YnNpZW9hemJtYmF5emFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5ODI4NDUsImV4cCI6MjA0ODU1ODg0NX0.8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8';

  try {
    console.log('🧪 Testando função send-verification-code com Resend API...');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-verification-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        email: 'test@example.com' // ⚠️  Substitua por um email real para testar o recebimento
      })
    });

    console.log('📊 Status HTTP:', response.status);
    console.log('📋 Headers de resposta:', Object.fromEntries(response.headers.entries()));

    const result = await response.json();
    console.log('📨 Resultado:', JSON.stringify(result, null, 2));

    if (response.ok && result.success) {
      console.log('✅ Teste bem-sucedido! Verifique o email para o código de verificação.');
    } else {
      console.log('❌ Erro na resposta:', result.error || 'Erro desconhecido');
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
};

testEmail();