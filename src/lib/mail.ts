// src/lib/mail.ts

interface Recipient {
  email: string;
  name: string;
}

interface CertameOpenedEmailParams {
  to: Recipient[];
  certameYear: number;
  periodoInicio: string;
  periodoFim: string;
}

export async function sendCertameOpenedEmail({
  to,
  certameYear,
  periodoInicio,
  periodoFim,
}: CertameOpenedEmailParams) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.warn("[mail] BREVO_API_KEY não configurada");
    return;
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: {
        name: "ICMS ECO",
        email: process.env.MAIL_FROM ?? "no-reply@icmseco.local",
      },

      to: to.map((u) => ({
        email: u.email,
        name: u.name,
      })),

      subject: `Novo certame ${certameYear} disponível`,

      htmlContent: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6">
          <h2>🌿 Novo certame disponível</h2>

          <p>
            O certame <strong>${certameYear}</strong> foi aberto no sistema ICMS ECO.
          </p>

          <p>
            <strong>Período de apuração:</strong><br />
            ${periodoInicio} até ${periodoFim}
          </p>

          <p>
            Acesse o sistema para iniciar o preenchimento dos critérios e envio das evidências.
          </p>

          <hr />

          <small>Sistema ICMS ECO · Uso interno</small>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const err = await response.text();

    console.error("[mail] Brevo error:", err);

    throw new Error("Falha ao enviar email");
  }

  return response.json();
}