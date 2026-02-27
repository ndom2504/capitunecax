import type { APIRoute } from 'astro';
import { getUserFromSessionFullAny, hasNeonDatabase } from '../../../lib/db';
import {
  isValidCatalogId,
  setCatalogPackageServicesAny,
  upsertCatalogPackageAny,
  upsertCatalogServiceAny,
} from '../../../lib/catalog';

type Action = 'upsert_service' | 'upsert_package' | 'set_package_services';

export const POST: APIRoute = async ({ cookies, locals, request }) => {
  const token = cookies.get('capitune_session')?.value;
  if (!token) return json({ error: 'Non connecté' }, 401);

  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const useNeon = !db && hasNeonDatabase();

  if (!db && !useNeon) {
    return json({ error: 'DB non disponible' }, 503);
  }

  const me = await getUserFromSessionFullAny(db, token);
  if (!me) return json({ error: 'Session expirée' }, 401);

  const isPro = String((me as any)?.account_type ?? '') === 'pro';
  const isAdmin = String((me as any)?.role ?? '') === 'admin';
  if (!isPro && !isAdmin) return json({ error: 'Accès refusé' }, 403);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON invalide' }, 400);
  }

  const action = String(body?.action ?? '') as Action;

  try {
    if (action === 'upsert_service') {
      const id = String(body?.service?.id ?? '').trim();
      const name = String(body?.service?.name ?? '').trim();
      if (!isValidCatalogId(id)) return json({ error: 'ID service invalide' }, 400);
      if (!name) return json({ error: 'Nom service requis' }, 400);
      await upsertCatalogServiceAny(db, {
        id,
        name,
        description: typeof body?.service?.description === 'string' ? body.service.description : undefined,
        icon: typeof body?.service?.icon === 'string' ? body.service.icon : undefined,
        basePrice: body?.service?.basePrice,
      });
      return json({ ok: true });
    }

    if (action === 'upsert_package') {
      const id = String(body?.pkg?.id ?? '').trim();
      const name = String(body?.pkg?.name ?? '').trim();
      if (!isValidCatalogId(id)) return json({ error: 'ID pack invalide' }, 400);
      if (!name) return json({ error: 'Nom pack requis' }, 400);
      await upsertCatalogPackageAny(db, {
        id,
        name,
        description: typeof body?.pkg?.description === 'string' ? body.pkg.description : undefined,
        badge: typeof body?.pkg?.badge === 'string' ? body.pkg.badge : undefined,
        price: body?.pkg?.price,
        features: Array.isArray(body?.pkg?.features) ? body.pkg.features : undefined,
        popular: !!body?.pkg?.popular,
      });
      return json({ ok: true });
    }

    if (action === 'set_package_services') {
      const packageId = String(body?.packageId ?? '').trim();
      const serviceIds = Array.isArray(body?.serviceIds) ? body.serviceIds.map((x: any) => String(x)) : [];
      if (!isValidCatalogId(packageId)) return json({ error: 'ID pack invalide' }, 400);
      await setCatalogPackageServicesAny(db, packageId, serviceIds);
      return json({ ok: true });
    }

    return json({ error: 'Action invalide' }, 400);
  } catch (e: any) {
    return json({ error: e?.message || 'Erreur serveur' }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
