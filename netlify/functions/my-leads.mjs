// POST /api/my-leads — клиент получает статусы СВОИХ заявок.
// Браузер клиента хранит номер заявки и секретный ключ; без ключа чужую заявку не увидеть.
import { store, json, readJson, safeEqual, publicView } from '../lib/common.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const body = await readJson(req);
  const items = Array.isArray(body?.items) ? body.items.slice(0, 50) : [];
  const s = store();

  const found = await Promise.all(
    items.map(async ({ id, token } = {}) => {
      if (typeof id !== 'string' || typeof token !== 'string' || !/^[A-Z0-9]{4,12}$/.test(id)) return null;
      const lead = await s.get(id, { type: 'json' });
      return lead && safeEqual(lead.token, token) ? publicView(lead) : null;
    }),
  );

  return json({ leads: found.filter(Boolean) });
};

export const config = { path: '/api/my-leads' };
