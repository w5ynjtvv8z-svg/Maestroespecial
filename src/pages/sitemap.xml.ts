// Карта сайта для Google с hreflang-связками между языковыми версиями.
import type { APIRoute } from 'astro';
import { LANGS, homePath, servicePath, type Lang } from '../lib/i18n';
import { getServices, getServiceById } from '../lib/data';

export const GET: APIRoute = ({ site }) => {
  const abs = (p: string) => new URL(p, site).href;
  const groups: Record<Lang, string>[] = [];

  groups.push(Object.fromEntries(LANGS.map((l) => [l, homePath(l)])) as Record<Lang, string>);
  for (const s of getServices('es')) {
    groups.push(
      Object.fromEntries(
        LANGS.map((l) => {
          const alt = getServiceById(l, s.id);
          return [l, alt ? servicePath(l, alt.slug) : homePath(l)];
        }),
      ) as Record<Lang, string>,
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const urls = groups.flatMap((g) =>
    LANGS.map((l) => {
      const links = LANGS.map((x) => `<xhtml:link rel="alternate" hreflang="${x}" href="${abs(g[x])}"/>`).join('');
      return `<url><loc>${abs(g[l])}</loc><lastmod>${today}</lastmod>${links}<xhtml:link rel="alternate" hreflang="x-default" href="${abs(g.es)}"/></url>`;
    }),
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
