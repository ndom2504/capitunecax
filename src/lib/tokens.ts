/**
 * Génération de tokens de vérification sécurisés.
 * Compatible Cloudflare Workers (pas de crypto Node).
 */

/** Génère un token 32 octets = 64 caractères hexadécimaux */
export function generateVerificationToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Construit l'URL de vérification absolue */
export function buildVerifyUrl(requestUrl: string, token: string, email: string): string {
  const origin = new URL(requestUrl).origin;
  return `${origin}/api/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
}
