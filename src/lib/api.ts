// Работа с заявками из браузера.
// На хостинге Netlify — настоящий сервер (/api/...).
// В демо-сборке (PUBLIC_DEMO=1, для показа) — всё хранится в этом браузере,
// пароль панели в демо: demo
const DEMO = import.meta.env.PUBLIC_DEMO === '1';

export type Status = 'new' | 'viewed' | 'accepted' | 'done' | 'rejected';
export interface PublicLead {
  id: string;
  createdAt: string;
  updatedAt: string;
  service: string;
  message: string;
  status: Status;
}
export interface AdminLead extends PublicLead {
  name: string;
  phone: string;
  lang: string;
  page: string;
  note: string;
  history: { status: Status; at: string }[];
}
export interface NewLead {
  name: string;
  phone: string;
  service: string;
  message: string;
  lang: string;
  page: string;
  consent: boolean;
  'bot-field'?: string;
}

export class ApiError extends Error {
  constructor(public status: number, message = 'api_error') {
    super(message);
  }
}

// ---------- «Мои заявки» в браузере клиента ----------
const MY_KEY = 'me-my-leads';
type MyRef = { id: string; token: string; createdAt: string };
export function getMyRefs(): MyRef[] {
  try {
    return JSON.parse(localStorage.getItem(MY_KEY) || '[]');
  } catch {
    return [];
  }
}
function addMyRef(ref: MyRef) {
  try {
    localStorage.setItem(MY_KEY, JSON.stringify([ref, ...getMyRefs()].slice(0, 50)));
  } catch {}
}

// ---------- Сервер ----------
async function call<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error);
  return data as T;
}

// ---------- Демо-режим ----------
const DEMO_KEY = 'me-demo-leads';
const demoAll = (): (AdminLead & { token: string })[] => {
  try {
    return JSON.parse(localStorage.getItem(DEMO_KEY) || '[]');
  } catch {
    return [];
  }
};
const demoSave = (list: unknown[]) => {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(list));
  } catch {}
};
const rnd = (n: number) => Array.from({ length: n }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
const pub = (l: AdminLead): PublicLead => ({
  id: l.id, createdAt: l.createdAt, updatedAt: l.updatedAt, service: l.service, message: l.message, status: l.status,
});

// ---------- Публичные функции ----------
export async function createLead(lead: NewLead): Promise<{ id: string; token: string; createdAt: string }> {
  let result: { id: string; token: string; createdAt: string };
  if (DEMO) {
    const now = new Date().toISOString();
    const rec = {
      ...lead, id: rnd(6), token: rnd(20), status: 'new' as Status, note: '',
      createdAt: now, updatedAt: now, history: [{ status: 'new' as Status, at: now }],
    };
    demoSave([rec, ...demoAll()]);
    result = { id: rec.id, token: rec.token, createdAt: now };
  } else {
    result = await call('/api/leads', { method: 'POST', body: JSON.stringify(lead) });
  }
  if (result.token) addMyRef(result);
  return result;
}

export async function fetchMyLeads(): Promise<PublicLead[]> {
  const refs = getMyRefs();
  if (!refs.length) return [];
  if (DEMO) {
    const all = demoAll();
    return refs.map((r) => all.find((l) => l.id === r.id && l.token === r.token)).filter(Boolean).map((l) => pub(l!));
  }
  const { leads } = await call<{ leads: PublicLead[] }>('/api/my-leads', {
    method: 'POST',
    body: JSON.stringify({ items: refs.map(({ id, token }) => ({ id, token })) }),
  });
  return leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function adminLogin(password: string): Promise<string> {
  if (DEMO) {
    if (password !== 'demo') throw new ApiError(401, 'wrong_password');
    return 'demo';
  }
  return (await call<{ token: string }>('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) })).token;
}

export async function adminList(token: string): Promise<AdminLead[]> {
  if (DEMO) return demoAll().map(({ token: _t, ...l }) => l);
  return (await call<{ leads: AdminLead[] }>('/api/admin/leads', {}, token)).leads;
}

export async function adminUpdate(token: string, id: string, patch: { status?: Status; note?: string }): Promise<AdminLead> {
  if (DEMO) {
    const all = demoAll();
    const l = all.find((x) => x.id === id)!;
    const now = new Date().toISOString();
    if (patch.status && patch.status !== l.status) {
      l.status = patch.status;
      l.history = [...l.history, { status: patch.status, at: now }];
    }
    if (typeof patch.note === 'string') l.note = patch.note;
    l.updatedAt = now;
    demoSave(all);
    const { token: _t, ...rest } = l;
    return rest;
  }
  return (await call<{ lead: AdminLead }>(`/api/admin/leads/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }, token)).lead;
}

export async function adminDelete(token: string, id: string): Promise<void> {
  if (DEMO) {
    demoSave(demoAll().filter((l) => l.id !== id));
    return;
  }
  await call(`/api/admin/leads/${id}`, { method: 'DELETE' }, token);
}

export const isDemo = DEMO;
