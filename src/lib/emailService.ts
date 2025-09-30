// Serviço de envio de emails usando Amazon SES via SMTP API
interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

class EmailService {
  private smtpHost: string;
  private smtpPort: number;
  private smtpUsername: string;
  private smtpPassword: string;
  private fromEmail: string;

  constructor() {
    // Configurações do Amazon SES SMTP
    this.smtpHost = import.meta.env.VITE_SMTP_HOST || 'email-smtp.us-east-1.amazonaws.com';
    this.smtpPort = parseInt(import.meta.env.VITE_SMTP_PORT || '587');
    this.smtpUsername = import.meta.env.VITE_SMTP_USERNAME || '';
    this.smtpPassword = import.meta.env.VITE_SMTP_PASSWORD || '';
    this.fromEmail = 'isabela@mail.isadate.online';
  }

  // Método auxiliar para criar MIME email
  private createMimeEmail(data: EmailData): string {
    const boundary = '----=_NextPart_' + Date.now();
    const emailBody = [
      `From: Isa Date <${this.fromEmail}>`,
      `To: ${data.to}`,
      `Subject: =?UTF-8?B?${btoa(data.subject).replace(/=+$/, '')}?=`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      data.html,
      '',
      `--${boundary}--`,
      ''
    ].join('\r\n');

    return emailBody;
  }

  async sendEmail(data: EmailData): Promise<{ success: boolean; message: string }> {
    // Como o navegador não permite conexões SMTP diretas, usaremos uma API proxy
    // Você precisa criar uma API simples (Vercel, Netlify, etc.) que faça a ponte

    const apiUrl = import.meta.env.VITE_EMAIL_PROXY_URL || 'https://your-email-proxy.vercel.app/api/send-email';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          smtpHost: this.smtpHost,
          smtpPort: this.smtpPort,
          smtpUsername: this.smtpUsername,
          smtpPassword: this.smtpPassword,
          from: this.fromEmail,
          to: data.to,
          subject: data.subject,
          html: data.html,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      throw error;
    }
  }

  // Método específico para email de confirmação
  async sendConfirmationEmail(email: string, confirmationCode: string, fullName?: string): Promise<{ success: boolean; message: string }> {
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirme seu email - Isa Date</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f8f9fa;
            padding: 20px;
          }
          .container {
            background-color: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            width: 80px;
            height: 80px;
            background-color: #ec4899;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            color: white;
            font-size: 36px;
            font-weight: bold;
          }
          .title {
            color: #ec4899;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #6b7280;
            font-size: 16px;
            margin-bottom: 30px;
          }
          .code-container {
            background-color: #f3f4f6;
            border: 2px dashed #ec4899;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
          }
          .code {
            font-size: 32px;
            font-weight: bold;
            color: #ec4899;
            letter-spacing: 4px;
            font-family: 'Courier New', monospace;
          }
          .instructions {
            color: #4b5563;
            margin: 20px 0;
            line-height: 1.7;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
          .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">💕</div>
            <h1 class="title">Isa Date</h1>
            <p class="subtitle">Confirme seu endereço de email</p>
          </div>

          <p>Olá${fullName ? ` ${fullName}` : ''},</p>

          <p>Obrigado por se cadastrar no <strong>Isa Date</strong>! Para continuar criando sua conta e começar sua jornada romântica, precisamos confirmar seu endereço de email.</p>

          <div class="code-container">
            <p style="margin: 0 0 15px 0; color: #374151; font-weight: 600;">Seu código de confirmação:</p>
            <div class="code">${confirmationCode}</div>
          </div>

          <div class="instructions">
            <p><strong>Como confirmar:</strong></p>
            <ol style="padding-left: 20px;">
              <li>Copie o código acima</li>
              <li>Cole no campo de confirmação no site</li>
              <li>Continue com seu cadastro</li>
            </ol>
          </div>

          <div class="warning">
            <strong>⚠️ Importante:</strong> Este código é válido por 10 minutos. Se você não solicitou este email, ignore esta mensagem.
          </div>

          <p>Estamos ansiosos para te ajudar a encontrar sua conexão especial! 💕</p>

          <p>Atenciosamente,<br>
          <strong>Equipe Isa Date</strong></p>

          <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
            <p>© 2024 Isa Date. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Confirme seu email - Isa Date',
      html: html,
    });
  }

  // Método específico para email de boas-vindas
  async sendWelcomeEmail(email: string, fullName?: string): Promise<{ success: boolean; message: string }> {
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo ao Isa Date!</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f8f9fa;
            padding: 20px;
          }
          .container {
            background-color: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            width: 80px;
            height: 80px;
            background-color: #ec4899;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            color: white;
            font-size: 36px;
            font-weight: bold;
          }
          .title {
            color: #ec4899;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #6b7280;
            font-size: 16px;
            margin-bottom: 30px;
          }
          .welcome-message {
            font-size: 18px;
            color: #374151;
            margin: 30px 0;
            line-height: 1.7;
          }
          .features {
            background-color: #f3f4f6;
            border-radius: 8px;
            padding: 25px;
            margin: 30px 0;
          }
          .feature-item {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
          }
          .feature-icon {
            width: 24px;
            height: 24px;
            background-color: #ec4899;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            margin-right: 15px;
            font-size: 14px;
          }
          .cta-button {
            display: inline-block;
            background-color: #ec4899;
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            text-align: center;
            margin: 30px 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">💕</div>
            <h1 class="title">Bem-vindo ao Isa Date!</h1>
            <p class="subtitle">Sua jornada romântica começa agora</p>
          </div>

          <div class="welcome-message">
            <p>Olá${fullName ? ` ${fullName}` : ''},</p>

            <p>Seja muito bem-vindo ao <strong>Isa Date</strong>! 🎉</p>

            <p>Estamos emocionados em ter você conosco. Prepare-se para viver conversas autênticas e conexões reais em um ambiente seguro e acolhedor.</p>
          </div>

          <div class="features">
            <h3 style="margin-bottom: 20px; color: #374151;">O que você pode fazer agora:</h3>

            <div class="feature-item">
              <div class="feature-icon">💬</div>
              <span>Iniciar conversas por texto com a Isa</span>
            </div>

            <div class="feature-item">
              <div class="feature-icon">🎤</div>
              <span>Experimentar mensagens de voz (com créditos)</span>
            </div>

            <div class="feature-item">
              <div class="feature-icon">📸</div>
              <span>Receber fotos diárias exclusivas</span>
            </div>

            <div class="feature-item">
              <div class="feature-icon">🎁</div>
              <span>Enviar presentes virtuais especiais</span>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="https://isadate.online" class="cta-button">
              Começar Minha Jornada Romântica
            </a>
          </div>

          <p style="text-align: center; color: #6b7280; margin-top: 30px;">
            Dúvidas? Nossa equipe está aqui para ajudar.<br>
            Entre em contato: suporte@mail.isadate.online
          </p>

          <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
            <p>© 2024 Isa Date. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Bem-vindo ao Isa Date! 🎉',
      html: html,
    });
  }
}

export const emailService = new EmailService();