// POST /api/leads — клиент отправляет заявку с сайта.
import { store, json, readJson, newId, newToken, clip, LANGS } from '../lib/common.mjs';
import { notifyNewLead } from '../lib/notify.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const body = await readJson(req);
  if (!body) return json({ error: 'bad_request' }, 400);

  // Защита от спам-ботов: скрытое поле должно быть пустым
  if (body['bot-field']) return json({ id: 'OK', token: '' });

  const lead = {
    name: clip(body.name, 100),
    phone: clip(body.phone, 30),
    service: clip(body.service, 150),
    message: clip(body.message, 2000),
    lang: LANGS.includes(body.lang) ? body.lang : 'es',
    page: clip(body.page, 200),
  };
  const digits = lead.phone.replace(/\D/g, '');
  if (!lead.name || digits.length < 6 || body.consent !== true) {
    return json({ error: 'validation' }, 422);
  }

  const now = new Date().toISOString();
  const s = store();
  let id = newId();
  while (await s.get(id)) id = newId();

  const record = {
    id,
    token: newToken(),
    ...lead,
    status: 'new',
    note: '',
    createdAt: now,
    updatedAt: now,
    history: [{ status: 'new', at: now }],
  };
  await s.setJSON(id, record);
  await notifyNewLead(record);

  return json({ id, token: record.token, createdAt: now }, 201);
};

export const config = { path: '/api/leads' };
