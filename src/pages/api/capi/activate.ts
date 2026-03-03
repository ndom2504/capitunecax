/**
 * POST /api/capi/activate
 * Crée un projet à partir d'une session CAPI complète.
 * Corps : { session: CapiSession, advisorId?: string, selectedServiceIds?: string[] }
 */
import type { APIRoute } from 'astro';
import {
  getNeonSqlClient,
  getUserFromSessionAny,
  getUserFromSessionFullAny,
  hasNeonDatabase,
} from '../../../lib/db';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function generateProjectTitle(session: any): string {
  const motifLabels: Record<string, string> = {
    visiter: 'Visa visiteur',
    travailler: 'Permis de travail',
    etudier: 'Permis d\'études',
    residence_permanente: 'Résidence permanente',
    famille: 'Regroupement familial',
    entreprendre: 'Visa entrepreneur',
    regularisation: 'Régularisation de statut',
  };
  const base = motifLabels[session.motif] ?? 'Projet immigration';
  if (session.programme) return `${base} — ${session.programme}`;
  return base;
}

export const POST: APIRoute = async ({ cookies, locals, request }) => {
  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();

  const authHeader = request.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const cookieToken = cookies.get('capitune_session')?.value;
  const token = bearerToken ?? cookieToken;

  if (!token) return json({ error: 'Non connecté' }, 401);

  // Mode sans DB → retourner un projet fictif pour ne pas bloquer l'UX mobile
  if (!db && !useNeon) {
    await getUserFromSessionAny(null, token);
    return json({
      ok: true,
      project: { id: 'local_' + Date.now(), status: 'actif', persisted: false },
    });
  }

  try {
    const user = await getUserFromSessionFullAny(db, token);
    if (!user) return json({ error: 'Session expirée' }, 401);

    const body = await request.json() as {
      session: any;
      advisorId?: string;
      selectedServiceIds?: string[];
    };

    const { session, advisorId, selectedServiceIds = [] } = body;
    if (!session) return json({ error: 'Session CAPI manquante' }, 400);

    const now = new Date().toISOString();
    const title = generateProjectTitle(session);
    const status = 'actif';

    // Construire les métadonnées du projet
    const metadata = {
      motif: session.motif,
      programme: session.programme,
      profile: session.profile,
      evaluation: session.evaluation,
      services: (session.services ?? []).filter((s: any) => selectedServiceIds.includes(s.id) || s.selected),
      timeline: session.timeline ?? [],
      advisor_id: advisorId ?? session.advisor?.id ?? null,
      advisor: session.advisor ?? null,
      activated_at: now,
    };

    let projectId: string;

    if (db) {
      // D4 Worker DB (Cloudflare)
      const existing = await db
        .prepare(`SELECT id FROM projects WHERE user_id = ? AND status != 'annule' ORDER BY created_at DESC LIMIT 1`)
        .bind(user.id)
        .first<{ id: string }>();

      if (existing) {
        projectId = existing.id;
        await db
          .prepare(`UPDATE projects SET title = ?, status = ?, metadata = ?, updated_at = ? WHERE id = ?`)
          .bind(title, status, JSON.stringify(metadata), now, projectId)
          .run();
      } else {
        projectId = crypto.randomUUID();
        await db
          .prepare(`INSERT INTO projects (id, user_id, title, status, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
          .bind(projectId, user.id, title, status, JSON.stringify(metadata), now, now)
          .run();
      }

      // Vider la session CAPI
      await db
        .prepare('DELETE FROM capi_sessions WHERE user_id = ?')
        .bind(user.id)
        .run().catch(() => {});

    } else {
      // Neon PostgreSQL
      const sql = await getNeonSqlClient();
      const [existing] = await sql`
        SELECT id FROM projects
        WHERE user_id = ${user.id} AND status != 'annule'
        ORDER BY created_at DESC LIMIT 1
      `;

      if (existing) {
        projectId = existing.id;
        await sql`
          UPDATE projects
          SET title = ${title}, status = ${status},
              metadata = ${JSON.stringify(metadata)}, updated_at = ${now}
          WHERE id = ${projectId}
        `;
      } else {
        const id = crypto.randomUUID();
        await sql`
          INSERT INTO projects (id, user_id, title, status, metadata, created_at, updated_at)
          VALUES (${id}, ${user.id}, ${title}, ${status}, ${JSON.stringify(metadata)}, ${now}, ${now})
        `;
        projectId = id;
      }

      // Vider la session CAPI
      await sql`DELETE FROM capi_sessions WHERE user_id = ${user.id}`.catch(() => {});
    }

    return json({
      ok: true,
      project: { id: projectId, title, status, metadata },
    });

  } catch (err: any) {
    console.error('CAPI activate error:', err);
    // Graceful degradation — ne pas bloquer l'UX
    return json({
      ok: true,
      project: { id: 'fallback_' + Date.now(), status: 'actif', persisted: false },
    });
  }
};
