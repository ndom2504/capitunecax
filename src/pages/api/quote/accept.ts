/**
 * POST /api/quote/accept — Accepter une proposition tarifaire (côté client)
 * Body: { quote_id }
 */
import type { APIRoute } from 'astro';
import { getNeonSqlClient, getUserFromSessionAny, hasNeonDatabase, uuid } from '../../../lib/db';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const db = (locals.runtime?.env as Env)?.DB ?? null;
  const useNeon = !db && hasNeonDatabase();
  if (!db && !useNeon) return json({ error: 'DB non disponible' }, 503);

  const token = cookies.get('capitune_session')?.value ?? '';
  if (!token) return json({ error: 'Non connecté' }, 401);

  const me = await getUserFromSessionAny(db, token);
  if (!me) return json({ error: 'Session expirée' }, 401);

  const body = (await request.json().catch(() => null)) as any;
  const quoteId = String(body?.quote_id ?? '').trim();
  if (!quoteId) return json({ error: 'quote_id manquant' }, 400);

  try {
    if (db) {
      const quote = await db
        .prepare(`SELECT * FROM project_quotes WHERE id=? LIMIT 1`)
        .bind(quoteId)
        .first<any>();
      if (!quote) return json({ error: 'Proposition introuvable' }, 404);
      if (String(quote.client_id) !== String(me.id)) return json({ error: 'Accès refusé' }, 403);
      if (String(quote.status) !== 'sent') return json({ error: 'Proposition déjà traitée' }, 400);

      await db
        .prepare(`UPDATE project_quotes SET status='accepted', updated_at=datetime('now') WHERE id=?`)
        .bind(quoteId)
        .run();

      const project = await db
        .prepare(`SELECT id, metadata FROM projects WHERE id=? LIMIT 1`)
        .bind(String(quote.project_id))
        .first<{ id: string; metadata?: string }>();

      if (project?.id) {
        let md: any = {};
        try { md = project.metadata ? JSON.parse(project.metadata) : {}; } catch { md = {}; }
        md.quote = {
          id: quoteId,
          total: Number(quote.total ?? 0),
          currency: String(quote.currency ?? 'CAD'),
          estimated_delay: String(quote.estimated_delay ?? ''),
          accepted_at: new Date().toISOString(),
        };

        await db
          .prepare(`UPDATE projects SET status='demarre', metadata=?, updated_at=datetime('now') WHERE id=?`)
          .bind(JSON.stringify(md), project.id)
          .run();

        const msg = `✅ Proposition acceptée. Votre dossier est maintenant démarré.`;
        await db
          .prepare(`INSERT INTO messages (id, project_id, user_id, sender, content) VALUES (?, ?, ?, 'bot', ?)`)
          .bind(uuid(), project.id, me.id, msg)
          .run()
          .catch(() => {});
      }

      return json({ ok: true });
    }

    const sql = await getNeonSqlClient();
    if (!sql) return json({ error: 'DB non disponible' }, 503);

    const quoteRows = await sql<any>`
      SELECT
        id::text as id,
        project_id::text as project_id,
        client_id::text as client_id,
        currency,
        (total::float8) as total,
        estimated_delay,
        status
      FROM project_quotes
      WHERE id = ${quoteId}::uuid
      LIMIT 1
    `;

    const quote = quoteRows?.[0] ?? null;
    if (!quote) return json({ error: 'Proposition introuvable' }, 404);
    if (String(quote.client_id) !== String(me.id)) return json({ error: 'Accès refusé' }, 403);
    if (String(quote.status) !== 'sent') return json({ error: 'Proposition déjà traitée' }, 400);

    await sql`UPDATE project_quotes SET status='accepted', updated_at=now() WHERE id = ${quoteId}::uuid`;

    const projectRows = await sql<{ id: string; metadata: string | null }>`
      SELECT id::text as id, metadata
      FROM projects
      WHERE id = ${String(quote.project_id)}::uuid
      LIMIT 1
    `;

    const project = projectRows?.[0] ?? null;
    if (project?.id) {
      let md: any = {};
      try { md = project.metadata ? JSON.parse(project.metadata) : {}; } catch { md = {}; }
      md.quote = {
        id: quoteId,
        total: Number(quote.total ?? 0),
        currency: String(quote.currency ?? 'CAD'),
        estimated_delay: String(quote.estimated_delay ?? ''),
        accepted_at: new Date().toISOString(),
      };

      await sql`
        UPDATE projects
        SET status='demarre', metadata=${JSON.stringify(md)}, updated_at=now()
        WHERE id = ${project.id}::uuid
      `;

      const msg = `✅ Proposition acceptée. Votre dossier est maintenant démarré.`;
      await sql`
        INSERT INTO messages (id, project_id, user_id, sender, content)
        VALUES (${uuid()}::uuid, ${project.id}::uuid, ${me.id}::uuid, 'bot', ${msg})
      `.catch(() => {});
    }

    return json({ ok: true });
  } catch (err) {
    console.error('[quote accept] error', err);
    return json({ error: 'Erreur' }, 500);
  }
};
