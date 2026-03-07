function normalizeEmail(email: unknown): string {
  const raw = String(email ?? '').trim().toLowerCase();
  if (!raw) return '';
  const at = raw.indexOf('@');
  if (at <= 0) return raw;

  const local = raw.slice(0, at);
  const domain = raw.slice(at + 1);

  // Gmail-style aliasing: name+tag@gmail.com -> name@gmail.com
  const localNoPlus = local.split('+')[0];
  return `${localNoPlus}@${domain}`;
}

function parseEmailList(raw: unknown): Set<string> {
  const txt = String(raw ?? '').trim();
  if (!txt) return new Set();
  const parts = txt.split(/[\s,;]+/g).map((p) => normalizeEmail(p)).filter(Boolean);
  return new Set(parts);
}

function readEnvValue(locals: any, key: string): unknown {
  const env = locals?.runtime?.env ?? {};
  const penv = (globalThis as any).process?.env ?? {};
  return env[key] ?? penv[key] ?? (import.meta.env as any)?.[key];
}

export function isTestEmail(email: unknown, locals: any, envKey = 'CAPITUNE_TEST_EMAILS'): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  const raw = readEnvValue(locals, envKey);
  const set = parseEmailList(raw);
  return set.has(normalized);
}
