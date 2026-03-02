/**
 * Envoi d'emails transactionnels via Resend (API REST).
 * Compatible Cloudflare Workers — aucun SDK Node requis.
 * Doc: https://resend.com/docs/api-reference/emails/send-email
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(
  payload: EmailPayload,
  resendApiKey: string | undefined,
): Promise<{ ok: boolean; error?: string }> {
  if (!resendApiKey) {
    // En développement sans clé, log le lien dans la console
    console.warn('[email] RESEND_API_KEY absent — email non envoyé (dev mode)');
    return { ok: false, error: 'RESEND_API_KEY_MISSING' };
  }

  const from = payload.from ?? 'Capitune <no-reply@capitune.com>';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => `HTTP ${res.status}`);
      console.error('[email] Resend API error:', err);
      return { ok: false, error: err };
    }

    return { ok: true };
  } catch (e) {
    console.error('[email] Erreur réseau:', e);
    return { ok: false, error: String(e) };
  }
}

/** Template HTML de l'email de vérification */
export function buildVerificationEmail(name: string, verifyUrl: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Vérifiez votre courriel — Capitune</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,.08);">

        <!-- En-tête -->
        <tr><td style="background:#1f4b6e;padding:28px 36px;text-align:center;">
          <span style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:.5px;">Capitune</span>
        </td></tr>

        <!-- Corps -->
        <tr><td style="padding:36px 40px;">
          <h2 style="margin:0 0 16px;color:#1f4b6e;font-size:20px;font-weight:700;">
            Confirmez votre adresse courriel
          </h2>
          <p style="margin:0 0 12px;color:#444;font-size:15px;line-height:1.6;">
            Bonjour <strong>${escHtml(name)}</strong>,
          </p>
          <p style="margin:0 0 28px;color:#555;font-size:15px;line-height:1.7;">
            Bienvenue sur Capitune ! Pour activer votre compte et accéder à tous nos services,
            veuillez confirmer votre adresse courriel en cliquant sur le bouton ci-dessous.
          </p>
          <div style="text-align:center;margin-bottom:28px;">
            <a href="${verifyUrl}"
               style="display:inline-block;background:#e87722;color:#ffffff;text-decoration:none;
                      font-size:15px;font-weight:700;padding:15px 40px;border-radius:8px;
                      letter-spacing:.3px;">
              ✅&nbsp;&nbsp;Vérifier mon compte
            </a>
          </div>
          <p style="margin:0 0 6px;color:#999;font-size:12px;text-align:center;">
            Ce lien expire dans <strong>24 heures</strong>.
          </p>
          <p style="margin:0;color:#bbb;font-size:11px;text-align:center;word-break:break-all;">
            Lien alternatif&nbsp;:
            <a href="${verifyUrl}" style="color:#e87722;">${verifyUrl}</a>
          </p>
        </td></tr>

        <!-- Pied de page -->
        <tr><td style="background:#f8f9fa;padding:18px 40px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;color:#aaa;font-size:12px;">
            Si vous n'avez pas créé de compte sur Capitune, ignorez simplement cet email.
          </p>
          <p style="margin:6px 0 0;color:#ccc;font-size:11px;">
            © ${new Date().getFullYear()} Capitune — Tous droits réservés
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escHtml(s: string): string {
  return String(s || '').replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;'
  );
}
