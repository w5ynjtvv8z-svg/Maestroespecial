// Общие функции для серверной части (Netlify Functions).
// Заявки хранятся в Netlify Blobs — встроенном хранилище Netlify (бесплатно, отдельный сервер не нужен).
import { getStore } from '@netlify/blobs';
import crypto from 'node:crypto';

export const STATUSES = ['new', 'viewed', 'accepted', 'done', 'rejected'];
export const LANGS = ['ru', 'es', 'en'];

const env = (name) => process.env[name] || '';

export function store() {
  // Для локальных тестов: BLOBS_LOCAL_URL указывает на локальный сервер хранилища
  if (env('BLOBS_LOCAL_URL')) {
    return getStore({ name: 'leads', siteID: 'local', token: 'local', apiURL: env('BLOBS_LOCAL_URL') });
  }
  return getStore({ name: 'leads', consistency: 'strong' });
}

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

export async function readJson(req) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

// Короткий номер заявки без похожих символов (0/O, 1/I)
export function newId() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.randomBytes(6), (b) => abc[b % abc.length]).join('');
}

// Секретный ключ заявки — по нему клиент видит только свою заявку
export const newToken = () => crypto.randomBytes(18).toString('base64url');

export function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// ---------- Вход в панель администратора ----------
const sessionSecret = () => env('SESSION_SECRET') || `pw:${env('ADMIN_PASSWORD')}`;
const sign = (value) => crypto.createHmac('sha256', sessionSecret()).update(value).digest('base64url');

export function createSession(days = 30) {
  const exp = String(Date.now() + days * 86400000);
  return `${exp}.${sign(exp)}`;
}

export function isAdmin(req) {
  if (!env('ADMIN_PASSWORD')) return false;
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const [exp, sig] = token.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, sign(exp));
}

export const checkPassword = (password) => !!env('ADMIN_PASSWORD') && safeEqual(password || '', env('ADMIN_PASSWORD'));

// ---------- Заявки ----------
export async function allLeads() {
  const s = store();
  const { blobs } = await s.list();
  const items = await Promise.all(blobs.map((b) => s.get(b.key, { type: 'json' })));
  return items.filter(Boolean).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** То, что видит клиент в «Мои заявки» (без внутренних заметок мастера) */
export const publicView = (l) => ({
  id: l.id,
  createdAt: l.createdAt,
  updatedAt: l.updatedAt,
  service: l.service,
  message: l.message,
  status: l.status,
});

/** То, что видит администратор (без секретного ключа клиента) */
export const adminView = ({ token, ...rest }) => rest;

export const clip = (v, max) => String(v ?? '').trim().slice(0, max);
