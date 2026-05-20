// src/lib/brevo.ts

// ─────────────────────────────────────────────
// Cliente de email via Brevo (Sendinblue) API v3
// ─────────────────────────────────────────────

const BREVO_API_KEY = process.env.BREVO_API_KEY!;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL ?? "noreply@rcbambiental.com.br";
const SENDER_NAME = process.env.BREVO_SENDER_NAME ?? "ICMS-ECO";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

interface EmailRecipient {
  email: string;
  name?: string;
}

interface SendEmailOptions {
  to: EmailRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
}

async function sendEmail(opts: SendEmailOptions): Promise<void> {
  if (!BREVO_API_KEY) {
    console.warn("[brevo] BREVO_API_KEY não configurada — email não enviado:", opts.subject);
    return;
  }

  const body = {
    sender: { email: SENDER_EMAIL, name: SENDER_NAME },
    to: opts.to,
    subject: opts.subject,
    htmlContent: opts.htmlContent,
    textContent: opts.textContent,
  };

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[brevo] Erro ao enviar email:", err);
    throw new Error(`Falha ao enviar email: ${res.status}`);
  }
}

// ─────────────────────────────────────────────
// Template base HTML
// ─────────────────────────────────────────────

function baseTemplate(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
    .header { background: #166534; padding: 24px 32px; }
    .header h1 { color: #fff; margin: 0; font-size: 18px; font-weight: 600; }
    .header p { color: #bbf7d0; margin: 4px 0 0; font-size: 13px; }
    .content { padding: 32px; color: #334155; line-height: 1.6; }
    .content h2 { color: #0f172a; font-size: 16px; margin-top: 0; }
    .btn { display: inline-block; background: #16a34a; color: #fff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin: 16px 0; }
    .info-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 16px 0; }
    .alert-box { background: #fefce8; border: 1px solid #fde047; border-radius: 6px; padding: 16px; margin: 16px 0; }
    .footer { padding: 16px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌿 ICMS Ecológico</h1>
      <p>Sistema de Gestão do Selo Ambiental — Icms-Eco</p>
    </div>
    <div class="content">
      ${body}
    </div>
    <div class="footer">
      Este email foi gerado automaticamente pelo sistema ICMS-ECO. Não responda a este email.
    </div>
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────
// Templates específicos
// ─────────────────────────────────────────────

/** Novo funcionário — credenciais de acesso */
export async function sendWelcomeEmail(opts: {
  to: EmailRecipient;
  tempPassword: string;
}): Promise<void> {
  const html = baseTemplate(
    "Seu acesso ao sistema ICMS Ecológico",
    `
    <h2>Bem-vindo(a) ao sistema ICMS-ECO!</h2>
    <p>Sua conta foi criada pela equipe Icms-Eco. Use as credenciais abaixo para acessar o sistema:</p>
    <div class="info-box">
      <strong>E-mail:</strong> ${opts.to.email}<br />
      <strong>Senha provisória:</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:3px;font-size:14px;">${opts.tempPassword}</code>
    </div>
    <p>Ao fazer login pela primeira vez, você será solicitado(a) a criar uma nova senha.</p>
    <a class="btn" href="${APP_URL}/login">Acessar o sistema</a>
    <p style="font-size:13px;color:#64748b;">Se você não esperava este email, entre em contato com a administração da Icms-Eco.</p>
    `
  );

  await sendEmail({
    to: [opts.to],
    subject: "Seu acesso ao sistema ICMS Ecológico",
    htmlContent: html,
  });
}

/** Admin: nova evidência adicionada */
export async function sendEvidenceUploadedEmail(opts: {
  to: EmailRecipient[];
  municipalityName: string;
  criterionId: string;
  criterionDesc: string;
  uploadedBy: string;
}): Promise<void> {
  const html = baseTemplate(
    `Nova evidência — ${opts.municipalityName}`,
    `
    <h2>Nova evidência adicionada</h2>
    <p><strong>${opts.uploadedBy}</strong> adicionou uma evidência para o município <strong>${opts.municipalityName}</strong>.</p>
    <div class="info-box">
      <strong>Critério:</strong> ${opts.criterionId} — ${opts.criterionDesc}
    </div>
    <a class="btn" href="${APP_URL}/municipio">Revisar no sistema</a>
    `
  );

  await sendEmail({
    to: opts.to,
    subject: `Nova evidência adicionada — ${opts.municipalityName} [${opts.criterionId}]`,
    htmlContent: html,
  });
}

/** Funcionário: evidência devolvida */
export async function sendEvidenceReturnedEmail(opts: {
  to: EmailRecipient;
  criterionId: string;
  criterionDesc: string;
  returnReason: string;
  municipalityName: string;
}): Promise<void> {
  const html = baseTemplate(
    `Evidência devolvida — ${opts.criterionId}`,
    `
    <h2>Uma evidência foi devolvida para revisão</h2>
    <p>O administrador devolveu uma evidência do município <strong>${opts.municipalityName}</strong> para que você faça as correções necessárias.</p>
    <div class="alert-box">
      <strong>Critério:</strong> ${opts.criterionId} — ${opts.criterionDesc}<br />
      <strong>Motivo:</strong> ${opts.returnReason}
    </div>
    <p>Acesse o sistema, faça as correções indicadas e envie novamente.</p>
    <a class="btn" href="${APP_URL}/municipio">Acessar o sistema</a>
    `
  );

  await sendEmail({
    to: [opts.to],
    subject: `Evidência devolvida para revisão — ${opts.criterionId}`,
    htmlContent: html,
  });
}

/** Prazo do certame se aproximando */
export async function sendCertameDeadlineEmail(opts: {
  to: EmailRecipient[];
  certameYear: number;
  daysLeft: number;
  deadline: string;
}): Promise<void> {
  const icon = opts.daysLeft <= 7 ? "🔴" : opts.daysLeft <= 15 ? "🟡" : "🟠";
  const html = baseTemplate(
    `${icon} Faltam ${opts.daysLeft} dias para o certame ${opts.certameYear}`,
    `
    <h2>${icon} Atenção: prazo se aproximando</h2>
    <p>O certame <strong>${opts.certameYear}</strong> será encerrado em <strong>${opts.deadline}</strong>.</p>
    <div class="alert-box">
      Faltam apenas <strong>${opts.daysLeft} dias</strong> para o fechamento do certame. Verifique se todas as evidências estão devidamente preenchidas e validadas.
    </div>
    <a class="btn" href="${APP_URL}/admin">Ver painel geral</a>
    `
  );

  await sendEmail({
    to: opts.to,
    subject: `⚠️ Faltam ${opts.daysLeft} dias para o certame ${opts.certameYear}`,
    htmlContent: html,
  });
}

/** Certame aberto */
export async function sendCertameOpenedEmail(opts: {
  to: EmailRecipient[];
  certameYear: number;
  periodoInicio: string;
  periodoFim: string;
}): Promise<void> {
  const html = baseTemplate(
    `Certame ${opts.certameYear} aberto`,
    `
    <h2>🚀 Novo certame aberto!</h2>
    <p>O certame <strong>${opts.certameYear}</strong> foi aberto. Inicie a documentação dos municípios sob sua responsabilidade.</p>
    <div class="info-box">
      <strong>Período de apuração:</strong> ${opts.periodoInicio} a ${opts.periodoFim}
    </div>
    <a class="btn" href="${APP_URL}">Acessar o sistema</a>
    `
  );

  await sendEmail({
    to: opts.to,
    subject: `Certame ${opts.certameYear} aberto — iniciem a documentação`,
    htmlContent: html,
  });
}