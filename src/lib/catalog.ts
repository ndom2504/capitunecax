import { getNeonSqlClient, hasNeonDatabase } from './db';
import { packagesCatalog, servicesCatalog } from './service-catalog';

export type CatalogService = {
  id: string;
  name: string;
  description: string;
  icon: string;
  basePrice: number;
};

export type CatalogPackage = {
  id: string;
  name: string;
  description: string;
  badge: string;
  price: number;
  services: string[];
  features: string[];
  popular?: boolean;
};

export type Catalog = {
  packages: CatalogPackage[];
  services: CatalogService[];
};

export function isValidCatalogId(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (v.length < 2 || v.length > 42) return false;
  return /^[a-z0-9][a-z0-9-_]*$/.test(v);
}

function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

function safeString(value: unknown, max: number, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.slice(0, max);
}

function safeStringArray(value: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const s = item.trim().slice(0, maxLen);
    if (!s) continue;
    out.push(s);
    if (out.length >= maxItems) break;
  }
  return out;
}

async function hasCatalogTablesD1(db: D1Database): Promise<boolean> {
  const row = await db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='catalog_packages'")
    .first<{ name: string }>();
  return !!row?.name;
}

async function hasCatalogTablesNeon(): Promise<boolean> {
  const sql = await getNeonSqlClient();
  if (!sql) return false;
  const rows = await sql<{ regclass: string | null }>`SELECT to_regclass('public.catalog_packages') as regclass`;
  return !!rows?.[0]?.regclass;
}

export async function getCatalogAny(db: D1Database | null): Promise<Catalog> {
  const baseServices: CatalogService[] = servicesCatalog.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    icon: s.icon,
    basePrice: s.basePrice,
  }));

  const basePackages: CatalogPackage[] = packagesCatalog.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    badge: p.badge,
    price: p.price,
    services: [...p.services],
    features: [...p.features],
    popular: p.popular,
  }));

  const byServiceId = new Map(baseServices.map((s) => [s.id, s] as const));
  const byPackageId = new Map(basePackages.map((p) => [p.id, p] as const));

  try {
    if (db) {
      const ok = await hasCatalogTablesD1(db);
      if (!ok) return { packages: basePackages, services: baseServices };

      const svcRows = await db
        .prepare('SELECT id, name, description, icon, base_price FROM catalog_services')
        .all<{ id: string; name: string; description: string; icon: string; base_price: number }>();

      for (const r of svcRows?.results ?? []) {
        if (!isValidCatalogId(r.id)) continue;
        byServiceId.set(r.id, {
          id: r.id,
          name: safeString(r.name, 80, r.id),
          description: safeString(r.description, 300, ''),
          icon: safeString(r.icon, 12, '🧩') || '🧩',
          basePrice: Math.max(0, toNumber(r.base_price, 0)),
        });
      }

      const pkgRows = await db
        .prepare('SELECT id, name, description, badge, price, features, popular FROM catalog_packages')
        .all<{ id: string; name: string; description: string; badge: string; price: number; features: string; popular: number }>();

      const mapRows = await db
        .prepare('SELECT package_id, service_id FROM catalog_package_services')
        .all<{ package_id: string; service_id: string }>();

      const pkgToSvcs = new Map<string, string[]>();
      for (const r of mapRows?.results ?? []) {
        if (!isValidCatalogId(r.package_id) || !isValidCatalogId(r.service_id)) continue;
        const arr = pkgToSvcs.get(r.package_id) ?? [];
        arr.push(r.service_id);
        pkgToSvcs.set(r.package_id, arr);
      }

      for (const r of pkgRows?.results ?? []) {
        if (!isValidCatalogId(r.id)) continue;
        let features: string[] = [];
        try {
          features = safeStringArray(JSON.parse(String(r.features ?? '[]')), 50, 120);
        } catch {
          features = [];
        }
        const services = Array.from(new Set((pkgToSvcs.get(r.id) ?? []).filter((sid) => byServiceId.has(sid))));
        byPackageId.set(r.id, {
          id: r.id,
          name: safeString(r.name, 80, r.id),
          description: safeString(r.description, 300, ''),
          badge: safeString(r.badge, 12, '📦') || '📦',
          price: Math.max(0, toNumber(r.price, 0)),
          services,
          features,
          popular: !!r.popular,
        });
      }

      return {
        packages: Array.from(byPackageId.values()),
        services: Array.from(byServiceId.values()),
      };
    }

    if (hasNeonDatabase() && (await hasCatalogTablesNeon())) {
      const sql = await getNeonSqlClient();
      if (!sql) return { packages: basePackages, services: baseServices };

      const svcRows = await sql<{ id: string; name: string; description: string; icon: string; base_price: any }>`
        SELECT id, name, description, icon, base_price
        FROM catalog_services
      `;

      for (const r of svcRows ?? []) {
        if (!isValidCatalogId(r.id)) continue;
        byServiceId.set(r.id, {
          id: r.id,
          name: safeString(r.name, 80, r.id),
          description: safeString(r.description, 300, ''),
          icon: safeString(r.icon, 12, '🧩') || '🧩',
          basePrice: Math.max(0, toNumber(r.base_price, 0)),
        });
      }

      const pkgRows = await sql<{
        id: string;
        name: string;
        description: string;
        badge: string;
        price: any;
        features: unknown;
        popular: boolean;
      }>`
        SELECT id, name, description, badge, price, features, popular
        FROM catalog_packages
      `;

      const mapRows = await sql<{ package_id: string; service_id: string }>`
        SELECT package_id, service_id
        FROM catalog_package_services
      `;

      const pkgToSvcs = new Map<string, string[]>();
      for (const r of mapRows ?? []) {
        if (!isValidCatalogId(r.package_id) || !isValidCatalogId(r.service_id)) continue;
        const arr = pkgToSvcs.get(r.package_id) ?? [];
        arr.push(r.service_id);
        pkgToSvcs.set(r.package_id, arr);
      }

      for (const r of pkgRows ?? []) {
        if (!isValidCatalogId(r.id)) continue;
        const features = safeStringArray(r.features, 50, 120);
        const services = Array.from(new Set((pkgToSvcs.get(r.id) ?? []).filter((sid) => byServiceId.has(sid))));
        byPackageId.set(r.id, {
          id: r.id,
          name: safeString(r.name, 80, r.id),
          description: safeString(r.description, 300, ''),
          badge: safeString(r.badge, 12, '📦') || '📦',
          price: Math.max(0, toNumber(r.price, 0)),
          services,
          features,
          popular: !!r.popular,
        });
      }

      return {
        packages: Array.from(byPackageId.values()),
        services: Array.from(byServiceId.values()),
      };
    }
  } catch {
    // ignore and fallback
  }

  return { packages: basePackages, services: baseServices };
}

export async function upsertCatalogServiceAny(
  db: D1Database | null,
  input: { id: string; name: string; description?: string; icon?: string; basePrice?: number }
): Promise<void> {
  const id = input.id;
  if (!isValidCatalogId(id)) throw new Error('ID service invalide');

  const name = safeString(input.name, 80, id) || id;
  const description = safeString(input.description, 300, '');
  const icon = safeString(input.icon, 12, '🧩') || '🧩';
  const basePrice = Math.max(0, toNumber(input.basePrice, 0));

  if (db) {
    await db
      .prepare(
        `INSERT INTO catalog_services (id, name, description, icon, base_price, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name,
           description=excluded.description,
           icon=excluded.icon,
           base_price=excluded.base_price,
           updated_at=datetime('now')`
      )
      .bind(id, name, description, icon, basePrice)
      .run();
    return;
  }

  const sql = await getNeonSqlClient();
  if (!sql) throw new Error('DB non disponible');

  await sql`
    INSERT INTO catalog_services (id, name, description, icon, base_price, created_at, updated_at)
    VALUES (${id}, ${name}, ${description}, ${icon}, ${basePrice}, now(), now())
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      icon = EXCLUDED.icon,
      base_price = EXCLUDED.base_price,
      updated_at = now()
  `;
}

export async function upsertCatalogPackageAny(
  db: D1Database | null,
  input: {
    id: string;
    name: string;
    description?: string;
    badge?: string;
    price?: number;
    features?: string[];
    popular?: boolean;
  }
): Promise<void> {
  const id = input.id;
  if (!isValidCatalogId(id)) throw new Error('ID pack invalide');

  const name = safeString(input.name, 80, id) || id;
  const description = safeString(input.description, 300, '');
  const badge = safeString(input.badge, 12, '📦') || '📦';
  const price = Math.max(0, toNumber(input.price, 0));
  const features = safeStringArray(input.features, 50, 120);
  const popular = !!input.popular;

  if (db) {
    await db
      .prepare(
        `INSERT INTO catalog_packages (id, name, description, badge, price, features, popular, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name,
           description=excluded.description,
           badge=excluded.badge,
           price=excluded.price,
           features=excluded.features,
           popular=excluded.popular,
           updated_at=datetime('now')`
      )
      .bind(id, name, description, badge, price, JSON.stringify(features), popular ? 1 : 0)
      .run();
    return;
  }

  const sql = await getNeonSqlClient();
  if (!sql) throw new Error('DB non disponible');

  await sql`
    INSERT INTO catalog_packages (id, name, description, badge, price, features, popular, created_at, updated_at)
    VALUES (${id}, ${name}, ${description}, ${badge}, ${price}, ${JSON.stringify(features)}::jsonb, ${popular}, now(), now())
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      badge = EXCLUDED.badge,
      price = EXCLUDED.price,
      features = EXCLUDED.features,
      popular = EXCLUDED.popular,
      updated_at = now()
  `;
}

export async function setCatalogPackageServicesAny(
  db: D1Database | null,
  packageId: string,
  serviceIds: string[]
): Promise<void> {
  if (!isValidCatalogId(packageId)) throw new Error('ID pack invalide');
  const cleaned = Array.from(new Set(serviceIds.filter(isValidCatalogId))).slice(0, 200);

  if (db) {
    const batch: D1PreparedStatement[] = [];
    batch.push(
      db.prepare('DELETE FROM catalog_package_services WHERE package_id = ?').bind(packageId)
    );
    for (const sid of cleaned) {
      batch.push(
        db
          .prepare(
            `INSERT OR IGNORE INTO catalog_package_services (package_id, service_id, created_at)
             VALUES (?, ?, datetime('now'))`
          )
          .bind(packageId, sid)
      );
    }
    await db.batch(batch);
    await db
      .prepare("UPDATE catalog_packages SET updated_at=datetime('now') WHERE id=?")
      .bind(packageId)
      .run();
    return;
  }

  const sql = await getNeonSqlClient();
  if (!sql) throw new Error('DB non disponible');

  await sql`DELETE FROM catalog_package_services WHERE package_id = ${packageId}`;
  for (const sid of cleaned) {
    await sql`
      INSERT INTO catalog_package_services (package_id, service_id, created_at)
      VALUES (${packageId}, ${sid}, now())
      ON CONFLICT DO NOTHING
    `;
  }
  await sql`UPDATE catalog_packages SET updated_at = now() WHERE id = ${packageId}`;
}
