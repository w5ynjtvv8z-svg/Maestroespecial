// Локальная проверка серверной части: node netlify/test-api.mjs
import { BlobsServer } from '@netlify/blobs/server';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const server = new BlobsServer({ directory: mkdtempSync(join(tmpdir(), 'blobs-')), token: 'local', port: 0 });
const { port } = await server.start();
process.env.BLOBS_LOCAL_URL = `http://localhost:${port}`;
process.env.ADMIN_PASSWORD = 'secret-test';
process.env.URL = 'https://example.test';
const sent = [];
const realFetch = globalThis.fetch;
globalThis.fetch = (url, opts) => {
  if (String(url).includes('callmebot')) { sent.push(decodeURIComponent(String(url))); return Promise.resolve(new Response('ok')); }
  return realFetch(url, opts);
};
process.env.NOTIFY_WHATSAPP_PHONE = '34652920274';
process.env.CALLMEBOT_APIKEY = 'KEY';

const leads = (await import('./functions/leads.mjs')).default;
const myLeads = (await import('./functions/my-leads.mjs')).default;
const login = (await import('./functions/admin-login.mjs')).default;
const admin = (await import('./functions/admin-leads.mjs')).default;
const req = (method, body, headers = {}) =>
  new Request('http://x/', { method, headers: { 'content-type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined });

// 1. Заявка без согласия / без телефона отклоняется
assert.equal((await leads(req('POST', { name: 'A', phone: '12', consent: true }))).status, 422);
assert.equal((await leads(req('POST', { name: 'A', phone: '+34 600 111 222' }))).status, 422);

// 2. Создание заявок
let r = await leads(req('POST', { name: 'Иван', phone: '+34 600 111 222', service: 'Бассейны', message: 'Мутная вода', lang: 'ru', consent: true }));
assert.equal(r.status, 201);
const a = await r.json();
r = await leads(req('POST', { name: 'Ana', phone: '+34 611 000 000', service: 'Fontanería', lang: 'es', consent: true }));
const b = await r.json();
assert.match(a.id, /^[A-Z0-9]{6}$/);
assert.ok(sent[0].includes('Новая заявка №' + a.id) && sent[0].includes('Мутная вода') && sent[0].includes('https://example.test/panel/'));
console.log('WhatsApp-уведомление:\n' + sent[0].split('text=')[1].split('&apikey')[0]);

// 3. Клиент видит только свою заявку; с чужим ключом — ничего
r = await myLeads(req('POST', { items: [{ id: a.id, token: a.token }, { id: b.id, token: a.token }] }));
let mine = (await r.json()).leads;
assert.equal(mine.length, 1);
assert.equal(mine[0].id, a.id);
assert.equal(mine[0].status, 'new');
assert.equal(mine[0].token, undefined);
assert.equal(mine[0].phone, undefined);

// 4. Панель: без входа и с неверным паролем — нельзя
assert.equal((await admin(req('GET'), {})).status, 401);
assert.equal((await login(req('POST', { password: 'wrong' }))).status, 401);
assert.equal((await admin(req('GET', null, { authorization: 'Bearer 9999999999999.fake' }), {})).status, 401);
const { token } = await (await login(req('POST', { password: 'secret-test' }))).json();
const auth = { authorization: `Bearer ${token}` };

// 5. Панель видит все заявки, без секретных ключей клиентов
let all = (await (await admin(req('GET', null, auth), {})).json()).leads;
assert.equal(all.length, 2);
assert.ok(all.every((l) => l.token === undefined && l.phone));

// 6. Смена статуса и заметки, клиент видит новый статус
r = await admin(req('PATCH', { status: 'accepted', note: 'Приеду в среду' }, auth), { params: { id: a.id } });
assert.equal((await r.json()).lead.status, 'accepted');
await admin(req('PATCH', { status: 'bogus' }, auth), { params: { id: a.id } });
mine = (await (await myLeads(req('POST', { items: [{ id: a.id, token: a.token }] }))).json()).leads;
assert.equal(mine[0].status, 'accepted');
assert.equal(mine[0].note, undefined);

// 7. Удаление
await admin(req('DELETE', null, auth), { params: { id: b.id } });
all = (await (await admin(req('GET', null, auth), {})).json()).leads;
assert.equal(all.length, 1);
assert.equal(all[0].history.length, 2);

console.log('\nВсе проверки пройдены ✔');
await server.stop();
