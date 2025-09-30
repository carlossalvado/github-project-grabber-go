// API Proxy para envio de emails via Amazon SES
// Este arquivo pode ser usado no Vercel Functions ou similar

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

    // Criar transporter SMTP
    const transporter = nodemailer.createTransporter({
      host: smtpHost,
      port: smtpPort,
      secure: false, // true para 465, false para outras portas
      auth: {
        user: smtpUsername,
        pass: smtpPassword,
      },
      tls: {
        ciphers: 'SSLv3'
      }
    });

    // Verificar conexão
    await transporter.verify();

    // Enviar email
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