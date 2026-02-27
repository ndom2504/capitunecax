import type { APIRoute } from 'astro';
import { getCatalogAny } from '../../lib/catalog';

export const GET: APIRoute = async ({ locals }) => {
  const db = ((locals.runtime?.env as Env | undefined)?.DB ?? null);
  const catalog = await getCatalogAny(db);
  return json(catalog);
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
