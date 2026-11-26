// Уведомление сантехнику о новой заявке.
//
// WhatsApp — через бесплатный сервис CallMeBot (сообщения самому себе):
//   NOTIFY_WHATSAPP_PHONE = 34652920274   (номер, куда присылать, только цифры)
//   CALLMEBOT_APIKEY      = ключ, который CallMeBot присылает после активации
//
// Telegram (необязательно, как запасной канал):
//   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
//
// Переменные задаются в Netlify → Site configuration → Environment variables.

const LANG_NAMES = { es: 'испанский', ru: 'русский', en: 'английский' };

export function buildText(lead, siteUrl) {
  const lines = [
    `🔔 Новая заявка №${lead.id}`,
    '',
    `👤 ${lead.name}`,
    `📞 ${lead.phone}`,
    `🔧 ${lead.service}`,
  ];
  if (lead.message) lines.push(`📝 ${lead.message}`);
  lines.push(`🌐 Язык клиента: ${LANG_NAMES[lead.lang] || lead.lang}`);
  if (siteUrl) lines.push('', `Все заявки: ${siteUrl.replace(/\/$/, '')}/panel/`);
  return lines.join('\n');
}

const withTimeout = (promise, ms = 6000) =>
  Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

export async function notifyNewLead(lead) {
  const env = (n) => process.env[n] || '';
  const text = buildText(lead, env('URL') || env('SITE_URL'));
  const tasks = [];

  if (env('NOTIFY_WHATSAPP_PHONE') && env('CALLMEBOT_APIKEY')) {
    const url =
      'https://api.callmebot.com/whatsapp.php' +
      `?phone=${encodeURIComponent(env('NOTIFY_WHATSAPP_PHONE'))}` +
      `&text=${encodeURIComponent(text)}` +
      `&apikey=${encodeURIComponent(env('CALLMEBOT_APIKEY'))}`;
    tasks.push(withTimeout(fetch(url)));
  }

  if (env('TELEGRAM_BOT_TOKEN') && env('TELEGRAM_CHAT_ID')) {
    tasks.push(
      withTimeout(
        fetch(`https://api.telegram.org/bot${env('TELEGRAM_BOT_TOKEN')}/sendMessage`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ chat_id: env('TELEGRAM_CHAT_ID'), text, disable_web_page_preview: true }),
        }),
      ),
    );
  }

  const results = await Promise.allSettled(tasks);
  results.forEach((r) => r.status === 'rejected' && console.error('notify failed:', r.reason?.message));
}
