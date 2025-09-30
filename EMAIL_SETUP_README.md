# Configuração de Email - Resend API

Este documento explica como configurar o sistema de verificação de email usando **Resend API** (recomendado) ou Amazon SES como alternativa para o projeto Isa Date.

## ✅ Status Atual

**✅ IMPLEMENTADO**: Sistema de verificação de email usando Resend API
- Função Supabase configurada
- Página de cadastro atualizada com fluxo em 3 etapas
- Tabela `email_verifications` criada
- Checkbox de consentimento para marketing adicionado

## 📋 Pré-requisitos

### Para Resend (Recomendado)
- Conta gratuita no [Resend](https://resend.com)
- Domínio `isadate.online` verificado
- API Key do Resend

### Para Amazon SES (Alternativa)
- Conta AWS ativa
- Domínio verificado no Amazon SES
- Email `isabela@mail.isadate.online` configurado como remetente verificado

## ⚡ Configuração Completa - Resend (Recomendado)

### 1. Configure seu domínio no Resend
1. Acesse [resend.com](https://resend.com) e faça login
2. No painel lateral, clique em **"Domains"**
3. Clique em **"Add Domain"**
4. Digite: `isadate.online`
5. Clique em **"Add Domain"**

### 2. Verificar se o domínio está disponível
**IMPORTANTE**: Se não aparecer registros DNS, pode significar:
- O domínio já está sendo usado por outro serviço (como Amazon SES)
- O domínio não está registrado ou não pertence a você
- Há um conflito de configuração

### 3. Solução Alternativa: Usar domínio do Resend
Para começar rapidamente, você pode usar o domínio padrão do Resend:

```env
FROM_EMAIL=noreply@resend.dev
```

**Vantagens:**
- ✅ Funciona imediatamente (sem verificação)
- ✅ 100 emails grátis por mês
- ✅ Não precisa configurar DNS

**Limitações:**
- O remetente será `noreply@resend.dev`
- Para usar `isa@isadate.online`, precisa verificar o domínio

### 4. Se quiser usar seu domínio
Se o domínio `isadate.online` estiver bloqueado pelo Amazon SES:
1. Remova a configuração do Amazon SES primeiro
2. Ou use um subdomínio diferente: `mail.isadate.online`
3. Ou use o domínio do Resend temporariamente

### 3. Configure o email de envio
Após verificar o domínio, você pode usar qualquer email @isadate.online como remetente.

### 4. Configure as variáveis de ambiente
```env
# Arquivo .env.local
RESEND_API_KEY=re_jNMkyood_25gfeeTGXcjJGkxdqHT4si2S
FROM_EMAIL=isa@isadate.online
```

### 2. Deploy da função Edge Function
No painel do Supabase > Edge Functions:

1. Clique em **"Create a new function"**
2. **Nome**: `send-verification-code`
3. **Código**: Cole o conteúdo do arquivo `supabase/functions/send-verification-code/index.ts`
4. Clique em **"Deploy function"**

### 3. Configure as variáveis de ambiente
No painel do Supabase > Settings > Edge Functions:

```env
RESEND_API_KEY=re_jNMkyood_25gfeeTGXcjJGkxdqHT4si2S
FROM_EMAIL=isa@mail.isadate.online
SUPABASE_URL=https://hedxxbsieoazrmbayzab.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Aplique a migration do banco
```bash
npx supabase db push
```

### 5. Teste a função
```bash
node test-email-function.js
```

**✅ Pronto!** O sistema está configurado e funcionando.

## 🚀 Passo a Passo - Configuração Amazon SES (Alternativa)

### 1. Acesse o Amazon SES Console
1. Faça login na sua conta AWS
2. Navegue para **Amazon SES** no console AWS
3. Selecione a região `us-east-1` (N. Virginia) - importante para compatibilidade

### 2. Verifique seu Domínio/Email
1. No menu lateral, clique em **Verified identities**
2. Clique em **Create identity**
3. Selecione **Email address** e digite: `isabela@mail.isadate.online`
4. Clique em **Create identity**
5. **IMPORTANTE**: Confirme a verificação clicando no link enviado para o email

### 3. Configure SMTP Credentials
1. No menu lateral, clique em **SMTP settings**
2. Clique em **Create SMTP credentials**
3. Crie um usuário IAM específico para SMTP (ex: `ses-smtp-user`)
4. **ANOTE** as credenciais geradas:
   - **SMTP Username**: (será algo como `AKIA...`)
   - **SMTP Password**: (senha específica para SMTP)

### 4. Saia do Modo Sandbox (Produção)
1. No menu lateral, clique em **Account dashboard**
2. Se estiver em **Sandbox mode**, clique em **Request production access**
3. Preencha o formulário de solicitação
4. Aguarde aprovação (pode levar algumas horas)

## 🔧 Configuração do Projeto

### 1. Crie o arquivo `.env`
```bash
cp .env.example .env
```

### 2. Configure as variáveis de ambiente
```env
# Amazon SES SMTP Configuration
VITE_SMTP_HOST=email-smtp.us-east-1.amazonaws.com
VITE_SMTP_PORT=587
VITE_SMTP_USERNAME=AKIA... # Seu SMTP Username
VITE_SMTP_PASSWORD=your-smtp-password # Sua SMTP Password

# Email Proxy API (crie uma API simples em Vercel/Netlify)
VITE_EMAIL_PROXY_URL=https://your-email-proxy.vercel.app/api/send-email
```

## 📧 Opção 1: Usando Resend (Recomendado - Mais Simples)

### 1. Crie uma conta no Resend
1. Acesse [resend.com](https://resend.com) e crie uma conta gratuita
2. Verifique seu domínio de email (ex: `isadate.online`)
3. Obtenha sua API Key no dashboard

### 2. Configure as variáveis de ambiente
```env
# No arquivo supabase/.env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=isa@isadate.online
```

### 3. Vantagens do Resend
- ✅ Mais simples de configurar
- ✅ Não precisa de proxy personalizado
- ✅ 100 emails grátis por mês
- ✅ Melhor deliverability
- ✅ Suporte nativo a templates

## 🌐 Opção 2: Criando a API Proxy (Vercel) - Alternativa
```bash
npm install -g vercel
vercel
```

### 2. Crie a estrutura do projeto
```
email-proxy/
├── api/
│   └── send-email.js
├── package.json
└── vercel.json
```

### 3. Arquivo `api/send-email.js`
```javascript
const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      smtpHost,
      smtpPort,
      smtpUsername,
      smtpPassword,
      from,
      to,
      subject,
      html
    } = req.body;

    const transporter = nodemailer.createTransporter({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: {
        user: smtpUsername,
        pass: smtpPassword,
      },
      tls: {
        ciphers: 'SSLv3'
      }
    });

    await transporter.verify();

    const info = await transporter.sendMail({
      from: from,
      to: to,
      subject: subject,
      html: html,
    });

    console.log('Email enviado:', info.messageId);

    res.status(200).json({
      success: true,
      message: 'Email enviado com sucesso',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Erro ao enviar email:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar email',
      error: error.message
    });
  }
}
```

### 4. Arquivo `package.json`
```json
{
  "name": "email-proxy",
  "version": "1.0.0",
  "main": "api/send-email.js",
  "dependencies": {
    "nodemailer": "^6.9.7"
  }
}
```

### 5. Arquivo `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/send-email.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/send-email",
      "dest": "/api/send-email.js"
    }
  ]
}
```

### 6. Deploy no Vercel
```bash
cd email-proxy
npm install
vercel --prod
```

### 7. Atualize o `.env` com a URL do Vercel
```env
VITE_EMAIL_PROXY_URL=https://your-project-name.vercel.app/api/send-email
```

## 🔄 Fluxo de Cadastro

1. **Passo 1**: Usuário insere nome e email
2. **Passo 2**: Sistema gera código de 6 dígitos e envia por email
3. **Passo 3**: Usuário confirma o código (válido por 10 minutos)
4. **Passo 4**: Usuário completa cadastro (senha, termos, etc.)
5. **Passo 5**: Sistema cria conta no Supabase
6. **Passo 6**: Sistema envia email de boas-vindas

## 📧 Templates de Email

### Email de Confirmação
- **Assunto**: "Confirme seu email - Isa Date"
- **Conteúdo**: Código de 6 dígitos, instruções, aviso de expiração

### Email de Boas-vindas
- **Assunto**: "Bem-vindo ao Isa Date! 🎉"
- **Conteúdo**: Boas-vindas, próximos passos, recursos disponíveis

## 🐛 Troubleshooting

### Erro: "Email not verified"
- Verifique se o email `isabela@mail.isadate.online` está verificado no SES

### Erro: "SMTP Authentication failed"
- Verifique as credenciais SMTP
- Certifique-se de que não está no modo sandbox

### Erro: "Daily sending quota exceeded"
- Verifique os limites de envio no SES Dashboard
- Solicite aumento de quota se necessário

### Emails indo para spam
- Configure DKIM, SPF e DMARC no seu domínio
- Use um endereço de remetente consistente

## 📊 Monitoramento

### Amazon SES Console
- **Sending statistics**: Taxa de entrega, bounces, complaints
- **Reputation metrics**: Monitoramento de reputação
- **Suppression list**: Emails que rejeitaram mensagens

### Logs de Aplicação
- Verifique os logs do Vercel para erros de envio
- Monitor de sucesso/falha de emails

## 💰 Custos

- **Amazon SES**: $0.10 por 1.000 emails (primeiros 62.000/mês grátis)
- **Vercel**: Plano gratuito inclui 100GB bandwidth/mês
- **Domínio**: Custo do registro do domínio

## 🔒 Segurança

- Nunca exponha credenciais SMTP no código frontend
- Use HTTPS para todas as comunicações
- Implemente rate limiting na API proxy
- Monitore tentativas de abuso

---

**Nota**: Este sistema mantém o cadastro no Supabase intacto, apenas adiciona verificação de email antes do cadastro ser processado.