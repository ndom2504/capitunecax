/**
 * GET /api/payments — Liste des paiements de l'utilisateur connecté
 */
import type { APIRoute } from 'astro';
import {
  getActiveProjectAny,
  getNeonSqlClient,
  getUserFromSessionFullAny,
  hasNeonDatabase,
} from '../../../lib/db';

export const GET: APIRoute = async ({ cookies, locals }) => {
  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();
  const token = cookies.get('capitune_session')?.value;
  if (!token) return json({ error: 'Non connecté' }, 401);

  if (!db && !useNeon) {
    return json({ payments: [] });
  }

  const user = await getUserFromSessionFullAny(db, token);
  if (!user) return json({ error: 'Session expirée' }, 401);

  const project = await getActiveProjectAny(db, user.id);

  let payments: unknown[] = [];

  if (db) {
    const clause = project
      ? `WHERE p.user_id = ? AND p.project_id = ?`
      : `WHERE p.user_id = ?`;
    const binds = project ? [user.id, project.id] : [user.id];

    const result = await db
      .prepare(
        `SELECT p.id, p.method, p.amount, p.currency, p.status, p.reference,
                p.created_at, p.updated_at,
                pr.type as project_type
         FROM payments p
         LEFT JOIN projects pr ON pr.id = p.project_id
         ${clause}
         ORDER BY p.created_at DESC
         LIMIT 50`,
      )
      .bind(...binds)
      .all<Record<string, unknown>>();
    payments = result.results ?? [];
  } else {
    const sql = await getNeonSqlClient();
    if (sql) {
      if (project) {
        payments = await sql<Record<string, unknown>>`
          SELECT p.id, p.method, p.amount, p.currency, p.status, p.reference,
                 p.created_at, p.updated_at,
                 pr.type as project_type
          FROM payments p
          LEFT JOIN projects pr ON pr.id = p.project_id
          WHERE p.user_id = ${user.id} AND p.project_id = ${project.id}
          ORDER BY p.created_at DESC
          LIMIT 50
        `;
      } else {
        payments = await sql<Record<string, unknown>>`
          SELECT p.id, p.method, p.amount, p.currency, p.status, p.reference,
                 p.created_at, p.updated_at,
                 pr.type as project_type
          FROM payments p
          LEFT JOIN projects pr ON pr.id = p.project_id
          WHERE p.user_id = ${user.id}
          ORDER BY p.created_at DESC
          LIMIT 50
        `;
      }
    }
  }

  return json({ payments: normalizePayments(payments) });
};

function normalizePayments(rows: unknown[]): object[] {
  const METHOD_LABELS: Record<string, string> = {
    stripe: 'Paiement par carte',
    paypal: 'Paiement PayPal',
    interac: 'Virement Interac',
    virement: 'Virement bancaire',
  };
  return (rows as Record<string, unknown>[]).map((p) => ({
    id: p.id,
    label: METHOD_LABELS[String(p.method ?? '')] ?? 'Paiement',
    amount: p.amount,
    currency: p.currency ?? 'CAD',
    status: p.status === 'paid' ? 'paid' : p.status === 'failed' ? 'failed' : 'pending',
    date: String(p.created_at ?? '').slice(0, 10),
    receiptUrl: p.reference ? null : null,
  }));
}

export const OPTIONS: APIRoute = () =>
  new Response(null, {
    status: 204,
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET' },
  });

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
