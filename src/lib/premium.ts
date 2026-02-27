import { getNeonSqlClient } from './db';

export function isPremiumActive(premiumExpiresAt: unknown): boolean {
  if (!premiumExpiresAt) return false;
  const dt = Date.parse(String(premiumExpiresAt));
  if (!Number.isFinite(dt)) return false;
  return dt > Date.now();
}

export function computePremiumExpiryISO(now = new Date()): string {
  const next = new Date(now.getTime());
  next.setFullYear(next.getFullYear() + 1);
  return next.toISOString();
}

export async function activatePremiumForUserAny(db: D1Database | null, userId: string): Promise<{ premium_expires_at: string }> {
  const expiresAt = computePremiumExpiryISO();

  if (db) {
    await db
      .prepare("UPDATE users SET premium_expires_at=?, updated_at=datetime('now') WHERE id=?")
      .bind(expiresAt, userId)
      .run();
    return { premium_expires_at: expiresAt };
  }

  const sql = await getNeonSqlClient();
  if (!sql) throw new Error('DB non disponible');

  const rows = await sql<{ premium_expires_at: string }>`
    UPDATE users
    SET premium_expires_at = now() + interval '1 year',
        updated_at = now()
    WHERE id = ${userId}
    RETURNING premium_expires_at
  `;

  const v = rows?.[0]?.premium_expires_at;
  return { premium_expires_at: typeof v === 'string' ? v : expiresAt };
}
