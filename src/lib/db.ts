/**
 * Utilitaires D1 — CAPITUNE
 * Fournit des helpers typés pour interagir avec Cloudflare D1
 * + fallback Neon Postgres (Vercel) via DATABASE_URL
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
  // Devise préférée (affichage UI)
  currency_code?: string;
  // Abonnement premium: date d'expiration (ISO string en D1, timestamptz en Postgres)
  premium_expires_at?: string | null;
  // Type de compte (MVP): client (particulier) vs pro (professionnel)
  account_type?: 'client' | 'pro' | string;
  // JSON stocké en TEXT (liste des ids services proposés)
  pro_services?: string;
  // JSON stocké en TEXT (prix par pack)
  pro_pack_prices?: string;
  // JSON stocké en TEXT: { [packId]: string[] }
  pro_pack_services?: string;
  // Profil pro (public)
  pro_diploma?: string;
  pro_competences?: string;
  pro_experience_years?: number | null;
  // Géolocalisation (optionnelle)
  location_lat?: number | null;
  location_lng?: number | null;
  role: 'client' | 'admin';
  oauth_provider: string;
  oauth_id: string;
  // D1 renvoie 0/1, Postgres/Neon renvoie bool
  notif_email: number | boolean;
  notif_rdv: number | boolean;
  notif_msg: number | boolean;
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

export type SessionUser = Pick<User, 'id' | 'email' | 'name' | 'role' | 'account_type'>;

// ── Détection Neon (Postgres) ────────────────────────────────────────────

export function getDatabaseUrl(): string | null {
  // Astro/Vite expose les variables côté serveur via import.meta.env
  // (sans préfixe PUBLIC_). Sur certaines plateformes, process.env est aussi dispo.
  const url = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.DATABASE_URL;
  if (url) return url;
  const p = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process;
  return p?.env?.DATABASE_URL ?? null;
}

export function hasNeonDatabase(): boolean {
  return !!getDatabaseUrl();
}

type NeonSql = <T = unknown>(
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<T[]>;

let _neonSql: NeonSql | null = null;

export async function getNeonSqlClient(): Promise<NeonSql | null> {
  if (_neonSql) return _neonSql;
  const url = getDatabaseUrl();
  if (!url) return null;

  const mod = await import('@neondatabase/serverless');
  // Cache fetch-based connections between invocations when possible
  mod.neonConfig.fetchConnectionCache = true;
  _neonSql = mod.neon(url) as NeonSql;
  return _neonSql;
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

export async function getUserFromSessionNeon(sessionToken: string): Promise<User | null> {
  const sql = await getNeonSqlClient();
  if (!sql) return null;
  const rows = await sql<User>`
    SELECT u.*
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ${sessionToken} AND s.expires_at > now()
    LIMIT 1
  `;
  return (rows[0] as unknown as User) ?? null;
}

// ── Fallback session base64 (Vercel / sans D1) ───────────────────────────

export function getUserFromBase64Session(sessionToken: string): SessionUser | null {
  if (!sessionToken) return null;
  try {
    const data = JSON.parse(decodeURIComponent(atob(sessionToken))) as {
      id?: string;
      email?: string;
      name?: string;
      role?: string;
      account_type?: string;
    };
    const email = String(data.email ?? '').toLowerCase().trim();
    if (!email) return null;

    const role = data.role === 'admin' ? 'admin' : 'client';
    const account_type = data.account_type === 'pro' ? 'pro' : 'client';
    return {
      id: String(data.id ?? email),
      email,
      name: String(data.name ?? email).trim(),
      role,
      account_type,
    };
  } catch {
    return null;
  }
}

export async function getUserFromSessionAny(
  db: D1Database | null,
  sessionToken: string
): Promise<SessionUser | null> {
  if (!sessionToken) return null;
  if (db && /^[0-9a-f]{64}$/.test(sessionToken)) {
    const user = await getUserFromSession(db, sessionToken);
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.name, role: user.role, account_type: user.account_type };
  }
  if (/^[0-9a-f]{64}$/.test(sessionToken)) {
    const user = await getUserFromSessionNeon(sessionToken);
    if (user) return { id: user.id, email: user.email, name: user.name, role: user.role, account_type: user.account_type };
  }
  return getUserFromBase64Session(sessionToken);
}

export async function getUserFromSessionFullAny(
  db: D1Database | null,
  sessionToken: string
): Promise<User | null> {
  if (!sessionToken) return null;
  if (db && /^[0-9a-f]{64}$/.test(sessionToken)) return getUserFromSession(db, sessionToken);
  if (/^[0-9a-f]{64}$/.test(sessionToken)) return getUserFromSessionNeon(sessionToken);
  return null;
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

export async function createSessionNeon(userId: string): Promise<string> {
  const sql = await getNeonSqlClient();
  if (!sql) throw new Error('DATABASE_URL manquant (Neon)');

  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await sql`INSERT INTO sessions (id, user_id, expires_at) VALUES (${token}, ${userId}, ${expires})`;
  return token;
}

export async function createSessionAny(db: D1Database | null, userId: string): Promise<string> {
  if (db) return createSession(db, userId);
  return createSessionNeon(userId);
}

// ── Supprimer une session (déconnexion) ───────────────────────────────────

export async function deleteSession(db: D1Database, token: string): Promise<void> {
  await db.prepare(`DELETE FROM sessions WHERE id = ?`).bind(token).run();
}

export async function deleteSessionNeon(token: string): Promise<void> {
  const sql = await getNeonSqlClient();
  if (!sql) return;
  await sql`DELETE FROM sessions WHERE id = ${token}`;
}

export async function deleteSessionAny(db: D1Database | null, token: string): Promise<void> {
  if (db) return deleteSession(db, token);
  return deleteSessionNeon(token);
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

export async function getActiveProjectNeon(
  userId: string
): Promise<(Project & { services?: ProjectServices }) | null> {
  const sql = await getNeonSqlClient();
  if (!sql) return null;

  const projects = await sql<Project>`
    SELECT *
    FROM projects
    WHERE user_id = ${userId} AND status != 'annule'
    ORDER BY updated_at DESC
    LIMIT 1
  `;
  const project = (projects[0] as unknown as Project) ?? null;
  if (!project) return null;

  const servicesRows = await sql<ProjectServices>`
    SELECT
      id,
      project_id,
      pack_id,
      (pack_price::float8) AS pack_price,
      carte,
      created_at,
      updated_at
    FROM project_services
    WHERE project_id = ${project.id}
    LIMIT 1
  `;
  const services = (servicesRows[0] as unknown as ProjectServices) ?? null;

  return { ...project, services: services ?? undefined };
}

export async function getActiveProjectAny(
  db: D1Database | null,
  userId: string
): Promise<(Project & { services?: ProjectServices }) | null> {
  if (db) return getActiveProject(db, userId);
  return getActiveProjectNeon(userId);
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

export async function getMessagesNeon(projectId: string): Promise<Message[]> {
  const sql = await getNeonSqlClient();
  if (!sql) return [];
  const rows = await sql<Message>`
    SELECT *
    FROM messages
    WHERE project_id = ${projectId}
    ORDER BY created_at ASC
  `;
  return rows as unknown as Message[];
}

export async function getMessagesAny(db: D1Database | null, projectId: string): Promise<Message[]> {
  if (db) return getMessages(db, projectId);
  return getMessagesNeon(projectId);
}
