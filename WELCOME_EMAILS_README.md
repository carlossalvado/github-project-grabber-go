# Sistema de Emails de Boas-vindas - Isa Date

Este documento explica como funciona o sistema de emails de boas-vindas para usuários do plano trial.

## 🎯 Funcionalidades

- **Email de boas-vindas sedutor** enviado 2 minutos após o cadastro
- **Sequência de 3 emails** durante os 3 dias do trial
- **Horário brasileiro**: Emails enviados às 22:00 (horário de Brasília)
- **Templates personalizados** para cada dia do trial
- **Integração com Resend** (sem limitações do Supabase)

## 📧 Sequência de Emails

### Dia 1: Email Inicial (2 minutos após cadastro)
- **Assunto**: "Bem-vindo ao Isa Date! 💕"
- **Conteúdo**: Boas-vindas sedutoras, menção aos créditos gratuitos, convite para chamada de voz

### Dia 2: Email de Saudade (22h do dia seguinte)
- **Assunto**: "Saudades suas, Gatinho! 🔥"
- **Conteúdo**: Mensagem apaixonada, lembrando dos créditos disponíveis

### Dia 3: Última Chance (22h do dia posterior)
- **Assunto**: "Último dia, Gatinho! Não perca! ⏰"
- **Conteúdo**: Urgência, última oportunidade de conexão

## 🛠️ Como Funciona

### 1. Agendamento Automático
Quando um usuário se cadastra no plano trial, o sistema automaticamente agenda 3 emails:

```javascript
// No SignupPage.tsx
if (isTrialPlan && user?.id) {
  // Agenda email inicial (+2 minutos)
  // Agenda email dia 2 (22h do dia seguinte)
  // Agenda email dia 3 (22h do dia posterior)
}
```

### 2. Processamento Manual
Os emails são processados por um script Node.js que deve ser executado periodicamente:

```bash
# Executar a cada 5 minutos via cron job
node welcome-email-scheduler.js
```

### 3. Templates Sedutores
Cada email contém:
- **Foto da Isa** como cabeçalho
- **Saudação personalizada** ("Oi Gatinho [Nome]!")
- **Conteúdo sedutor** com linguagem apaixonada
- **Call-to-action** para iniciar chat/chamada
- **Menção aos créditos gratuitos**

## 🚀 Configuração

### 1. Instalar Dependências
```bash
npm install --save-dev dotenv
```

### 2. Configurar Variáveis de Ambiente
```env
# No arquivo .env
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=isa@isadate.online
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
```

### 3. Aplicar Migration
```bash
npx supabase db push
```

### 4. Executar Script de Emails
```bash
# Teste manual
node welcome-email-scheduler.js

# Produção: configurar cron job
# Executar a cada 5 minutos
*/5 * * * * cd /path/to/project && node welcome-email-scheduler.js
```

## 📊 Monitoramento

### Verificar Emails Agendados
```sql
SELECT * FROM welcome_email_schedule
WHERE sent_at IS NULL
ORDER BY scheduled_at ASC;
```

### Verificar Emails Enviados
```sql
SELECT * FROM welcome_email_schedule
WHERE sent_at IS NOT NULL
ORDER BY sent_at DESC;
```

### Logs do Script
O script gera logs detalhados:
- ✅ Emails enviados com sucesso
- ❌ Erros de envio
- 📊 Estatísticas de processamento

## 🎨 Personalização

### Modificar Templates
Edite a função `getEmailTemplate()` no arquivo `welcome-email-scheduler.js`:

```javascript
case 1: // Email inicial
  return baseTemplate(
    "Seu Assunto Personalizado",
    `Oi ${userName}!`,
    `Seu conteúdo sedutor aqui...`,
    "Seu CTA personalizado"
  )
```

### Alterar Horários
Modifique os horários no `SignupPage.tsx`:

```javascript
// Alterar para 20h ao invés de 22h
tomorrow.setHours(20, 0, 0, 0); // 20:00 BR
```

## 🔧 Troubleshooting

### Emails não estão sendo enviados
1. Verificar se o script está rodando
2. Checar logs do script
3. Confirmar variáveis de ambiente
4. Verificar quota do Resend

### Emails indo para spam
1. Configurar DKIM/SPF no domínio
2. Usar endereço de remetente consistente
3. Melhorar conteúdo dos emails

### Erro de fuso horário
O sistema usa horário UTC. Para ajustar:
```javascript
// Para horário de Brasília (UTC-3)
brazilTime.setHours(hour - 3);
```

## 📈 Métricas de Sucesso

- **Taxa de abertura** dos emails
- **Cliques nos CTAs**
- **Conversões** para chamadas de voz
- **Retenção** de usuários trial

---

**Nota**: Este sistema é independente do Supabase Auth e usa apenas o Resend para envio de emails, evitando limitações de quota.