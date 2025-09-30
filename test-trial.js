// Script para testar o trial
// Execute com: node test-trial.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

dotenv.config();

// Tentar carregar .env.local também
try {
  const envLocalPath = resolve('.env.local');
  const envLocal = readFileSync(envLocalPath, 'utf8');
  const envVars = envLocal.split('\n').reduce((acc, line) => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      acc[key.trim()] = valueParts.join('=').trim();
    }
    return acc;
  }, {});

  Object.assign(process.env, envVars);
} catch (error) {
  // .env.local não existe, continuar
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🔍 Verificando variáveis de ambiente...');
console.log('SUPABASE_URL:', SUPABASE_URL ? '✅ Definido' : '❌ Não definido');
console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ Definido' : '❌ Não definido');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testTrial() {
  console.log('🧪 Testando sistema de trial...\n');

  // Simular login (substitua por um user_id real)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.log('❌ Usuário não autenticado. Faça login primeiro.');
    return;
  }

  console.log(`👤 Usuário: ${user.email} (ID: ${user.id})\n`);

  // 1. Verificar se existe trial
  console.log('1️⃣ Verificando trial existente...');
  const { data: trialData, error: trialError } = await supabase
    .from('user_trials')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (trialError && trialError.code !== 'PGRST116') {
    console.error('❌ Erro ao buscar trial:', trialError);
    return;
  }

  if (trialData) {
    console.log('✅ Trial encontrado:');
    console.log(`   - Ativo: ${trialData.trial_active}`);
    console.log(`   - Início: ${trialData.trial_start}`);
    console.log(`   - Fim: ${trialData.trial_end}`);

    const now = new Date();
    const trialEnd = new Date(trialData.trial_end + 'Z');
    const isActive = trialData.trial_active && trialEnd > now;

    console.log(`   - Agora: ${now.toISOString()}`);
    console.log(`   - TrialEnd (UTC): ${trialEnd.toISOString()}`);
    console.log(`   - Está ativo: ${isActive}`);

    if (isActive) {
      const diffMs = trialEnd.getTime() - now.getTime();
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
      console.log(`   - Horas restantes: ${diffHours}`);
    }
  } else {
    console.log('❌ Nenhum trial encontrado');
  }

  // 2. Verificar emails agendados
  console.log('\n2️⃣ Verificando emails agendados...');
  const { data: emailsData, error: emailsError } = await supabase
    .from('welcome_email_schedule')
    .select('*')
    .eq('user_id', user.id)
    .order('scheduled_at', { ascending: true });

  if (emailsError) {
    console.error('❌ Erro ao buscar emails:', emailsError);
    return;
  }

  if (emailsData && emailsData.length > 0) {
    console.log(`✅ ${emailsData.length} emails agendados:`);
    emailsData.forEach((email, index) => {
      console.log(`   ${index + 1}. Dia ${email.trial_day}: ${email.scheduled_at} (${email.sent_at ? 'ENVIADO' : 'PENDENTE'})`);
    });
  } else {
    console.log('❌ Nenhum email agendado');
  }

  // 3. Testar função RPC
  console.log('\n3️⃣ Testando função start_trial...');
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('start_trial', {
      user_uuid: user.id
    });

    if (rpcError) {
      console.error('❌ Erro na função RPC:', rpcError);
    } else {
      console.log('✅ Função RPC executada:', rpcData);
    }
  } catch (error) {
    console.error('❌ Erro ao chamar RPC:', error);
  }

  console.log('\n🏁 Teste concluído!');
}

// Executar teste
testTrial().catch(console.error);