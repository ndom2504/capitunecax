const DEFAULT_ADMIN_EMAILS = ['info@misterdil.ca', 'divinegismille@gmail.com'];

function normalizeEmail(value: unknown): string {
  return String(value ?? '').toLowerCase().trim();
}

export function parseAdminEmails(raw: unknown): string[] {
  const text = String(raw ?? '').trim();
  if (!text) return [];

  const parts = text
    .split(/[\s,;]+/g)
    .map((p) => normalizeEmail(p))
    .filter(Boolean);

  return Array.from(new Set(parts));
}

let cachedAdminEmails: string[] | null = null;

export function getAdminEmails(): string[] {
  if (cachedAdminEmails) return cachedAdminEmails;
  const parsed = parseAdminEmails((import.meta as any).env?.ADMIN_EMAILS);
  cachedAdminEmails = parsed.length ? parsed : DEFAULT_ADMIN_EMAILS;
  return cachedAdminEmails;
}

export function isAdminEmail(email: unknown): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return getAdminEmails().includes(normalized);
}

export function effectiveRoleForUser(user: { email: string; role?: string } | null): 'admin' | 'client' {
  if (!user) return 'client';
  if (user.role === 'admin') return 'admin';
  return isAdminEmail(user.email) ? 'admin' : 'client';
}
