/**
 * Vercel Serverless Function: Envio de Notificação de Briefing via Resend API
 * Dispara um e-mail com layout executivo da QLS para o administrador quando um participante conclui o briefing.
 */

export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  try {
    const { 
      projectName, 
      clientCompany, 
      respondentName, 
      respondentEmail, 
      respondentPhone, 
      respondentRole, 
      answersSummary,
      recipientEmail
    } = req.body || {};

    if (!projectName || !respondentName || !respondentEmail) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes no corpo da requisição.' });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const toEmail = recipientEmail || process.env.ADMIN_NOTIFICATION_EMAIL || 'douglas@qls.com.au';
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Central QLS <onboarding@resend.dev>';

    // Se a chave da Resend não estiver configurada no ambiente da Vercel
    if (!resendApiKey) {
      console.warn('⚠️ RESEND_API_KEY não configurada no ambiente. Simulando envio bem-sucedido.');
      return res.status(200).json({
        success: true,
        simulated: true,
        message: 'Resumo registrado. Para receber no seu e-mail real, adicione a RESEND_API_KEY nas variáveis de ambiente da Vercel.',
        preview: {
          to: toEmail,
          subject: `[Central QLS] Novo Briefing: ${projectName} - ${respondentName} (${respondentRole || 'Participante'})`,
          respondent: { name: respondentName, email: respondentEmail, role: respondentRole }
        }
      });
    }

    // Montar o HTML com a identidade de luxo da QLS
    const sectionsHtml = (answersSummary || []).map(section => `
      <div style="margin-bottom: 24px; background: #141311; border: 1px solid #2e2b26; border-radius: 8px; padding: 18px;">
        <h3 style="color: #c9a84c; margin: 0 0 12px 0; font-size: 16px; text-transform: uppercase; letter-spacing: 0.05em;">
          ${section.sectionTitle || 'Bloco Temático'}
        </h3>
        ${(section.items || []).map(item => `
          <div style="margin-bottom: 12px; border-bottom: 1px solid #23201b; padding-bottom: 8px;">
            <p style="color: #9a9590; font-size: 13px; margin: 0 0 4px 0; font-weight: 600;">${item.questionTitle}</p>
            <p style="color: #f8f6f2; font-size: 14px; margin: 0; line-height: 1.5;">${item.answerText || 'Não respondido'}</p>
          </div>
        `).join('')}
      </div>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Novo Briefing Recebido - QLS</title>
      </head>
      <body style="margin: 0; padding: 30px; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #e4e0da;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 650px; margin: 0 auto; background: #100f0d; border: 1px solid #3a3632; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="padding: 30px; background: linear-gradient(180deg, #181613 0%, #100f0d 100%); border-bottom: 1px solid #c9a84c;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #c9a84c; font-weight: 700;">QLS Lighting Australia • Central de Projetos</span>
                  <h1 style="color: #f8f6f2; margin: 6px 0 0 0; font-size: 24px; font-weight: 700;">Novo Briefing Concluído</h1>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <div style="background: rgba(201, 168, 76, 0.08); border-left: 3px solid #c9a84c; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #c9a84c; font-weight: 600;">PROJETO: ${projectName}</p>
                <p style="margin: 0; font-size: 13px; color: #9a9590;">Empresa / Cliente: <strong style="color: #f8f6f2;">${clientCompany || 'QLS Lighting'}</strong></p>
              </div>

              <h2 style="color: #f8f6f2; font-size: 16px; margin: 0 0 12px 0; border-bottom: 1px solid #23201b; padding-bottom: 6px;">
                👤 Dados do Respondente
              </h2>
              <table width="100%" style="margin-bottom: 24px; font-size: 14px;">
                <tr>
                  <td style="color: #9a9590; padding: 4px 0; width: 120px;">Nome:</td>
                  <td style="color: #f8f6f2; font-weight: 600;">${respondentName}</td>
                </tr>
                <tr>
                  <td style="color: #9a9590; padding: 4px 0;">Cargo / Papel:</td>
                  <td style="color: #c9a84c; font-weight: 600;">${respondentRole}</td>
                </tr>
                <tr>
                  <td style="color: #9a9590; padding: 4px 0;">E-mail:</td>
                  <td style="color: #f8f6f2;">${respondentEmail}</td>
                </tr>
                <tr>
                  <td style="color: #9a9590; padding: 4px 0;">WhatsApp:</td>
                  <td style="color: #f8f6f2;">${respondentPhone || 'Não informado'}</td>
                </tr>
              </table>

              <h2 style="color: #f8f6f2; font-size: 16px; margin: 0 0 16px 0; border-bottom: 1px solid #23201b; padding-bottom: 6px;">
                📋 Resumo das Respostas do Participante
              </h2>
              ${sectionsHtml}

              <div style="text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #23201b;">
                <a href="https://roadmap-qls.vercel.app/central-qls" style="display: inline-block; background: #c9a84c; color: #0a0a0a; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">
                  Acessar Matriz Comparativa na Central QLS →
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background: #0a0a0a; border-top: 1px solid #1a1814; text-align: center; font-size: 12px; color: #6f6a64;">
              © ${new Date().getFullYear()} QLS Lighting Australia Pty Ltd. Sistema de Briefing & Arquitetura Digital.
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Disparar requisição para a API da Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: `[Central QLS] Novo Briefing: ${projectName} - ${respondentName} (${respondentRole})`,
        html: emailHtml
      })
    });

    const data = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Erro na API da Resend:', data);
      return res.status(500).json({ error: 'Erro ao disparar e-mail via Resend', details: data });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Erro no handler de e-mail:', error);
    return res.status(500).json({ error: 'Erro interno ao processar notificação de e-mail', message: error.message });
  }
}
