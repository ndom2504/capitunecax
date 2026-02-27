/**
 * Utilitaires D1 — CAPITUNE
 * Fournit des helpers typés pour interagir avec Cloudflare D1
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  password_hash: string | null;
  name: string;
  phone: string;
  location: string;
  bio: string;
  avatar_key: string;
  role: 'client' | 'admin';
  oauth_provider: string;
  oauth_id: string;
  notif_email: number;
  notif_rdv: number;
  notif_msg: number;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  type: string;
  province: string;
  pays: string;
  diplome: string;
  domaine: string;
  experience: string;
  famille: string;
  enfants: string;
  conjoint: string;
  delai: string;
  nbpersonnes: string;
  notes: string;
  langues: string; // JSON
  status: 'en_cours' | 'soumis' | 'annule' | 'termine';
  created_at: string;
  updated_at: string;
}

export interface ProjectServices {
  id: string;
  project_id: string;
  pack_id: string;
  pack_price: number;
  carte: string; // JSON
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  project_id: string;
  user_id: string;
  method: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  reference: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  project_id: string | null;
  user_id: string;
  sender: 'user' | 'bot' | 'admin';
  content: string;
  attachments: string; // JSON array
  created_at: string;
}

// ── UUID v4 simple (compatible Workers) ───────────────────────────────────

export function uuid(): string {
  return crypto.randomUUID();
}

// ── Récupérer l'utilisateur depuis la session cookie ──────────────────────

export async function getUserFromSession(
  db: D1Database,
  sessionToken: string
): Promise<User | null> {
  const row = await db
    .prepare(
      `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.expires_at > datetime('now')`
    )
    .bind(sessionToken)
    .first<User>();
  return row ?? null;
}

// ── Créer une session (30 jours) ──────────────────────────────────────────

export async function createSession(
  db: D1Database,
  userId: string
): Promise<string> {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
  await db
    .prepare(`INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)`)
    .bind(token, userId, expires)
    .run();
  return token;
}

// ── Supprimer une session (déconnexion) ───────────────────────────────────

export async function deleteSession(db: D1Database, token: string): Promise<void> {
  await db.prepare(`DELETE FROM sessions WHERE id = ?`).bind(token).run();
}

// ── Projet actif de l'utilisateur ─────────────────────────────────────────

export async function getActiveProject(
  db: D1Database,
  userId: string
): Promise<(Project & { services?: ProjectServices }) | null> {
  const project = await db
    .prepare(
      `SELECT * FROM projects WHERE user_id = ? AND status != 'annule'
       ORDER BY updated_at DESC LIMIT 1`
    )
    .bind(userId)
    .first<Project>();

  if (!project) return null;

  const services = await db
    .prepare(`SELECT * FROM project_services WHERE project_id = ? LIMIT 1`)
    .bind(project.id)
    .first<ProjectServices>();

  return { ...project, services: services ?? undefined };
}

// ── Messages d'un projet ──────────────────────────────────────────────────

export async function getMessages(
  db: D1Database,
  projectId: string
): Promise<Message[]> {
  const { results } = await db
    .prepare(`SELECT * FROM messages WHERE project_id = ? ORDER BY created_at ASC`)
    .bind(projectId)
    .all<Message>();
  return results;
}
