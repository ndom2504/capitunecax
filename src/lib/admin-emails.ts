const DEFAULT_ADMIN_EMAILS = ['info@misterdil.ca', 'divinegismille@gmail.com'];
const DEFAULT_SUPER_ADMIN_EMAILS: string[] = [];

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

let cachedSuperAdminEmails: string[] | null = null;

export function getSuperAdminEmails(): string[] {
  if (cachedSuperAdminEmails) return cachedSuperAdminEmails;
  const parsed = parseAdminEmails((import.meta as any).env?.SUPER_ADMIN_EMAILS);
  cachedSuperAdminEmails = parsed.length ? parsed : DEFAULT_SUPER_ADMIN_EMAILS;
  return cachedSuperAdminEmails;
}

export function isAdminEmail(email: unknown): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return getAdminEmails().includes(normalized);
}

export function isSuperAdminEmail(email: unknown): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  const supers = getSuperAdminEmails();
  // Par défaut (si SUPER_ADMIN_EMAILS est vide), on considère que tout admin est super-admin.
  if (!supers.length) return isAdminEmail(normalized);
  return supers.includes(normalized);
}

export function effectiveRoleForUser(user: { email: string; role?: string } | null): 'admin' | 'client' {
  if (!user) return 'client';
  if (user.role === 'admin') return 'admin';
  return isAdminEmail(user.email) ? 'admin' : 'client';
}
