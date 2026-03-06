import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import {
  getNeonSqlClient,
  getUserFromSessionAny,
  getUserFromSessionFullAny,
  hasNeonDatabase,
} from '../../../lib/db';

export const POST: APIRoute = async ({ cookies, locals, request }) => {
  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();

  const authHeader = request.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const cookieToken = cookies.get('capitune_session')?.value;
  const token = bearerToken ?? cookieToken;

  if (!token) return json({ error: 'Non connecté' }, 401);

  // Même si la DB est indisponible, on veut pouvoir confirmer côté Stripe
  // et laisser le mobile mettre à jour son état local.
  if (!db && !useNeon) {
    const user = await getUserFromSessionAny(null, token);
    if (!user) return json({ error: 'Session expirée' }, 401);
  }

  const me = await getUserFromSessionFullAny(db, token);
  if (!me) return json({ error: 'Session expirée' }, 401);

  const stripeKey = (locals?.runtime?.env?.STRIPE_SECRET_KEY || import.meta.env.STRIPE_SECRET_KEY || '').trim();
  if (!stripeKey) return json({ error: 'Stripe not configured' }, 500);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON invalide' }, 400);
  }

  const sessionId = String(body?.sessionId ?? '').trim();
  if (!sessionId) return json({ error: 'sessionId requis' }, 400);

  let session: any;
  try {
    const stripe = new Stripe(stripeKey, { apiVersion: '2025-01-27.acacia' as any });
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error('[autonomie/stripe-confirm]', msg);
    return json({ error: 'Erreur Stripe : ' + msg }, 500);
  }

  if (!session) return json({ error: 'Session Stripe introuvable' }, 404);
  if (session.payment_status !== 'paid') return json({ error: 'Paiement non confirmé' }, 402);

  const md = session.metadata || {};
  if (md.kind !== 'autonomie') return json({ error: 'Session invalide' }, 400);
  if (String(md.userId) !== String(me.id)) return json({ error: 'Session non associée à cet utilisateur' }, 403);

  const persisted = await markAutonomiePaidAny(db, useNeon, String(me.id));
  return json({ ok: true, persisted });
};

async function markAutonomiePaidAny(db: any, useNeon: boolean, userId: string): Promise<boolean> {
  try {
    let sessionData: string | null = null;

    if (db) {
      const row = await db
        .prepare('SELECT session_data FROM capi_sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1')
        .bind(userId)
        .first();
      sessionData = (row as any)?.session_data ?? null;
    } else if (useNeon) {
      const sql = await getNeonSqlClient();
      if (!sql) return false;
      const rows = await sql<{ session_data: string }>`
        SELECT session_data FROM capi_sessions
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC LIMIT 1
      `;
      sessionData = rows[0]?.session_data ?? null;
    } else {
      return false;
    }

    const parsed = sessionData ? safeJsonParse(sessionData) : null;
    const next = {
      ...(parsed ?? {}),
      autonomie: {
        ...(((parsed ?? {}) as any).autonomie ?? {}),
        hasPaidAutonomie: true,
      },
      updatedAt: new Date().toISOString(),
    };

    const sessionJson = JSON.stringify(next);
    const now = new Date().toISOString();

    if (db) {
      const existing = await db
        .prepare('SELECT id FROM capi_sessions WHERE user_id = ?')
        .bind(userId)
        .first();
      if (existing) {
        await db
          .prepare('UPDATE capi_sessions SET session_data = ?, updated_at = ? WHERE user_id = ?')
          .bind(sessionJson, now, userId)
          .run();
      } else {
        await db
          .prepare('INSERT INTO capi_sessions (user_id, session_data, created_at, updated_at) VALUES (?, ?, ?, ?)')
          .bind(userId, sessionJson, now, now)
          .run();
      }
      return true;
    }

    const sql = await getNeonSqlClient();
    if (!sql) return false;

    await sql`
      INSERT INTO capi_sessions (user_id, session_data, created_at, updated_at)
      VALUES (${userId}, ${sessionJson}, ${now}, ${now})
      ON CONFLICT (user_id) DO UPDATE
      SET session_data = ${sessionJson}, updated_at = ${now}
    `;

    return true;
  } catch (err) {
    console.error('[markAutonomiePaidAny] error:', err);
    return false;
  }
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
