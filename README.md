# Maestro Especial — сайт компании

Сантехника, отопление, аэротермия, бассейны и очистка воды · Валенсия / Сагунто.
Три языка: **испанский** (основной, `/`), **русский** (`/ru/`), **английский** (`/en/`).

| Что | Чем сделано |
|---|---|
| Сайт | [Astro](https://astro.build) — статический, очень быстрый (важно для Google) |
| Админ-панель | [Decap CMS](https://decapcms.org) — `https://<домен>/admin/` |
| Хостинг и заявки с формы | [Netlify](https://netlify.com) (бесплатный тариф) |
| Статистика | Google Analytics 4 + Microsoft Clarity |
| SEO | мета-теги, hreflang, sitemap.xml, robots.txt, Schema.org (Plumber, Service, FAQ, Breadcrumbs) |

## Страницы

- Главная: первый экран, проблемы, услуги, преимущества, о нас + районы работы, отзывы, вопросы-ответы, контакты с формой
- 4 страницы услуг на каждом языке (свой адрес на каждом языке: `/servicios/piscinas/`, `/ru/uslugi/basseyny/`, `/en/services/swimming-pools/`)
- Правовая информация и cookies (обязательна в Испании)

## Запуск сайта (один раз)

1. **Netlify** → *Add new site → Import from GitHub* → выбрать этот репозиторий, ветку `main`.
   Настройки сборки подтянутся из `netlify.toml` сами.
2. **Домен**: купить (например `maestroespecial.es`) и подключить в Netlify → *Domain management*.
   Затем вписать его в админке: *Настройки сайта → Адрес сайта* (и в `public/admin/config.yml` → `site_url`).
3. **Вход в админку** (через GitHub):
   - Netlify → *Site configuration → Access & security → OAuth* → *Install provider* → **GitHub**
     (Client ID/Secret создаются на GitHub: *Settings → Developer settings → OAuth Apps*,
     callback URL: `https://api.netlify.com/auth/done`).
   - Администратору нужен аккаунт GitHub с доступом к репозиторию (*Settings → Collaborators*).
4. **Заявки с формы**: Netlify → *Forms* → форма `lead` появится после первой публикации.
   Там же: *Form notifications → Email* — заявки будут приходить на почту.
5. **Google Analytics 4**: создать ресурс на analytics.google.com → скопировать ID `G-XXXXXXXXXX` →
   вставить в админке *Настройки сайта → Google Analytics 4 — ID*.
   В GA4 отметить как ключевые события: `click_call`, `click_whatsapp`, `generate_lead`.
   Чтобы видеть, *где* кликнули: *Admin → Custom definitions* → добавить параметры события `location`, `page_lang`, `label`.
6. **Microsoft Clarity** (тепловые карты и записи сессий): clarity.microsoft.com → новый проект → ID → в админку.
7. **Google Search Console**: добавить сайт → способ «HTML-тег» → значение `content` вставить в админку
   (*Код подтверждения Google Search Console*) → после публикации подтвердить → отправить `sitemap.xml`.
8. **Google Business Profile** (карточка на Google Картах) — очень важно для «fontanero cerca de mí».
   Ссылку на карточку вписать в админке — она попадёт в разметку для Google.

## Что отслеживает статистика

| Событие | Когда |
|---|---|
| `page_view` | просмотр страницы (устройство, город, источник — GA4 собирает сам) |
| `click_call` | нажали на телефон |
| `click_whatsapp` | нажали WhatsApp |
| `click_social` | перешли в Instagram / YouTube / TikTok |
| `click_cta` | открыли страницу услуги с карточки |
| `generate_lead` | отправили форму заявки |
| `select_language` | переключили язык |

Параметр `location` показывает место клика: `header`, `hero`, `mobile_bar`, `contact`, `service_hero`, `footer`.
Отчёт по устройствам: GA4 → *Reports → Tech → Tech details* (Device category).

Cookies включаются только после согласия посетителя (баннер, Google Consent Mode v2) — требование GDPR.

## Как устроено редактирование

Админка сохраняет изменения прямо в репозиторий → Netlify пересобирает сайт за 1–2 минуты.

| Раздел админки | Файл |
|---|---|
| Настройки сайта | `src/data/settings.json` |
| Страницы → Главная | `src/data/home.json` |
| Страницы → Правовая информация | `src/data/privacy.json` |
| Услуги | `src/data/services/*.json` |
| Отзывы | `src/data/reviews/*.json` (блок появится на сайте после первого отзыва) |
| Загруженные фото | `public/images/uploads/` |

Надписи на кнопках/меню — `src/lib/i18n.ts`.

## Для разработчика

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # → dist/
# Админка локально, без GitHub:
npm run cms        # в отдельном терминале, затем http://localhost:4321/admin/index.html
```
