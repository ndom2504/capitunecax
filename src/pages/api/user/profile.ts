/**
 * GET /api/user/profile  — Lire le profil utilisateur
 * PUT /api/user/profile  — Mettre à jour nom, téléphone, ville, bio, notifs, devise
 */
import type { APIRoute } from 'astro';
import {
  getNeonSqlClient,
  getUserFromSession,
  getUserFromSessionAny,
  getUserFromSessionFullAny,
  hasNeonDatabase,
} from '../../../lib/db';

export const GET: APIRoute = async ({ cookies, locals }) => {
  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();
  const token = cookies.get('capitune_session')?.value;
  if (!token) return json({ error: 'Non connecté' }, 401);

  // Sans DB (ni D1 ni Neon): fallback sur session base64
  if (!db && !useNeon) {
    const user = await getUserFromSessionAny(null, token);
    if (!user) return json({ error: 'Session expirée' }, 401);
    return json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: '',
      location: '',
      bio: '',
      avatar_key: '',
      role: user.role,
      notif_email: false,
      notif_rdv: false,
      notif_msg: false,
      currency_code: 'CAD',
      premium_expires_at: null,
      premium_active: false,
    });
  }

  const user = await getUserFromSessionFullAny(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);

  const premiumExpiresAt = user.premium_expires_at ?? null;
  const premiumActive = isPremiumActive(premiumExpiresAt);
  const currencyCode = typeof user.currency_code === 'string' && user.currency_code.trim() ? user.currency_code.trim().toUpperCase() : 'CAD';

  return json({
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    location: user.location,
    bio: user.bio,
    avatar_key: user.avatar_key,
    role: user.role,
    notif_email: !!user.notif_email,
    notif_rdv: !!user.notif_rdv,
    notif_msg: !!user.notif_msg,
    currency_code: currencyCode,
    premium_expires_at: premiumExpiresAt,
    premium_active: premiumActive,
  });
};

export const PUT: APIRoute = async ({ cookies, locals, request }) => {
  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();
  const token = cookies.get('capitune_session')?.value;
  if (!token) return json({ error: 'Non connecté' }, 401);

  // Sans DB (ni D1 ni Neon) : accepter la requête mais sans persistance
  if (!db && !useNeon) {
    const user = await getUserFromSessionAny(null, token);
    if (!user) return json({ error: 'Session expirée' }, 401);
    return json({ ok: true, persisted: false });
  }

  const user = await getUserFromSessionFullAny(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);

  const body = await request.json() as Record<string, unknown>;

  const name     = String(body.name     ?? user.name).slice(0, 100);
  const phone    = String(body.phone    ?? user.phone).slice(0, 30);
  const location = String(body.location ?? user.location).slice(0, 100);
  const bio      = String(body.bio      ?? user.bio).slice(0, 500);
  const notif_email = body.notif_email !== undefined ? (body.notif_email ? 1 : 0) : user.notif_email;
  const notif_rdv   = body.notif_rdv   !== undefined ? (body.notif_rdv   ? 1 : 0) : user.notif_rdv;
  const notif_msg   = body.notif_msg   !== undefined ? (body.notif_msg   ? 1 : 0) : user.notif_msg;
  const currency_code = normalizeCurrencyCode(body.currency_code ?? user.currency_code ?? 'CAD');
  // avatar_key : accepter https:// et data:image/ (base64 compressé ≤ 300 Ko), ou '' pour effacer
  const rawAvatar = typeof body.avatar_key === 'string' ? body.avatar_key.trim() : null;
  const avatar_key = rawAvatar === null
    ? (user.avatar_key ?? null)            // non fourni → conserver
    : rawAvatar === ''
      ? ''                                 // suppression explicite
      : (/^https?:\/\//i.test(rawAvatar) || /^data:image\//i.test(rawAvatar)) && rawAvatar.length <= 307200
        ? rawAvatar                        // URL valide → sauvegarder
        : (user.avatar_key ?? null);       // format invalide → conserver

  if (db) {
    await db.prepare(
      `UPDATE users SET name=?, phone=?, location=?, bio=?, notif_email=?, notif_rdv=?, notif_msg=?, currency_code=?, avatar_key=?, updated_at=datetime('now')
       WHERE id=?`
    ).bind(name, phone, location, bio, notif_email, notif_rdv, notif_msg, currency_code, avatar_key, user.id).run();
  } else {
    const sql = await getNeonSqlClient();
    if (!sql) return json({ error: 'Configuration base de données manquante' }, 500);
    await sql`
      UPDATE users
      SET
        name = ${name},
        phone = ${phone},
        location = ${location},
        bio = ${bio},
        notif_email = ${!!notif_email},
        notif_rdv = ${!!notif_rdv},
        notif_msg = ${!!notif_msg},
        currency_code = ${currency_code},
        avatar_key = ${avatar_key},
        updated_at = now()
      WHERE id = ${user.id}
    `;
  }

  return json({ ok: true });
};

function normalizeCurrencyCode(value: unknown): string {
  const raw = typeof value === 'string' ? value : String(value ?? '');
  const v = raw.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(v)) return 'CAD';
  return v;
}

function isPremiumActive(premiumExpiresAt: unknown): boolean {
  if (!premiumExpiresAt) return false;
  const dt = typeof premiumExpiresAt === 'string' ? Date.parse(premiumExpiresAt) : Date.parse(String(premiumExpiresAt));
  if (!Number.isFinite(dt)) return false;
  return dt > Date.now();
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
