// POST /api/admin/login — вход в панель заявок по паролю (переменная ADMIN_PASSWORD).
import { json, readJson, checkPassword, createSession } from '../lib/common.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const body = await readJson(req);
  if (!process.env.ADMIN_PASSWORD) return json({ error: 'not_configured' }, 503);
  if (!checkPassword(body?.password)) {
    await new Promise((r) => setTimeout(r, 800)); // замедляем подбор пароля
    return json({ error: 'wrong_password' }, 401);
  }
  return json({ token: createSession(30) });
};

export const config = { path: '/api/admin/login' };
