// Панель администратора:
//   GET    /api/admin/leads        — все заявки
//   PATCH  /api/admin/leads/:id    — сменить статус / заметку { status?, note? }
//   DELETE /api/admin/leads/:id    — удалить заявку (например, по просьбе клиента — GDPR)
import { store, json, readJson, isAdmin, allLeads, adminView, clip, STATUSES } from '../lib/common.mjs';

export default async (req, context) => {
  if (!isAdmin(req)) return json({ error: 'unauthorized' }, 401);
  const id = context?.params?.id;
  const s = store();

  if (req.method === 'GET' && !id) {
    const leads = await allLeads();
    return json({ leads: leads.map(adminView) });
  }

  if (!id || !/^[A-Z0-9]{4,12}$/.test(id)) return json({ error: 'not_found' }, 404);
  const lead = await s.get(id, { type: 'json' });
  if (!lead) return json({ error: 'not_found' }, 404);

  if (req.method === 'PATCH') {
    const body = (await readJson(req)) || {};
    const now = new Date().toISOString();
    if (body.status && STATUSES.includes(body.status) && body.status !== lead.status) {
      lead.status = body.status;
      lead.history = [...(lead.history || []), { status: body.status, at: now }];
    }
    if (typeof body.note === 'string') lead.note = clip(body.note, 2000);
    lead.updatedAt = now;
    await s.setJSON(id, lead);
    return json({ lead: adminView(lead) });
  }

  if (req.method === 'DELETE') {
    await s.delete(id);
    return json({ ok: true });
  }

  return json({ error: 'method' }, 405);
};

export const config = { path: ['/api/admin/leads', '/api/admin/leads/:id'] };
